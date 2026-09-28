import { z } from "zod";
import { allocateSharedIps, appExists, createApp, createMachine, destroyApp, listMachines, type FlyPreviewConfig } from "../../../../src/plugin/previews/machines-client";
import { previewAppName } from "../../../../src/previews/preview-key";

export const staticPreviewInput = z.object({
  repo: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/).max(200),
  staticId: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
  path: z.string().regex(/^[A-Za-z0-9_.-]{1,100}$/),
  contentBase64: z.string().min(1).max(350_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
}).refine((value) => !value.path.startsWith("."), "Invalid file name");

export async function createStaticPreview(input: z.infer<typeof staticPreviewInput>, config: FlyPreviewConfig) {
  const appName = previewAppName({ repo: input.repo, staticId: input.staticId });
  const exists = await appExists(appName, config);
  if (exists && (await listMachines(appName, config)).length > 0) throw new Error("Static preview already exists");
  if (!exists) await createApp(appName, config);
  await allocateSharedIps(appName, config);
  const machine = await createMachine({
    appName,
    region: config.defaultRegion,
    image: "nginx:alpine",
    internalPort: 80,
    memoryMb: 256,
    cpus: 1,
    files: [{ guestPath: `/usr/share/nginx/html/${input.path}`, contentBase64: input.contentBase64 }],
  }, config);
  return { appName, machineId: machine.id, state: machine.state, url: `https://${appName}.fly.dev/${input.path}` };
}

export async function removeStaticPreview(repo: string, staticId: string, config: FlyPreviewConfig) {
  await destroyApp(previewAppName({ repo, staticId }), config);
}
