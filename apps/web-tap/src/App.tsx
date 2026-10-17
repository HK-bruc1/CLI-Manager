import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Menu, Folder, TerminalSquare, Plus, SlidersHorizontal, PanelRight, LogOut, ArrowUpRight, CircleStop, RefreshCw } from "lucide-react";
import { useWorkspace } from "./useWorkspace";
import { usePreferences } from "./preferences";
import { translator } from "./i18n";
import { useViewportBox, startViewport } from "./viewport";
import { Sidebar } from "./Sidebar";
import { Sheet } from "./Sheet";

const Details = lazy(() => import("./DetailsPanel"));
const SessionView = lazy(() => import("./SessionView").then((module) => ({ default: module.SessionView })));

/** Compose the optional client; classic view components and state are never imported. */
export function App() {
  const model = useWorkspace();
  const { prefs, setPrefs, phone } = usePreferences();
  const t = translator(prefs.language);
  const [panel, setPanel] = useState<"sessions" | "projects" | "settings" | "details" | "end" | null>(null);
  const [ending, setEnding] = useState<{ scope: string; sessionId: string; title: string }>();
  const accountScope = JSON.stringify([model.user?.id, model.deviceId]);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [pairingError, setPairingError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useViewportBox(root);
  useEffect(() => { startViewport(); }, []);
  useEffect(() => { setPanel(null); setEnding(undefined); }, [accountScope]);
  const session = model.workspace.terminals?.find((item) => item.sessionId === model.activeId);
  const project = model.workspace.projects.find((item) => item.id === session?.projectId);
  const close = () => { setPanel(null); setEnding(undefined); };

  if (model.mobileToken) return <div ref={root} className="tap-login"><div className="tap-login-card">
    <h1>{t("authorize")}</h1><p>{t("authorizeHint")}</p>
    {model.authError && <p role="alert">{t("loginError")}</p>}
    <div className="tap-dialog-actions"><button disabled={model.checking} onClick={model.cancelMobile}>{t("cancel")}</button>
      <button className="tap-primary" disabled={model.checking} onClick={() => void model.redeemMobile()}>{t("confirm")}</button></div>
  </div></div>;

  if (!model.user) return <div ref={root} className="tap-login">
    <div className="tap-login-card"><span className="tap-mark is-large">t<span>_</span></span><h1>{t("app")}</h1><p>{t("loginHint")}</p>
      <form onSubmit={(event) => { event.preventDefault(); void model.login(username, password).then(() => setPassword("")); }}>
        <label>{t("username")}<input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
        <label>{t("password")}<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {model.authError && <p role="alert">{t(model.authError === "authExpired" ? "authExpired" : "loginError")}</p>}
        <button className="tap-primary" disabled={model.checking}>{t(model.checking ? "connecting" : "login")}</button>
      </form><a href="/">{t("classic")}<ArrowUpRight size={13} /></a>
      <button className="tap-language" onClick={() => setPrefs({ ...prefs, language: prefs.language === "zh-CN" ? "en-US" : "zh-CN" })}>{prefs.language === "zh-CN" ? "English" : "简体中文"}</button>
    </div>
  </div>;

  const sidebar = <Sidebar model={model} t={t} phone={phone} onPick={() => setPanel("projects")} onSettings={() => setPanel("settings")}
    onClose={phone ? close : undefined} />;
  return <div ref={root} className="tap-app">
    {!phone && sidebar}
    <main className="tap-workspace">
      <header className="tap-topbar">
        {phone && <button className="tap-icon" aria-label={t("openSessions")} onClick={() => setPanel("sessions")}><Menu size={19} /></button>}
        <div className="tap-workspace-title"><Folder size={15} /><span>{project?.name ?? t("app")}</span>{session && <><span className="tap-separator">/</span><strong>{session.title}</strong></>}</div>
        <div className="tap-top-actions">
          {session && <><button className="tap-icon" aria-label={t("showDetails")} onClick={() => setPanel("details")}><PanelRight size={17} /></button>
            <button className="tap-icon" aria-label={t("stop")} onClick={() => {
              // A delayed project launch can select another terminal while this confirmation is open.
              setEnding({ scope: accountScope, sessionId: session.sessionId, title: session.title }); setPanel("end");
            }}><CircleStop size={17} /></button></>}
          <button className="tap-icon" aria-label={t("settings")} onClick={() => setPanel("settings")}><SlidersHorizontal size={17} /></button>
        </div>
      </header>
      {model.error && <div className="tap-banner" role="alert"><span>{t(model.error === "unknownDelivery" ? "unknownDelivery" : model.error === "sendFailed" ? "sendFailed" : "error")}</span>
        <button onClick={() => { model.setError(""); model.refresh(); }}>{t("retry")}</button><button onClick={() => model.setError("")}>{t("close")}</button></div>}
      {model.device?.status === "offline" && <div className="tap-banner" role="status">{t("deviceOffline")}</div>}
      {model.user && model.device && model.link !== "open" && <div className="tap-connection-banner" role="status">{t("reconnecting")}<button onClick={model.reconnect}><RefreshCw size={12} />{t("reconnect")}</button></div>}
      {!model.devices.length ? <div className="tap-empty-workspace"><TerminalSquare size={32} /><h1>{t("noDevices")}</h1><p>{t("pairHint")}</p>
        <form onSubmit={(event) => { event.preventDefault(); setPairingError(false); void model.pair(pairingCode).catch(() => setPairingError(true)); }}>
          <input required aria-label={t("code")} value={pairingCode} onChange={(event) => setPairingCode(event.target.value)} /><button className="tap-primary">{t("pair")}</button>
        </form>{pairingError && <p role="alert">{t("error")}</p>}
      </div> : !model.activeId ? <div className="tap-empty-workspace"><span className="tap-mark is-large">t<span>_</span></span><h1>{t("emptyTitle")}</h1><p>{t("emptyHint")}</p>
        <button className="tap-primary" onClick={() => setPanel("projects")} disabled={!model.workspace.projects.length || model.device?.status !== "online"}><Plus size={16} />{t("newSession")}</button>
      </div> : <div className="tap-sessions" key={`${model.user.id}:${model.deviceId}`}>
        <Suspense fallback={<p className="tap-chat-notice" role="status">{t("loading")}</p>}>
          {model.mounted.map((id) => <SessionView key={id} id={id} active={model.activeId === id} model={model} prefs={prefs} phone={phone} t={t} />)}
        </Suspense>
      </div>}
    </main>
    {panel === "sessions" && <Sheet title={t("sessions")} side onClose={close} t={t}>{sidebar}</Sheet>}
    {panel === "projects" && <Sheet title={t("newSession")} onClose={close} t={t}>
      <p className="tap-muted">{t("source")}</p>
      {model.workspace.projects.map((item) => <div className="tap-project-choice" key={item.id}>
        <button disabled={model.starting || item.environmentType === "ssh" || model.device?.status !== "online"} onClick={() => { void model.start(item); close(); }}>
          <Folder size={18} /><span><strong>{item.name}</strong><small>{item.environmentType === "ssh" ? t("unsupportedProject") : item.cwd}</small></span><Plus size={16} />
        </button>
        {model.workspace.worktrees.filter((worktree) => worktree.projectId === item.id).map((worktree) => <button className="tap-worktree-choice" key={worktree.id}
          disabled={model.starting || worktree.status === "missing" || item.environmentType === "ssh"} onClick={() => { void model.start(item, worktree.id); close(); }}>
          <span>{worktree.name}</span><small>{worktree.branch}</small><Plus size={13} />
        </button>)}
      </div>)}
    </Sheet>}
    {panel === "settings" && <Sheet title={t("settings")} onClose={close} t={t}>
      <label className="tap-setting-row">{t("theme")}<select value={prefs.theme} onChange={(event) => setPrefs({ ...prefs, theme: event.target.value as typeof prefs.theme })}>
        <option value="system">{t("system")}</option><option value="light">{t("light")}</option><option value="dark">{t("dark")}</option></select></label>
      <label className="tap-setting-row">{t("language")}<select value={prefs.language} onChange={(event) => setPrefs({ ...prefs, language: event.target.value as typeof prefs.language })}>
        <option value="zh-CN">简体中文</option><option value="en-US">English</option></select></label>
      <label className="tap-setting-row">{t("fontSize")}<input type="range" min={11} max={24} step={1} value={prefs.fontSize} onChange={(event) => setPrefs({ ...prefs, fontSize: Number(event.target.value) })} /><span>{prefs.fontSize}</span></label>
      <div className="tap-setting-links"><a href="/">{t("classic")}<ArrowUpRight size={14} /></a>
        <button onClick={() => { close(); void model.logout(); }}><LogOut size={15} />{t("logout")}</button></div>
    </Sheet>}
    {panel === "end" && ending?.scope === accountScope && <Sheet title={t("stop")} onClose={close} t={t}>
      <p className="tap-path">{ending.title}</p><p>{t("stopConfirm")}</p>
      <div className="tap-dialog-actions"><button onClick={close}>{t("cancel")}</button><button className="tap-danger" onClick={() => { model.end(ending.sessionId); close(); }}>{t("stop")}</button></div>
    </Sheet>}
    {panel === "details" && session && <Sheet title={t("details")} onClose={close} t={t}>
      <Suspense fallback={<p>{t("loading")}</p>}><Details key={`${model.user.id}:${model.deviceId}:${session.projectId}:${session.worktreeId}`}
        context={{ projectId: session.projectId, ...(session.worktreeId ? { worktreeId: session.worktreeId } : {}) }} run={model.run} t={t} /></Suspense>
    </Sheet>}
  </div>;
}
