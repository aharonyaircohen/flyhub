import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleGitHubPreviewEvent, verifyGitHubSignature } from "./github-webhook";

afterEach(() => vi.unstubAllGlobals());

describe("GitHub preview webhook", () => {
  it("requires a valid HMAC over the exact payload", () => {
    const signature = `sha256=${createHmac("sha256", "secret").update("payload").digest("hex")}`;
    expect(verifyGitHubSignature("payload", signature, "secret")).toBe(true);
    expect(verifyGitHubSignature("changed", signature, "secret")).toBe(false);
    expect(verifyGitHubSignature("payload", null, "secret")).toBe(false);
  });

  it("ignores unrelated GitHub events", async () => {
    expect(await handleGitHubPreviewEvent("ping", {}, { token: "token", orgSlug: "personal", defaultRegion: "fra" })).toEqual({ ignored: true });
  });

  it("destroys the matching PR preview on close", async () => {
    const requests: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      requests.push(`${init.method} ${new URL(url).pathname}`);
      return init.method === "GET" ? Response.json([]) : new Response("", { status: 200 });
    });
    const result = await handleGitHubPreviewEvent("pull_request", { action: "closed", repository: { full_name: "owner/repo" }, number: 12, pull_request: { head: { sha: "a".repeat(40) } } }, { token: "token", orgSlug: "personal", defaultRegion: "fra" });
    expect(result).toEqual({ destroyed: true });
    expect(requests).toEqual([expect.stringMatching(/^GET \/v1\/apps\/kp-.*-pr-12\/machines$/), expect.stringMatching(/^DELETE \/v1\/apps\/kp-.*-pr-12$/)]);
  });
});
