import { cookies, headers } from "next/headers";
import { decodeToken } from "../auth-token";
import { USE_MOCK } from "../mock/config";
import { handleMock } from "../mock/handlers";
import { API_PREFIX, unwrap } from "./client";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";

export async function readSession() {
  return decodeToken((await cookies()).get("accessToken")?.value);
}

/**
 * Server komponentlaridan backendga GET so'rov (foydalanuvchi cookie'lari bilan).
 * Mock rejimida so'rov to'g'ridan-to'g'ri mock handler'ga beriladi.
 * Xatolik yoki backend javob bermasa `null` qaytaradi.
 */
export async function serverApi<T>(path: string): Promise<T | null> {
  if (USE_MOCK) {
    const session = await readSession();
    const result = handleMock({
      method: "GET",
      path,
      userId: session?.userId ?? null,
      sid: session?.sid ?? null,
      userAgent: (await headers()).get("user-agent") ?? undefined,
    });
    return result.status === 200 ? unwrap<T>(result.json) : null;
  }

  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${BACKEND_URL}${API_PREFIX}${path}`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  }).catch(() => null);

  if (!res?.ok) return null;
  return unwrap<T>(await res.json());
}
