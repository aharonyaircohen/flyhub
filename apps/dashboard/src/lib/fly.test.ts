import { afterEach, describe, expect, it, vi } from "vitest";
import { readBrowserTicket } from "../../../../src/browsers/ticket";
import { actOnVolume, browserDirectUrl, isManagedApp } from "./fly";

const key = Buffer.alloc(32, 7);
const machine = {
  id: "machine123",
  state: "started",
  region: "fra",
  config: { env: {
    KODY_BROWSER_REPOSITORY: "owner/repo",
    KODY_BROWSER_ACTOR_ID: "operator",
    KODY_BROWSER_SESSION_ID: "session-1",
    KODY_BROWSER_VERIFY_KEY: key.toString("hex"),
  } },
};

afterEach(() => vi.unstubAllGlobals());

describe("browser links", () => {
  it("mints a short lived ticket bound to the selected Fly machine", () => {
    const url = new URL(browserDirectUrl("kody-browser-example", machine));
    expect(url.origin).toBe("https://kody-browser-example.fly.dev");
    const identity = readBrowserTicket(url.searchParams.get("ticket")!, key);
    expect(identity).toMatchObject({ repository: "owner/repo", actorId: "operator", sessionId: "session-1", machineId: "machine123" });
  });

  it("rejects non browser apps and missing machine credentials", () => {
    expect(() => browserDirectUrl("other-app", machine)).toThrow();
    expect(() => browserDirectUrl("kody-browser-example", { ...machine, config: { env: {} } })).toThrow();
  });
});

describe("volume actions", () => {
  const config = { token: "token", orgSlug: "personal", defaultRegion: "fra" };

  it("blocks deletion of an attached volume before making a write", async () => {
    const methods: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      methods.push(init.method || "GET");
      return Response.json(url.includes("/volumes") ? [{ id: "vol_1", attached_machine_id: "machine" }] : { apps: [{ name: "my-app" }] });
    });
    await expect(actOnVolume("my-app", "vol_1", "delete", config)).rejects.toThrow("Detach");
    expect(methods).toEqual(["GET", "GET"]);
  });

  it("snapshots a detached volume before deleting it", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push(`${init.method || "GET"} ${new URL(url).pathname}`);
      if (url.endsWith("/volumes")) return Response.json([{ id: "vol_1", attached_machine_id: null }]);
      if (url.includes("/apps?")) return Response.json({ apps: [{ name: "my-app" }] });
      return Response.json({ ok: true });
    });
    await actOnVolume("my-app", "vol_1", "delete", config);
    expect(calls.slice(-2)).toEqual(["POST /v1/apps/my-app/volumes/vol_1/snapshots", "DELETE /v1/apps/my-app/volumes/vol_1"]);
  });
});

describe("managed app deletion", () => {
  it("restricts deletion to Flyhub browser and preview apps", () => {
    expect(isManagedApp("flyhub-browser-example")).toBe(true);
    expect(isManagedApp("kp-example")).toBe(true);
    expect(isManagedApp("kody-brain-example")).toBe(false);
    expect(isManagedApp("kody-browser-example")).toBe(false);
  });
});
