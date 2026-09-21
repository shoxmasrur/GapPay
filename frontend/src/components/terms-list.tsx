import { formatMoney } from "@/lib/format";
import { exitPolicyLabel, penaltyText, queueRuleLabel } from "@/lib/labels";
import type { CircleTerms } from "@/lib/types";

/** Davra shartlari — qo'shilishda rozilik beriladigan ro'yxat va davra sahifasida ko'rsatiladi. */
export function TermsList({ terms }: { terms: CircleTerms }) {
  const rows: [string, string, string?][] = [
    ["Oylik badal", formatMoney(terms.amount)],
    ["Har oy oluvchiga", formatMoney(Number(terms.amount) * terms.memberCount)],
    ["A’zolar va muddat", `${terms.memberCount} kishi · ${terms.memberCount} oy`],
    ["To‘lov sanasi", `har oyning ${terms.paymentDay}-sanasi`, terms.deadlineDays ? `muhlat ${terms.deadlineDays} kun` : undefined],
    ["Navbat", queueRuleLabel[terms.queueRule].title, queueRuleLabel[terms.queueRule].text],
    ["Qisman to‘lov", terms.allowPartial ? "Ruxsat etilgan" : "Ruxsat yo‘q"],
    ["Jarima", penaltyText(terms.penalty)],
    ["Kimdir chiqsa", exitPolicyLabel[terms.exitPolicy].title, exitPolicyLabel[terms.exitPolicy].text],
  ];
  return (
    <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface text-sm">
      {rows.map(([k, v, note]) => (
        <div key={k} className="flex justify-between gap-4 px-4 py-3">
          <dt className="shrink-0 text-muted">{k}</dt>
          <dd className="text-right">
            <span className="font-medium">{v}</span>
            {note && <span className="mt-0.5 block text-xs text-muted">{note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
