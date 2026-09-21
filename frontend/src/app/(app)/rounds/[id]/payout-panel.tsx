"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ChoiceCards, CodeField, FormError } from "@/components/ui/field";
import { Card, Notice } from "@/components/ui/page-header";
import { confirmPayout, recordPayout, sendPayoutCode } from "@/lib/api/actions";
import { formatDate, formatMoney } from "@/lib/format";
import { methodLabel } from "@/lib/labels";
import { USE_MOCK } from "@/lib/mock/config";
import { useAction } from "@/lib/use-action";
import type { Payout } from "@/lib/types";

type Props = {
  roundId: number;
  payout: Payout | null;
  total: number;
  recipientName: string;
  isRecipient: boolean;
  isOrganizer: boolean;
  allPaid: boolean;
  roundOpen: boolean;
};

export function PayoutPanel({ roundId, payout, total, recipientName, isRecipient, isOrganizer, allPaid, roundOpen }: Props) {
  const [method, setMethod] = useState<"CASH" | "CARD">("CASH");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const { run, pending, error, setError } = useAction();

  if (payout?.status === "CONFIRMED") {
    return (
      <Card className="flex items-center gap-3 p-4">
        <span className="grid size-10 place-items-center rounded-full bg-paid-soft text-paid">
          <Icon name="check" />
        </span>
        <div className="text-sm">
          <p className="font-semibold">{isRecipient ? "Siz" : recipientName} {formatMoney(payout.amount)} oldi</p>
          <p className="text-muted">
            {methodLabel[payout.method]} · {formatDate(payout.confirmedAt ?? payout.recordedAt)} · SMS bilan tasdiqlangan
          </p>
        </div>
      </Card>
    );
  }

  if (payout && isRecipient) {
    return (
      <Card className="flex flex-col gap-4 border-brand p-4">
        <div>
          <p className="font-semibold">Pulni oldingizmi?</p>
          <p className="mt-0.5 text-sm text-muted">
            {payout.recordedBy} sizga {formatMoney(payout.amount)} ({methodLabel[payout.method].toLowerCase()}) topshirganini qayd etdi. Olgan bo‘lsangiz, SMS kod bilan tasdiqlang.
          </p>
        </div>
        {codeSent ? (
          <>
            <CodeField value={code} onChange={(v) => (setCode(v), setError(null))} autoFocus />
            {USE_MOCK && <p className="text-xs text-muted">Mock rejimi: istalgan 6 xonali kod qabul qilinadi.</p>}
            <FormError message={error} />
            <Button type="button" loading={pending} disabled={code.length !== 6} onClick={() => run(() => confirmPayout(payout.id, code))}>
              Tasdiqlash
            </Button>
            <button type="button" className="text-sm font-medium text-brand" onClick={() => run(() => sendPayoutCode(payout.id), { refresh: false })}>
              Kodni qayta yuborish
            </button>
          </>
        ) : (
          <>
            <FormError message={error} />
            <Button type="button" loading={pending} onClick={async () => (await run(() => sendPayoutCode(payout.id), { refresh: false })) && setCodeSent(true)}>
              <Icon name="check" className="size-5" /> Ha, pulni oldim
            </Button>
          </>
        )}
      </Card>
    );
  }

  if (payout) {
    return (
      <Notice tone="warning">
        {formatMoney(payout.amount)} {recipientName}ga topshirildi ({formatDate(payout.recordedAt)}). Oluvchining SMS tasdig‘i kutilmoqda.
      </Notice>
    );
  }

  if (!roundOpen) return null;

  if (!allPaid) {
    return <Notice>Hamma a’zo to‘liq to‘lagach, tashkilotchi {formatMoney(total)}ni {isRecipient ? "sizga" : `${recipientName}ga`} topshiradi.</Notice>;
  }

  if (!isOrganizer) {
    return <Notice>Hamma to‘ladi! Tashkilotchi pulni {isRecipient ? "sizga" : `${recipientName}ga`} topshirishi kutilmoqda.</Notice>;
  }

  return (
    <Card className="flex flex-col gap-4 border-brand p-4">
      <div>
        <p className="font-semibold">Hamma to‘ladi — pulni topshiring</p>
        <p className="mt-0.5 text-sm text-muted">
          {formatMoney(total)} → {recipientName}. Oluvchi SMS bilan tasdiqlagach, raund yopiladi va keyingisi ochiladi.
        </p>
      </div>
      <ChoiceCards
        label="Qanday topshirildi"
        value={method}
        onChange={setMethod}
        options={[
          { value: "CASH", title: "Naqd" },
          { value: "CARD", title: "Kartaga o‘tkazma" },
        ]}
      />
      <FormError message={error} />
      <Button type="button" loading={pending} onClick={() => run(() => recordPayout(roundId, method))}>
        <Icon name="wallet" className="size-5" /> Topshirilganini qayd etish
      </Button>
    </Card>
  );
}
