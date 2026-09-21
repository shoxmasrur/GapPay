import type { CircleStatus, Invitation, ObligationStatus, RoundStatus, TransactionStatus } from "@/lib/types";

const tones = {
  paid: "bg-paid-soft text-paid",
  pending: "bg-pending-soft text-pending",
  overdue: "bg-overdue-soft text-overdue",
  neutral: "bg-bg text-muted",
  brand: "bg-brand-soft text-brand",
};

type Tone = keyof typeof tones;

const obligation: Record<ObligationStatus, { label: string; tone: Tone }> = {
  PAID: { label: "To‘langan", tone: "paid" },
  PARTIALLY_PAID: { label: "Qisman to‘langan", tone: "pending" },
  PENDING: { label: "Kutilmoqda", tone: "pending" },
  OVERDUE: { label: "Kechikkan", tone: "overdue" },
};

const circle: Record<CircleStatus, { label: string; tone: Tone }> = {
  GATHERING: { label: "Yig‘ilmoqda", tone: "pending" },
  ACTIVE: { label: "Faol", tone: "paid" },
  COMPLETED: { label: "Yakunlangan", tone: "neutral" },
  CANCELLED: { label: "Bekor qilingan", tone: "neutral" },
};

const round: Record<RoundStatus, { label: string; tone: Tone }> = {
  UPCOMING: { label: "Kutilmoqda", tone: "neutral" },
  OPEN: { label: "Ochiq", tone: "brand" },
  CLOSED: { label: "Yopilgan", tone: "paid" },
};

const transaction: Record<TransactionStatus, { label: string; tone: Tone }> = {
  AWAITING_CONFIRMATION: { label: "Tasdiq kutilmoqda", tone: "pending" },
  CONFIRMED: { label: "Tasdiqlangan", tone: "paid" },
  REJECTED: { label: "Rad etilgan", tone: "overdue" },
};

const invitation: Record<Invitation["status"], { label: string; tone: Tone }> = {
  ACTIVE: { label: "Faol", tone: "paid" },
  EXPIRED: { label: "Muddati o‘tgan", tone: "neutral" },
  REVOKED: { label: "Bekor qilingan", tone: "neutral" },
  USED_UP: { label: "Limit tugagan", tone: "neutral" },
};

export function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

export const ObligationBadge = ({ status }: { status: ObligationStatus }) => <Badge {...obligation[status]} />;
export const CircleStatusBadge = ({ status }: { status: CircleStatus }) => <Badge {...circle[status]} />;
export const RoundStatusBadge = ({ status }: { status: RoundStatus }) => <Badge {...round[status]} />;
export const TransactionBadge = ({ status }: { status: TransactionStatus }) => <Badge {...transaction[status]} />;
export const InvitationBadge = ({ status }: { status: Invitation["status"] }) => <Badge {...invitation[status]} />;
