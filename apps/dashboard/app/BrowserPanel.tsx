"use client";

import { useState, type FormEvent } from "react";

export default function BrowserPanel({ onCreated }: { onCreated: (app: string) => Promise<void> }) {
  const [repository, setRepository] = useState("");
  const [initialUrl, setInitialUrl] = useState("https://example.com");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/browsers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repository: repository.trim(), initialUrl: initialUrl.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Browser creation failed");
      await onCreated(data.appName);
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  return <><div className="detail-head"><div><p className="eyebrow">Flyhub</p><h1>Browsers</h1><p className="muted no-pad">Create an isolated browser machine for a repository.</p></div></div><section className="card"><div className="card-head"><h2>New browser</h2></div><form className="preview-form" onSubmit={create}><label>Repository<input value={repository} onChange={(event) => setRepository(event.target.value)} placeholder="owner/repo" required /></label><label>Start at URL<input value={initialUrl} onChange={(event) => setInitialUrl(event.target.value)} placeholder="https://example.com" type="url" required /></label><div className="preview-actions"><button type="submit" disabled={busy}>{busy ? "Creating…" : "Create browser"}</button></div></form>{error && <p role="alert" className="error">{error}</p>}</section><section className="card"><p className="muted no-pad">After creation, Flyhub opens the app. Use its Open browser action when the machine is running.</p></section></>;
}
