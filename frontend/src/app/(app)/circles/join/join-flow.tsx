"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TermsList } from "@/components/terms-list";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { Notice } from "@/components/ui/page-header";
import { getJoinPreview, joinCircle } from "@/lib/api/actions";
import { MOCK_INVITE_CODE, USE_MOCK } from "@/lib/mock/config";
import { useAction } from "@/lib/use-action";
import type { JoinPreview } from "@/lib/types";

// TZ "3 bosqich qoidasi": 1) kod → 2) shartlar va rozilik → 3) davra sahifasi.
type Props = { initialCode: string; initialPreview: JoinPreview | null; initialError?: string };

export function JoinFlow({ initialCode, initialPreview, initialError }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [preview, setPreview] = useState(initialPreview);
  const [agreed, setAgreed] = useState(false);
  const { run, pending, error: actionError, setError } = useAction();
  const [showInitialError, setShowInitialError] = useState(!!initialError);
  const error = actionError ?? (showInitialError ? initialError : null);

  async function loadPreview(value: string) {
    if (value.trim().length < 4) return setError("Taklif kodini kiriting");
    const result = await run(() => getJoinPreview(value), { refresh: false });
    if (result) setPreview(result);
  }

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    if (!preview) return;
    if (!agreed) return setError("Davom etish uchun shartlarga rozilik bildiring");
    const result = await run(() => joinCircle(code, preview.termsVersion), { refresh: false });
    if (result) router.replace(`/circles/${result.circleId}?joined=1`);
  }

  if (!preview) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadPreview(code);
        }}
        className="flex flex-col gap-5"
        noValidate
      >
        <Field
          label="Taklif kodi"
          placeholder="ABC-1234"
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          className="text-center text-xl font-bold tracking-widest uppercase"
          value={code}
          onChange={(e) => (setCode(e.target.value.toUpperCase()), setShowInitialError(false))}
        />
        {USE_MOCK && (
          <Notice>
            Mock rejimi: sinash uchun <button type="button" className="font-bold underline" onClick={() => setCode(MOCK_INVITE_CODE)}>{MOCK_INVITE_CODE}</button> kodini ishlating.
          </Notice>
        )}
        <FormError message={error} />
        <Button type="submit" loading={pending}>
          Davom etish
        </Button>
      </form>
    );
  }

  const free = preview.memberCount - preview.joinedCount;

  return (
    <form onSubmit={onJoin} className="flex flex-col gap-5" noValidate>
      <div className="rounded-2xl bg-brand p-5 text-white">
        <p className="text-sm text-white/80">Tashkilotchi: {preview.organizer.fullName}</p>
        <h2 className="mt-1 text-2xl font-bold">{preview.name}</h2>
        {preview.description && <p className="mt-1 text-white/85">{preview.description}</p>}
        <p className="mt-3 text-sm text-white/80">
          {preview.joinedCount} / {preview.memberCount} kishi qo‘shilgan · {free} ta o‘rin bo‘sh
        </p>
      </div>

      {preview.alreadyMember ? (
        <>
          <Notice>Siz bu davraga allaqachon qo‘shilgansiz.</Notice>
          <Button type="button" onClick={() => router.replace(`/circles/${preview.circleId}`)}>
            Davraga o‘tish
          </Button>
        </>
      ) : (
        <>
          <div>
            <h3 className="mb-2 font-semibold">Davra shartlari</h3>
            <TermsList terms={preview} />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface p-4">
            <input type="checkbox" checked={agreed} onChange={(e) => (setAgreed(e.target.checked), setError(null))} className="mt-0.5 size-5 shrink-0 accent-[var(--color-brand)]" />
            <span className="text-sm">
              Shartlar bilan tanishdim va roziman. Har oy <b>o‘z vaqtida to‘lash</b> majburiyatini olaman. Rozilik sana, qurilma va IP bilan saqlanadi.
            </span>
          </label>

          <FormError message={error} />

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => (setPreview(null), setAgreed(false))} className="flex-1">
              Orqaga
            </Button>
            <Button type="submit" loading={pending} disabled={!agreed} className="flex-[2]">
              Qo‘shilish
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
