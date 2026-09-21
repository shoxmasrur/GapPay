import { BottomNav } from "@/components/bottom-nav";
import { USE_MOCK } from "@/lib/mock/config";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {USE_MOCK && (
        <div className="bg-pending-soft py-1 text-center text-xs font-semibold text-pending">Mock rejimi — ma’lumotlar soxta</div>
      )}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-6 pb-28">{children}</main>
      <BottomNav />
    </>
  );
}
