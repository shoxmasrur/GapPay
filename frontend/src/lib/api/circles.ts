// Server komponentlari uchun o'qish (GET) funksiyalari.
// TODO(backend): circles, rounds, me modullari backendda hali yo'q — haqiqiy
// rejimda ular tayyor bo'lmaguncha bo'sh holat ko'rinadi. Ko'rish uchun `pnpm dev:mock`.
import type { CircleDetails, CircleSummary, MyHistory, MySummary, RoundDetails, Session } from "../types";
import { serverApi } from "./server";

const emptySummary: MySummary = { nextPayment: null, nextPayout: null, actions: [], circles: [] };

export async function getMyCircles(): Promise<CircleSummary[]> {
  return (await serverApi<CircleSummary[]>("/circles")) ?? [];
}

export function getCircle(id: number) {
  return serverApi<CircleDetails>(`/circles/${id}`);
}

export function getRound(id: number) {
  return serverApi<RoundDetails>(`/rounds/${id}`);
}

export async function getMySummary(): Promise<MySummary> {
  return (await serverApi<MySummary>("/me/summary")) ?? emptySummary;
}

export function getMyHistory() {
  return serverApi<MyHistory>("/me/history");
}

export function getSessions() {
  return serverApi<Session[]>("/auth/sessions");
}
