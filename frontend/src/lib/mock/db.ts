// Mock rejimi uchun xotiradagi "baza". Jadvallar TZ 8-bo'limidagi sxemaga
// yaqin tuzilgan: majburiyat (obligation) va real tranzaksiya alohida, payout alohida.
// Sanalar bugundan hisoblanadi, shunda sahifalar doim "tirik" ko'rinadi.
// Server qayta ishga tushsa (yoki "Mock ma'lumotlarini tiklash" bosilsa) boshlang'ich holatga qaytadi.
import type {
  CircleStatus,
  ExitPolicy,
  MembershipRole,
  MembershipStatus,
  PaymentMethod,
  PayoutStatus,
  PenaltyRule,
  QueueRule,
  Role,
  RoundStatus,
  TransactionStatus,
} from "../types";

export type DbUser = { id: number; fullName: string; phone: string; role: Role; createdAt: string };

export type DbCircle = {
  id: number;
  name: string;
  description?: string;
  organizerId: number;
  amount: number;
  memberCount: number;
  paymentDay: number;
  deadlineDays: number;
  queueRule: QueueRule;
  allowPartial: boolean;
  penalty: PenaltyRule | null;
  exitPolicy: ExitPolicy;
  termsVersion: number;
  status: CircleStatus;
  createdAt: string;
  activatedAt: string | null;
};

export type DbMembership = {
  circleId: number;
  userId: number;
  role: MembershipRole;
  queuePosition: number | null;
  status: MembershipStatus;
  joinedAt: string;
};

export type DbConsent = { id: number; circleId: number; userId: number; termsVersion: number; acceptedAt: string; ip: string; device: string };

export type DbInvitation = {
  id: number;
  circleId: number;
  code: string;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  revoked: boolean;
  createdAt: string;
};

export type DbLottery = { circleId: number; seed: string; participants: number[]; order: number[]; drawnAt: string };

export type DbRound = { id: number; circleId: number; roundNumber: number; recipientId: number; deadline: string; status: RoundStatus };

export type DbObligation = { id: number; roundId: number; userId: number; amount: number };

export type DbTransaction = {
  id: number;
  obligationId: number;
  amount: number;
  method: PaymentMethod;
  status: TransactionStatus;
  recordedById: number;
  createdAt: string;
  confirmedAt: string | null;
  idempotencyKey: string;
};

export type DbPayout = {
  id: number;
  roundId: number;
  amount: number;
  method: "CASH" | "CARD";
  recordedById: number;
  recordedAt: string;
  status: PayoutStatus;
  confirmedAt: string | null;
};

export type DbSession = { id: number; userId: number; device: string; ip: string; lastActiveAt: string };

export type Db = {
  seq: number;
  users: DbUser[];
  circles: DbCircle[];
  memberships: DbMembership[];
  consents: DbConsent[];
  invitations: DbInvitation[];
  lotteries: DbLottery[];
  rounds: DbRound[];
  obligations: DbObligation[];
  transactions: DbTransaction[];
  payouts: DbPayout[];
  sessions: DbSession[];
};

/** Mock rejimida "kirgan" foydalanuvchi (login'da noma'lum raqam kiritilsa shu bo'ladi). */
export const DEMO_USER_ID = 6;

const DAY = 86_400_000;
export const fromToday = (days: number, hours = 10) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hours - 5, 0, 0, 0); // Toshkent vaqti bo'yicha soat
  return d.toISOString();
};

export function nextId(db: Db) {
  return ++db.seq;
}

const NAMES = [
  "Dilnoza Karimova",
  "Aziz Rahimov",
  "Malika Yusupova",
  "Jasur Tursunov",
  "Nodira Aliyeva",
  "Sardor Aliyev",
  "Bekzod Ergashev",
  "Gulnora Saidova",
  "Otabek Nazarov",
  "Feruza Xolmatova",
  "Rustam Qodirov",
  "Kamola Ismoilova",
  "Sherzod Umarov",
  "Zarina Olimova",
  "Laziz Hamidov",
];

/** Mock'da davrani to'ldirish uchun qo'shimcha ismlar. */
export const EXTRA_NAMES = [
  "Oybek Mirzayev",
  "Shahnoza Rasulova",
  "Ulug‘bek Sobirov",
  "Madina Qosimova",
  "Javlon Karimov",
  "Nilufar To‘xtayeva",
  "Doniyor Abdullayev",
  "Sevara Hakimova",
  "Temur Yo‘ldoshev",
  "Munisa Ahmedova",
];

