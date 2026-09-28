import { describe, expect, it } from "vitest";
import { readBrowserTicket } from "../../../../src/browsers/ticket";
import { browserDirectUrl } from "./fly";

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
