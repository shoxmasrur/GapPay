"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Server komponentni vaqti-vaqti bilan yangilaydi (boshqalarning tasdig'ini kutganda). */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
