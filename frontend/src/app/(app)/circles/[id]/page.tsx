import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { TermsList } from "@/components/terms-list";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Notice, PageHeader, Progress, Section } from "@/components/ui/page-header";
import { CircleStatusBadge, ObligationBadge, RoundStatusBadge } from "@/components/ui/status-badge";
import { getCircle } from "@/lib/api/circles";
import { formatDate, formatDaysLeft, formatMoney, formatPhone } from "@/lib/format";
import { readSession } from "@/lib/api/server";
import { ActivatePanel } from "./activate-panel";
import { InvitePanel } from "./invite-panel";

export async function generateMetadata({ params }: PageProps<"/circles/[id]">) {
  const circle = await getCircle(Number((await params).id));
  return { title: circle?.name ?? "Davra" };
}

export default async function CirclePage({ params, searchParams }: PageProps<"/circles/[id]">) {
  const [circle, session, query] = await Promise.all([getCircle(Number((await params).id)), readSession(), searchParams]);
  if (!circle) notFound();

  const me = session?.userId;
  const isOrganizer = circle.myRole === "ORGANIZER";
  const gathering = circle.status === "GATHERING";
  const openRound = circle.rounds.find((r) => r.status === "OPEN");
  const payout = Number(circle.amount) * circle.memberCount;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/circles", label: "Davralar" }}
        title={circle.name}
        subtitle={circle.description}
        action={<CircleStatusBadge status={circle.status} />}
      />

      {query.created && <Notice>Davra yaratildi! Endi taklif kodini a’zolarga yuboring.</Notice>}
      {query.joined && <Notice>Siz davraga qo‘shildingiz. Hamma yig‘ilgach, tashkilotchi navbatni belgilaydi.</Notice>}

      {/* Asosiy ko'rsatkichlar */}
      <section className="rounded-2xl bg-brand p-5 text-white">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/80">Oylik badal</p>
            <p className="text-3xl font-bold tracking-tight">{formatMoney(circle.amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80">Oluvchiga</p>
            <p className="font-semibold">{formatMoney(payout)}</p>
          </div>
        </div>
        <div className="mt-5">
          {gathering ? (
            <>
              <div className="mb-2 flex justify-between text-sm">
                <span>A’zolar yig‘ilmoqda</span>
                <span className="font-semibold">
                  {circle.joinedCount} / {circle.memberCount}
                </span>
              </div>
              <Progress value={circle.joinedCount} max={circle.memberCount} tone="white" />
            </>
          ) : (
            <>
              <div className="mb-2 flex justify-between text-sm">
                <span>{circle.status === "COMPLETED" ? "Davra yakunlangan" : `${circle.currentRound}-raund`}</span>
                <span className="font-semibold">
                  {circle.rounds.filter((r) => r.status === "CLOSED").length} / {circle.memberCount} yopilgan
                </span>
              </div>
              <Progress value={circle.rounds.filter((r) => r.status === "CLOSED").length} max={circle.memberCount} tone="white" />
            </>
          )}
        </div>
      </section>

      {/* Joriy raund — mening holatim */}
      {openRound && (
        <Link href={`/rounds/${openRound.id}`} className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{openRound.roundNumber}-raund · oluvchi</p>
              <p className="font-semibold">{openRound.recipient.userId === me ? "Siz" : openRound.recipient.fullName}</p>
            </div>
            {circle.myObligationStatus && <ObligationBadge status={circle.myObligationStatus} />}
          </div>
          <div className="mt-3">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-muted">
                Muhlat {formatDate(openRound.deadline)} · {formatDaysLeft(openRound.deadline)}
              </span>
              <span className="font-medium">{Math.round((Number(openRound.collected) / Number(openRound.total)) * 100)}%</span>
            </div>
            <Progress value={Number(openRound.collected)} max={Number(openRound.total)} />
            <p className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted">
                Yig‘ildi: {formatMoney(openRound.collected)} / {formatMoney(openRound.total)}
              </span>
              <Icon name="chevron" className="size-4 text-muted" />
            </p>
          </div>
        </Link>
      )}

      {gathering && isOrganizer && (
        <>
          <Section title="Taklif qilish" id="invite">
            <InvitePanel circleId={circle.id} circleName={circle.name} invitations={circle.invitations ?? []} freeSlots={circle.memberCount - circle.joinedCount} />
          </Section>
          <ActivatePanel circleId={circle.id} queueRule={circle.queueRule} members={circle.members} memberCount={circle.memberCount} />
        </>
      )}

      {gathering && !isOrganizer && (
        <Notice>
          Hamma qo‘shilgach, tashkilotchi ({circle.organizer.fullName}) navbatni belgilab davrani boshlaydi. Sizga xabar beramiz.
        </Notice>
      )}

      <Section title={gathering ? `A’zolar (${circle.joinedCount}/${circle.memberCount})` : "Navbat"} id="members">
        <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {circle.members.map((m) => {
            const isMe = m.userId === me;
            const receivesNow = openRound?.recipient.userId === m.userId;
            return (
              <li key={m.userId} className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-brand-soft/60" : ""}`}>
                {m.queuePosition != null && <span className="w-5 shrink-0 text-center font-bold text-muted">{m.queuePosition}</span>}
                <Avatar name={m.fullName} id={m.userId} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {m.fullName}
                    {isMe && <span className="text-muted"> (siz)</span>}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {m.role === "ORGANIZER" && <span className="font-semibold text-brand">Tashkilotchi · </span>}
                    {receivesNow && <span className="font-semibold text-brand">Shu oy oladi · </span>}
                    {m.phone.includes("*") ? m.phone : formatPhone(m.phone)}
                  </p>
                </div>
                {m.currentStatus && <ObligationBadge status={m.currentStatus} />}
              </li>
            );
          })}
          {gathering &&
            Array.from({ length: circle.memberCount - circle.joinedCount }, (_, i) => (
              <li key={`empty-${i}`} className="flex items-center gap-3 px-4 py-3 text-muted">
                <span className="grid size-10 place-items-center rounded-full border-2 border-dashed border-line">
                  <Icon name="plus" className="size-4" />
                </span>
                <span className="text-sm">Bo‘sh o‘rin</span>
              </li>
            ))}
        </ol>
      </Section>

      {circle.rounds.length > 0 && (
        <Section title="Oyma-oy jadval" id="schedule">
          <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {circle.rounds.map((r) => {
              const content = (
                <>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${r.status === "OPEN" ? "bg-brand text-white" : r.status === "CLOSED" ? "bg-paid-soft text-paid" : "bg-bg text-muted"}`}>
                    {r.status === "CLOSED" ? <Icon name="check" className="size-4" /> : r.roundNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.recipient.userId === me ? "Siz olasiz" : r.recipient.fullName}</p>
                    <p className="text-xs text-muted">
                      {r.roundNumber}-raund · muhlat {formatDate(r.deadline)}
                    </p>
                  </div>
                  <RoundStatusBadge status={r.status} />
                </>
              );
              return (
                <li key={r.id}>
                  {r.status === "UPCOMING" ? (
                    <div className="flex items-center gap-3 px-4 py-3">{content}</div>
                  ) : (
                    <Link href={`/rounds/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-bg">
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </Section>
      )}

      {circle.lottery && (
        <details className="group rounded-2xl border border-line bg-surface">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand">
              <Icon name="shield" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">Qur‘a natijasi</span>
              <span className="text-sm text-muted">{formatDate(circle.lottery.drawnAt)} · adolatlilikni tekshirish</span>
            </span>
            <Icon name="chevron" className="size-4 text-muted transition-transform group-open:rotate-90" />
          </summary>
          <div className="flex flex-col gap-3 border-t border-line p-4 text-sm">
            <p>
              <span className="text-muted">Seed: </span>
              <code className="rounded bg-bg px-1.5 py-0.5 font-mono">{circle.lottery.seed}</code>
            </p>
            <p className="text-muted">Ishtirokchilar ({circle.lottery.participants.length}): {circle.lottery.participants.map((p) => p.fullName).join(", ")}</p>
            <ol className="grid grid-cols-2 gap-1.5">
              {circle.lottery.order.map((o) => (
                <li key={o.userId} className="rounded-lg bg-bg px-2.5 py-1.5">
                  <b>{o.position}.</b> {o.fullName}
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted">Shu seed bilan aralashtirish qayta bajarilsa, aynan shu tartib chiqadi. Natija o‘zgartirib bo‘lmaydigan qilib saqlangan.</p>
          </div>
        </details>
      )}

      <details className="group">
        <summary className="mb-3 flex cursor-pointer list-none items-center justify-between text-lg font-bold">
          Davra shartlari
          <Icon name="chevron" className="size-4 text-muted transition-transform group-open:rotate-90" />
        </summary>
        <TermsList terms={circle} />
        <p className="mt-2 text-xs text-muted">
          Tashkilotchi: {circle.organizer.fullName} · yaratilgan {formatDate(circle.createdAt)} · shartlar {circle.termsVersion}-versiya
        </p>
      </details>

      {circle.status === "COMPLETED" && (
        <ButtonLink href="/history" variant="secondary">
          Moliyaviy tarixni ko‘rish
        </ButtonLink>
      )}
    </div>
  );
}
