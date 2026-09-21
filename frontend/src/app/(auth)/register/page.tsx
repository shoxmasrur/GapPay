"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, PhoneField } from "@/components/ui/field";
import { login, register } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { localDigits, toApiPhone } from "@/lib/format";

type Errors = Partial<Record<"fullName" | "phone" | "password" | "confirm", string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  function validate(): Errors {
    const e: Errors = {};
    if (form.fullName.trim().length < 3) e.fullName = "Ism va familiyangizni kiriting";
    if (localDigits(form.phone).length !== 9) e.phone = "Telefon raqamni to‘liq kiriting";
    if (form.password.length < 6) e.password = "Parol kamida 6 ta belgidan iborat bo‘lsin";
    if (form.confirm !== form.password) e.confirm = "Parollar bir xil emas";
    return e;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setFormError(null);
    setLoading(true);
    const phone = toApiPhone(form.phone);
    try {
      await register(form.fullName.trim(), phone, form.password);
      await login(phone, form.password);
      router.replace("/home");
      router.refresh();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Ro‘yxatdan o‘tish</h1>
      <p className="mt-1 text-muted">Bir daqiqada hisob oching</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
        <FormError message={formError} />
        <Field
          label="Ism va familiya"
          autoComplete="name"
          placeholder="Eshmat Toshmatov"
          value={form.fullName}
          onChange={(e) => set("fullName")(e.target.value)}
          error={errors.fullName}
          autoFocus
        />
        <PhoneField value={form.phone} onChange={set("phone")} error={errors.phone} />
        <Field
          label="Parol"
          type="password"
          autoComplete="new-password"
          hint="Kamida 6 ta belgi"
          value={form.password}
          onChange={(e) => set("password")(e.target.value)}
          error={errors.password}
        />
        <Field
          label="Parolni takrorlang"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => set("confirm")(e.target.value)}
          error={errors.confirm}
        />
        <Button type="submit" loading={loading}>
          Ro‘yxatdan o‘tish
        </Button>
      </form>

      <p className="mt-auto pt-8 text-center text-muted">
        Hisobingiz bormi?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Kirish
        </Link>
      </p>
    </>
  );
}
