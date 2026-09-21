import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-8 pb-10">
      <Logo />
      <div className="mt-10 flex flex-1 flex-col">{children}</div>
    </main>
  );
}
