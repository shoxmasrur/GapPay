import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { CreateCircleForm } from "./create-circle-form";

export const metadata: Metadata = { title: "Davra yaratish" };

export default function NewCirclePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Yangi davra" back={{ href: "/circles", label: "Davralar" }} />
      <CreateCircleForm />
    </div>
  );
}
