import {
  listAppsByPrefix,
  listMachines,
  startMachine,
  stopMachine,
  suspendMachine,
  destroyMachine,
  type FlyPreviewConfig,
} from "../../../../src/plugin/previews/machines-client";
import { listVolumes } from "../../../../src/apps/resources-client";

export function flyConfig(): FlyPreviewConfig | null {
  const token = process.env.FLY_API_TOKEN?.trim();
  const orgSlug = process.env.FLY_ORG_SLUG?.trim();
  if (!token || !orgSlug) return null;
  return {
    token,
    orgSlug,
    defaultRegion: process.env.FLY_DEFAULT_REGION?.trim() || "fra",
  };
}

export async function listApps(config: FlyPreviewConfig): Promise<string[]> {
  return listAppsByPrefix("", config);
}

export async function appResources(app: string, config: FlyPreviewConfig) {
  const [machines, volumeData] = await Promise.all([
    listMachines(app, config),
    listVolumes(app, config),
  ]);
  const volumes = Array.isArray(volumeData) ? volumeData : [];
  return { machines, volumes };
}

export async function actOnMachine(
  app: string,
  id: string,
  action: "start" | "stop" | "suspend" | "destroy",
  config: FlyPreviewConfig,
): Promise<void> {
  if (action === "start") return startMachine(app, id, config);
  if (action === "stop") return stopMachine(app, id, config);
  if (action === "suspend") return suspendMachine(app, id, config);
  return destroyMachine(app, id, config);
}
