import { NextRequest, NextResponse } from "next/server";

/**
 * Inyecta Authorization: Bearer <CASTDOWN_API_KEY> en toda request /api/*.
 * Corre en Vercel Edge (server-side) → el browser nunca ve la clave.
 * Trabaja en conjunto con next.config.mjs rewrites() que reescribe /api/* → CASTDOWN_API_URL.
 */
export function middleware(req: NextRequest) {
  const key = process.env.CASTDOWN_API_KEY;
  if (!key) return NextResponse.next();

  const headers = new Headers(req.headers);
  headers.set("Authorization", `Bearer ${key}`);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/api/:path*"],
};
