import { NextResponse, type NextRequest } from "next/server";
import { createMockToken, decodeToken } from "@/lib/auth-token";
import { USE_MOCK } from "@/lib/mock/config";
import { handleMock } from "@/lib/mock/handlers";

const SESSION_TTL = 7 * 24 * 60 * 60;

// Mock backend: faqat `pnpm dev:mock` rejimida javob beradi, aks holda 404.
async function handler(request: NextRequest, ctx: RouteContext<"/api/mock/[...path]">) {
  if (!USE_MOCK) return NextResponse.json({ statusCode: 404, message: "Not found" }, { status: 404 });

  const { path } = await ctx.params;
  const token = decodeToken(request.cookies.get("accessToken")?.value);
  const body = request.method === "GET" || request.method === "DELETE" ? undefined : await request.json().catch(() => undefined);

  const result = handleMock({
    method: request.method,
    path: `/${path.join("/")}`,
    body,
    userId: token?.userId ?? null,
    sid: token?.sid ?? null,
    userAgent: request.headers.get("user-agent") ?? undefined,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1",
  });

  const response = NextResponse.json(result.json, { status: result.status });
  if (result.session === "clear") {
    response.cookies.delete("accessToken");
  } else if (result.session) {
    response.cookies.set("accessToken", createMockToken(result.session.userId, result.session.sid, SESSION_TTL), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL,
    });
  }
  return response;
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
