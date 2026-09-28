import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));
const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

describe("Fly dashboard exports", () => {
  it("ships the dashboard components through the Fly package boundary", () => {
    for (const name of [
      "RunnerManager",
      "BrainImagesManager",
      "BrainFlyCard",
      "FlyVolumesManager",
    ]) {
      const target = manifest.exports["./dashboard/admin/*"].replace("*", name);
      expect(existsSync(resolve(root, target)), name).toBe(true);
    }
    for (const name of [
      "FlyActivityTab",
      "FlyMachinesTable",
      "FlyPreviewsList",
      "FlyRemoteBrowserSurface",
      "BranchPreviewCard",
      "PreviewsCard",
    ]) {
      const target = manifest.exports["./dashboard/previews/*"].replace("*", name);
      expect(existsSync(resolve(root, target)), name).toBe(true);
    }
    expect(existsSync(resolve(root, manifest.exports["./dashboard/browser-stream-client"]))).toBe(true);
  });
});
