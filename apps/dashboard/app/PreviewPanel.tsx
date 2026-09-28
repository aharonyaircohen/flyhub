"use client";

import { useState, type FormEvent } from "react";
import StaticPreviewForm from "./StaticPreviewForm";

type Preview = { appName: string; state: string; url: string; machineId?: string; builderMachineId?: string };

export default function PreviewPanel({ onBuilt }: { onBuilt: () => Promise<void> }) {
  const [repo, setRepo] = useState("");
  const [ref, setRef] = useState("");
  const [kind, setKind] = useState<"pr" | "branch">("pr");
  const [identity, setIdentity] = useState("");
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function body() {
    return { repo: repo.trim(), ref: ref.trim(), ...(kind === "pr" ? { pr: Number(identity) } : { branch: identity.trim() }) };
  }

  async function request(path: string, init?: RequestInit) {
    const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json" } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  async function build(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setResult("");
    try {
      const data = await request("/api/previews", { method: "POST", body: JSON.stringify(body()) });
      setResult(`Builder ${data.builderMachineId} started for ${data.appName}. The preview URL will respond after the build finishes.`);
      await onBuilt();
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  async function refresh() {
    setBusy(true); setError("");
    try { const data = await request(`/api/previews?repo=${encodeURIComponent(repo.trim())}`); setPreviews(data.previews); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  async function openPreview() {
    const tab = window.open("", "_blank");
    if (!tab) { setError("Allow pop-ups to open the preview."); return; }
    try {
      const data = await request("/api/previews/ticket", { method: "POST", body: JSON.stringify(body()) });
      tab.location.href = data.url;
    } catch (cause) { tab.close(); setError((cause as Error).message); }
  }

  return <><div className="detail-head"><div><p className="eyebrow">Flyhub</p><h1>Previews</h1><p className="muted no-pad">Build a PR or branch into its own Fly app.</p></div></div><section className="card"><div className="card-head"><h2>Build preview</h2></div><form className="preview-form" onSubmit={build}><label>Repository <input placeholder="owner/repo" value={repo} onChange={(event) => setRepo(event.target.value)} required /></label><label>Source <select value={kind} onChange={(event) => setKind(event.target.value as "pr" | "branch")}><option value="pr">Pull request</option><option value="branch">Branch</option></select></label><label>{kind === "pr" ? "PR number" : "Branch name"}<input placeholder={kind === "pr" ? "123" : "feature/my-work"} value={identity} onChange={(event) => setIdentity(event.target.value)} required /></label><label>Git ref<input placeholder="branch name or commit SHA" value={ref} onChange={(event) => setRef(event.target.value)} required /></label><div className="preview-actions"><button type="submit" disabled={busy}>Build preview</button><button type="button" className="quiet" disabled={busy || !repo.trim()} onClick={() => void refresh()}>Refresh list</button><button type="button" className="quiet" disabled={!repo.trim() || !identity.trim()} onClick={() => void openPreview()}>Open selected preview</button></div></form>{result && <p role="status" className="success">{result}</p>}{error && <p role="alert" className="error">{error}</p>}</section><section className="card"><div className="card-head"><h2>Previews for this repository</h2><span>{previews.length}</span></div>{previews.length === 0 ? <p className="muted no-pad">Enter a repository and refresh to see its previews.</p> : previews.map((preview) => <div className="volume" key={preview.appName}><strong>{preview.appName}</strong><span>{preview.state}</span></div>)}</section><StaticPreviewForm onCreated={onBuilt} /></>;
}
