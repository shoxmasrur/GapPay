import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

const features = [
  ["Kim to‘ladi — hammaga ko‘rinadi", "Har bir to‘lov avtomatik qayd etiladi, bahs qolmaydi."],
  ["Navbat adolatli", "Qur‘a natijasi saqlanadi — istalgan payt tekshirsa bo‘ladi."],
  ["Eslatmalar o‘zi keladi", "Muhlatdan oldin Telegram va SMS orqali xabar beramiz."],
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-8 pb-10">
      <Logo />

      <section className="mt-12">
        <h1 className="text-3xl leading-tight font-bold tracking-tight">Gap pulini daftarda emas, telefoningizda yuriting</h1>
        <p className="mt-3 text-lg text-muted">Kim qachon to‘laydi, kim qachon oladi — hammasi bir joyda va hammaga ochiq.</p>
      </section>

      <ul className="mt-8 flex flex-col gap-3">
        {features.map(([title, text]) => (
          <li key={title} className="rounded-2xl border border-line bg-surface p-4">
            <p className="font-semibold">{title}</p>
            <p className="mt-0.5 text-sm text-muted">{text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-3 pt-10">
        <ButtonLink href="/register">Boshlash</ButtonLink>
        <ButtonLink href="/login" variant="secondary">
          Menda hisob bor
        </ButtonLink>
      </div>
    </main>
  );
}
