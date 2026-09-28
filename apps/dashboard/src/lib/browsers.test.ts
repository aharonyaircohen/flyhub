import { describe, expect, it } from "vitest";
import { browserAppName } from "../../../../src/plugin/browsers";
import { browserInput } from "./browsers";

describe("browser session input", () => {
  it("accepts a repository and URL", () => {
    expect(browserInput.safeParse({ repository: "owner/repo", initialUrl: "https://example.com" }).success).toBe(true);
  });

  it("rejects a malformed repository or URL", () => {
    expect(browserInput.safeParse({ repository: "bad", initialUrl: "https://example.com" }).success).toBe(false);
    expect(browserInput.safeParse({ repository: "owner/repo", initialUrl: "not-a-url" }).success).toBe(false);
  });

  it("names new browser apps under Flyhub", () => {
    expect(browserAppName({ owner: "owner", repo: "repo", actorId: "admin" })).toMatch(/^flyhub-browser-/);
  });
});
