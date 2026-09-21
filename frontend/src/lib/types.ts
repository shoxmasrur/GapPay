export type Role = "USER" | "SUPER_ADMIN";

export type User = {
  id: number;
  fullName: string;
  phone: string;
  role: Role;
  createdAt?: string;
};

// Quyidagi tiplar TZ (3, 8, 9-bo'limlar) asosida. Backend modullari tayyor
// bo'lganda javob shakliga qarab moslashtiriladi.

/** Summalar tiyinda (backendda BIGINT, JSON'da string bo'lib kelishi mumkin). */
export type Money = number | string;

export type CircleStatus = "GATHERING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type ObligationStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
export type QueueRule = "LOTTERY" | "AGREEMENT" | "REQUEST";
export type MembershipRole = "ORGANIZER" | "MEMBER";
export type MembershipStatus = "ACTIVE" | "LEFT" | "REMOVED";
export type ExitPolicy = "CONTINUE" | "REPLACEMENT" | "RECALCULATE";
export type RoundStatus = "UPCOMING" | "OPEN" | "CLOSED";
export type PaymentMethod = "CASH" | "PAYME" | "CLICK";
export type TransactionStatus = "AWAITING_CONFIRMATION" | "CONFIRMED" | "REJECTED";
export type PayoutStatus = "AWAITING_CONFIRMATION" | "CONFIRMED";

export type PenaltyRule = {
  /** Muhlatdan keyin jarimasiz kunlar */
  graceDays: number;
  type: "PERCENT" | "FIXED";
  /** PERCENT bo'lsa foiz, FIXED bo'lsa tiyin */
  value: number;
  /** Jarimaning yuqori chegarasi (tiyin) */
  maxAmount: Money;
};

/** Davra shartlari — a'zo qo'shilishda aynan shularga rozilik beradi. */
export type CircleTerms = {
  amount: Money;
  memberCount: number;
  /** Har oyning qaysi sanasida to'lov */
  paymentDay: number;
  /** To'lov sanasidan keyin necha kun muhlat */
  deadlineDays: number;
  queueRule: QueueRule;
  allowPartial: boolean;
  penalty: PenaltyRule | null;
  exitPolicy: ExitPolicy;
  termsVersion: number;
};

export type CircleSummary = {
  id: number;
  name: string;
  amount: Money;
  memberCount: number;
  joinedCount: number;
  status: CircleStatus;
  myRole: MembershipRole;
  /** Navbat hali belgilanmagan bo'lsa null (davra yig'ilmoqda) */
  myQueuePosition: number | null;
  currentRound: number;
  nextDeadline: string | null;
  myObligationStatus: ObligationStatus | null;
};

export type CircleMember = {
  userId: number;
  fullName: string;
  /** Tashkilotchidan boshqalarga qisman yashirilgan: +998 90 *** ** 45 */
  phone: string;
  role: MembershipRole;
  queuePosition: number | null;
  status: MembershipStatus;
  /** Joriy raunddagi majburiyat holati */
  currentStatus: ObligationStatus | null;
  joinedAt: string;
};

export type RoundSummary = {
  id: number;
  roundNumber: number;
  recipient: { userId: number; fullName: string };
  deadline: string;
  status: RoundStatus;
  collected: Money;
  total: Money;
};

export type Invitation = {
  id: number;
  code: string;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | "USED_UP";
  createdAt: string;
};

export type LotteryAudit = {
  seed: string;
  drawnAt: string;
  participants: { userId: number; fullName: string }[];
  order: { position: number; userId: number; fullName: string }[];
};

export type CircleDetails = CircleSummary &
  CircleTerms & {
    description?: string;
    createdAt: string;
    organizer: { userId: number; fullName: string };
    members: CircleMember[];
    rounds: RoundSummary[];
    lottery: LotteryAudit | null;
    /** Faqat tashkilotchiga qaytadi */
    invitations?: Invitation[];
  };

export type Transaction = {
  id: number;
  amount: Money;
  method: PaymentMethod;
  status: TransactionStatus;
  recordedBy: string;
  createdAt: string;
  confirmedAt: string | null;
};

export type Obligation = {
  id: number;
  userId: number;
  fullName: string;
  amount: Money;
  paidAmount: Money;
  status: ObligationStatus;
  transactions: Transaction[];
};

export type Payout = {
  id: number;
  amount: Money;
  method: "CASH" | "CARD";
  recordedBy: string;
  recordedAt: string;
  status: PayoutStatus;
  confirmedAt: string | null;
};

export type RoundDetails = RoundSummary & {
  circle: { id: number; name: string; amount: Money; allowPartial: boolean; myRole: MembershipRole };
  obligations: Obligation[];
  payout: Payout | null;
};

export type JoinPreview = CircleTerms & {
  circleId: number;
  name: string;
  description?: string;
  organizer: { fullName: string };
  joinedCount: number;
  alreadyMember: boolean;
};

export type PendingAction =
  | { type: "CONFIRM_PAYMENT"; id: number; roundId: number; circleName: string; amount: Money; recordedBy: string; createdAt: string }
  | { type: "CONFIRM_PAYOUT"; id: number; roundId: number; circleName: string; amount: Money; recordedBy: string; createdAt: string };

export type MySummary = {
  nextPayment: {
    circleId: number;
    roundId: number;
    circleName: string;
    amount: Money;
    paidAmount: Money;
    dueAt: string;
    status: ObligationStatus;
  } | null;
  nextPayout: {
    circleId: number;
    roundId: number;
    circleName: string;
    amount: Money;
    expectedAt: string;
    queuePosition: number;
    memberCount: number;
  } | null;
  actions: PendingAction[];
  circles: CircleSummary[];
};

export type HistoryEntry = {
  id: string;
  type: "PAYMENT" | "PAYOUT";
  date: string;
  circleId: number;
  circleName: string;
  roundId: number;
  roundNumber: number;
  amount: Money;
  method: PaymentMethod | "CARD";
};

export type MyHistory = {
  totalPaid: Money;
  totalReceived: Money;
  circles: { id: number; name: string; status: CircleStatus; paid: Money; received: Money }[];
  entries: HistoryEntry[];
};

export type Session = {
  id: number;
  device: string;
  ip: string;
  lastActiveAt: string;
  current: boolean;
};

export type CreateCircleInput = {
  name: string;
  description?: string;
  amount: number;
  memberCount: number;
  paymentDay: number;
  deadlineDays: number;
  queueRule: QueueRule;
  allowPartial: boolean;
  penalty: PenaltyRule | null;
  exitPolicy: ExitPolicy;
};
