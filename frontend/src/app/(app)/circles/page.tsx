import type { Metadata } from "next";
import { CircleCard } from "@/components/circle-card";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { getMyCircles } from "@/lib/api/circles";

export const metadata: Metadata = { title: "Davralar" };

export default async function CirclesPage() {
  const circles = await getMyCircles();
  const groups = [
    { title: "Faol", items: circles.filter((c) => c.status === "ACTIVE") },
    { title: "Yig‘ilmoqda", items: circles.filter((c) => c.status === "GATHERING") },
    { title: "Yakunlangan", items: circles.filter((c) => c.status === "COMPLETED" || c.status === "CANCELLED") },
  ].filter((g) => g.items.length);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Davralarim" />

      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href="/circles/new">
          <Icon name="plus" className="size-5" /> Yaratish
        </ButtonLink>
        <ButtonLink href="/circles/join" variant="secondary">
          <Icon name="key" className="size-5" /> Kod bilan
        </ButtonLink>
      </div>

      {groups.length ? (
        groups.map((g) => (
          <section key={g.title} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted">
              {g.title} · {g.items.length}
            </h2>
            {g.items.map((c) => (
              <CircleCard key={c.id} circle={c} />
            ))}
          </section>
        ))
      ) : (
        <EmptyState icon="circles" title="Siz hali birorta davrada emassiz" text="Yangi davra yarating yoki tashkilotchi bergan kod bilan qo‘shiling." />
      )}
    </div>
  );
}
