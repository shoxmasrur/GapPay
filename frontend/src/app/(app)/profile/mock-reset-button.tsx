"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { mockReset } from "@/lib/api/actions";
import { useAction } from "@/lib/use-action";

/** Faqat mock rejimida ko'rinadi: xotiradagi soxta bazani boshlang'ich holatiga qaytaradi. */
export function MockResetButton() {
  const { run, pending } = useAction();
  return (
    <div className="rounded-2xl border border-dashed border-pending/40 bg-pending-soft/50 p-4">
      <p className="text-sm font-semibold text-pending">Mock rejimi</p>
      <p className="mt-0.5 text-sm text-muted">Barcha ma’lumotlar soxta va server xotirasida saqlanadi.</p>
      <Button type="button" variant="secondary" loading={pending} onClick={() => run(mockReset)} className="mt-3 h-11 w-full text-sm">
        <Icon name="refresh" className="size-4" /> Mock ma’lumotlarini tiklash
      </Button>
    </div>
  );
}
