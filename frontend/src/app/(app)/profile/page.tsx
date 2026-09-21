import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { Notice, Section } from "@/components/ui/page-header";
import { getSessions } from "@/lib/api/circles";
import { formatDate, formatPhone } from "@/lib/format";
import { USE_MOCK } from "@/lib/mock/config";
import { getCurrentUser } from "@/lib/session";
import { EditName } from "./edit-name";
import { LogoutButton } from "./logout-button";
import { MockResetButton } from "./mock-reset-button";
import { SessionsList } from "./sessions-list";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const [user, sessions] = await Promise.all([getCurrentUser(), getSessions()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Profil</h1>

      {user ? (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center gap-4">
            <Avatar name={user.fullName} id={user.id} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold">{user.fullName}</p>
              <p className="text-muted">{formatPhone(user.phone)}</p>
            </div>
          </div>
          {user.createdAt && <p className="mt-4 text-sm text-muted">{formatDate(user.createdAt)} dan beri a‘zo</p>}
          <EditName userId={user.id} fullName={user.fullName} />
        </section>
      ) : (
        <Notice tone="warning">Profil ma’lumotlarini yuklab bo‘lmadi. Backend ishlayotganini tekshiring.</Notice>
      )}

      <Link href="/history" className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-brand/40">
        <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon name="history" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Moliyaviy tarix</span>
          <span className="text-sm text-muted">Qancha to‘ladim, qancha oldim</span>
        </span>
        <Icon name="chevron" className="size-4 text-muted" />
      </Link>

      <Section title="Qurilmalar" id="sessions">
        {sessions ? (
          <SessionsList sessions={sessions} />
        ) : (
          // TODO(backend): GET /auth/sessions va DELETE /auth/sessions/:id hali yo'q
          <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-muted">Sessiyalar ro‘yxati backendda hali mavjud emas.</p>
        )}
      </Section>

      {USE_MOCK && <MockResetButton />}

      <LogoutButton />
    </div>
  );
}
