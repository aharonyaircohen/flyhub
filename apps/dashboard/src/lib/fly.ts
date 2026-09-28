import {
  listAppsByPrefix,
  listMachines,
  startMachine,
  stopMachine,
  suspendMachine,
  destroyMachine,
  destroyApp,
  type FlyPreviewConfig,
} from "../../../../src/plugin/previews/machines-client";
import { deleteVolume, listVolumes, snapshotVolume } from "../../../../src/apps/resources-client";
import { mintBrowserTicket } from "../../../../src/browsers/ticket";

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

export function browserDirectUrl(app: string, machine: Awaited<ReturnType<typeof listMachines>>[number]): string {
  if (!/^(?:kody|flyhub)-browser-[a-z0-9-]+$/.test(app)) throw new Error("Not a browser app");
  const env = machine.config?.env;
  const repository = env?.KODY_BROWSER_REPOSITORY;
  const actorId = env?.KODY_BROWSER_ACTOR_ID;
  const sessionId = env?.KODY_BROWSER_SESSION_ID;
  const verifyKey = env?.KODY_BROWSER_VERIFY_KEY;
  if (!repository || !actorId || !sessionId || typeof verifyKey !== "string" || !/^[a-fA-F0-9]{64}$/.test(verifyKey))
    throw new Error("Browser session credentials are unavailable");
  const { ticket } = mintBrowserTicket({ repository, actorId, sessionId, machineId: machine.id }, 300, Buffer.from(verifyKey, "hex"));
  return `https://${app}.fly.dev/direct?ticket=${encodeURIComponent(ticket)}`;
}

export async function findMachine(app: string, id: string, config: FlyPreviewConfig) {
  return (await listMachines(app, config)).find((machine) => machine.id === id);
}

export async function actOnVolume(app: string, id: string, action: "snapshot" | "delete", config: FlyPreviewConfig) {
  const apps = await listAppsByPrefix("", config);
  if (!apps.includes(app)) throw new Error("App not found in this organization");
  const data = await listVolumes(app, config);
  const volume = Array.isArray(data) ? data.find((item) => item?.id === id) : null;
  if (!volume) throw new Error("Volume not found");
  if (action === "delete" && volume.attached_machine_id) throw new Error("Detach the volume before deleting it");
  await snapshotVolume(app, id, config);
  if (action === "delete") await deleteVolume(app, id, config);
}

export function isManagedApp(app: string): boolean {
  return app.startsWith("flyhub-browser-") || app.startsWith("kp-");
}

export async function destroyManagedApp(app: string, config: FlyPreviewConfig) {
  if (!isManagedApp(app)) throw new Error("App is not managed by Flyhub");
  const apps = await listAppsByPrefix("", config);
  if (!apps.includes(app)) throw new Error("App not found in this organization");
  await destroyApp(app, config);
}
