"use client";

import { useState, type FormEvent } from "react";

function fileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export default function StaticPreviewForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [repo, setRepo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [created, setCreated] = useState<{ url: string; staticId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    if (file.size > 250_000) { setError("Choose a file under 250 KB"); return; }
    setBusy(true); setError(""); setCreated(null);
    const staticId = crypto.randomUUID();
    try {
      const contentBase64 = await fileBase64(file);
      const response = await fetch("/api/previews/static", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repo: repo.trim(), staticId, path: file.name, contentBase64 }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Static preview failed");
      setCreated({ url: data.url, staticId });
      await onCreated();
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!created || !window.confirm("Destroy this static preview app?")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/previews/static", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repo: repo.trim(), staticId: created.staticId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Delete failed");
      setCreated(null);
      await onCreated();
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  return <section className="card"><div className="card-head"><h2>Static file preview</h2></div><p className="muted no-pad">Host one small HTML, PDF, or image file without a build.</p><form className="preview-form" onSubmit={upload}><label>Repository<input value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="owner/repo" required /></label><label>File<input type="file" accept=".html,.htm,.pdf,.png,.jpg,.jpeg,.gif,.svg,.webp" onChange={(event) => setFile(event.target.files?.[0] || null)} required /></label><div className="preview-actions"><button type="submit" disabled={busy || !file}>Create static preview</button></div></form>{created && <div role="status" className="static-result"><p>Preview created. It may take a moment to start.</p><a href={created.url} target="_blank" rel="noreferrer">Open preview ↗</a><button className="quiet" disabled={busy} onClick={() => void remove()}>Destroy preview</button></div>}{error && <p role="alert" className="error">{error}</p>}</section>;
}
