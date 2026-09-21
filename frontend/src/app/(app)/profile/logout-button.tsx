"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/api/auth";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    await logout().catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button variant="secondary" loading={loading} onClick={onClick} className="text-overdue">
      Chiqish
    </Button>
  );
}
