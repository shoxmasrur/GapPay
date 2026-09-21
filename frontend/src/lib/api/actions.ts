// Brauzerdan chaqiriladigan o'zgartiruvchi amallar (client komponentlar uchun).
import type { CircleDetails, CreateCircleInput, Invitation, JoinPreview, RoundDetails } from "../types";
import { api } from "./client";

export const createCircle = (input: CreateCircleInput) => api<{ id: number }>("/circles", { method: "POST", body: input });

export const getJoinPreview = (code: string) => api<JoinPreview>(`/circles/join/${encodeURIComponent(code.trim())}`);

export const joinCircle = (code: string, termsVersion: number) =>
  api<{ circleId: number }>("/circles/join", { method: "POST", body: { code: code.trim(), termsVersion, accepted: true } });

export const createInvitation = (circleId: number, expiresInDays: number, maxUses: number) =>
  api<Invitation>(`/circles/${circleId}/invitations`, { method: "POST", body: { expiresInDays, maxUses } });

export const revokeInvitation = (id: number) => api<object>(`/invitations/${id}/revoke`, { method: "POST" });

export const activateCircle = (circleId: number, order?: number[]) =>
  api<CircleDetails>(`/circles/${circleId}/activate`, { method: "POST", body: { order } });

export const recordCashPayment = (obligationId: number, amount: number, idempotencyKey: string) =>
  api<{ id: number }>("/payments/manual", { method: "POST", body: { obligationId, amount, method: "CASH", idempotencyKey } });

export const confirmPayment = (id: number) => api<object>(`/payments/${id}/confirm`, { method: "POST" });

export const rejectPayment = (id: number) => api<object>(`/payments/${id}/reject`, { method: "POST" });

export const recordPayout = (roundId: number, method: "CASH" | "CARD") =>
  api<RoundDetails>(`/rounds/${roundId}/payout`, { method: "POST", body: { method } });

export const sendPayoutCode = (payoutId: number) =>
  api<{ expiresIn: number; resendAfter: number }>(`/payouts/${payoutId}/send-code`, { method: "POST" });

export const confirmPayout = (payoutId: number, code: string) =>
  api<object>(`/payouts/${payoutId}/confirm`, { method: "POST", body: { code } });

// Faqat mock rejimi uchun
export const mockFillCircle = (circleId: number) => api<object>(`/mock/circles/${circleId}/fill`, { method: "POST" });
export const mockReset = () => api<object>("/mock/reset", { method: "POST" });
