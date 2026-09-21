import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader, Progress, Section } from "@/components/ui/page-header";
import { RoundStatusBadge } from "@/components/ui/status-badge";
import { getRound } from "@/lib/api/circles";
import { readSession } from "@/lib/api/server";
import { formatDate, formatDaysLeft, formatMoney } from "@/lib/format";
import { ObligationRow } from "./obligation-row";
import { PayoutPanel } from "./payout-panel";
import { AutoRefresh } from "./auto-refresh";

export async function generateMetadata({ params }: PageProps<"/rounds/[id]">) {
  const round = await getRound(Number((await params).id));
  return { title: round ? `${round.roundNumber}-raund · ${round.circle.name}` : "Raund" };
}

export default async function RoundPage({ params }: PageProps<"/rounds/[id]">) {
  const [round, session] = await Promise.all([getRound(Number((await params).id)), readSession()]);
  if (!round) notFound();

  const me = session?.userId;
  const isOrganizer = round.circle.myRole === "ORGANIZER";
  const isRecipient = round.recipient.userId === me;
  const roundOpen = round.status === "OPEN";
  const paidCount = round.obligations.filter((o) => o.status === "PAID").length;
  const allPaid = round.obligations.length > 0 && paidCount === round.obligations.length;
  const hasAwaiting = round.obligations.some((o) => o.transactions.some((t) => t.status === "AWAITING_CONFIRMATION")) || round.payout?.status === "AWAITING_CONFIRMATION";

  return (
    <div className="flex flex-col gap-6">
      {/* Boshqa a'zolar tasdiqlashini kutayotganda sahifa o'zi yangilanib turadi */}
      {hasAwaiting && <AutoRefresh seconds={5} />}

      <PageHeader
        back={{ href: `/circles/${round.circle.id}`, label: round.circle.name }}
        title={`${round.roundNumber}-raund`}
        subtitle={`Muhlat: ${formatDate(round.deadline)}${roundOpen ? ` · ${formatDaysLeft(round.deadline)}` : ""}`}
        action={<RoundStatusBadge status={round.status} />}
      />

      <section className="rounded-2xl bg-brand p-5 text-white">
        <div className="flex items-center gap-3">
          <Avatar name={round.recipient.fullName} id={round.recipient.userId} size="lg" />
          <div>
            <p className="text-sm text-white/80">Bu oy oluvchi</p>
            <p className="text-xl font-bold">{isRecipient ? "Siz" : round.recipient.fullName}</p>
          </div>
        </div>
        <p className="mt-4 text-3xl font-bold tracking-tight">{formatMoney(round.collected)}</p>
        <p className="mb-2 text-sm text-white/80">
          {formatMoney(round.total)} dan yig‘ildi · {paidCount}/{round.obligations.length} kishi to‘ladi
        </p>
        <Progress value={Number(round.collected)} max={Number(round.total)} tone="white" />
      </section>

      <PayoutPanel
        roundId={round.id}
        payout={round.payout}
        total={Number(round.total)}
        recipientName={round.recipient.fullName}
        isRecipient={isRecipient}
        isOrganizer={isOrganizer}
        allPaid={allPaid}
        roundOpen={roundOpen}
      />

      <Section title="To‘lovlar" id="payments" action={isOrganizer && roundOpen ? <span className="text-xs text-muted">Qayd etish uchun a’zoni bosing</span> : undefined}>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {round.obligations.map((o) => (
            <ObligationRow key={o.id} obligation={o} isMe={o.userId === me} isOrganizer={isOrganizer} allowPartial={round.circle.allowPartial} roundOpen={roundOpen} />
          ))}
        </ul>
      </Section>

      {round.status === "CLOSED" && <p className="text-center text-xs text-muted">Yopilgan raund yozuvlari o‘zgartirilmaydi.</p>}
    </div>
  );
}
