import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Folder, FileText, RefreshCw, GitBranch } from "lucide-react";
import type { JsonObject, JsonValue } from "./protocol";
import type { Translate } from "./i18n";

type Entry = { name: string; path: string; kind: string };
/** Reads use the selected registered project; no write actions or arbitrary host paths. */
export default function DetailsPanel({ context, run, t }: {
  context: JsonObject; run: (kind: string, payload: JsonObject) => Promise<JsonValue>; t: Translate;
}) {
  const [tab, setTab] = useState<"files" | "git">("files");
  const [path, setPath] = useState("");
  const [result, setResult] = useState<JsonValue>(null);
  const [preview, setPreview] = useState<{ path: string; content: string; diff?: boolean }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    setBusy(true); setError(false); setPreview(undefined);
    void run(tab === "files" ? "file.list" : "git.status", { ...context, ...(tab === "files" ? { path } : {}) }).then(
      (value) => { if (current === generation.current) setResult(value); },
      () => { if (current === generation.current) setError(true); },
    ).finally(() => { if (current === generation.current) setBusy(false); });
    return () => { generation.current++; };
  }, [run, context.projectId, context.worktreeId, tab, path, version]);
  const open = async (entry: Entry) => {
    if (entry.kind === "directory") { setPath(entry.path); return; }
    const current = ++generation.current; setBusy(true); setError(false);
    try {
      const value = await run("file.read_text", { ...context, path: entry.path });
      if (current !== generation.current) return;
      if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.content !== "string") throw Error("invalid_file");
      setPreview({ path: entry.path, content: value.content });
    } catch { if (current === generation.current) setError(true); }
    finally { if (current === generation.current) setBusy(false); }
  };
  const openDiff = async (entry: { path: string; status: string }) => {
    const current = ++generation.current; setBusy(true); setError(false);
    try {
      const value = await run("git.diff", { ...context, path: entry.path, status: entry.status });
      if (current !== generation.current) return;
      if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.content !== "string") throw Error("invalid_diff");
      setPreview({ path: entry.path, content: value.content, diff: true });
    } catch { if (current === generation.current) setError(true); }
    finally { if (current === generation.current) setBusy(false); }
  };
  const git = result && !Array.isArray(result) && typeof result === "object" ? result : null;
  const branch = git?.branch && typeof git.branch === "object" && !Array.isArray(git.branch) ? git.branch : null;
  return <div className="tap-details">
    <div className="tap-details-tabs"><button aria-pressed={tab === "files"} onClick={() => { setTab("files"); setResult(null); }}>{t("files")}</button>
      <button aria-pressed={tab === "git"} onClick={() => { setTab("git"); setResult(null); }}>{t("git")}</button>
      <button className="tap-icon" aria-label={t("refresh")} onClick={() => setVersion((n) => n + 1)}><RefreshCw size={14} /></button></div>
    {busy && <p role="status">{t("loading")}</p>}
    {error && <p role="alert">{t("error")} <button onClick={() => setVersion((n) => n + 1)}>{t("retry")}</button></p>}
    {preview ? <><button onClick={() => setPreview(undefined)}><ChevronLeft size={13} />{t("back")}</button><p className="tap-path">{preview.path}</p>
      <pre>{preview.diff ? preview.content.split("\n").map((line, index) => <span key={index} className={line.startsWith("+") ? "tap-diff-add" : line.startsWith("-") ? "tap-diff-del" : ""}>{line}{"\n"}</span>) : preview.content}</pre></>
      : tab === "files" ? <>
        {path && <button className="tap-path" onClick={() => setPath(path.split("/").slice(0, -1).join("/"))}><ChevronLeft size={13} />{path}</button>}
        {Array.isArray(result) && result.filter((item) => item && typeof item === "object" && !Array.isArray(item) && item.name !== ".git").map((item) => {
          const entry = item as unknown as Entry;
          return <button className="tap-file-row" key={entry.path} onClick={() => void open(entry)}>{entry.kind === "directory" ? <Folder size={15} /> : <FileText size={15} />}{entry.name}</button>;
        })}
      </> : git && <>
        <div className="tap-git-summary"><GitBranch size={15} /><span>{typeof branch?.branch === "string" ? branch.branch : "—"}</span><small>{t("readOnly")}</small></div>
        {Array.isArray(git.changes) && !git.changes.length && <p className="tap-muted">{t("noChanges")}</p>}
        {Array.isArray(git.changes) && git.changes.map((value, index) => {
          if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.path !== "string" || typeof value.status !== "string") return null;
          const entry = { path: value.path, status: value.status };
          return <button className="tap-git-row" key={`${entry.path}:${index}`} onClick={() => void openDiff(entry)}>
            <span className="tap-git-status">{entry.status}</span><span>{entry.path}</span>
            <small className="tap-git-add">+{typeof value.added === "number" ? value.added : 0}</small><small className="tap-git-del">−{typeof value.deleted === "number" ? value.deleted : 0}</small>
          </button>;
        })}
      </>}
  </div>;
}
