import { lazy, Suspense, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Terminal, type TerminalHandle } from "./Terminal";
import { Composer } from "./Composer";
import { KeyBar } from "./KeyBar";
import { prepareWebImage } from "../../../src/shared/lib/webImageUpload";
import type { WorkspaceModel } from "./useWorkspace";
import type { Preferences } from "./preferences";
import type { Translate } from "./i18n";
import type { Modifiers } from "./input";

const Conversation = lazy(() => import("./Conversation").then((module) => ({ default: module.Conversation })));

/** A mounted session retains terminal state and its own composer while other sessions are selected. */
export function SessionView({ id, active, model, prefs, phone, t }: {
  id: string; active: boolean; model: WorkspaceModel; prefs: Preferences; phone: boolean; t: Translate;
}) {
  const terminal = useRef<TerminalHandle>(null);
  const [mode, setMode] = useState<"terminal" | "chat">("terminal");
  const [chatOpened, setChatOpened] = useState(false);
  const [modifiers, setModifiers] = useState<Modifiers>({ ctrl: false, alt: false });
  const [showKeys, setShowKeys] = useState(true);
  const session = model.workspace.terminals?.find((item) => item.sessionId === id);
  const state = model.states[id] ?? { status: "connecting", controlMode: "desktop" as const };
  const disabled = !active || model.link !== "open" || model.device?.status !== "online"
    || !["running", "attached"].includes(state.status);
  const clearModifiers = () => setModifiers({ ctrl: false, alt: false });
  const context = { projectId: session?.projectId ?? "", ...(session?.worktreeId ? { worktreeId: session.worktreeId } : {}) };
  return <section className={`tap-session${active ? " is-visible" : ""}`} aria-hidden={!active} inert={!active}>
    <div className="tap-view-toolbar">
      <div role="tablist" aria-label={t("native")}>
        <button role="tab" aria-selected={mode === "terminal"} aria-controls={`terminal-${id}`} onClick={() => setMode("terminal")}>{t("terminal")}</button>
        <button role="tab" aria-selected={mode === "chat"} aria-controls={`chat-${id}`} onClick={() => { setChatOpened(true); setMode("chat"); }}>{t("chat")}</button>
      </div>
      <span className="tap-session-state"><i className={disabled ? "" : "is-live"} />{t(["exited", "closed"].includes(state.status) ? "ended" : "native")}</span>
    </div>
    <div className="tap-session-content">
      <div id={`terminal-${id}`} className="tap-terminal-panel" role="tabpanel" hidden={mode !== "terminal"}>
        <Terminal ref={terminal} sessionId={id} stream={model.stream} active={active} visible={mode === "terminal"}
          connected={!disabled} state={state} fontSize={prefs.fontSize} t={t}
          onInput={(text) => model.input(id, text)} onResize={(cols, rows) => model.resize(id, cols, rows)} onError={model.setError} onRetry={() => model.reopen(id)} />
      </div>
      <div id={`chat-${id}`} className="tap-chat-panel" role="tabpanel" hidden={mode !== "chat"}>
        {chatOpened && <Suspense fallback={<p className="tap-chat-notice">{t("loading")}</p>}>
          <Conversation sessionId={id} stream={model.stream} context={context} run={model.run}
            active={active && mode === "chat"} supported={Boolean(model.device?.capabilities.includes("terminal.transcript"))} t={t} />
        </Suspense>}
      </div>
    </div>
    <div className="tap-input-dock">
      <Composer key={`${model.user?.id}:${model.deviceId}:${id}`} storageKey={JSON.stringify(["cli-manager.tap.draft", model.user?.id, model.deviceId, id])}
        disabled={disabled} phone={phone} modifiers={modifiers} clearModifiers={clearModifiers} onCharacter={(text) => model.input(id, text)}
        onSend={(text) => {
          // The terminal stays mounted in chat mode, so paste still reads the real CLI modes.
          return terminal.current?.message(text) ?? Promise.resolve(false);
        }}
        onInterrupt={() => model.input(id, "\x03")} onDirect={() => { flushSync(() => setMode("terminal")); terminal.current?.focus(); }}
        onImage={async (file) => {
          const upload = await prepareWebImage(file);
          const result = await model.run("terminal.attach_image", { sessionId: id, ...upload });
          if (!result || typeof result !== "object" || Array.isArray(result)
            || result.delivery !== "browser_paste" || result.sessionId !== id || typeof result.pasteText !== "string") throw new Error("image_bridge_upgrade_required");
          return result.pasteText;
        }} t={t} />
      {showKeys && <KeyBar key={id} disabled={disabled} modifiers={modifiers} onModifiers={setModifiers} t={t} onKey={(key) => {
        if (terminal.current?.key(key, modifiers)) clearModifiers();
      }} />}
      <div className="tap-dock-status"><span><i className={model.link === "open" ? "is-live" : ""} />{t(model.link === "open" ? "online" : "reconnecting")}</span>
        <button aria-pressed={showKeys} onClick={() => setShowKeys(!showKeys)}>{t("showKeys")}</button></div>
    </div>
  </section>;
}
