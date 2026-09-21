import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

export function PageHeader({ title, subtitle, back, action }: { title: ReactNode; subtitle?: ReactNode; back?: { href: string; label: string }; action?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3">
      {back && (
        <Link href={back.href} className="-ml-1 inline-flex w-fit items-center gap-1 text-sm font-medium text-brand">
          <Icon name="back" className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <div className="mt-1 text-muted">{subtitle}</div>}
        </div>
        {action}
      </div>
    </header>
  );
}

export function Section({ title, action, children, id }: { title: ReactNode; action?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={id} className="text-lg font-bold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface ${className}`}>{children}</div>;
}

export function EmptyState({ icon, title, text, children }: { icon: Parameters<typeof Icon>[0]["name"]; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
        <Icon name={icon} className="size-6" />
      </span>
      <p className="mt-3 font-semibold">{title}</p>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      {children && <div className="mt-4 w-full">{children}</div>}
    </div>
  );
}

const noticeTones = {
  info: "bg-brand-soft text-brand-strong",
  warning: "bg-pending-soft text-pending",
  danger: "bg-overdue-soft text-overdue",
};

export function Notice({ tone = "info", children }: { tone?: keyof typeof noticeTones; children: ReactNode }) {
  return (
    <div className={`flex gap-2.5 rounded-xl px-4 py-3 text-sm ${noticeTones[tone]}`}>
      <Icon name={tone === "info" ? "info" : "alert"} className="mt-px size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Progress({ value, max, tone = "brand" }: { value: number; max: number; tone?: "brand" | "white" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`h-2 overflow-hidden rounded-full ${tone === "white" ? "bg-white/25" : "bg-bg"}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${tone === "white" ? "bg-white" : "bg-brand"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
