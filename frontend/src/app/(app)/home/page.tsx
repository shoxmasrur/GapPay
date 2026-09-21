import type { Metadata } from "next";
import Link from "next/link";
import { CircleCard } from "@/components/circle-card";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Progress, Section } from "@/components/ui/page-header";
import { ObligationBadge } from "@/components/ui/status-badge";
import { getMySummary } from "@/lib/api/circles";
import { formatDate, formatDaysLeft, formatMoney } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Bosh sahifa" };

export default async function HomePage() {
  const [user, summary] = await Promise.all([getCurrentUser(), getMySummary()]);
  const { nextPayment, nextPayout, actions, circles } = summary;
  const firstName = user?.fullName.split(" ")[0];
  const activeCircles = circles.filter((c) => c.status !== "COMPLETED");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-muted">Assalomu alaykum{firstName ? "," : ""}</p>
          <h1 className="text-2xl font-bold">{firstName ?? "Xush kelibsiz"}</h1>
        </div>
        <Link href="/profile" className="relative grid size-11 place-items-center rounded-full border border-line bg-surface text-muted" aria-label={`Bildirishnomalar: ${actions.length}`}>
          <Icon name="bell" />
          {actions.length > 0 && <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-overdue text-[11px] font-bold text-white">{actions.length}</span>}
        </Link>
      </header>

      {/* Tasdiq kutayotgan amallar — ikki tomonlama tasdiq (TZ 3.4) */}
      {actions.length > 0 && (
        <section aria-label="Tasdiq kutayotgan amallar" className="flex flex-col gap-2">
          {actions.map((a) => (
            <Link key={`${a.type}-${a.id}`} href={`/rounds/${a.roundId}`} className="flex items-center gap-3 rounded-2xl border border-pending/30 bg-pending-soft p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-pending">
                <Icon name={a.type === "CONFIRM_PAYOUT" ? "wallet" : "cash"} />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-ink">{a.type === "CONFIRM_PAYOUT" ? "Pulni olganingizni tasdiqlang" : "To‘lovingizni tasdiqlang"}</p>
                <p className="text-muted">
                  {a.circleName} · {formatMoney(a.amount)} · {a.recordedBy}
                </p>
              </div>
              <Icon name="chevron" className="size-4 text-pending" />
            </Link>
          ))}
        </section>
      )}

      {/* TZ: bosh ekran = "Men qachon to'layman va qachon olaman?" */}
      <section aria-labelledby="next-payment" className="rounded-2xl bg-gradient-to-br from-brand to-brand-strong p-5 text-white shadow-lg shadow-brand/20">
        <div className="flex items-center justify-between">
          <h2 id="next-payment" className="text-sm font-medium text-white/80">
            Keyingi to‘lov
          </h2>
          {nextPayment && (
            <span className="rounded-full bg-white px-0.5 py-0.5">
              <ObligationBadge status={nextPayment.status} />
            </span>
          )}
        </div>
        {nextPayment ? (
          <>
            <p className="mt-2 text-3xl font-bold tracking-tight">{formatMoney(Number(nextPayment.amount) - Number(nextPayment.paidAmount))}</p>
            <p className="mt-1 text-white/85">
              {formatDate(nextPayment.dueAt)} · {formatDaysLeft(nextPayment.dueAt)}
            </p>
            <p className="mt-0.5 text-sm text-white/70">{nextPayment.circleName}</p>
            {Number(nextPayment.paidAmount) > 0 && (
              <div className="mt-3">
                <Progress value={Number(nextPayment.paidAmount)} max={Number(nextPayment.amount)} tone="white" />
                <p className="mt-1 text-xs text-white/75">{formatMoney(nextPayment.paidAmount)} to‘langan</p>
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {/* TODO(backend): Payme/Click to'lovi (POST /payments/initiate) — TZ 2-bosqich */}
              <button type="button" disabled className="h-12 rounded-xl bg-white font-semibold text-brand disabled:opacity-80" title="To‘lov tizimi hali ulanmagan">
                Payme / Click
              </button>
              <Link href={`/rounds/${nextPayment.roundId}`} className="grid h-12 place-items-center rounded-xl border border-white/40 font-semibold text-white">
                Batafsil
              </Link>
            </div>
            <p className="mt-2 text-center text-xs text-white/70">Naqd to‘lasangiz, tashkilotchi qayd etadi — siz tasdiqlaysiz</p>
          </>
        ) : (
          <p className="mt-2 text-lg font-semibold">Hozircha to‘lov yo‘q</p>
        )}
      </section>

      <section aria-labelledby="next-payout" className="rounded-2xl border border-line bg-surface p-5">
        <h2 id="next-payout" className="text-sm font-medium text-muted">
          Men qachon olaman
        </h2>
        {nextPayout ? (
          <Link href={`/circles/${nextPayout.circleId}`} className="mt-2 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-bold tracking-tight">{formatMoney(nextPayout.amount)}</p>
              <p className="mt-1 text-muted">
                {formatDate(nextPayout.expectedAt)} · {nextPayout.circleName}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-3xl font-bold text-brand">{nextPayout.queuePosition}</p>
              <p className="text-xs text-muted">/ {nextPayout.memberCount} navbat</p>
            </div>
          </Link>
        ) : (
          <p className="mt-2 text-muted">Davra boshlangach, navbatingiz shu yerda chiqadi.</p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/circles/new" className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 hover:border-brand/40">
          <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand">
            <Icon name="plus" />
          </span>
          <span className="font-semibold">Davra yaratish</span>
        </Link>
        <Link href="/circles/join" className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 hover:border-brand/40">
          <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand">
            <Icon name="key" />
          </span>
          <span className="font-semibold">Kod bilan qo‘shilish</span>
        </Link>
      </div>

      <Section
        title="Davralarim"
        id="my-circles"
        action={
          <Link href="/circles" className="text-sm font-medium text-brand">
            Hammasi
          </Link>
        }
      >
        {activeCircles.length ? (
          <div className="flex flex-col gap-3">
            {activeCircles.map((c) => (
              <CircleCard key={c.id} circle={c} />
            ))}
          </div>
        ) : (
          <EmptyState icon="circles" title="Hali davra yo‘q" text="Yangi davra yarating yoki tashkilotchidan taklif kodini so‘rang.">
            <ButtonLink href="/circles/new" className="w-full">
              Davra yaratish
            </ButtonLink>
          </EmptyState>
        )}
      </Section>
    </div>
  );
}
