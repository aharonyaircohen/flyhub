"use client";

import { useCallback, useEffect, useState } from "react";
import PreviewPanel from "./PreviewPanel";
import BrowserPanel from "./BrowserPanel";

type Machine = { id: string; name?: string; state: string; region: string; createdAt?: string; guest?: { cpus?: number; memoryMb?: number } };
type Volume = { id?: string; name?: string; region?: string; size_gb?: number; state?: string };
type Resources = { machines: Machine[]; volumes: Volume[] };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}

export default function Home() {
  const [session, setSession] = useState<{ authenticated: boolean; configured: boolean } | null>(null);
  const [view, setView] = useState<"apps" | "previews" | "browsers">("apps");
  const [token, setToken] = useState("");
  const [apps, setApps] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [resources, setResources] = useState<Resources | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshApps = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ apps: string[] }>("/api/apps");
      setApps(result.apps);
      setSelected((current) => result.apps.includes(current) ? current : result.apps[0] || "");
    } catch (cause) { setError((cause as Error).message); }
    finally { setLoading(false); }
  }, []);

  const refreshResources = useCallback(async (app: string) => {
    if (!app) { setResources(null); return; }
    setResources(null);
    setError("");
    try { setResources(await api<Resources>(`/api/apps/${encodeURIComponent(app)}/resources`)); }
    catch (cause) { setError((cause as Error).message); }
  }, []);

  useEffect(() => { api<{ authenticated: boolean; configured: boolean }>("/api/session").then(setSession).catch((cause) => setError(cause.message)); }, []);
  useEffect(() => { if (session?.authenticated) void refreshApps(); }, [session?.authenticated, refreshApps]);
  useEffect(() => { if (selected) void refreshResources(selected); }, [selected, refreshResources]);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy("login"); setError("");
    try {
      await api("/api/session", { method: "POST", body: JSON.stringify({ token }) });
      setToken(""); setSession({ authenticated: true, configured: true });
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(""); }
  }

  async function logout() {
    await api("/api/session", { method: "DELETE" });
    setSession({ authenticated: false, configured: true }); setApps([]); setSelected(""); setResources(null);
  }

  async function machineAction(machine: Machine, action: "start" | "stop" | "suspend" | "destroy") {
    if (action === "destroy" && !window.confirm(`Destroy machine ${machine.id} in ${selected}? This cannot be undone.`)) return;
    setBusy(machine.id); setError("");
    try {
      await api(`/api/apps/${encodeURIComponent(selected)}/machines/${encodeURIComponent(machine.id)}/action`, { method: "POST", body: JSON.stringify({ action }) });
      await refreshResources(selected);
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(""); }
  }

  async function openBrowser(machine: Machine) {
    const tab = window.open("", "_blank");
    if (!tab) { setError("Allow pop-ups to open the browser session."); return; }
    setBusy(machine.id); setError("");
    try {
      const result = await api<{ url: string }>(`/api/apps/${encodeURIComponent(selected)}/machines/${encodeURIComponent(machine.id)}/browser-link`, { method: "POST" });
      tab.location.href = result.url;
    } catch (cause) { tab.close(); setError((cause as Error).message); }
    finally { setBusy(""); }
  }

  if (!session) return <main className="center"><p>Loading Flyhub…</p>{error && <p className="error">{error}</p>}</main>;
  if (!session.configured || !session.authenticated) return <main className="center"><section className="login"><div className="mark">F</div><h1>Flyhub</h1>{session.configured ? <><p>Sign in to manage your Fly apps.</p><form onSubmit={login}><label htmlFor="token">Admin token</label><input id="token" type="password" autoComplete="current-password" value={token} onChange={(event) => setToken(event.target.value)} required /><button disabled={busy === "login"}>Sign in</button></form></> : <><p>Set <code>FLYHUB_ADMIN_TOKEN</code> to a secret of at least 16 characters, then restart the dashboard.</p><p>Set <code>FLY_API_TOKEN</code> and <code>FLY_ORG_SLUG</code> to connect your Fly organization.</p></>}{error && <p role="alert" className="error">{error}</p>}</section></main>;

  return <main className="shell"><header><div className="brand"><div className="mark">F</div><div><strong>Flyhub</strong><span>Fly infrastructure</span></div></div><div className="header-actions"><button className="quiet" onClick={() => setView("apps")}>Apps</button><button className="quiet" onClick={() => setView("previews")}>Previews</button><button className="quiet" onClick={() => setView("browsers")}>Browsers</button><button className="quiet" onClick={() => void refreshApps()} disabled={loading}>Refresh</button><button className="quiet" onClick={() => void logout()}>Sign out</button></div></header><div className="workspace"><aside><div className="pane-title"><h2>Apps</h2><span>{apps.length}</span></div>{loading && <p className="muted">Loading apps…</p>}{!loading && apps.length === 0 && <p className="muted">No apps found in this Fly organization.</p>}<nav aria-label="Fly apps">{apps.map((app) => <button className={`app-item ${selected === app ? "active" : ""}`} key={app} onClick={() => { setSelected(app); setView("apps"); }}><span className="app-dot"/>{app}</button>)}</nav></aside><section className="detail">{view === "previews" ? <PreviewPanel onBuilt={refreshApps} /> : view === "browsers" ? <BrowserPanel onCreated={async (app) => { await refreshApps(); setSelected(app); setView("apps"); }} /> : <>{error && <div role="alert" className="error-banner">{error}</div>}{selected ? <><div className="detail-head"><div><p className="eyebrow">Application</p><h1>{selected}</h1><a href={`https://fly.io/apps/${encodeURIComponent(selected)}`} target="_blank" rel="noreferrer">Open in Fly ↗</a></div><button className="quiet" onClick={() => void refreshResources(selected)}>Refresh app</button></div>{!resources ? <p className="muted">Loading resources…</p> : <><section className="card"><div className="card-head"><h2>Machines</h2><span>{resources.machines.length}</span></div>{resources.machines.length === 0 ? <p className="muted">No machines in this app.</p> : <div className="machine-list">{resources.machines.map((machine) => <article className="machine" key={machine.id}><div className="machine-main"><div><strong>{machine.name || machine.id}</strong><small>{machine.id} · {machine.region}</small></div><span className={`state ${machine.state === "started" ? "running" : ""}`}>{machine.state}</span></div><div className="machine-actions">{/(?:kody|flyhub)-browser-/.test(selected) && <button disabled={busy === machine.id || machine.state !== "started"} onClick={() => void openBrowser(machine)}>Open browser</button>}<button disabled={busy === machine.id} onClick={() => void machineAction(machine, "start")}>Start</button><button disabled={busy === machine.id} onClick={() => void machineAction(machine, "stop")}>Stop</button><button disabled={busy === machine.id} onClick={() => void machineAction(machine, "suspend")}>Suspend</button><button className="danger" disabled={busy === machine.id} onClick={() => void machineAction(machine, "destroy")}>Destroy</button></div></article>)}</div>}</section><section className="card"><div className="card-head"><h2>Volumes</h2><span>{resources.volumes.length}</span></div>{resources.volumes.length === 0 ? <p className="muted">No volumes in this app.</p> : <div className="volume-list">{resources.volumes.map((volume, index) => <div className="volume" key={volume.id || index}><strong>{volume.name || volume.id}</strong><span>{volume.region || "Unknown region"} · {volume.size_gb ?? "?"} GB</span></div>)}</div>}</section></>}</> : <div className="empty"><div className="mark">F</div><h2>Select an app</h2><p>Choose an app to view its machines and volumes.</p></div>}</>}</section></div></main>;
}
