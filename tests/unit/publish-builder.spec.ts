import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureBuilderApp } from "../../scripts/publish-preview-builder.mjs";

afterEach(() => vi.unstubAllGlobals());

describe("builder host setup", () => {
  it("creates the Flyhub builder app in the selected organization when missing", async () => {
    const calls: Array<{ url: string; body?: string }> = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body as string | undefined });
      return new Response("{}", { status: calls.length === 1 ? 404 : 200 });
    });
    await ensureBuilderApp("token", "personal");
    expect(calls).toHaveLength(2);
    expect(calls[0]?.url).toContain("/apps/flyhub-preview-builder");
    expect(JSON.parse(calls[1]?.body || "{}")).toEqual({ app_name: "flyhub-preview-builder", org_slug: "personal" });
  });

  it("does not create an existing builder app", async () => {
    const fetcher = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    await ensureBuilderApp("token", "personal");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
