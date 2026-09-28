import { describe, expect, it } from "vitest";
import { staticPreviewInput } from "./static-preview";

const valid = { repo: "owner/repo", staticId: "file1", path: "index.html", contentBase64: Buffer.from("hello").toString("base64") };

describe("static preview input", () => {
  it("accepts a small file with a safe name", () => {
    expect(staticPreviewInput.safeParse(valid).success).toBe(true);
  });

  it("rejects paths and oversized files", () => {
    expect(staticPreviewInput.safeParse({ ...valid, path: "../secret" }).success).toBe(false);
    expect(staticPreviewInput.safeParse({ ...valid, contentBase64: "a".repeat(350_001) }).success).toBe(false);
    expect(staticPreviewInput.safeParse({ ...valid, contentBase64: "not base64" }).success).toBe(false);
  });
});
