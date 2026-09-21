// Mock backend: TZ 9-bo'limidagi endpointlarni xotiradagi baza ustida bajaradi.
// Javob shakli backend bilan bir xil ({ statusCode, data }), shuning uchun
// frontend kodi mock va haqiqiy rejimda bir xil ishlaydi.
import type {
  CircleDetails,
  CircleSummary,
  CreateCircleInput,
  HistoryEntry,
  Invitation,
  JoinPreview,
  MyHistory,
  MySummary,
  ObligationStatus,
  PendingAction,
  RoundDetails,
  RoundSummary,
  Session,
  User,
} from "../types";
import {
  DEMO_USER_ID,
  EXTRA_NAMES,
  getDb,
  nextId,
  resetDb,
  type Db,
  type DbCircle,
  type DbObligation,
  type DbPayout,
  type DbRound,
  type DbTransaction,
  type DbUser,
} from "./db";

export class MockError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type MockRequest = {
  method: string;
  path: string;
  body?: unknown;
  userId: number | null;
  sid: number | null;
  userAgent?: string;
  ip?: string;
};

export type MockResult = {
  status: number;
  json: unknown;
  /** Route handler cookie'ni shunga qarab o'rnatadi yoki o'chiradi */
  session?: { userId: number; sid: number } | "clear";
};

type Ctx = MockRequest & { db: Db; params: string[]; result: Pick<MockResult, "session"> };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Body = Record<string, any>;
type Handler = (ctx: Ctx) => unknown;

/** Boshqa a'zolar (bot) naqd to'lov va payout'ni shuncha vaqtdan keyin "o'zi" tasdiqlaydi. */
const BOT_CONFIRM_DELAY_MS = 8_000;

const now = () => new Date().toISOString();

// ---------- yordamchilar ----------

// Uzilgan sessiyalar — server qayta ishga tushganda noma'lum bo'lib qolgan sessiyalardan farqlash uchun.
const revokedSessions = new Set<number>();

function requireUser(ctx: Ctx): DbUser {
  const user = ctx.db.users.find((u) => u.id === ctx.userId);
  if (!user || ctx.sid == null || revokedSessions.has(ctx.sid)) throw new MockError(401, "Sessiya tugagan. Qaytadan kiring");
  // Mock baza qayta yaratilgan bo'lsa (server restart / reset), cookie'dagi sessiyani tiklaymiz
  if (!ctx.db.sessions.some((s) => s.id === ctx.sid)) {
    ctx.db.sessions.push({ id: ctx.sid, userId: user.id, device: describeDevice(ctx.userAgent), ip: ctx.ip ?? "127.0.0.1", lastActiveAt: now() });
    ctx.db.seq = Math.max(ctx.db.seq, ctx.sid);
  }
  return user;
}

const body = (ctx: Ctx) => (ctx.body ?? {}) as Body;
const userName = (db: Db, id: number) => db.users.find((u) => u.id === id)?.fullName ?? "Noma’lum";

function maskPhone(phone: string) {
  return `+998 ${phone.slice(4, 6)} *** ** ${phone.slice(-2)}`;
}

function findCircle(db: Db, id: number): DbCircle {
  const circle = db.circles.find((c) => c.id === id);
  if (!circle) throw new MockError(404, "Davra topilmadi");
  return circle;
}

function membershipOf(db: Db, circleId: number, userId: number) {
  return db.memberships.find((m) => m.circleId === circleId && m.userId === userId && m.status === "ACTIVE");
}

function activeMembers(db: Db, circleId: number) {
  return db.memberships.filter((m) => m.circleId === circleId && m.status === "ACTIVE");
}

function requireMember(ctx: Ctx, circle: DbCircle) {
  const m = membershipOf(ctx.db, circle.id, ctx.userId!);
  if (!m) throw new MockError(403, "Siz bu davra a’zosi emassiz");
  return m;
}

function requireOrganizer(ctx: Ctx, circle: DbCircle) {
  if (circle.organizerId !== ctx.userId) throw new MockError(403, "Bu amalni faqat tashkilotchi bajara oladi");
}

const openRoundOf = (db: Db, circleId: number) => db.rounds.find((r) => r.circleId === circleId && r.status === "OPEN");

function paidAmount(db: Db, obligationId: number) {
  return db.transactions
    .filter((t) => t.obligationId === obligationId && t.status === "CONFIRMED")
    .reduce((sum, t) => sum + t.amount, 0);
}

function awaitingAmount(db: Db, obligationId: number) {
  return db.transactions
    .filter((t) => t.obligationId === obligationId && t.status === "AWAITING_CONFIRMATION")
    .reduce((sum, t) => sum + t.amount, 0);
}

function obligationStatus(db: Db, obligation: DbObligation, round: DbRound): ObligationStatus {
  const paid = paidAmount(db, obligation.id);
  if (paid >= obligation.amount) return "PAID";
  if (round.status === "OPEN" && new Date(round.deadline) < new Date()) return "OVERDUE";
  return paid > 0 ? "PARTIALLY_PAID" : "PENDING";
}

