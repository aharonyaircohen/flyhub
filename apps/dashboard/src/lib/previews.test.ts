import { describe, expect, it } from "vitest";
import { previewInput } from "./previews";

describe("preview build input", () => {
  it("accepts a repository PR or branch and a ref", () => {
    expect(previewInput.safeParse({ repo: "owner/repo", pr: 12, ref: "main" }).success).toBe(true);
    expect(previewInput.safeParse({ repo: "owner/repo", branch: "feature/a", ref: "abc123" }).success).toBe(true);
  });

  it("rejects ambiguous or missing preview identities", () => {
    expect(previewInput.safeParse({ repo: "owner/repo", pr: 12, branch: "feature", ref: "main" }).success).toBe(false);
    expect(previewInput.safeParse({ repo: "owner/repo", ref: "main" }).success).toBe(false);
    expect(previewInput.safeParse({ repo: "invalid", pr: 12, ref: "main" }).success).toBe(false);
  });
});
