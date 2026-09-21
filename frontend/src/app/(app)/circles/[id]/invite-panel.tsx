"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { FormError, Stepper } from "@/components/ui/field";
import { Card } from "@/components/ui/page-header";
import { InvitationBadge } from "@/components/ui/status-badge";
import { createInvitation, revokeInvitation } from "@/lib/api/actions";
import { formatDate } from "@/lib/format";
import { useAction } from "@/lib/use-action";
import type { Invitation } from "@/lib/types";

export function InvitePanel({ circleId, circleName, invitations, freeSlots }: { circleId: number; circleName: string; invitations: Invitation[]; freeSlots: number }) {
  const [creating, setCreating] = useState(invitations.every((i) => i.status !== "ACTIVE"));
  const [days, setDays] = useState(3);
  const [maxUses, setMaxUses] = useState(Math.max(1, freeSlots));
  const [copied, setCopied] = useState<number | null>(null);
  const { run, pending, error } = useAction();

  const active = invitations.filter((i) => i.status === "ACTIVE");
  const inactive = invitations.filter((i) => i.status !== "ACTIVE");

  async function share(inv: Invitation) {
    const url = `${window.location.origin}/circles/join?code=${encodeURIComponent(inv.code)}`;
    const text = `«${circleName}» davrasiga taklif. Kod: ${inv.code}`;
    if (navigator.share) {
      await navigator.share({ title: "Gap — taklif", text, url }).catch(() => null);
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${url}`).catch(() => null);
    setCopied(inv.id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function onCreate() {
    const inv = await run(() => createInvitation(circleId, days, maxUses));
    if (inv) setCreating(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {active.map((inv) => (
        <Card key={inv.id} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">Taklif kodi</p>
            <InvitationBadge status={inv.status} />
          </div>
          <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-brand">{inv.code}</p>
          <p className="mt-1 text-sm text-muted">
            {formatDate(inv.expiresAt)} gacha · {inv.usedCount}/{inv.maxUses} marta ishlatilgan
          </p>
          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={() => share(inv)} className="h-11 flex-1 text-sm">
              <Icon name={copied === inv.id ? "check" : "share"} className="size-4" />
              {copied === inv.id ? "Nusxalandi" : "Yuborish"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => run(() => revokeInvitation(inv.id))} disabled={pending} className="h-11 text-sm text-overdue">
              Bekor qilish
            </Button>
          </div>
        </Card>
      ))}

      {creating ? (
        <Card className="flex flex-col gap-5 p-4">
          <p className="font-semibold">Yangi taklif kodi</p>
          <Stepper label="Amal qilish muddati" value={days} onChange={setDays} min={1} max={14} suffix="kun" />
          <Stepper label="Necha kishi ishlata oladi" value={maxUses} onChange={setMaxUses} min={1} max={50} suffix="marta" hint={`Davrada ${freeSlots} ta bo‘sh o‘rin bor`} />
          <FormError message={error} />
          <div className="flex gap-2">
            {active.length > 0 && (
              <Button type="button" variant="secondary" onClick={() => setCreating(false)} className="flex-1">
                Bekor
              </Button>
            )}
            <Button type="button" loading={pending} onClick={onCreate} className="flex-[2]">
              Kod yaratish
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <FormError message={error} />
          <Button type="button" variant="ghost" onClick={() => setCreating(true)}>
            <Icon name="plus" className="size-4" />
            Yangi kod yaratish
          </Button>
        </>
      )}

      {inactive.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted">Eski kodlar ({inactive.length})</summary>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface">
            {inactive.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-3 py-2">
                <span className="font-mono text-muted line-through">{inv.code}</span>
                <InvitationBadge status={inv.status} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
