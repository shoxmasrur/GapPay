import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  // Faqat ichki manzillarga qaytaramiz (open redirect'dan himoya)
  const redirectTo = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/home";

  return (
    <>
      <h1 className="text-2xl font-bold">Xush kelibsiz</h1>
      <p className="mt-1 text-muted">Telefon raqamingiz va parolingiz bilan kiring</p>

      <LoginForm redirectTo={redirectTo} />

      <p className="mt-auto pt-8 text-center text-muted">
        Hisobingiz yo‘qmi?{" "}
        <Link href="/register" className="font-semibold text-brand">
          Ro‘yxatdan o‘ting
        </Link>
      </p>
    </>
  );
}
