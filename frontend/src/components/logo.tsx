import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-ink">
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-white" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="7.5" />
          <circle cx="12" cy="4.5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      Gap
    </Link>
  );
}
