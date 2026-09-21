"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ChoiceCards, Field, FormError, MoneyField, Stepper, TextArea, Toggle } from "@/components/ui/field";
import { Card, Notice } from "@/components/ui/page-header";
import { createCircle } from "@/lib/api/actions";
import { formatMoney } from "@/lib/format";
import { exitPolicyLabel, penaltyText, queueRuleLabel } from "@/lib/labels";
import { useAction } from "@/lib/use-action";
import type { CreateCircleInput, ExitPolicy, QueueRule } from "@/lib/types";

const STEPS = ["Asosiy", "Summa va muddat", "Qoidalar", "Tekshirish"];

type Form = {
  name: string;
  description: string;
  amountSoum: number | null;
  memberCount: number;
  paymentDay: number;
  deadlineDays: number;
  queueRule: QueueRule;
  allowPartial: boolean;
  penaltyEnabled: boolean;
  penaltyGraceDays: number;
  penaltyType: "PERCENT" | "FIXED";
  penaltyValue: number | null;
  penaltyMaxSoum: number | null;
  exitPolicy: ExitPolicy;
};

const initial: Form = {
  name: "",
  description: "",
  amountSoum: null,
  memberCount: 10,
  paymentDay: 15,
  deadlineDays: 3,
  queueRule: "LOTTERY",
  allowPartial: true,
  penaltyEnabled: false,
  penaltyGraceDays: 3,
  penaltyType: "PERCENT",
  penaltyValue: 1,
  penaltyMaxSoum: 50_000,
  exitPolicy: "REPLACEMENT",
};

function toInput(f: Form): CreateCircleInput {
  return {
    name: f.name.trim(),
    description: f.description.trim() || undefined,
    amount: (f.amountSoum ?? 0) * 100,
    memberCount: f.memberCount,
    paymentDay: f.paymentDay,
    deadlineDays: f.deadlineDays,
    queueRule: f.queueRule,
    allowPartial: f.allowPartial,
    penalty: f.penaltyEnabled
      ? {
          graceDays: f.penaltyGraceDays,
          type: f.penaltyType,
          value: f.penaltyType === "PERCENT" ? (f.penaltyValue ?? 0) : (f.penaltyValue ?? 0) * 100,
          maxAmount: (f.penaltyMaxSoum ?? 0) * 100,
        }
      : null,
    exitPolicy: f.exitPolicy,
  };
}