function invitationStatus(inv: Db["invitations"][number]): Invitation["status"] {
  if (inv.revoked) return "REVOKED";
  if (inv.usedCount >= inv.maxUses) return "USED_UP";
  if (new Date(inv.expiresAt) < new Date()) return "EXPIRED";
  return "ACTIVE";
}

function describeDevice(ua = "") {
  const browser = /Telegram/i.test(ua) ? "Telegram" : /Edg\//.test(ua) ? "Edge" : /Firefox/.test(ua) ? "Firefox" : /Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "Brauzer";
  const os = /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Noma’lum qurilma";
  return `${browser} · ${os}`;
}

/** Foydalanuvchi "bot"mi — ya'ni mock'da hech qachon kirmagan, uning o'rniga tizim tasdiqlaydi. */
const isBot = (db: Db, userId: number) => !db.sessions.some((s) => s.userId === userId);

/** Har so'rov boshida: bot a'zolar o'zlariga tegishli tasdiqlarni BOT_CONFIRM_DELAY_MS dan keyin bajaradi. */
function tick(db: Db) {
  const due = (iso: string) => Date.parse(iso) + BOT_CONFIRM_DELAY_MS <= Date.now();
  for (const tx of db.transactions) {
    if (tx.status !== "AWAITING_CONFIRMATION" || !due(tx.createdAt)) continue;
    const payer = db.obligations.find((o) => o.id === tx.obligationId)!.userId;
    if (isBot(db, payer)) Object.assign(tx, { status: "CONFIRMED", confirmedAt: now() });
  }
  for (const payout of db.payouts) {
    if (payout.status !== "AWAITING_CONFIRMATION" || !due(payout.recordedAt)) continue;
    const round = db.rounds.find((r) => r.id === payout.roundId)!;
    if (isBot(db, round.recipientId)) confirmPayout(db, payout);
  }
}

function confirmPayout(db: Db, payout: DbPayout) {
  payout.status = "CONFIRMED";
  payout.confirmedAt = now();
  const round = db.rounds.find((r) => r.id === payout.roundId)!;
  round.status = "CLOSED";

  const next = db.rounds.find((r) => r.circleId === round.circleId && r.roundNumber === round.roundNumber + 1);
  if (next) openRound(db, next);
  else findCircle(db, round.circleId).status = "COMPLETED";
}

function openRound(db: Db, round: DbRound) {
  const circle = findCircle(db, round.circleId);
  round.status = "OPEN";
  for (const m of activeMembers(db, circle.id)) {
    db.obligations.push({ id: nextId(db), roundId: round.id, userId: m.userId, amount: circle.amount });
  }
}

