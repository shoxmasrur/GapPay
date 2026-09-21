import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { EmptyState, Notice, PageHeader, Section } from "@/components/ui/page-header";
import { CircleStatusBadge } from "@/components/ui/status-badge";
import { getMyHistory } from "@/lib/api/circles";
import { formatDate, formatMoney } from "@/lib/format";
import { methodLabel } from "@/lib/labels";
import type { HistoryEntry } from "@/lib/types";

export const metadata: Metadata = { title: "Tarix" };

const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

function groupByMonth(entries: HistoryEntry[]) {
  const groups = new Map<string, HistoryEntry[]>();
  for (const e of entries) {
    const d = new Date(e.date);
    const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  return [...groups];
}

export default async function HistoryPage() {
  const history = await getMyHistory();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Moliyaviy tarix" subtitle="Qancha to‘ladim, qancha oldim" />

      {!history ? (
        <Notice tone="warning">Tarixni yuklab bo‘lmadi. Backend ishlayotganini tekshiring.</Notice>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Icon name="arrowUp" className="size-3.5 text-overdue" /> Jami to‘ladim
              </p>
              <p className="mt-1 text-lg font-bold">{formatMoney(history.totalPaid)}</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Icon name="arrowDown" className="size-3.5 text-paid" /> Jami oldim
              </p>
              <p className="mt-1 text-lg font-bold">{formatMoney(history.totalReceived)}</p>
            </div>
          </div>

          {history.circles.length > 0 && (
            <Section title="Davralar bo‘yicha" id="by-circle">
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {history.circles.map((c) => (
                  <li key={c.id}>
                    <Link href={`/circles/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-bg">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.name}</p>
                        <p className="text-xs text-muted">
                          to‘ladim {formatMoney(c.paid)} · oldim {formatMoney(c.received)}
                        </p>
                      </div>
                      <CircleStatusBadge status={c.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Barcha amallar" id="entries">
            {history.entries.length === 0 ? (
              <EmptyState icon="history" title="Hali amallar yo‘q" text="Tasdiqlangan to‘lov va olgan pullaringiz shu yerda chiqadi." />
            ) : (
              <div className="flex flex-col gap-5">
                {groupByMonth(history.entries).map(([month, entries]) => (
                  <div key={month}>
                    <p className="mb-2 text-sm font-semibold text-muted">{month}</p>
                    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                      {entries.map((e) => {
                        const income = e.type === "PAYOUT";
                        return (
                          <li key={e.id}>
                            <Link href={`/rounds/${e.roundId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-bg">
                              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${income ? "bg-paid-soft text-paid" : "bg-bg text-muted"}`}>
                                <Icon name={income ? "arrowDown" : "arrowUp"} className="size-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{income ? "Navbatim — pul oldim" : "Badal to‘ladim"}</p>
                                <p className="truncate text-xs text-muted">
                                  {e.circleName} · {e.roundNumber}-raund · {methodLabel[e.method]} · {formatDate(e.date)}
                                </p>
                              </div>
                              <span className={`shrink-0 font-semibold ${income ? "text-paid" : ""}`}>
                                {income ? "+" : "−"}
                                {formatMoney(e.amount)}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* TODO(backend): PDF ko'chirma — GET /me/history?format=pdf (TZ 2-bosqich) */}
        </>
      )}
    </div>
  );
}
