import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square, Keyboard, ImagePlus } from "lucide-react";
import { composerAction, modifyCharacter, type Modifiers } from "./input";
import type { Translate } from "./i18n";

/** Draft ownership is per account/device/session, independent of selected display mode. */
export function Composer({ storageKey, disabled, phone, modifiers, clearModifiers, onCharacter, onSend, onInterrupt, onDirect, onImage, t }: {
  storageKey: string; disabled: boolean; phone: boolean; modifiers: Modifiers; clearModifiers: () => void;
  onCharacter: (bytes: string) => boolean; onSend: (text: string) => Promise<boolean>;
  onInterrupt: () => void; onDirect: () => void; onImage: (file: File) => Promise<string>; t: Translate;
}) {
  const [draft, setDraft] = useState(() => { try { return localStorage.getItem(storageKey) ?? ""; } catch { return ""; } });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const image = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const draftRef = useRef(draft); draftRef.current = draft;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    try { if (draft) localStorage.setItem(storageKey, draft); else localStorage.removeItem(storageKey); } catch { /* Storage may be disabled. */ }
    if (input.current) { input.current.style.height = "auto"; input.current.style.height = `${Math.min(160, input.current.scrollHeight)}px`; }
  }, [draft, storageKey]);
  const send = async () => {
    if (busy.current || disabled || composing.current || !draft.trim()) return;
    busy.current = true; setSending(true); setError("");
    const submitted = draft;
    try {
      const accepted = await onSend(submitted);
      if (mounted.current && accepted && draftRef.current === submitted) setDraft("");
      else if (mounted.current && !accepted) setError(t("sendFailed"));
    } catch (caught) {
      if (mounted.current) setError(caught instanceof Error && caught.message === "multiline_paste_unavailable"
        ? t("multiline_paste_unavailable") : t("unknownDelivery"));
    } finally { busy.current = false; if (mounted.current) setSending(false); }
  };
  return <div className="tap-composer-wrap">
    {error && <div className="tap-inline-error" role="alert">{error}</div>}
    <div className="tap-composer">
      <textarea ref={input} value={draft} maxLength={16_000} rows={1} aria-label={t("input")}
        placeholder={t("inputHint")} enterKeyHint={phone ? "enter" : "send"}
        onChange={(event) => setDraft(event.target.value)}
        onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
        onKeyDown={(event) => {
          if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
          if ((modifiers.ctrl || modifiers.alt) && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            if (onCharacter(modifyCharacter(event.key, modifiers))) clearModifiers();
            return;
          }
          if (composerAction(event, phone) === "send") { event.preventDefault(); void send(); }
        }} />
      <div className="tap-composer-tools">
        <div>
          <button className="tap-icon" title={t("files")} aria-label={t("files")} disabled={disabled || sending}
            onPointerDown={(event) => event.preventDefault()} onClick={() => image.current?.click()}><ImagePlus size={17} /></button>
          <button className="tap-icon" title={t("direct")} aria-label={t("direct")} disabled={disabled}
            onPointerDown={(event) => event.preventDefault()} onClick={onDirect}><Keyboard size={17} /></button>
          <button className="tap-icon tap-interrupt" title={t("interrupt")} aria-label={t("interrupt")} disabled={disabled}
            onPointerDown={(event) => event.preventDefault()} onClick={onInterrupt}><Square size={13} /></button>
        </div>
        <button className="tap-send" aria-label={t("send")} title={t("sendHint")}
          disabled={disabled || sending || !draft.trim()} onPointerDown={(event) => event.preventDefault()} onClick={() => void send()}>
          <ArrowUp size={19} strokeWidth={2.2} />
        </button>
      </div>
      <input ref={image} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" hidden onChange={async (event) => {
        const file = event.target.files?.[0]; event.target.value = "";
        if (!file || busy.current) return;
        busy.current = true; setSending(true); setError("");
        try {
          const path = await onImage(file);
          if (mounted.current) setDraft((text) => `${text}${text ? " " : ""}${path}`);
        } catch { if (mounted.current) setError(t("error")); }
        finally { busy.current = false; if (mounted.current) setSending(false); }
      }} />
    </div>
    <div className="tap-composer-hint"><span>{sending ? t("sending") : t("sendHint")}</span></div>
  </div>;
}
