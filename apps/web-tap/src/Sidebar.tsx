import { useState } from "react";
import { ChevronDown, Folder, Plus, PanelLeftClose, TerminalSquare, Settings, ArrowUpRight } from "lucide-react";
import type { WorkspaceModel } from "./useWorkspace";
import type { Translate } from "./i18n";

/** Project identity remains opaque; display paths never become request authority. */
export function Sidebar({ model, t, onPick, onSettings, onClose, phone }: {
  model: WorkspaceModel; t: Translate; onPick: () => void; onSettings: () => void; onClose?: () => void; phone: boolean;
}) {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  return <aside className="tap-sidebar">
    <header className="tap-sidebar-brand"><span className="tap-mark">t<span>_</span></span><strong>Tap</strong><span>CLI-Manager</span>
      {phone && <button className="tap-icon" aria-label={t("close")} onClick={onClose}><PanelLeftClose size={17} /></button>}
    </header>
    <div className="tap-sidebar-action"><button className="tap-new-session" onClick={onPick} disabled={!model.workspace.projects.length || model.device?.status !== "online"}>
      <Plus size={16} />{t("newSession")}
    </button></div>
    <nav aria-label={t("sessions")} className="tap-session-nav">
      {!model.workspace.projects.length && <p className="tap-empty-small">{t("noProjects")}</p>}
      {model.workspace.projects.map((project) => {
        const sessions = model.workspace.terminals?.filter((session) => session.projectId === project.id) ?? [];
        const expanded = !collapsed.includes(project.id);
        return <section key={project.id} className="tap-nav-folder">
          <div className="tap-folder-row">
            <button aria-expanded={expanded} onClick={() => setCollapsed((old) => expanded ? [...old, project.id] : old.filter((id) => id !== project.id))}>
              <ChevronDown size={12} className={expanded ? "" : "is-folded"} /><Folder size={14} /><span>{project.name}</span><small>{sessions.length || ""}</small>
            </button>
            <button className="tap-icon" aria-label={`${t("newSession")} · ${project.name}`} disabled={model.starting || project.environmentType === "ssh" || model.device?.status !== "online"}
              onClick={() => { void model.start(project); onClose?.(); }}><Plus size={14} /></button>
          </div>
          {expanded && <div className="tap-folder-sessions">
            {!sessions.length && <p className="tap-empty-folder">{t("noSessions")}</p>}
            {sessions.map((session) => {
              const ended = ["exited", "closed"].includes(model.states[session.sessionId]?.status);
              return <button key={session.sessionId} className={`tap-nav-session${model.activeId === session.sessionId ? " is-current" : ""}`}
                aria-current={model.activeId === session.sessionId ? "page" : undefined} onClick={() => { model.attach(session.sessionId); onClose?.(); }}>
                <span className={`tap-agent-icon${ended ? " is-ended" : ""}`}><TerminalSquare size={15} /><i /></span>
                <span>{session.title || project.name}{session.worktreeId && <small>{model.workspace.worktrees.find((item) => item.id === session.worktreeId)?.name}</small>}</span>
              </button>;
            })}
          </div>}
        </section>;
      })}
    </nav>
    <footer className="tap-sidebar-footer">
      <label className="tap-device-select"><i className={model.device?.status === "online" ? "is-live" : ""} />
        <select aria-label={t("device")} value={model.deviceId ?? ""} onChange={(event) => model.setDeviceId(event.target.value)}>
          {model.devices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
        </select>
      </label>
      <div><a href="/">{t("classic")}<ArrowUpRight size={12} /></a><button className="tap-icon" aria-label={t("settings")} onClick={onSettings}><Settings size={17} /></button></div>
    </footer>
  </aside>;
}
