"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { Card, Notice } from "@/components/ui/page-header";
import { activateCircle, mockFillCircle } from "@/lib/api/actions";
import { USE_MOCK } from "@/lib/mock/config";
import { useAction } from "@/lib/use-action";
import type { CircleMember, QueueRule } from "@/lib/types";

type Props = { circleId: number; queueRule: QueueRule; members: CircleMember[]; memberCount: number };

export function ActivatePanel({ circleId, queueRule, members, memberCount }: Props) {
  const [order, setOrder] = useState(members.map((m) => m.userId));
  const [confirming, setConfirming] = useState(false);
  const { run, pending, error } = useAction();
  const missing = memberCount - members.length;
  const byId = new Map(members.map((m) => [m.userId, m]));

  function move(index: number, delta: number) {
    const next = [...order];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    setOrder(next);
  }

  if (missing > 0) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        <p className="font-semibold">Davrani boshlash</p>
        <p className="text-sm text-muted">Yana {missing} kishi qo‘shilishi kerak. Hamma qo‘shilib, shartlarga rozilik bergach, davrani faollashtira olasiz.</p>
        {USE_MOCK && (
          <Button type="button" variant="secondary" loading={pending} onClick={() => run(() => mockFillCircle(circleId))} className="text-sm">
            Mock: bo‘sh o‘rinlarni soxta a’zolar bilan to‘ldirish
          </Button>
        )}
        <FormError message={error} />
      </Card>
    );
  }

  const lottery = queueRule === "LOTTERY";

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div>
        <p className="font-semibold">Hamma yig‘ildi — davrani boshlang</p>
        <p className="mt-0.5 text-sm text-muted">
          {lottery ? "Tizim navbatni tasodifiy aralashtiradi. Natija va seed saqlanadi — keyin istalgan a’zo adolatli bo‘lganini tekshira oladi." : "Kelishilgan navbat tartibini belgilang: yuqoridagi birinchi bo‘lib oladi."}
        </p>
      </div>

      {!lottery && (
        <ol className="divide-y divide-line rounded-xl border border-line">
          {order.map((userId, i) => {
            const m = byId.get(userId)!;
            return (
              <li key={userId} className="flex items-center gap-3 px-3 py-2">
                <span className="w-5 text-center font-bold text-muted">{i + 1}</span>
                <Avatar name={m.fullName} id={m.userId} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.fullName}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-bg disabled:opacity-30" aria-label={`${m.fullName} — yuqoriga`}>
                  <Icon name="arrowUp" className="size-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-bg disabled:opacity-30" aria-label={`${m.fullName} — pastga`}>
                  <Icon name="arrowDown" className="size-4" />
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {confirming && <Notice tone="warning">Faollashtirilgandan keyin yangi a’zo qo‘shilmaydi va navbat o‘zgarmaydi. Davom etasizmi?</Notice>}
      <FormError message={error} />

      {confirming ? (
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setConfirming(false)} className="flex-1">
            Yo‘q
          </Button>
          <Button type="button" loading={pending} onClick={() => run(() => activateCircle(circleId, lottery ? undefined : order))} className="flex-[2]">
            {lottery && <Icon name="dice" className="size-5" />}
            Ha, boshlash
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={() => setConfirming(true)}>
          {lottery ? (
            <>
              <Icon name="dice" className="size-5" /> Qur‘a tashlash va boshlash
            </>
          ) : (
            "Tartibni tasdiqlash va boshlash"
          )}
        </Button>
      )}
    </Card>
  );
}
