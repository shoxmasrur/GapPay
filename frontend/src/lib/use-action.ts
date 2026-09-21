"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage } from "./api/client";

/**
 * Client komponentdagi amal (POST/PATCH...) uchun: yuklanish va xato holati,
 * muvaffaqiyatdan keyin server komponentlarni yangilash (router.refresh).
 */
export function useAction() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(fn: () => Promise<T>, { refresh = true }: { refresh?: boolean } = {}): Promise<T | undefined> {
    setPending(true);
    setError(null);
    try {
      const result = await fn();
      if (refresh) router.refresh();
      return result;
    } catch (err) {
      setError(errorMessage(err));
      return undefined;
    } finally {
      setPending(false);
    }
  }

  return { run, pending, error, setError };
}
