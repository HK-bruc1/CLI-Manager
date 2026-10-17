import { useState } from "react";
import { Check, ChevronRight, Folder, Plus, Search, Settings, SquarePen, X } from "lucide-react";
import { AgentIcon } from "./AgentIcon";
import { Menu } from "./Menu";
import type { WorkspaceModel } from "./useWorkspace";
import type { Translate } from "./i18n";

/** Project identity remains opaque; display paths never become request authority. */
export function Sidebar({ model, t, onPick, onSettings, onClose, phone }: {
  model: WorkspaceModel; t: Translate; onPick: () => void; onSettings: () => void; onClose?: () => void; phone: boolean;
}) {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [devices, setDevices] = useState(false);
  const online = model.device?.status === "online";
  const canStart = online && model.workspace.projects.length > 0;
  const needle = query.trim().toLowerCase();
  const linkLabel = !online ? t("statusOffline") : model.link === "open" ? t("linkOnline") : t("linkConnecting");
  const linkClass = !online ? " is-lost" : model.link === "open" ? "" : " is-waiting";
  let matches = 0;
  return <aside className="tap-sidebar">
    <header className="tap-sidebar-head">
      <span className="tap-mark" aria-hidden>t<b>_</b></span><strong>Tap</strong>
      <span className="tap-sidebar-tools">
        <button type="button" className="tap-icon" aria-label={t("newSession")} title={t("newSession")} disabled={!canStart} onClick={onPick}>
          <SquarePen size={16} />
        </button>
        {phone && <button type="button" className="tap-icon" aria-label={t("closeSessions")} onClick={onClose}><X size={17} /></button>}
      </span>
    </header>
    <label className="tap-search">
      <Search size={14} aria-hidden />
      <input type="search" value={query} placeholder={t("searchSessions")} aria-label={t("searchSessions")}
        onChange={(event) => setQuery(event.target.value)} />
    </label>
    <nav aria-label={t("sessions")} className="tap-session-nav">
      {!model.workspace.projects.length && <p className="tap-nav-empty">{t("noProjects")}</p>}
      {model.workspace.projects.map((project) => {
        const all = model.workspace.terminals?.filter((session) => session.projectId === project.id) ?? [];
        const sessions = needle ? all.filter((session) => `${session.title} ${project.name}`.toLowerCase().includes(needle)) : all;
        if (needle && !sessions.length) return null;
        matches += sessions.length;
        const expanded = Boolean(needle) || !collapsed.includes(project.id);
        const running = all.filter((session) => !["exited", "closed"].includes(model.states[session.sessionId]?.status)).length;
        const startable = !model.starting && project.environmentType !== "ssh" && online;
        return <section key={project.id} className="tap-folder">
          <div className="tap-folder-row">
            <button type="button" className="tap-folder-toggle" aria-expanded={expanded}
              onClick={() => setCollapsed((old) => expanded ? [...old, project.id] : old.filter((id) => id !== project.id))}>
              <ChevronRight size={13} className={expanded ? "is-open" : undefined} /><Folder size={15} />
              <span>{project.name}</span>{running > 0 && <small className="tap-count">{running}</small>}
            </button>
            <button type="button" className="tap-icon is-small" aria-label={`${t("newSession")} · ${project.name}`}
              title={project.environmentType === "ssh" ? t("unsupportedProject") : `${t("newSession")} · ${project.name}`}
              disabled={!startable} onClick={() => { void model.start(project); onClose?.(); }}><Plus size={14} /></button>
          </div>
          {expanded && <div className="tap-folder-items">
            {!sessions.length && <p className="tap-folder-empty">{t("noSessions")}</p>}
            {sessions.map((session) => {
              const current = model.activeId === session.sessionId;
              const ended = ["exited", "closed"].includes(model.states[session.sessionId]?.status);
              const worktree = model.workspace.worktrees.find((item) => item.id === session.worktreeId);
              return <button type="button" key={session.sessionId}
                className={`tap-nav-row${current ? " is-current" : ""}${ended ? " is-ended" : ""}`}
                aria-current={current ? "page" : undefined} onClick={() => { model.attach(session.sessionId); onClose?.(); }}>
                {model.mounted.includes(session.sessionId) && <i className="tap-open-mark" aria-hidden />}
                <span className="tap-row-icon"><AgentIcon source={project.source} size={15} /><i className={`tap-status is-${ended ? "ended" : "running"}`} /></span>
                <span className="tap-row-title">{session.title || project.name}</span>
                {worktree && <small className="tap-row-badge">{worktree.name}</small>}
              </button>;
            })}
          </div>}
        </section>;
      })}
      {needle && !matches && <p className="tap-nav-empty">{t("noMatches")}</p>}
    </nav>
    <footer className="tap-sidebar-foot">
      <button type="button" className="tap-icon" aria-label={t("settings")} title={t("settings")} onClick={onSettings}><Settings size={16} /></button>
      <span className="tap-menu-anchor tap-link-state">
        <button type="button" className="tap-device" aria-label={`${t("device")}: ${model.device?.name ?? ""}`} aria-haspopup="menu"
          aria-expanded={devices} disabled={model.devices.length < 2} title={model.devices.length > 1 ? t("chooseDevice") : undefined}
          onClick={() => setDevices(!devices)}>
          <i className={`tap-link${linkClass}`} aria-hidden /><b>{model.device?.name}</b><span aria-hidden>·</span>{linkLabel}
        </button>
        <Menu open={devices} onClose={() => setDevices(false)} label={t("chooseDevice")} placement="up-end">
          {model.devices.map((device) => <button type="button" role="menuitemradio" aria-checked={device.id === model.deviceId} key={device.id}
            onClick={() => { setDevices(false); model.setDeviceId(device.id); }}>
            <i className={`tap-link${device.status === "online" ? "" : " is-lost"}`} aria-hidden />
            <span>{device.name}</span><small>{device.platform}</small>
            {device.id === model.deviceId && <Check size={15} className="tap-menu-check" />}
          </button>)}
        </Menu>
      </span>
    </footer>
  </aside>;
}
