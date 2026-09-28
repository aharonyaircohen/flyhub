import { z } from "zod";
import { spawnPreviewBuilder } from "../../../../src/previews/builder-client";
import { previewAppName, repoPreviewPrefix } from "../../../../src/previews/preview-key";
import { listAppsByPrefix, listMachines, type FlyPreviewConfig } from "../../../../src/plugin/previews/machines-client";
import { getPreviewBuilderStatus } from "../../../../src/previews/builder-client";

export const previewInput = z.object({
  repo: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/).max(200),
  ref: z.string().min(1).max(255),
  pr: z.number().int().positive().optional(),
  branch: z.string().min(1).max(255).optional(),
}).refine((value) => (value.pr !== undefined) !== (value.branch !== undefined), "Specify a PR or branch");

export type PreviewInput = z.infer<typeof previewInput>;

export async function createPreview(input: PreviewInput, config: FlyPreviewConfig) {
  const key = input.pr !== undefined ? { repo: input.repo, pr: input.pr } : { repo: input.repo, branch: input.branch! };
  const appName = previewAppName(key);
  const result = await spawnPreviewBuilder({
    ...input,
    appName,
    flyToken: config.token,
    flyOrgSlug: config.orgSlug,
    flyRegion: config.defaultRegion,
    githubToken: process.env.GITHUB_TOKEN?.trim() || undefined,
  });
  return { appName, builderMachineId: result.machineId, expectedUrl: result.expectedUrl, state: "building" as const };
}

export async function listPreviews(repo: string, config: FlyPreviewConfig) {
  const apps = await listAppsByPrefix(repoPreviewPrefix(repo), config);
  return Promise.all(apps.map(async (appName) => {
    const machines = await listMachines(appName, config);
    const builder = machines.length ? null : await getPreviewBuilderStatus(appName, config.token);
    return {
      appName,
      url: `https://${appName}.fly.dev`,
      state: machines[0]?.state ?? builder?.state ?? "empty",
      machineId: machines[0]?.id,
      builderMachineId: builder?.machineId,
    };
  }));
}