type OpenPayment = { paid?: number; awaiting?: number; recordedBy?: number; method?: PaymentMethod };

type CircleSeed = Omit<DbCircle, "id" | "termsVersion" | "createdAt" | "activatedAt"> & {
  createdDaysAgo: number;
  /** Navbat tartibida a'zolar (birinchisi — 1-o'rin) */
  members: number[];
  lotterySeed?: string;
  /** Faol davralar uchun: n-raund muhlati bugundan necha kun keyin */
  deadlineOffset?: (roundNumber: number) => number;
  /** Ochiq raund raqami (hammasi yopilgan bo'lsa memberCount + 1) */
  openRound?: number;
  openPayments?: Record<number, OpenPayment>;
  /** Ochiq raundda payout qayd etilgan, oluvchi tasdiqlashi kutilmoqda */
  openPayoutAwaiting?: boolean;
};

function seedCircle(db: Db, seed: CircleSeed) {
  const { createdDaysAgo, members, lotterySeed, deadlineOffset, openRound, openPayments, openPayoutAwaiting, ...rest } = seed;
  const active = rest.status !== "GATHERING";
  const circle: DbCircle = {
    ...rest,
    id: nextId(db),
    termsVersion: 1,
    createdAt: fromToday(-createdDaysAgo),
    activatedAt: active ? fromToday(-createdDaysAgo + 7) : null,
  };
  db.circles.push(circle);

  members.forEach((userId, i) => {
    const joinedAt = fromToday(-createdDaysAgo + Math.min(i, 6), 12 + (i % 6));
    db.memberships.push({
      circleId: circle.id,
      userId,
      role: userId === circle.organizerId ? "ORGANIZER" : "MEMBER",
      queuePosition: active ? i + 1 : null,
      status: "ACTIVE",
      joinedAt,
    });
    db.consents.push({ id: nextId(db), circleId: circle.id, userId, termsVersion: 1, acceptedAt: joinedAt, ip: "84.54.70.12", device: "Chrome · Android" });
  });

  if (active && lotterySeed) {
    db.lotteries.push({
      circleId: circle.id,
      seed: lotterySeed,
      participants: [...members].sort((a, b) => a - b),
      order: members,
      drawnAt: circle.activatedAt!,
    });
  }

  if (!active || !deadlineOffset || !openRound) return circle;

  members.forEach((recipientId, i) => {
    const roundNumber = i + 1;
    const deadline = fromToday(deadlineOffset(roundNumber), 23);
    const status: RoundStatus = roundNumber < openRound ? "CLOSED" : roundNumber === openRound ? "OPEN" : "UPCOMING";
    const round: DbRound = { id: nextId(db), circleId: circle.id, roundNumber, recipientId, deadline, status };
    db.rounds.push(round);
    if (status === "UPCOMING") return;

    for (const userId of members) {
      const obligation: DbObligation = { id: nextId(db), roundId: round.id, userId, amount: circle.amount };
      db.obligations.push(obligation);

      const addTx = (amount: number, txStatus: TransactionStatus, daysBefore: number, method: PaymentMethod, recordedById: number) => {
        const createdAt = fromToday(deadlineOffset(roundNumber) - daysBefore, 14);
        db.transactions.push({
          id: nextId(db),
          obligationId: obligation.id,
          amount,
          method,
          status: txStatus,
          recordedById,
          createdAt,
          confirmedAt: txStatus === "CONFIRMED" ? createdAt : null,
          idempotencyKey: `seed-${obligation.id}-${amount}`,
        });
      };

      if (status === "CLOSED") {
        addTx(circle.amount, "CONFIRMED", 1 + (userId % 5), userId % 3 === 0 ? "PAYME" : "CASH", circle.organizerId);
        continue;
      }
      const p = openPayments?.[userId];
      if (!p) continue;
      const recorder = p.recordedBy ?? circle.organizerId;
      if (p.paid) addTx(p.paid, "CONFIRMED", 3, p.method ?? "CASH", recorder);
      // Kutilayotgan tasdiq — hozirgina qayd etilgan (bot a'zo uni ~8 soniyada tasdiqlaydi)
      if (p.awaiting) {
        addTx(p.awaiting, "AWAITING_CONFIRMATION", 0, "CASH", recorder);
        db.transactions[db.transactions.length - 1].createdAt = new Date().toISOString();
      }
    }

    if (status === "CLOSED" || openPayoutAwaiting) {
      const recordedAt = fromToday(deadlineOffset(roundNumber) + (status === "CLOSED" ? 1 : -1), 18);
      db.payouts.push({
        id: nextId(db),
        roundId: round.id,
        amount: circle.amount * members.length,
        method: "CASH",
        recordedById: circle.organizerId,
        recordedAt,
        status: status === "CLOSED" ? "CONFIRMED" : "AWAITING_CONFIRMATION",
        confirmedAt: status === "CLOSED" ? recordedAt : null,
      });
    }
  });

  return circle;
}