export function CreateCircleForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const { run, pending, error } = useAction();

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function validate(): boolean {
    const e: typeof errors = {};
    if (step === 0 && form.name.trim().length < 2) e.name = "Davra nomini kiriting";
    if (step === 1 && !(form.amountSoum && form.amountSoum >= 1000)) e.amountSoum = "Badal kamida 1 000 so‘m bo‘lsin";
    if (step === 2 && form.penaltyEnabled) {
      if (!form.penaltyValue) e.penaltyValue = "Jarima miqdorini kiriting";
      if (form.penaltyType === "PERCENT" && (form.penaltyValue ?? 0) > 10) e.penaltyValue = "Ko‘pi bilan 10%";
      if (!form.penaltyMaxSoum) e.penaltyMaxSoum = "Yuqori chegarani kiriting";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    const created = await run(() => createCircle(toInput(form)), { refresh: false });
    if (created) router.replace(`/circles/${created.id}?created=1`);
  }

  const input = toInput(form);
  const payout = input.amount * form.memberCount;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <ol className="flex gap-1.5" aria-label="Bosqichlar">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`} />
            <p className={`mt-1.5 text-xs ${i === step ? "font-semibold text-ink" : "text-muted"}`}>{label}</p>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="flex flex-col gap-5">
          <Field label="Davra nomi" placeholder="Masalan: Oilaviy gap" autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} maxLength={60} />
          <TextArea label="Tavsif (ixtiyoriy)" placeholder="Kimlar bilan, qachon yig‘ilasiz…" value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={200} />
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-6">
          <MoneyField label="Oylik badal (har bir a’zo uchun)" value={form.amountSoum} onChange={(v) => set("amountSoum", v)} error={errors.amountSoum} autoFocus />
          <Stepper label="A’zolar soni" value={form.memberCount} onChange={(v) => set("memberCount", v)} min={2} max={30} suffix="kishi" hint={`Davra ${form.memberCount} oy davom etadi — har oy bitta a’zo oladi`} />
          <Stepper label="Har oyning nechanchi sanasida to‘lanadi" value={form.paymentDay} onChange={(v) => set("paymentDay", v)} min={1} max={28} suffix="-sana" />
          <Stepper label="To‘lov muhlati" value={form.deadlineDays} onChange={(v) => set("deadlineDays", v)} min={0} max={10} suffix="kun" hint="To‘lov sanasidan keyin shuncha kun ichida to‘lash kerak" />
          {input.amount > 0 && (
            <Notice>
              Har oy oluvchiga: <b>{formatMoney(payout)}</b>
            </Notice>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-6">
          <ChoiceCards
            label="Navbat qanday belgilanadi"
            value={form.queueRule}
            onChange={(v) => set("queueRule", v)}
            options={(Object.keys(queueRuleLabel) as QueueRule[]).map((value) => ({ value, ...queueRuleLabel[value] }))}
          />
          <Toggle label="Qisman to‘lovga ruxsat" text="Masalan, 1 000 000 so‘mni 400 000 + 600 000 qilib bo‘lib to‘lash" checked={form.allowPartial} onChange={(v) => set("allowPartial", v)} />
          <div className="flex flex-col gap-3">
            <Toggle label="Kechikish uchun jarima" text="Muhlat o‘tgach, imtiyoz kunlaridan keyin hisoblanadi" checked={form.penaltyEnabled} onChange={(v) => set("penaltyEnabled", v)} />
            {form.penaltyEnabled && (
              <Card className="flex flex-col gap-5 p-4">
                <Stepper label="Imtiyoz muddati" value={form.penaltyGraceDays} onChange={(v) => set("penaltyGraceDays", v)} min={0} max={10} suffix="kun" />
                <ChoiceCards
                  label="Jarima turi"
                  value={form.penaltyType}
                  onChange={(v) => set("penaltyType", v)}
                  options={[
                    { value: "PERCENT", title: "Foiz", text: "Badaldan kuniga necha foiz" },
                    { value: "FIXED", title: "Qat’iy summa", text: "Kuniga belgilangan summa" },
                  ]}
                />
                {form.penaltyType === "PERCENT" ? (
                  <Field label="Kuniga, %" inputMode="decimal" value={form.penaltyValue ?? ""} onChange={(e) => set("penaltyValue", Number(e.target.value.replace(/[^\d.]/g, "")) || null)} error={errors.penaltyValue} />
                ) : (
                  <MoneyField label="Kuniga" value={form.penaltyValue} onChange={(v) => set("penaltyValue", v)} error={errors.penaltyValue} />
                )}
                <MoneyField label="Jarimaning yuqori chegarasi" value={form.penaltyMaxSoum} onChange={(v) => set("penaltyMaxSoum", v)} error={errors.penaltyMaxSoum} />
              </Card>
            )}
          </div>
          <ChoiceCards
            label="Kimdir davradan chiqsa"
            value={form.exitPolicy}
            onChange={(v) => set("exitPolicy", v)}
            options={(Object.keys(exitPolicyLabel) as ExitPolicy[]).map((value) => ({ value, ...exitPolicyLabel[value] }))}
          />
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden">
            <div className="bg-brand p-5 text-white">
              <p className="text-sm text-white/80">{form.name}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{formatMoney(input.amount)}</p>
              <p className="text-sm text-white/80">har oy · {form.memberCount} kishi · {form.memberCount} oy</p>
            </div>
            <dl className="divide-y divide-line text-sm">
              {[
                ["Har oy oluvchiga", formatMoney(payout)],
                ["To‘lov sanasi", `har oyning ${form.paymentDay}-sanasi`],
                ["Muhlat", form.deadlineDays ? `${form.deadlineDays} kun` : "o‘sha kuni"],
                ["Navbat", queueRuleLabel[form.queueRule].title],
                ["Qisman to‘lov", form.allowPartial ? "Ruxsat etilgan" : "Yo‘q"],
                ["Jarima", penaltyText(input.penalty)],
                ["Chiqish siyosati", exitPolicyLabel[form.exitPolicy].title],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Notice>Davra yaratilgach, taklif kodini a’zolarga yuborasiz. Hamma qo‘shilib, shartlarga rozilik bergach, davrani faollashtirasiz.</Notice>
        </div>
      )}

      <FormError message={error} />

      <div className="flex gap-3">
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">
            Orqaga
          </Button>
        )}
        <Button type="submit" loading={pending} className="flex-[2]">
          {step === STEPS.length - 1 ? "Davrani yaratish" : "Davom etish"}
        </Button>
      </div>
    </form>
  );
}
