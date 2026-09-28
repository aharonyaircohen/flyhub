import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createSession, isAdmin, isSameOrigin, matchesAdminToken, verifySession } from "./auth";

const secret = "a-long-flyhub-admin-secret";

afterEach(() => { delete process.env.FLYHUB_ADMIN_TOKEN; });

describe("dashboard authentication", () => {
  it("accepts only the configured token", () => {
    expect(matchesAdminToken(secret, secret)).toBe(true);
    expect(matchesAdminToken("wrong", secret)).toBe(false);
  });

  it("rejects expired or tampered cookies", () => {
    const now = Date.parse("2026-09-28T10:00:00Z");
    const session = createSession(secret, now);
    expect(verifySession(session, secret, now)).toBe(true);
    expect(verifySession(session, secret, now + 8 * 24 * 60 * 60 * 1000)).toBe(false);
    expect(verifySession(session, "different-secret", now)).toBe(false);
  });

  it("requires a valid cookie for protected APIs", () => {
    process.env.FLYHUB_ADMIN_TOKEN = secret;
    const anonymous = new NextRequest("http://localhost:3355/api/apps");
    expect(isAdmin(anonymous)).toBe(false);
    const authorized = new NextRequest("http://localhost:3355/api/apps", { headers: { cookie: `flyhub_session=${createSession(secret)}` } });
    expect(isAdmin(authorized)).toBe(true);
  });

  it("rejects a cross-origin mutation", () => {
    expect(isSameOrigin(new NextRequest("http://localhost:3355/api/session", { headers: { origin: "https://evil.example" } }))).toBe(false);
  });

  it("accepts the browser origin when Next rewrites its internal URL", () => {
    const request = new NextRequest("http://localhost:3355/api/session", { headers: { host: "127.0.0.1:3355", origin: "http://127.0.0.1:3355" } });
    expect(isSameOrigin(request)).toBe(true);
  });
});