function createSeed(): Db {
  const db: Db = {
    seq: 1000,
    users: [],
    circles: [],
    memberships: [],
    consents: [],
    invitations: [],
    lotteries: [],
    rounds: [],
    obligations: [],
    transactions: [],
    payouts: [],
    sessions: [],
  };

  // Foydalanuvchilar id'lari 1..15 — qolgan yozuvlar 1001 dan boshlanadi.
  NAMES.forEach((fullName, i) => {
    db.users.push({
      id: i + 1,
      fullName,
      phone: `+99890${String(1_234_567 + i * 111_111).slice(0, 7)}`,
      role: "USER",
      createdAt: fromToday(-200 + i * 3),
    });
  });
  db.users[DEMO_USER_ID - 1].phone = "+998901112233";

  // 1. Faol, men — tashkilotchi, qur'a bilan
  seedCircle(db, {
    name: "Oilaviy gap",
    description: "Qarindoshlar bilan har oyning 15-sanasida.",
    organizerId: DEMO_USER_ID,
    amount: 100_000_000,
    memberCount: 10,
    paymentDay: 15,
    deadlineDays: 5,
    queueRule: "LOTTERY",
    allowPartial: true,
    penalty: { graceDays: 3, type: "PERCENT", value: 1, maxAmount: 5_000_000 },
    exitPolicy: "REPLACEMENT",
    status: "ACTIVE",
    createdDaysAgo: 75,
    members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    lotterySeed: "a3f9c2e17b04d58e",
    deadlineOffset: (n) => 4 + (n - 3) * 30,
    openRound: 3,
    openPayments: {
      1: { paid: 100_000_000 },
      2: { paid: 100_000_000, method: "PAYME", recordedBy: 2 },
      3: { awaiting: 100_000_000 },
      5: { paid: 40_000_000 },
      7: { paid: 100_000_000 },
      9: { paid: 100_000_000, method: "CLICK", recordedBy: 9 },
    },
  });

  // 2. Faol, men — a'zo, kelishuv bo'yicha; mening to'lovim kechikkan va
  // tashkilotchi qayd etgan naqd to'lov tasdig'imni kutyapti
  seedCircle(db, {
    name: "Ishxona davrasi",
    description: "Bo‘lim xodimlari, har oy boshida.",
    organizerId: 11,
    amount: 50_000_000,
    memberCount: 6,
    paymentDay: 1,
    deadlineDays: 3,
    queueRule: "AGREEMENT",
    allowPartial: true,
    penalty: { graceDays: 2, type: "FIXED", value: 2_000_000, maxAmount: 10_000_000 },
    exitPolicy: "CONTINUE",
    status: "ACTIVE",
    createdDaysAgo: 45,
    members: [11, 12, 6, 13, 14, 15],
    deadlineOffset: (n) => -1 + (n - 2) * 30,
    openRound: 2,
    openPayments: {
      11: { paid: 50_000_000 },
      12: { paid: 50_000_000 },
      6: { awaiting: 20_000_000 },
      13: { paid: 50_000_000, method: "PAYME", recordedBy: 13 },
      15: { paid: 25_000_000 },
    },
  });

  // 3. Faol, men — 1-navbatda; hamma to'lagan, payout mening tasdig'imni kutyapti
  seedCircle(db, {
    name: "Do‘stlar",
    organizerId: 7,
    amount: 20_000_000,
    memberCount: 4,
    paymentDay: 20,
    deadlineDays: 2,
    queueRule: "LOTTERY",
    allowPartial: false,
    penalty: null,
    exitPolicy: "RECALCULATE",
    status: "ACTIVE",
    createdDaysAgo: 20,
    members: [6, 7, 8, 9],
    lotterySeed: "5c81e0f2a9d3b746",
    deadlineOffset: (n) => -3 + (n - 1) * 30,
    openRound: 1,
    openPayments: { 6: { paid: 20_000_000 }, 7: { paid: 20_000_000 }, 8: { paid: 20_000_000 }, 9: { paid: 20_000_000 } },
    openPayoutAwaiting: true,
  });

  // 4. Yig'ilmoqda, men — tashkilotchi; hamma qo'shilgan, faollashtirishga tayyor
  const neighbours = seedCircle(db, {
    name: "Qo‘shnilar",
    description: "Mahalla qo‘shnilari, 5 kishi.",
    organizerId: DEMO_USER_ID,
    amount: 30_000_000,
    memberCount: 5,
    paymentDay: 10,
    deadlineDays: 3,
    queueRule: "LOTTERY",
    allowPartial: false,
    penalty: null,
    exitPolicy: "REPLACEMENT",
    status: "GATHERING",
    createdDaysAgo: 6,
    members: [6, 1, 2, 3, 4],
  });
  db.invitations.push({
    id: nextId(db),
    circleId: neighbours.id,
    code: "QSH-4821",
    expiresAt: fromToday(1),
    maxUses: 10,
    usedCount: 4,
    revoked: false,
    createdAt: fromToday(-6),
  });

  // 5. Yig'ilmoqda, men — a'zo
  seedCircle(db, {
    name: "Maktab do‘stlari",
    organizerId: 13,
    amount: 40_000_000,
    memberCount: 8,
    paymentDay: 5,
    deadlineDays: 5,
    queueRule: "REQUEST",
    allowPartial: true,
    penalty: null,
    exitPolicy: "CONTINUE",
    status: "GATHERING",
    createdDaysAgo: 3,
    members: [13, 6, 14],
  });

  // 6. Men a'zo emasman — "Kod bilan qo'shilish" sinovi uchun
  const bazaar = seedCircle(db, {
    name: "Bozor davrasi",
    description: "Chorsu bozoridagi do‘kondorlar.",
    organizerId: 15,
    amount: 200_000_000,
    memberCount: 6,
    paymentDay: 25,
    deadlineDays: 3,
    queueRule: "LOTTERY",
    allowPartial: true,
    penalty: { graceDays: 1, type: "PERCENT", value: 2, maxAmount: 20_000_000 },
    exitPolicy: "REPLACEMENT",
    status: "GATHERING",
    createdDaysAgo: 2,
    members: [15, 1, 2],
  });
  db.invitations.push({
    id: nextId(db),
    circleId: bazaar.id,
    code: "GAP-7K3M",
    expiresAt: fromToday(5),
    maxUses: 5,
    usedCount: 2,
    revoked: false,
    createdAt: fromToday(-2),
  });

  // 7. Yakunlangan — tarix uchun
  seedCircle(db, {
    name: "Yozgi gap",
    organizerId: 1,
    amount: 30_000_000,
    memberCount: 3,
    paymentDay: 1,
    deadlineDays: 3,
    queueRule: "AGREEMENT",
    allowPartial: false,
    penalty: null,
    exitPolicy: "CONTINUE",
    status: "COMPLETED",
    createdDaysAgo: 150,
    members: [1, 6, 5],
    deadlineOffset: (n) => -130 + (n - 1) * 30,
    openRound: 4,
  });

  db.sessions.push(
    { id: nextId(db), userId: DEMO_USER_ID, device: "Chrome · Windows", ip: "84.54.70.12", lastActiveAt: fromToday(-2, 21) },
    { id: nextId(db), userId: DEMO_USER_ID, device: "Safari · iPhone", ip: "213.230.92.4", lastActiveAt: fromToday(-9, 8) },
  );

  return db;
}

// Dev rejimida modul qayta yuklanganda ham ma'lumot saqlanib qolishi uchun globalThis'da.
const globalForMock = globalThis as unknown as { __gapMockDb?: Db };

export function getDb(): Db {
  globalForMock.__gapMockDb ??= createSeed();
  return globalForMock.__gapMockDb;
}

export function resetDb() {
  globalForMock.__gapMockDb = createSeed();
}
