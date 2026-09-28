import { NextRequest, NextResponse } from "next/server";
import {
  configuredAdminToken,
  createSession,
  isAdmin,
  isSameOrigin,
  matchesAdminToken,
  SESSION_COOKIE,
  sessionMaxAge,
} from "../../../src/lib/auth";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: isAdmin(request),
    configured: Boolean(configuredAdminToken()),
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const secret = configuredAdminToken();
  if (!secret)
    return NextResponse.json(
      { error: "Set FLYHUB_ADMIN_TOKEN to at least 16 characters" },
      { status: 503 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const token =
    body && typeof body === "object" && "token" in body
      ? (body as { token?: unknown }).token
      : undefined;
  if (typeof token !== "string" || !matchesAdminToken(token, secret))
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(SESSION_COOKIE, createSession(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionMaxAge,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
