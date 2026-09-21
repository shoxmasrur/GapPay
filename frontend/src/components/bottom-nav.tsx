"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

const items: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: "/home", label: "Bosh sahifa", icon: "home", match: ["/home"] },
  { href: "/circles", label: "Davralar", icon: "circles", match: ["/circles", "/rounds"] },
  { href: "/history", label: "Tarix", icon: "history", match: ["/history"] },
  { href: "/profile", label: "Profil", icon: "user", match: ["/profile"] },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map((item) => {
          const active = item.match.some((m) => pathname.startsWith(m));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${active ? "text-brand" : "text-muted"}`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${active ? "bg-brand-soft" : ""}`}>
                  <Icon name={item.icon} className="size-5" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
