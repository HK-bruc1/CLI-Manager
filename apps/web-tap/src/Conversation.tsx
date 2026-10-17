import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import type { JsonObject, JsonValue, TerminalStream, TerminalTranscript, TranscriptMessage } from "./protocol";
import type { Translate } from "./i18n";

/** Update visible history in response to output; idle/hidden chats never poll continuously. */
export function Conversation({ sessionId, context, run, stream, active, supported, t }: {
  sessionId: string; context: JsonObject; run: (kind: string, payload: JsonObject) => Promise<JsonValue>;
  stream: TerminalStream; active: boolean; supported: boolean; t: Translate;
}) {
  const [page, setPage] = useState<TerminalTranscript>();
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const reading = useRef<{ height: number; top: number } | undefined>(undefined);
  const binding = useRef<string | undefined>(undefined);
  const busy = useRef(false);
  const again = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const alive = useRef(true);
  const options = useRef({ active, context, run }); options.current = { active, context, run };

  const load = useCallback(async (before?: number) => {
    if (!supported || !options.current.active || document.visibilityState === "hidden") return;
    if (busy.current) { again.current = true; return; }
    busy.current = true;
    if (before !== undefined && box.current) reading.current = { height: box.current.scrollHeight, top: box.current.scrollTop };
    setLoading(true);
    try {
      const result = await options.current.run("terminal.transcript", { ...options.current.context, sessionId, ...(before !== undefined ? { before } : {}) });
      if (!alive.current) return;
      const value = result as unknown as TerminalTranscript;
      if (!value || !Array.isArray(value.messages)) throw new Error("invalid_transcript");
      const changed = value.cliSessionId !== binding.current;
      binding.current = value.cliSessionId;
      setPage((old) => before !== undefined ? { ...value, start: value.start } : { ...value, start: changed ? value.start : Math.min(old?.start ?? value.start, value.start) });
      setMessages((old) => {
        if (changed || !value.available) return value.messages;
        const next = new Map(old.filter((message) => Number(message.id.slice(message.id.lastIndexOf(":") + 1)) < value.total)
          .map((message) => [message.id, message]));
        for (const message of value.messages) next.set(message.id, message);
        return [...next.values()].sort((a, b) => Number(a.id.slice(a.id.lastIndexOf(":") + 1)) - Number(b.id.slice(b.id.lastIndexOf(":") + 1)));
      });
      setError(false);
    } catch (caught) { if (alive.current && !(caught instanceof DOMException && caught.name === "AbortError")) setError(true); }
    finally {
      busy.current = false;
      if (alive.current) setLoading(false);
      if (again.current && alive.current) {
        again.current = false;
        timer.current = setTimeout(() => { timer.current = undefined; void load(); }, 2000);
      }
    }
  }, [sessionId, supported]);

  useEffect(() => {
    alive.current = true;
    if (active) void load();
    const schedule = () => {
      if (!options.current.active || document.visibilityState === "hidden" || timer.current) return;
      timer.current = setTimeout(() => { timer.current = undefined; void load(); }, 2000);
    };
    const unsubscribe = stream.subscribe(sessionId, schedule);
    const visible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", visible);
    return () => { alive.current = false; clearTimeout(timer.current); timer.current = undefined; unsubscribe(); document.removeEventListener("visibilitychange", visible); };
  }, [active, load, sessionId, stream]);

  useLayoutEffect(() => {
    if (!box.current) return;
    if (reading.current) {
      box.current.scrollTop = reading.current.top + box.current.scrollHeight - reading.current.height;
      reading.current = undefined;
    } else if (pinned.current) box.current.scrollTop = box.current.scrollHeight;
  }, [messages]);

  return <div className="tap-chat" ref={box} onScroll={() => {
    if (box.current) pinned.current = box.current.scrollHeight - box.current.clientHeight - box.current.scrollTop < 48;
  }}>
    {!supported ? <p className="tap-chat-notice">{t("noChat")}</p>
      : page?.available === false ? <p className="tap-chat-notice">{t(page.reason ?? "missing")}</p> : null}
    {supported && page && page.start > 0 && <button className="tap-load-older" disabled={loading} onClick={() => void load(page.start)}>{t("older")}</button>}
    {error && <div className="tap-inline-error" role="alert">{t("error")} <button onClick={() => void load()}>{t("retry")}</button></div>}
    {loading && !page && <p className="tap-chat-notice" role="status">{t("loading")}</p>}
    {page?.available && !messages.length && <p className="tap-chat-notice">{t("chatEmpty")}</p>}
    <div className="tap-chat-content">
      {messages.map((message) => <Message key={message.id} message={message} t={t} />)}
    </div>
  </div>;
}

/** Message HTML remains escaped; links can only navigate through Markdown's safe URL handling. */
function Message({ message, t }: { message: TranscriptMessage; t: Translate }) {
  const [copied, setCopied] = useState(false);
  return <article className={`tap-message is-${message.role}`}>
    <Markdown remarkPlugins={[remarkGfm]} components={{ a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{message.text}</Markdown>
    {message.truncated && <small>{t("truncated")}</small>}
    {message.role === "assistant" && <footer>
      <button onClick={() => { void navigator.clipboard.writeText(message.text).then(() => setCopied(true), () => {}); }}>
        {copied ? <Check size={13} /> : <Copy size={13} />}{t(copied ? "copied" : "copy")}
      </button>
      <span>{message.model}</span>
      {message.at && <time>{new Date(message.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}</time>}
    </footer>}
  </article>;
}
