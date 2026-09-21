"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, PhoneField } from "@/components/ui/field";
import { requestPasswordReset, resetPassword, verifyResetCode } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { formatPhone, localDigits, toApiPhone } from "@/lib/format";

type Step = "phone" | "code" | "password";

const STEPS: Step[] = ["phone", "code", "password"];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function run(action: () => Promise<void>) {
    setError(null);
    setLoading(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      const res = await requestPasswordReset(toApiPhone(phone));
      setResendIn(res.resendAfter ?? 60);
      setStep("code");
    });

  function onPhoneSubmit(e: FormEvent) {
    e.preventDefault();
    if (localDigits(phone).length !== 9) return setError("Telefon raqamni to‘liq kiriting");
    sendCode();
  }

  function onCodeSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return setError("6 xonali kodni kiriting");
    run(async () => {
      const res = await verifyResetCode(toApiPhone(phone), code);
      setResetToken(res.resetToken);
      setStep("password");
    });
  }

  function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setError("Parol kamida 6 ta belgidan iborat bo‘lsin");
    run(async () => {
      await resetPassword(toApiPhone(phone), resetToken, password);
      router.replace("/login");
    });
  }

  return (
    <>
      <p className="text-sm font-medium text-muted">
        {STEPS.indexOf(step) + 1}-bosqich / {STEPS.length}
      </p>
      <h1 className="mt-1 text-2xl font-bold">Parolni tiklash</h1>

      {step === "phone" && (
        <form onSubmit={onPhoneSubmit} className="mt-8 flex flex-col gap-5" noValidate>
          <p className="text-muted">Ro‘yxatdan o‘tgan raqamingizga SMS kod yuboramiz.</p>
          <FormError message={error} />
          <PhoneField value={phone} onChange={setPhone} autoFocus />
          <Button type="submit" loading={loading}>
            Kod yuborish
          </Button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={onCodeSubmit} className="mt-8 flex flex-col gap-5" noValidate>
          <p className="text-muted">
            <span className="font-semibold text-ink">{formatPhone(phone)}</span> raqamiga yuborilgan 6 xonali kodni kiriting.
          </p>
          <FormError message={error} />
          <Field
            label="SMS kod"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="text-center text-2xl tracking-[0.5em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoFocus
          />
          <Button type="submit" loading={loading}>
            Tasdiqlash
          </Button>
          <div className="flex justify-between text-sm">
            <button type="button" className="font-medium text-brand" onClick={() => { setStep("phone"); setCode(""); setError(null); }}>
              Raqamni o‘zgartirish
            </button>
            <button type="button" className="font-medium text-brand disabled:text-muted" disabled={resendIn > 0 || loading} onClick={sendCode}>
              {resendIn > 0 ? `Qayta yuborish (${resendIn})` : "Qayta yuborish"}
            </button>
          </div>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={onPasswordSubmit} className="mt-8 flex flex-col gap-5" noValidate>
          <p className="text-muted">Yangi parol o‘ylab toping.</p>
          <FormError message={error} />
          <Field
            label="Yangi parol"
            type="password"
            autoComplete="new-password"
            hint="Kamida 6 ta belgi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <Button type="submit" loading={loading}>
            Saqlash
          </Button>
        </form>
      )}

      <p className="mt-auto pt-8 text-center text-muted">
        <Link href="/login" className="font-semibold text-brand">
          Kirish sahifasiga qaytish
        </Link>
      </p>
    </>
  );
}