/** Seed'dan olingan tasodifiy son generatori — qur'a natijasini qayta tekshirish mumkin bo'lsin. */
function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function randomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const pick = () => letters[Math.floor(Math.random() * letters.length)];
  return `${pick()}${pick()}${pick()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ---------- javob shakllari ----------

function toUser(u: DbUser): User {
  return { id: u.id, fullName: u.fullName, phone: u.phone, role: u.role, createdAt: u.createdAt };
}

function roundSummary(db: Db, round: DbRound): RoundSummary {
  const circle = findCircle(db, round.circleId);
  const obligations = db.obligations.filter((o) => o.roundId === round.id);
  return {
    id: round.id,
    roundNumber: round.roundNumber,
    recipient: { userId: round.recipientId, fullName: userName(db, round.recipientId) },
    deadline: round.deadline,
    status: round.status,
    collected: obligations.reduce((sum, o) => sum + paidAmount(db, o.id), 0),
    total: circle.amount * (obligations.length || circle.memberCount),
  };
}

function circleSummary(db: Db, circle: DbCircle, userId: number): CircleSummary {
  const m = membershipOf(db, circle.id, userId);
  const round = openRoundOf(db, circle.id);
  const myObligation = round && db.obligations.find((o) => o.roundId === round.id && o.userId === userId);
  const lastRound = db.rounds.filter((r) => r.circleId === circle.id).length;
  return {
    id: circle.id,
    name: circle.name,
    amount: circle.amount,
    memberCount: circle.memberCount,
    joinedCount: activeMembers(db, circle.id).length,
    status: circle.status,
    myRole: circle.organizerId === userId ? "ORGANIZER" : "MEMBER",
    myQueuePosition: m?.queuePosition ?? null,
    currentRound: round?.roundNumber ?? (circle.status === "COMPLETED" ? lastRound : 0),
    nextDeadline: round?.deadline ?? null,
    myObligationStatus: myObligation && round ? obligationStatus(db, myObligation, round) : null,
  };
}

function circleDetails(db: Db, circle: DbCircle, userId: number): CircleDetails {
  const isOrganizer = circle.organizerId === userId;
  const round = openRoundOf(db, circle.id);
  const lottery = db.lotteries.find((l) => l.circleId === circle.id);

  const members = activeMembers(db, circle.id)
    .map((m) => {
      const user = db.users.find((u) => u.id === m.userId)!;
      const obligation = round && db.obligations.find((o) => o.roundId === round.id && o.userId === m.userId);
      return {
        userId: m.userId,
        fullName: user.fullName,
        phone: isOrganizer || m.userId === userId ? user.phone : maskPhone(user.phone),
        role: m.role,
        queuePosition: m.queuePosition,
        status: m.status,
        currentStatus: obligation && round ? obligationStatus(db, obligation, round) : null,
        joinedAt: m.joinedAt,
      };
    })
    .sort((a, b) => (a.queuePosition ?? 99) - (b.queuePosition ?? 99) || a.joinedAt.localeCompare(b.joinedAt));

  return {
    ...circleSummary(db, circle, userId),
    description: circle.description,
    paymentDay: circle.paymentDay,
    deadlineDays: circle.deadlineDays,
    queueRule: circle.queueRule,
    allowPartial: circle.allowPartial,
    penalty: circle.penalty,
    exitPolicy: circle.exitPolicy,
    termsVersion: circle.termsVersion,
    createdAt: circle.createdAt,
    organizer: { userId: circle.organizerId, fullName: userName(db, circle.organizerId) },
    members,
    rounds: db.rounds
      .filter((r) => r.circleId === circle.id)
      .sort((a, b) => a.roundNumber - b.roundNumber)
      .map((r) => roundSummary(db, r)),
    lottery: lottery
      ? {
          seed: lottery.seed,
          drawnAt: lottery.drawnAt,
          participants: lottery.participants.map((id) => ({ userId: id, fullName: userName(db, id) })),
          order: lottery.order.map((id, i) => ({ position: i + 1, userId: id, fullName: userName(db, id) })),
        }
      : null,
    invitations: isOrganizer
      ? db.invitations
          .filter((i) => i.circleId === circle.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((i) => ({
            id: i.id,
            code: i.code,
            expiresAt: i.expiresAt,
            maxUses: i.maxUses,
            usedCount: i.usedCount,
            status: invitationStatus(i),
            createdAt: i.createdAt,
          }))
      : undefined,
  };
}

function roundDetails(db: Db, round: DbRound, userId: number): RoundDetails {
  const circle = findCircle(db, round.circleId);
  const payout = db.payouts.find((p) => p.roundId === round.id);
  return {
    ...roundSummary(db, round),
    circle: {
      id: circle.id,
      name: circle.name,
      amount: circle.amount,
      allowPartial: circle.allowPartial,
      myRole: circle.organizerId === userId ? "ORGANIZER" : "MEMBER",
    },
    obligations: db.obligations
      .filter((o) => o.roundId === round.id)
      .map((o) => ({
        id: o.id,
        userId: o.userId,
        fullName: userName(db, o.userId),
        amount: o.amount,
        paidAmount: paidAmount(db, o.id),
        status: obligationStatus(db, o, round),
        transactions: db.transactions
          .filter((t) => t.obligationId === o.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map((t) => ({
            id: t.id,
            amount: t.amount,
            method: t.method,
            status: t.status,
            recordedBy: userName(db, t.recordedById),
            createdAt: t.createdAt,
            confirmedAt: t.confirmedAt,
          })),
      }))
      .sort((a, b) => {
        const pos = (id: number) => membershipOf(db, circle.id, id)?.queuePosition ?? 99;
        return pos(a.userId) - pos(b.userId);
      }),
    payout: payout
      ? {
          id: payout.id,
          amount: payout.amount,
          method: payout.method,
          recordedBy: userName(db, payout.recordedById),
          recordedAt: payout.recordedAt,
          status: payout.status,
          confirmedAt: payout.confirmedAt,
        }
      : null,
  };
}

function obligationContext(db: Db, obligationId: number) {
  const obligation = db.obligations.find((o) => o.id === obligationId);
  if (!obligation) throw new MockError(404, "To‘lov majburiyati topilmadi");
  const round = db.rounds.find((r) => r.id === obligation.roundId)!;
  return { obligation, round, circle: findCircle(db, round.circleId) };
}

function transactionContext(db: Db, id: number) {
  const tx = db.transactions.find((t) => t.id === id);
  if (!tx) throw new MockError(404, "To‘lov topilmadi");
  return { tx, ...obligationContext(db, tx.obligationId) };
}

function payoutContext(db: Db, id: number) {
  const payout = db.payouts.find((p) => p.id === id);
  if (!payout) throw new MockError(404, "Topshirish yozuvi topilmadi");
  const round = db.rounds.find((r) => r.id === payout.roundId)!;
  return { payout, round, circle: findCircle(db, round.circleId) };
}

// ---------- endpointlar ----------

const auth = {
  login(ctx: Ctx) {
    const { phone } = body(ctx);
    // Mock: parol tekshirilmaydi; noma'lum raqam bilan demo foydalanuvchi kiradi.
    const user = ctx.db.users.find((u) => u.phone === phone) ?? ctx.db.users.find((u) => u.id === DEMO_USER_ID)!;
    const session = { id: nextId(ctx.db), userId: user.id, device: describeDevice(ctx.userAgent), ip: ctx.ip ?? "127.0.0.1", lastActiveAt: now() };
    ctx.db.sessions.push(session);
    ctx.result.session = { userId: user.id, sid: session.id };
    return toUser(user);
  },

  register(ctx: Ctx) {
    const { fullName, phone } = body(ctx);
    if (ctx.db.users.some((u) => u.phone === phone)) throw new MockError(409, "Bu raqam allaqachon ro‘yxatdan o‘tgan");
    const user: DbUser = { id: nextId(ctx.db), fullName, phone, role: "USER", createdAt: now() };
    ctx.db.users.push(user);
    return toUser(user);
  },

  logout(ctx: Ctx) {
    if (ctx.sid != null) revokedSessions.add(ctx.sid);
    ctx.db.sessions = ctx.db.sessions.filter((s) => s.id !== ctx.sid);
    ctx.result.session = "clear";
    return {};
  },

  sessions(ctx: Ctx): Session[] {
    const user = requireUser(ctx);
    const current = ctx.db.sessions.find((s) => s.id === ctx.sid);
    if (current) current.lastActiveAt = now();
    return ctx.db.sessions
      .filter((s) => s.userId === user.id)
      .map((s) => ({ id: s.id, device: s.device, ip: s.ip, lastActiveAt: s.lastActiveAt, current: s.id === ctx.sid }))
      .sort((a, b) => Number(b.current) - Number(a.current) || b.lastActiveAt.localeCompare(a.lastActiveAt));
  },

  revokeSession(ctx: Ctx) {
    const user = requireUser(ctx);
    const id = Number(ctx.params[0]);
    if (!ctx.db.sessions.some((s) => s.id === id && s.userId === user.id)) throw new MockError(404, "Sessiya topilmadi");
    ctx.db.sessions = ctx.db.sessions.filter((s) => s.id !== id);
    revokedSessions.add(id);
    if (id === ctx.sid) ctx.result.session = "clear";
    return {};
  },
};

const users = {
  get(ctx: Ctx) {
    const user = requireUser(ctx);
    if (Number(ctx.params[0]) !== user.id) throw new MockError(403, "Ruxsat yo‘q");
    return toUser(user);
  },

  update(ctx: Ctx) {
    const user = requireUser(ctx);
    if (Number(ctx.params[0]) !== user.id) throw new MockError(403, "Ruxsat yo‘q");
    const fullName = String(body(ctx).fullName ?? "").trim();
    if (fullName.length < 3) throw new MockError(400, "Ism kamida 3 ta harfdan iborat bo‘lsin");
    user.fullName = fullName;
    return toUser(user);
  },

  forgotPassword: () => ({ expiresIn: 120, resendAfter: 60 }),

  verifyOtp(ctx: Ctx) {
    if (!/^\d{6}$/.test(String(body(ctx).code))) throw new MockError(400, "Kod noto‘g‘ri");
    return { resetToken: "mock-reset-token" };
  },

  resetPassword: () => ({}),
};

const circles = {
  list(ctx: Ctx): CircleSummary[] {
    const user = requireUser(ctx);
    const order = { ACTIVE: 0, GATHERING: 1, COMPLETED: 2, CANCELLED: 3 };
    return ctx.db.memberships
      .filter((m) => m.userId === user.id && m.status === "ACTIVE")
      .map((m) => circleSummary(ctx.db, findCircle(ctx.db, m.circleId), user.id))
      .sort((a, b) => order[a.status] - order[b.status] || b.id - a.id);
  },

  create(ctx: Ctx) {
    const user = requireUser(ctx);
    const input = body(ctx) as CreateCircleInput;
    if (!input.name?.trim()) throw new MockError(400, "Davra nomini kiriting");
    if (!(input.amount > 0)) throw new MockError(400, "Badal summasini kiriting");
    if (input.memberCount < 2 || input.memberCount > 50) throw new MockError(400, "A’zolar soni 2 dan 50 gacha bo‘lsin");

    const circle: DbCircle = {
      id: nextId(ctx.db),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      organizerId: user.id,
      amount: input.amount,
      memberCount: input.memberCount,
      paymentDay: input.paymentDay,
      deadlineDays: input.deadlineDays,
      queueRule: input.queueRule,
      allowPartial: input.allowPartial,
      penalty: input.penalty,
      exitPolicy: input.exitPolicy,
      termsVersion: 1,
      status: "GATHERING",
      createdAt: now(),
      activatedAt: null,
    };
    ctx.db.circles.push(circle);
    ctx.db.memberships.push({ circleId: circle.id, userId: user.id, role: "ORGANIZER", queuePosition: null, status: "ACTIVE", joinedAt: now() });
    ctx.db.consents.push({ id: nextId(ctx.db), circleId: circle.id, userId: user.id, termsVersion: 1, acceptedAt: now(), ip: ctx.ip ?? "", device: describeDevice(ctx.userAgent) });
    return { id: circle.id };
  },

  get(ctx: Ctx) {
    const user = requireUser(ctx);
    const circle = findCircle(ctx.db, Number(ctx.params[0]));
    requireMember(ctx, circle);
    return circleDetails(ctx.db, circle, user.id);
  },

  rounds(ctx: Ctx) {
    requireUser(ctx);
    const circle = findCircle(ctx.db, Number(ctx.params[0]));
    requireMember(ctx, circle);
    return ctx.db.rounds.filter((r) => r.circleId === circle.id).map((r) => roundSummary(ctx.db, r));
  },

  findInvitation(ctx: Ctx, code: string) {
    const inv = ctx.db.invitations.find((i) => i.code.toUpperCase() === code.trim().toUpperCase());
    if (!inv) throw new MockError(404, "Bunday taklif kodi topilmadi");
    const status = invitationStatus(inv);
    if (status === "EXPIRED") throw new MockError(410, "Taklif kodining muddati tugagan");
    if (status !== "ACTIVE") throw new MockError(410, "Bu taklif kodi endi ishlamaydi");
    const circle = findCircle(ctx.db, inv.circleId);
    if (circle.status !== "GATHERING") throw new MockError(409, "Davra allaqachon boshlangan — yangi a’zo qo‘shilmaydi");
    return { inv, circle };
  },

  joinPreview(ctx: Ctx): JoinPreview {
    const user = requireUser(ctx);
    const { circle } = circles.findInvitation(ctx, decodeURIComponent(ctx.params[0]));
    return {
      circleId: circle.id,
      name: circle.name,
      description: circle.description,
      organizer: { fullName: userName(ctx.db, circle.organizerId) },
      joinedCount: activeMembers(ctx.db, circle.id).length,
      alreadyMember: !!membershipOf(ctx.db, circle.id, user.id),
      amount: circle.amount,
      memberCount: circle.memberCount,
      paymentDay: circle.paymentDay,
      deadlineDays: circle.deadlineDays,
      queueRule: circle.queueRule,
      allowPartial: circle.allowPartial,
      penalty: circle.penalty,
      exitPolicy: circle.exitPolicy,
      termsVersion: circle.termsVersion,
    };
  },

  join(ctx: Ctx) {
    const user = requireUser(ctx);
    const { code, termsVersion, accepted } = body(ctx);
    const { inv, circle } = circles.findInvitation(ctx, String(code ?? ""));
    if (membershipOf(ctx.db, circle.id, user.id)) return { circleId: circle.id };
    if (!accepted) throw new MockError(400, "Davra shartlariga rozilik bildiring");
    if (termsVersion !== circle.termsVersion) throw new MockError(409, "Davra shartlari o‘zgargan — qaytadan ko‘rib chiqing");
    if (activeMembers(ctx.db, circle.id).length >= circle.memberCount) throw new MockError(409, "Davrada bo‘sh o‘rin qolmagan");

    ctx.db.memberships.push({ circleId: circle.id, userId: user.id, role: "MEMBER", queuePosition: null, status: "ACTIVE", joinedAt: now() });
    ctx.db.consents.push({ id: nextId(ctx.db), circleId: circle.id, userId: user.id, termsVersion, acceptedAt: now(), ip: ctx.ip ?? "", device: describeDevice(ctx.userAgent) });
    inv.usedCount += 1;
    return { circleId: circle.id };
  },

  createInvitation(ctx: Ctx): Invitation {
    requireUser(ctx);
    const circle = findCircle(ctx.db, Number(ctx.params[0]));
    requireOrganizer(ctx, circle);
    if (circle.status !== "GATHERING") throw new MockError(409, "Davra faollashgan — yangi a’zo qo‘shib bo‘lmaydi");
    const { expiresInDays = 3, maxUses = circle.memberCount } = body(ctx);
    const inv = {
      id: nextId(ctx.db),
      circleId: circle.id,
      code: randomCode(),
      expiresAt: new Date(Date.now() + Number(expiresInDays) * 86_400_000).toISOString(),
      maxUses: Number(maxUses),
      usedCount: 0,
      revoked: false,
      createdAt: now(),
    };
    ctx.db.invitations.push(inv);
    return { ...inv, status: invitationStatus(inv) };
  },

  revokeInvitation(ctx: Ctx) {
    requireUser(ctx);
    const inv = ctx.db.invitations.find((i) => i.id === Number(ctx.params[0]));
    if (!inv) throw new MockError(404, "Taklif topilmadi");
    requireOrganizer(ctx, findCircle(ctx.db, inv.circleId));
    inv.revoked = true;
    return {};
  },

  activate(ctx: Ctx) {
    const user = requireUser(ctx);
    const circle = findCircle(ctx.db, Number(ctx.params[0]));
    requireOrganizer(ctx, circle);
    if (circle.status !== "GATHERING") throw new MockError(409, "Davra allaqachon faollashgan");
    const members = activeMembers(ctx.db, circle.id);
    if (members.length < circle.memberCount) throw new MockError(409, `Hali ${circle.memberCount - members.length} ta a’zo qo‘shilmagan`);

    const ids = members.map((m) => m.userId).sort((a, b) => a - b);
    let order: number[];
    if (circle.queueRule === "LOTTERY") {
      const seed = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const random = seededRandom(seed);
      order = [...ids];
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      ctx.db.lotteries.push({ circleId: circle.id, seed, participants: ids, order, drawnAt: now() });
    } else {
      order = (body(ctx).order ?? []).map(Number);
      const valid = order.length === ids.length && [...order].sort((a, b) => a - b).every((id, i) => id === ids[i]);
      if (!valid) throw new MockError(400, "Navbat tartibida barcha a’zolar bir martadan bo‘lishi kerak");
    }

    order.forEach((userId, i) => {
      members.find((m) => m.userId === userId)!.queuePosition = i + 1;
    });

    // Birinchi to'lov sanasi — paymentDay'ning eng yaqin kelgusi sanasi.
    const today = new Date();
    let monthOffset = today.getUTCDate() < circle.paymentDay ? 0 : 1;
    const deadlineOf = (n: number) =>
      new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + monthOffset + n - 1, circle.paymentDay + circle.deadlineDays, 18)).toISOString();
    if (new Date(deadlineOf(1)) < today) monthOffset += 1;

    order.forEach((recipientId, i) => {
      const round: DbRound = { id: nextId(ctx.db), circleId: circle.id, roundNumber: i + 1, recipientId, deadline: deadlineOf(i + 1), status: "UPCOMING" };
      ctx.db.rounds.push(round);
      if (i === 0) openRound(ctx.db, round);
    });

    circle.status = "ACTIVE";
    circle.activatedAt = now();
    return circleDetails(ctx.db, circle, user.id);
  },

  /** Faqat mock: bo'sh o'rinlarni soxta a'zolar bilan to'ldiradi (faollashtirishni sinash uchun). */
  mockFill(ctx: Ctx) {
    requireUser(ctx);
    const circle = findCircle(ctx.db, Number(ctx.params[0]));
    requireOrganizer(ctx, circle);
    if (circle.status !== "GATHERING") throw new MockError(409, "Davra allaqachon faollashgan");
    let free = circle.memberCount - activeMembers(ctx.db, circle.id).length;
    let n = 0;
    while (free-- > 0) {
      const fullName = EXTRA_NAMES[(ctx.db.users.length + n++) % EXTRA_NAMES.length];
      const user: DbUser = { id: nextId(ctx.db), fullName, phone: `+99893${String(1_000_000 + Math.floor(Math.random() * 8_999_999))}`, role: "USER", createdAt: now() };
      ctx.db.users.push(user);
      ctx.db.memberships.push({ circleId: circle.id, userId: user.id, role: "MEMBER", queuePosition: null, status: "ACTIVE", joinedAt: now() });
      ctx.db.consents.push({ id: nextId(ctx.db), circleId: circle.id, userId: user.id, termsVersion: circle.termsVersion, acceptedAt: now(), ip: "", device: "mock" });
    }
    return {};
  },
};

const rounds = {
  get(ctx: Ctx) {
    const user = requireUser(ctx);
    const round = ctx.db.rounds.find((r) => r.id === Number(ctx.params[0]));
    if (!round) throw new MockError(404, "Raund topilmadi");
    requireMember(ctx, findCircle(ctx.db, round.circleId));
    return roundDetails(ctx.db, round, user.id);
  },

  recordPayout(ctx: Ctx) {
    const user = requireUser(ctx);
    const round = ctx.db.rounds.find((r) => r.id === Number(ctx.params[0]));
    if (!round) throw new MockError(404, "Raund topilmadi");
    const circle = findCircle(ctx.db, round.circleId);
    requireOrganizer(ctx, circle);
    if (round.status !== "OPEN") throw new MockError(409, "Raund ochiq emas");
    if (ctx.db.payouts.some((p) => p.roundId === round.id)) throw new MockError(409, "Bu raund puli allaqachon topshirilgan");
    const obligations = ctx.db.obligations.filter((o) => o.roundId === round.id);
    if (obligations.some((o) => paidAmount(ctx.db, o.id) < o.amount)) throw new MockError(409, "Hamma a’zo to‘liq to‘lamaguncha pulni topshirib bo‘lmaydi");

    const payout: DbPayout = {
      id: nextId(ctx.db),
      roundId: round.id,
      amount: obligations.reduce((sum, o) => sum + o.amount, 0),
      method: body(ctx).method === "CARD" ? "CARD" : "CASH",
      recordedById: user.id,
      recordedAt: now(),
      status: "AWAITING_CONFIRMATION",
      confirmedAt: null,
    };
    ctx.db.payouts.push(payout);
    return roundDetails(ctx.db, round, user.id);
  },
};

const payments = {
  manual(ctx: Ctx) {
    const user = requireUser(ctx);
    const { obligationId, amount, idempotencyKey } = body(ctx);
    // Idempotentlik: takroriy bosishda ikkinchi yozuv tushmaydi
    const existing = ctx.db.transactions.find((t) => t.idempotencyKey === idempotencyKey);
    if (existing) return { id: existing.id, status: existing.status };

    const { obligation, round, circle } = obligationContext(ctx.db, Number(obligationId));
    requireOrganizer(ctx, circle);
    if (round.status !== "OPEN") throw new MockError(409, "Bu raund yopilgan");
    const value = Math.round(Number(amount));
    const remaining = obligation.amount - paidAmount(ctx.db, obligation.id) - awaitingAmount(ctx.db, obligation.id);
    if (!(value > 0)) throw new MockError(400, "Summani kiriting");
    if (value > remaining) throw new MockError(400, "Summa qolgan qarzdan oshmasin");
    if (!circle.allowPartial && value !== remaining) throw new MockError(400, "Bu davrada qisman to‘lovga ruxsat yo‘q — to‘liq summani kiriting");

    const self = obligation.userId === user.id;
    const tx: DbTransaction = {
      id: nextId(ctx.db),
      obligationId: obligation.id,
      amount: value,
      method: "CASH",
      // Ikki tomonlama tasdiq: to'lovchi o'zi tasdiqlaydi (tashkilotchi o'zi uchun qayd etsa — darhol)
      status: self ? "CONFIRMED" : "AWAITING_CONFIRMATION",
      recordedById: user.id,
      createdAt: now(),
      confirmedAt: self ? now() : null,
      idempotencyKey: String(idempotencyKey),
    };
    ctx.db.transactions.push(tx);
    return { id: tx.id, status: tx.status };
  },

  confirm(ctx: Ctx) {
    const user = requireUser(ctx);
    const { tx, obligation } = transactionContext(ctx.db, Number(ctx.params[0]));
    if (obligation.userId !== user.id) throw new MockError(403, "Faqat to‘lovchi tasdiqlay oladi");
    if (tx.status !== "AWAITING_CONFIRMATION") throw new MockError(409, "Bu to‘lov allaqachon ko‘rib chiqilgan");
    tx.status = "CONFIRMED";
    tx.confirmedAt = now();
    return {};
  },

  reject(ctx: Ctx) {
    const user = requireUser(ctx);
    const { tx, obligation } = transactionContext(ctx.db, Number(ctx.params[0]));
    if (obligation.userId !== user.id) throw new MockError(403, "Faqat to‘lovchi rad eta oladi");
    if (tx.status !== "AWAITING_CONFIRMATION") throw new MockError(409, "Bu to‘lov allaqachon ko‘rib chiqilgan");
    tx.status = "REJECTED";
    return {};
  },
};

const payouts = {
  sendCode(ctx: Ctx) {
    const user = requireUser(ctx);
    const { payout, round } = payoutContext(ctx.db, Number(ctx.params[0]));
    if (round.recipientId !== user.id) throw new MockError(403, "Faqat oluvchi tasdiqlay oladi");
    if (payout.status !== "AWAITING_CONFIRMATION") throw new MockError(409, "Allaqachon tasdiqlangan");
    return { expiresIn: 120, resendAfter: 60 };
  },

  confirm(ctx: Ctx) {
    const user = requireUser(ctx);
    const { payout, round } = payoutContext(ctx.db, Number(ctx.params[0]));
    if (round.recipientId !== user.id) throw new MockError(403, "Faqat oluvchi tasdiqlay oladi");
    if (payout.status !== "AWAITING_CONFIRMATION") throw new MockError(409, "Allaqachon tasdiqlangan");
    // Mock: istalgan 6 xonali kod qabul qilinadi
    if (!/^\d{6}$/.test(String(body(ctx).code))) throw new MockError(400, "SMS kod noto‘g‘ri");
    confirmPayout(ctx.db, payout);
    return {};
  },
};

const me = {
  summary(ctx: Ctx): MySummary {
    const user = requireUser(ctx);
    const db = ctx.db;
    const myCircles = circles.list(ctx);
    const activeCircles = db.circles.filter((c) => c.status === "ACTIVE" && membershipOf(db, c.id, user.id));

    const payments = activeCircles
      .flatMap((c) => {
        const round = openRoundOf(db, c.id);
        const o = round && db.obligations.find((x) => x.roundId === round.id && x.userId === user.id);
        if (!round || !o) return [];
        const status = obligationStatus(db, o, round);
        if (status === "PAID") return [];
        return [{ circleId: c.id, roundId: round.id, circleName: c.name, amount: o.amount, paidAmount: paidAmount(db, o.id), dueAt: round.deadline, status }];
      })
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

    const payoutsAhead = activeCircles
      .flatMap((c) => {
        const round = db.rounds.find((r) => r.circleId === c.id && r.recipientId === user.id && r.status !== "CLOSED");
        if (!round) return [];
        return [
          {
            circleId: c.id,
            roundId: round.id,
            circleName: c.name,
            amount: c.amount * c.memberCount,
            expectedAt: round.deadline,
            queuePosition: round.roundNumber,
            memberCount: c.memberCount,
          },
        ];
      })
      .sort((a, b) => a.expectedAt.localeCompare(b.expectedAt));

    const actions: PendingAction[] = [
      ...db.transactions
        .filter((t) => t.status === "AWAITING_CONFIRMATION")
        .flatMap((t) => {
          const { obligation, round, circle } = obligationContext(db, t.obligationId);
          if (obligation.userId !== user.id) return [];
          return [{ type: "CONFIRM_PAYMENT" as const, id: t.id, roundId: round.id, circleName: circle.name, amount: t.amount, recordedBy: userName(db, t.recordedById), createdAt: t.createdAt }];
        }),
      ...db.payouts
        .filter((p) => p.status === "AWAITING_CONFIRMATION")
        .flatMap((p) => {
          const { round, circle } = payoutContext(db, p.id);
          if (round.recipientId !== user.id) return [];
          return [{ type: "CONFIRM_PAYOUT" as const, id: p.id, roundId: round.id, circleName: circle.name, amount: p.amount, recordedBy: userName(db, p.recordedById), createdAt: p.recordedAt }];
        }),
    ];

    return { nextPayment: payments[0] ?? null, nextPayout: payoutsAhead[0] ?? null, actions, circles: myCircles };
  },

  history(ctx: Ctx): MyHistory {
    const user = requireUser(ctx);
    const db = ctx.db;
    const entries: HistoryEntry[] = [];

    for (const t of db.transactions) {
      if (t.status !== "CONFIRMED") continue;
      const { obligation, round, circle } = obligationContext(db, t.obligationId);
      if (obligation.userId !== user.id) continue;
      entries.push({ id: `tx-${t.id}`, type: "PAYMENT", date: t.confirmedAt ?? t.createdAt, circleId: circle.id, circleName: circle.name, roundId: round.id, roundNumber: round.roundNumber, amount: t.amount, method: t.method });
    }
    for (const p of db.payouts) {
      if (p.status !== "CONFIRMED") continue;
      const { round, circle } = payoutContext(db, p.id);
      if (round.recipientId !== user.id) continue;
      entries.push({ id: `payout-${p.id}`, type: "PAYOUT", date: p.confirmedAt ?? p.recordedAt, circleId: circle.id, circleName: circle.name, roundId: round.id, roundNumber: round.roundNumber, amount: p.amount, method: p.method });
    }
    entries.sort((a, b) => b.date.localeCompare(a.date));

    const sum = (list: HistoryEntry[]) => list.reduce((s, e) => s + Number(e.amount), 0);
    const byCircle = db.memberships
      .filter((m) => m.userId === user.id)
      .map((m) => findCircle(db, m.circleId))
      .filter((c) => c.status !== "GATHERING")
      .map((c) => {
        const mine = entries.filter((e) => e.circleId === c.id);
        return { id: c.id, name: c.name, status: c.status, paid: sum(mine.filter((e) => e.type === "PAYMENT")), received: sum(mine.filter((e) => e.type === "PAYOUT")) };
      });

    return {
      totalPaid: sum(entries.filter((e) => e.type === "PAYMENT")),
      totalReceived: sum(entries.filter((e) => e.type === "PAYOUT")),
      circles: byCircle,
      entries,
    };
  },
};

const routes: [string, RegExp, Handler][] = [
  ["POST", /^\/auth\/login$/, auth.login],
  ["POST", /^\/auth\/register$/, auth.register],
  ["POST", /^\/auth\/logout$/, auth.logout],
  ["GET", /^\/auth\/sessions$/, auth.sessions],
  ["DELETE", /^\/auth\/sessions\/(\d+)$/, auth.revokeSession],

  ["POST", /^\/user\/forgot-password$/, users.forgotPassword],
  ["POST", /^\/user\/verify-otp$/, users.verifyOtp],
  ["POST", /^\/user\/reset-password$/, users.resetPassword],
  ["GET", /^\/user\/(\d+)$/, users.get],
  ["PATCH", /^\/user\/(\d+)$/, users.update],

  ["GET", /^\/circles$/, circles.list],
  ["POST", /^\/circles$/, circles.create],
  ["GET", /^\/circles\/join\/([^/]+)$/, circles.joinPreview],
  ["POST", /^\/circles\/join$/, circles.join],
  ["GET", /^\/circles\/(\d+)$/, circles.get],
  ["GET", /^\/circles\/(\d+)\/rounds$/, circles.rounds],
  ["POST", /^\/circles\/(\d+)\/invitations$/, circles.createInvitation],
  ["POST", /^\/invitations\/(\d+)\/revoke$/, circles.revokeInvitation],
  ["POST", /^\/circles\/(\d+)\/activate$/, circles.activate],

  ["GET", /^\/rounds\/(\d+)$/, rounds.get],
  ["POST", /^\/rounds\/(\d+)\/payout$/, rounds.recordPayout],

  ["POST", /^\/payments\/manual$/, payments.manual],
  ["POST", /^\/payments\/(\d+)\/confirm$/, payments.confirm],
  ["POST", /^\/payments\/(\d+)\/reject$/, payments.reject],

  ["POST", /^\/payouts\/(\d+)\/send-code$/, payouts.sendCode],
  ["POST", /^\/payouts\/(\d+)\/confirm$/, payouts.confirm],

  ["GET", /^\/me\/summary$/, me.summary],
  ["GET", /^\/me\/history$/, me.history],

  // Faqat mock rejimi uchun yordamchi endpointlar
  ["POST", /^\/mock\/circles\/(\d+)\/fill$/, circles.mockFill],
  ["POST", /^\/mock\/reset$/, () => (resetDb(), {})],
];

export function handleMock(req: MockRequest): MockResult {
  const db = getDb();
  tick(db);

  for (const [method, pattern, handler] of routes) {
    if (method !== req.method) continue;
    const match = req.path.match(pattern);
    if (!match) continue;

    const ctx: Ctx = { ...req, db, params: match.slice(1), result: {} };
    try {
      const data = handler(ctx);
      return { status: 200, json: { statusCode: 200, data }, session: ctx.result.session };
    } catch (err) {
      if (err instanceof MockError) return { status: err.status, json: { statusCode: err.status, message: err.message } };
      throw err;
    }
  }

  return { status: 404, json: { statusCode: 404, message: `Mock endpoint topilmadi: ${req.method} ${req.path}` } };
}
