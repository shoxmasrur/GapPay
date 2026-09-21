import type { Money } from "./types";

const TIMEZONE = "Asia/Tashkent";

const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

/** Tiyindagi summani "1 200 000 so‘m" ko'rinishiga keltiradi. */
export function formatMoney(tiyin: Money): string {
  const soum = Math.round(Number(tiyin) / 100);
  const grouped = soum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} so‘m`;
}

function tashkentParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** "15-oktabr" (joriy yil bo'lmasa: "15-oktabr 2027"). */
export function formatDate(value: string | Date): string {
  const { year, month, day } = tashkentParts(new Date(value));
  const currentYear = tashkentParts(new Date()).year;
  const base = `${day}-${MONTHS[month - 1]}`;
  return year === currentYear ? base : `${base} ${year}`;
}

/** Toshkent vaqti bo'yicha bugundan necha kun qolgani (o'tgan bo'lsa manfiy). */
export function daysUntil(value: string | Date): number {
  const toUtcDay = (d: Date) => {
    const { year, month, day } = tashkentParts(d);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtcDay(new Date(value)) - toUtcDay(new Date())) / 86_400_000);
}

export function formatDaysLeft(value: string | Date): string {
  const days = daysUntil(value);
  if (days === 0) return "bugun";
  if (days === 1) return "ertaga";
  if (days > 0) return `${days} kun qoldi`;
  return `${-days} kun kechikdi`;
}

/** Istalgan kiritmadan faqat 9 xonali mahalliy raqamni ajratadi: "90 123 45 67" → "901234567". */
export function localDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("998") && digits.length > 9) digits = digits.slice(3);
  return digits.slice(0, 9);
}

/** Backendga yuboriladigan format: +998901234567 */
export function toApiPhone(local: string): string {
  return `+998${localDigits(local)}`;
}

/** Kiritish maydoni uchun: "90 123 45 67" */
export function formatLocalPhone(local: string): string {
  const d = localDigits(local);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

export function formatPhone(phone: string): string {
  return `+998 ${formatLocalPhone(phone)}`;
}
