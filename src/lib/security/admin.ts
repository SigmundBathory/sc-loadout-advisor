import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const ADMIN_TOKEN_HEADER = "x-admin-token";
const AUTHORIZATION_HEADER = "authorization";

function tokensMatch(expected: string, provided: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);

  if (expectedBytes.length !== providedBytes.length) return false;
  return timingSafeEqual(expectedBytes, providedBytes);
}

/**
 * Protects mutable synchronization/import endpoints without affecting local development
 * when no token has been configured.
 */
export function requireAdminToken(request: Request): NextResponse | null {
  const expectedToken = process.env.SYNC_ADMIN_TOKEN?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!expectedToken && !isProduction) return null;
  if (!expectedToken) {
    return NextResponse.json(
      { error: "Admin token is not configured" },
      { status: 403 }
    );
  }

  const authorization = request.headers.get(AUTHORIZATION_HEADER);
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const providedToken = bearerToken ?? request.headers.get(ADMIN_TOKEN_HEADER);

  if (!providedToken) {
    return NextResponse.json(
      { error: "Admin authentication required" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    );
  }

  if (!tokensMatch(expectedToken, providedToken.trim())) {
    return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
  }

  return null;
}
