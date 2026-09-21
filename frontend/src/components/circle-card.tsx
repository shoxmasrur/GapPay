import Link from "next/link";
import { Icon } from "@/components/icons";
import { Progress } from "@/components/ui/page-header";
import { CircleStatusBadge, ObligationBadge } from "@/components/ui/status-badge";
import { formatDate, formatMoney } from "@/lib/format";
import type { CircleSummary } from "@/lib/types";

export function CircleCard({ circle }: { circle: CircleSummary }) {
  return (
    <Link href={`/circles/${circle.id}`} className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{circle.name}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {formatMoney(circle.amount)} · {circle.memberCount} kishi
            {circle.myRole === "ORGANIZER" && " · tashkilotchi"}
          </p>
        </div>
        <CircleStatusBadge status={circle.status} />
      </div>

      {circle.status === "ACTIVE" && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3 text-sm">
          <span className="text-muted">
            {circle.currentRound}/{circle.memberCount}-raund · navbatim: <span className="font-semibold text-ink">{circle.myQueuePosition}</span>
            {circle.nextDeadline && <> · {formatDate(circle.nextDeadline)}</>}
          </span>
          {circle.myObligationStatus && <ObligationBadge status={circle.myObligationStatus} />}
        </div>
      )}

      {circle.status === "GATHERING" && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted">
              <Icon name="users" className="size-4" /> A’zolar
            </span>
            <span className="font-medium">
              {circle.joinedCount} / {circle.memberCount}
            </span>
          </div>
          <Progress value={circle.joinedCount} max={circle.memberCount} />
        </div>
      )}
    </Link>
  );
}
