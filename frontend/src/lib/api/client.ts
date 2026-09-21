import { USE_MOCK } from "../mock/config";

export const API_PREFIX = "/api/v1";

/** Brauzerdan so'rovlar prefiksi: mock rejimida o'zimizning mock route handler'imiz. */
const CLIENT_PREFIX = USE_MOCK ? "/api/mock" : API_PREFIX;

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
};

/**
 * Brauzerdan backendga so'rov yuboradi (next.config.ts dagi rewrite orqali).
 * Backend javobi `{ statusCode, data }` ko'rinishida bo'lsa, `data` qaytariladi.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;

  let res: Response;
  try {
    res = await fetch(`${CLIENT_PREFIX}${path}`, {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Internet aloqasini tekshiring va qayta urinib ko‘ring");
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      json && typeof json.message === "string"
        ? json.message
        : "Xatolik yuz berdi. Birozdan keyin qayta urinib ko‘ring";
    throw new ApiError(res.status, message, json?.code);
  }

  return unwrap<T>(json);
}

export function unwrap<T>(json: unknown): T {
  if (json && typeof json === "object" && "data" in json && "statusCode" in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

export function errorMessage(err: unknown) {
  return err instanceof ApiError ? err.message : "Xatolik yuz berdi";
}
