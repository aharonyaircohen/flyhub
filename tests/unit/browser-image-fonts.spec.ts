import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

describe("Fly browser image fonts", () => {
  it("includes Noto's Hebrew glyphs", () => {
    const dockerfile = readFileSync(
      fileURLToPath(new URL("../../browser/Dockerfile", import.meta.url)),
      "utf8",
    );

    expect(dockerfile).toContain("fonts-noto-core");
  });

  it("copies sources from the flyhub repository root", () => {
    const root = fileURLToPath(new URL("../../", import.meta.url));
    const dockerfile = readFileSync(resolve(root, "browser/Dockerfile"), "utf8");
    const copyLines = dockerfile.split("\n").filter((line) => line.startsWith("COPY "));
    expect(copyLines.length).toBeGreaterThan(0);

    for (const line of copyLines) {
      const sources = line.trim().split(/\s+/).slice(1, -1);
      for (const source of sources) {
        expect(existsSync(resolve(root, source)), `${source} must exist`).toBe(true);
      }
    }
  });
});
