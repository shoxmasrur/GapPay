import { formatMoney } from "./format";
import type { ExitPolicy, PaymentMethod, PenaltyRule, QueueRule } from "./types";

export const queueRuleLabel: Record<QueueRule, { title: string; text: string }> = {
  LOTTERY: { title: "Qur‘a", text: "Tizim navbatni tasodifiy aralashtiradi, natija saqlanadi" },
  AGREEMENT: { title: "Kelishuv", text: "Tashkilotchi navbatni a’zolar bilan kelishib belgilaydi" },
  REQUEST: { title: "Ariza", text: "Ehtiyoji borlar oldinroq so‘raydi, tashkilotchi tartiblaydi" },
};

export const exitPolicyLabel: Record<ExitPolicy, { title: string; text: string }> = {
  CONTINUE: { title: "Qolganlar bilan davom etish", text: "Chiqqan a’zo o‘rni bo‘sh qoladi, oluvchi summasi kamayadi" },
  REPLACEMENT: { title: "O‘rinbosar topish", text: "Chiqqan a’zo o‘rniga yangi odam uning navbatini oladi" },
  RECALCULATE: { title: "Qayta hisoblash", text: "Badal summasi qolgan a’zolarga qayta taqsimlanadi" },
};

export const methodLabel: Record<PaymentMethod | "CARD", string> = {
  CASH: "Naqd",
  PAYME: "Payme",
  CLICK: "Click",
  CARD: "Kartaga",
};

export function penaltyText(penalty: PenaltyRule | null) {
  if (!penalty) return "Jarima yo‘q";
  const value = penalty.type === "PERCENT" ? `${penalty.value}% kuniga` : `${formatMoney(penalty.value)} kuniga`;
  return `${penalty.graceDays} kundan keyin ${value}, ko‘pi bilan ${formatMoney(penalty.maxAmount)}`;
}
