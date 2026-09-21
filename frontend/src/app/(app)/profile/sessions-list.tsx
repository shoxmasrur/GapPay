"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { FormError } from "@/components/ui/field";
import { revokeSession } from "@/lib/api/auth";
import { formatDate } from "@/lib/format";
import { useAction } from "@/lib/use-action";
import type { Session } from "@/lib/types";

export function SessionsList({ sessions }: { sessions: Session[] }) {
  const router = useRouter();
  const { run, pending, error } = useAction();

  async function onRevoke(s: Session) {
    const ok = await run(() => revokeSession(s.id), { refresh: !s.current });
    if (ok && s.current) {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3">
            <span className={`grid size-10 shrink-0 place-items-center rounded-full ${s.current ? "bg-brand-soft text-brand" : "bg-bg text-muted"}`}>
              <Icon name="device" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{s.device}</p>
              <p className="truncate text-xs text-muted">
                {s.current ? <span className="font-semibold text-brand">Shu qurilma</span> : `Oxirgi faollik ${formatDate(s.lastActiveAt)}`} · {s.ip}
              </p>
            </div>
            {!s.current && (
              <button type="button" disabled={pending} onClick={() => onRevoke(s)} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-overdue hover:bg-overdue-soft disabled:opacity-50">
                Uzish
              </button>
            )}
          </li>
        ))}
      </ul>
      <FormError message={error} />
      <p className="text-xs text-muted">Tanimagan qurilmani ko‘rsangiz, darhol uzing va parolni almashtiring.</p>
    </div>
  );
}
