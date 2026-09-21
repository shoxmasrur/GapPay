"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, PhoneField } from "@/components/ui/field";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { localDigits, toApiPhone } from "@/lib/format";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (localDigits(phone).length !== 9) return setError("Telefon raqamni to‘liq kiriting");
    if (!password) return setError("Parolni kiriting");

    setError(null);
    setLoading(true);
    try {
      await login(toApiPhone(phone), password);
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
      <FormError message={error} />
      <PhoneField value={phone} onChange={setPhone} autoFocus />
      <Field
        label="Parol"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Link href="/forgot-password" className="-mt-2 self-end text-sm font-medium text-brand">
        Parolni unutdingizmi?
      </Link>
      <Button type="submit" loading={loading}>
        Kirish
      </Button>
    </form>
  );
}
