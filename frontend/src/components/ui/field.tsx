"use client";

import { useId, type ComponentProps } from "react";
import { formatLocalPhone, localDigits } from "@/lib/format";

const inputClass =
  "h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 aria-invalid:border-overdue";

type FieldProps = ComponentProps<"input"> & { label: string; error?: string; hint?: string };

export function Field({ label, error, hint, className = "", ...props }: FieldProps) {
  const id = useId();
  const describedBy = error || hint ? `${id}-desc` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input id={id} className={`${inputClass} ${className}`} aria-invalid={!!error} aria-describedby={describedBy} {...props} />
      {(error || hint) && (
        <p id={describedBy} className={`text-sm ${error ? "text-overdue" : "text-muted"}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

type PhoneFieldProps = { label?: string; value: string; onChange: (local: string) => void; error?: string; autoFocus?: boolean };

/** "+998" prefiksi qotirilgan; qiymat sifatida 9 xonali mahalliy raqam saqlanadi. */
export function PhoneField({ label = "Telefon raqam", value, onChange, error, autoFocus }: PhoneFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-muted">+998</span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="90 123 45 67"
          autoFocus={autoFocus}
          className={`${inputClass} pl-16 tracking-wide`}
          value={formatLocalPhone(value)}
          onChange={(e) => onChange(localDigits(e.target.value))}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
        />
      </div>
      {error && (
        <p id={`${id}-err`} className="text-sm text-overdue">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl bg-overdue-soft px-4 py-3 text-sm text-overdue">
      {message}
    </div>
  );
}

export function TextArea({ label, hint, ...props }: ComponentProps<"textarea"> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
        {...props}
      />
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** So'mdagi summa: "1 200 000" ko'rinishida kiritiladi, qiymat — butun so'm. */
export function MoneyField({ label, value, onChange, error, hint, autoFocus }: { label: string; value: number | null; onChange: (soum: number | null) => void; error?: string; hint?: string; autoFocus?: boolean }) {
  const id = useId();
  const describedBy = error || hint ? `${id}-desc` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          autoFocus={autoFocus}
          className={`${inputClass} pr-16 text-lg font-semibold tracking-wide`}
          value={value == null ? "" : value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
            onChange(digits ? Number(digits) : null);
          }}
          aria-invalid={!!error}
          aria-describedby={describedBy}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted">so‘m</span>
      </div>
      {(error || hint) && (
        <p id={describedBy} className={`text-sm ${error ? "text-overdue" : "text-muted"}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/** Katta "−  10  +" tugmali son tanlagich — telefonda bir qo'lda qulay. */
export function Stepper({ label, value, onChange, min, max, suffix, hint }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; suffix?: string; hint?: string }) {
  const id = useId();
  const btn = "grid size-12 place-items-center rounded-xl border border-line bg-surface text-2xl font-medium text-ink disabled:opacity-40";
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-sm font-medium text-ink">
        {label}
      </span>
      <div className="flex items-center gap-3" role="group" aria-labelledby={id}>
        <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Kamaytirish">
          −
        </button>
        <output className="flex-1 text-center text-xl font-bold" aria-live="polite">
          {value} {suffix}
        </output>
        <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Ko‘paytirish">
          +
        </button>
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, text, checked, onChange }: { label: string; text?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-line bg-surface p-4">
      <span>
        <span className="block font-medium">{label}</span>
        {text && <span className="mt-0.5 block text-sm text-muted">{text}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand after:absolute after:top-0.5 after:left-0.5 after:size-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" aria-hidden />
    </label>
  );
}

export function ChoiceCards<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; title: string; text?: string }[] }) {
  const name = useId();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium text-ink">{label}</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${value === o.value ? "border-brand bg-brand-soft/60" : "border-line bg-surface"}`}
        >
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="mt-1 size-4 accent-[var(--color-brand)]" />
          <span>
            <span className="block font-medium">{o.title}</span>
            {o.text && <span className="mt-0.5 block text-sm text-muted">{o.text}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/** 6 xonali SMS kod */
export function CodeField({ value, onChange, label = "SMS kod", autoFocus }: { value: string; onChange: (v: string) => void; label?: string; autoFocus?: boolean }) {
  return (
    <Field
      label={label}
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder="• • • • • •"
      maxLength={6}
      autoFocus={autoFocus}
      className="text-center text-2xl font-bold tracking-[0.5em]"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
    />
  );
}
