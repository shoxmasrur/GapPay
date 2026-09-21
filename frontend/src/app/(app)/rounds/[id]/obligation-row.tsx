"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormError, MoneyField } from "@/components/ui/field";
import { ObligationBadge, TransactionBadge } from "@/components/ui/status-badge";
import { confirmPayment, recordCashPayment, rejectPayment } from "@/lib/api/actions";
import { formatDate, formatMoney } from "@/lib/format";
import { methodLabel } from "@/lib/labels";
import { useAction } from "@/lib/use-action";
import type { Obligation } from "@/lib/types";

type Props = { obligation: Obligation; isMe: boolean; isOrganizer: boolean; allowPartial: boolean; roundOpen: boolean };

export function ObligationRow({ obligation: o, isMe, isOrganizer, allowPartial, roundOpen }: Props) {
  const awaiting = o.transactions.filter((t) => t.status === "AWAITING_CONFIRMATION");
  const remaining = Number(o.amount) - Number(o.paidAmount) - awaiting.reduce((s, t) => s + Number(t.amount), 0);
  const canRecord = isOrganizer && roundOpen && remaining > 0;
  const needsMyConfirm = isMe && awaiting.length > 0;

  const [open, setOpen] = useState(needsMyConfirm);
  const [recording, setRecording] = useState(false);
  const [amount, setAmount] = useState<number | null>(Math.round(remaining / 100));
  // Idempotentlik kaliti: takror bosilsa ham ikkinchi yozuv tushmaydi
  const [key, setKey] = useState(() => crypto.randomUUID());
  const { run, pending, error } = useAction();

  async function onRecord() {
    const tiyin = (amount ?? 0) * 100;
    const ok = await run(() => recordCashPayment(o.id, tiyin, key));
    if (ok) {
      setRecording(false);
      setKey(crypto.randomUUID());
    }
  }

  return (
    <li className={isMe ? "bg-brand-soft/50" : ""}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3 text-left" aria-expanded={open}>
        <Avatar name={o.fullName} id={o.userId} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {o.fullName}
            {isMe && <span className="text-muted"> (siz)</span>}
          </p>
          <p className="text-xs text-muted">
            {formatMoney(o.paidAmount)} / {formatMoney(o.amount)}
            {awaiting.length > 0 && <span className="font-semibold text-pending"> · tasdiq kutilmoqda</span>}
          </p>
        </div>
        <ObligationBadge status={o.status} />
      </button>

      {open && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          {o.transactions.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {o.transactions.map((t) => (
                <li key={t.id} className="rounded-xl border border-line bg-surface p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{formatMoney(t.amount)}</span>
                    <TransactionBadge status={t.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {methodLabel[t.method]} · {formatDate(t.createdAt)} · qayd etdi: {t.recordedBy}
                  </p>
                  {isMe && t.status === "AWAITING_CONFIRMATION" && (
                    <div className="mt-3 flex flex-col gap-2">
                      <p className="text-sm">
                        {t.recordedBy} sizdan <b>{formatMoney(t.amount)}</b> naqd olganini qayd etdi. To‘g‘rimi?
                      </p>
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => rejectPayment(t.id))} className="h-11 flex-1 text-sm text-overdue">
                          Yo‘q, bermadim
                        </Button>
                        <Button type="button" loading={pending} onClick={() => run(() => confirmPayment(t.id))} className="h-11 flex-[2] text-sm">
                          <Icon name="check" className="size-4" /> Ha, berdim
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Hali to‘lov qayd etilmagan.</p>
          )}

          {canRecord &&
            (recording ? (
              <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3">
                {allowPartial ? (
                  <MoneyField label="Naqd qabul qilingan summa" value={amount} onChange={setAmount} hint={`Qolgan qarz: ${formatMoney(remaining)}`} autoFocus />
                ) : (
                  <p className="text-sm">
                    Qabul qilingan summa: <b>{formatMoney(remaining)}</b> <span className="text-muted">(qisman to‘lovga ruxsat yo‘q)</span>
                  </p>
                )}
                <p className="text-xs text-muted">{isMe ? "O‘zingiz uchun qayd etganingiz darhol tasdiqlanadi." : `${o.fullName} tasdiqlagandan keyin to‘lov hisobga olinadi.`}</p>
                <FormError message={error} />
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setRecording(false)} className="h-11 flex-1 text-sm">
                    Bekor
                  </Button>
                  <Button type="button" loading={pending} onClick={onRecord} className="h-11 flex-[2] text-sm">
                    Qayd etish
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="secondary" onClick={() => (setAmount(Math.round(remaining / 100)), setRecording(true))} className="h-11 text-sm">
                <Icon name="cash" className="size-4" /> Naqd to‘lovni qayd etish
              </Button>
            ))}

          {!recording && <FormError message={error} />}
        </div>
      )}
    </li>
  );
}
