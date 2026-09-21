import type { Role } from "./types";

export type TokenPayload = { userId: number; role: Role; sid?: number };

/**
 * JWT payload'ini o'qiydi. Imzo bu yerda tekshirilmaydi — bu faqat UI uchun;
 * haqiqiy tekshiruv har bir so'rovda backend guard'ida bo'ladi.
 */
export function decodeToken(token: string | undefined): TokenPayload | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { userId: Number(payload.sub), role: payload.role, sid: payload.sid };
  } catch {
    return null;
  }
}

/** Faqat mock rejimi uchun: imzosiz JWT. */
export function createMockToken(userId: number, sid: number, ttlSeconds: number): string {
  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ sub: userId, role: "USER", sid, exp })}.mock`;
}
