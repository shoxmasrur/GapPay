import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { serverApi } from "@/lib/api/server";
import type { JoinPreview } from "@/lib/types";
import { JoinFlow } from "./join-flow";

export const metadata: Metadata = { title: "Davraga qo‘shilish" };

export default async function JoinPage({ searchParams }: PageProps<"/circles/join">) {
  const { code } = await searchParams;
  const initialCode = typeof code === "string" ? code.toUpperCase() : "";
  // Havola orqali kelganda (?code=...) shartlarni darhol ko'rsatamiz
  const preview = initialCode ? await serverApi<JoinPreview>(`/circles/join/${encodeURIComponent(initialCode)}`) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Davraga qo‘shilish" subtitle="Tashkilotchi bergan taklif kodini kiriting" back={{ href: "/circles", label: "Davralar" }} />
      <JoinFlow
        initialCode={initialCode}
        initialPreview={preview}
        initialError={initialCode && !preview ? "Taklif kodi topilmadi, muddati o‘tgan yoki davra allaqachon boshlangan" : undefined}
      />
    </div>
  );
}
