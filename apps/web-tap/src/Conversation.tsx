import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowDown, Check, ChevronRight, Copy, LoaderCircle, MessageSquareDashed, SquareTerminal } from "lucide-react";
import type { JsonObject, JsonValue, TerminalStream, TerminalTranscript, TranscriptMessage } from "./protocol";
import { fill, type Translate } from "./i18n";
import { clock, duration, modelName } from "./format";
import { groupTurns, type Turn } from "./turns";
import { ConversationCodeBlock, ConversationCodeI18n } from "./ConversationCodeBlock";
import { ConversationActivity } from "./ConversationActivity";

/** Update visible history in response to output; idle/hidden chats never poll continuously. */
export function Conversation({ sessionId, context, run, stream, active, supported, chatSize, onTerminal, onReconnect, t }: {
  sessionId: string; context: JsonObject; run: (kind: string, payload: JsonObject) => Promise<JsonValue>;
  stream: TerminalStream; active: boolean; supported: boolean; chatSize: number; onTerminal: () => void; onReconnect: () => void; t: Translate;
}) {
  const [page, setPage] = useState<TerminalTranscript>();
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const [away, setAway] = useState(false);
  const [unread, setUnread] = useState(false);
  const [flowing, setFlowing] = useState(false);
  const flowTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const turns = useMemo(() => groupTurns(messages), [messages]);
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
      const result = await options.current.run("terminal.transcript", {
        ...options.current.context, sessionId, includeDetails: true, ...(before !== undefined ? { before } : {}),
      });
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
      setFlowing(true);
      clearTimeout(flowTimer.current);
      flowTimer.current = setTimeout(() => setFlowing(false), 4000);
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
    else setUnread(true);
  }, [messages]);
  useEffect(() => () => clearTimeout(flowTimer.current), []);
  const bottom = () => { if (box.current) box.current.scrollTop = box.current.scrollHeight; setUnread(false); };

  const notice = !supported ? "noChat" : page?.available === false ? page.reason ?? "missing" : undefined;
  return <div className="tap-chat-wrap" style={{ "--chat-text": `${chatSize}px` } as CSSProperties}>
    <div className="tap-chat" ref={box} onScroll={() => {
      const element = box.current;
      if (!element) return;
      pinned.current = element.scrollHeight - element.clientHeight - element.scrollTop < 48;
      setAway(!pinned.current);
      if (pinned.current) setUnread(false);
    }}>
      <div className="tap-chat-column">
        {supported && page && page.start > 0 && <div className="tap-load-older">
          {loading ? <LoaderCircle size={15} className="tap-spin" aria-label={t("loading")} />
            : <button type="button" onClick={() => void load(page.start)}>{t("older")}</button>}
        </div>}
        {notice && <div className="tap-chat-notice" role="status"><MessageSquareDashed size={14} /><p>{t(notice as "noChat")}</p>
          {!supported && <button type="button" className="tap-text-button" onClick={onReconnect}>{t("reconnect")}</button>}
          <button type="button" className="tap-text-button" onClick={onTerminal}><SquareTerminal size={14} />{t("openTerminal")}</button>
        </div>}
        {error && <div className="tap-chat-notice is-error" role="alert"><p>{t("error")}</p>
          <button type="button" className="tap-text-button" onClick={() => void load()}>{t("retry")}</button></div>}
        {loading && !page && <p className="tap-chat-empty" role="status">{t("loading")}</p>}
        {page?.available && !messages.length && <p className="tap-chat-empty">{t("chatEmpty")}</p>}
        <ol className="tap-chat-list">
          {turns.map((turn, index) => <TurnView key={turn.key} turn={turn} live={flowing && index === turns.length - 1} t={t} />)}
        </ol>
      </div>
    </div>
    {away && <button type="button" className="tap-jump" aria-label={t("jumpLatest")} title={t("jumpLatest")} onClick={bottom}>
      <ArrowDown size={17} />{unread && <i aria-hidden />}
    </button>}
  </div>;
}

/** Process details always start folded, including while new output arrives. */
function TurnView({ turn, live, t }: { turn: Turn; live: boolean; t: Translate }) {
  const [open, setOpen] = useState(false);
  const steps = turn.steps.length;
  const model = modelName(turn.answer?.model ?? turn.steps.at(-1)?.model);
  const label = steps ? fill(t("processSteps"), { n: steps })
    : turn.elapsed !== undefined ? fill(t("workedFor"), { time: duration(turn.elapsed) }) : "";
  return <li className="tap-turn">
    {turn.prompt && <UserBubble message={turn.prompt} t={t} />}
    {(steps > 0 || (label && model)) && <button type="button" className="tap-fold" aria-expanded={open}
      disabled={!steps} onClick={() => setOpen(!open)}>
      {steps > 0 && <ChevronRight size={13} className={open ? "is-open" : undefined} />}
      {live && <LoaderCircle size={13} className="tap-spin" aria-label={t("statusRunning")} />}
      {model && <span className="tap-fold-model">{model}</span>}<span>{label}</span>
      {steps > 0 && turn.elapsed !== undefined && <span>{fill(t("workedFor"), { time: duration(turn.elapsed) })}</span>}
    </button>}
    <div className="tap-process" hidden={!open}>
      {turn.steps.map((message) => message.parts
        ? <ConversationActivity key={message.id} message={message} t={t} />
        : <Message key={message.id} message={message} t={t} />)}
    </div>
    {turn.answer && <Message message={turn.answer} t={t} />}
    {turn.answer && <Footer message={turn.answer} t={t} />}
  </li>;
}

function UserBubble({ message, t }: { message: TranscriptMessage; t: Translate }) {
  const long = message.text.length > 900 || message.text.split("\n").length > 12;
  const [open, setOpen] = useState(false);
  return <div className="tap-user">
    <div className={`tap-bubble${long && !open ? " is-clamped" : ""}`}>{message.text}</div>
    {long && <button type="button" className="tap-bubble-more" onClick={() => setOpen(!open)}>{t(open ? "collapse" : "expand")}</button>}
  </div>;
}

/** Message HTML remains escaped; links can only navigate through Markdown's safe URL handling. */
function Message({ message, t }: { message: TranscriptMessage; t: Translate }) {
  return <article className="tap-message">
    <ConversationCodeI18n value={t}><Markdown remarkPlugins={[remarkGfm]} components={{
      a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
      table: ({ children }) => <div className="tap-table"><table>{children}</table></div>,
      // A stable component type preserves folding/copy state while transcript text refreshes.
      pre: ConversationCodeBlock,
    }}>{message.text}</Markdown></ConversationCodeI18n>
    {message.truncated && <small className="tap-truncated">{t("truncated")}</small>}
  </article>;
}

function Footer({ message, t }: { message: TranscriptMessage; t: Translate }) {
  const [copied, setCopied] = useState(false);
  const time = clock(message.at);
  return <footer className="tap-turn-foot">
    <button type="button" aria-label={t(copied ? "copied" : "copy")} title={t(copied ? "copied" : "copy")} onClick={() => {
      void navigator.clipboard.writeText(message.text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => {});
    }}>{copied ? <Check size={13} /> : <Copy size={13} />}</button>
    {time && <span className="tap-meta">{time}</span>}
  </footer>;
}
