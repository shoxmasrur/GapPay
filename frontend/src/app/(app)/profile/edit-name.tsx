"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { updateProfile } from "@/lib/api/auth";
import { useAction } from "@/lib/use-action";

export function EditName({ userId, fullName }: { userId: number; fullName: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(fullName);
  const { run, pending, error, setError } = useAction();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim().length < 3) return setError("Ism kamida 3 ta harfdan iborat bo‘lsin");
    if (await run(() => updateProfile(userId, value.trim()))) setEditing(false);
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
        <Icon name="edit" className="size-4" /> Ismni o‘zgartirish
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 border-t border-line pt-4" noValidate>
      <Field label="Ism va familiya" autoFocus autoComplete="name" value={value} onChange={(e) => setValue(e.target.value)} />
      <FormError message={error} />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => (setEditing(false), setValue(fullName))} className="flex-1">
          Bekor
        </Button>
        <Button type="submit" loading={pending} className="flex-[2]">
          Saqlash
        </Button>
      </div>
    </form>
  );
}
