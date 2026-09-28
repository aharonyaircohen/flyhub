import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "flyhub_session";
const SESSION_SECONDS = 7 * 24 * 60 * 60;

export function configuredAdminToken(): string | null {
  const token = process.env.FLYHUB_ADMIN_TOKEN?.trim();
  return token && token.length >= 16 ? token : null;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function matchesAdminToken(candidate: string, secret: string): boolean {
  return timingSafeEqual(digest(candidate), digest(secret));
}

export function createSession(secret: string, now = Date.now()): string {
  const expiry = Math.floor(now / 1000) + SESSION_SECONDS;
  const signature = createHmac("sha256", secret)
    .update(`flyhub-session:v1:${expiry}`)
    .digest("base64url");
  return `${expiry}.${signature}`;
}

export function verifySession(
  value: string | undefined,
  secret: string,
  now = Date.now(),
): boolean {
  if (!value) return false;
  const match = /^(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return false;
  const expiry = Number(match[1]);
  if (!Number.isSafeInteger(expiry) || expiry <= Math.floor(now / 1000))
    return false;
  const expected = createHmac("sha256", secret)
    .update(`flyhub-session:v1:${expiry}`)
    .digest();
  const actual = Buffer.from(match[2], "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function isAdmin(request: NextRequest): boolean {
  const secret = configuredAdminToken();
  return Boolean(
    secret && verifySession(request.cookies.get(SESSION_COOKIE)?.value, secret),
  );
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const expectedHost = request.headers.get("host") || request.nextUrl.host;
    const expectedProtocol = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "");
    const actual = new URL(origin);
    return actual.host === expectedHost && actual.protocol === `${expectedProtocol}:`;
  } catch {
    return false;
  }
}

export const sessionMaxAge = SESSION_SECONDS;
