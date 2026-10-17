import { useId, useState } from "react";
import { Brain, ChevronRight, Wrench } from "lucide-react";
import type { TranscriptMessage } from "./protocol";
import type { Translate } from "./i18n";

/** Read-only recorded activity. Receiving new output never opens a disclosure. */
export function ConversationActivity({ message, t }: { message: TranscriptMessage; t: Translate }) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const parts = message.parts ?? [];
  if (!parts.length) return <small className="tap-truncated">{t("activityTruncated")}</small>;
  const reasoning = parts[0]?.kind === "reasoning";
  const call = parts.find((part) => part.kind === "tool_call");
  const name = call?.toolName ?? parts.find((part) => part.toolName)?.toolName;
  const label = t(reasoning ? "reasoningDetails" : call ? "toolCall" : "toolResult");
  return <section className="tap-activity">
    <button type="button" className="tap-activity-toggle" aria-expanded={open} aria-controls={bodyId}
      onClick={() => setOpen((value) => !value)}>
      <ChevronRight size={14} className={open ? "is-open" : undefined} aria-hidden />
      {reasoning ? <Brain size={15} aria-hidden /> : <Wrench size={15} aria-hidden />}
      <span>{label}{name ? ` · ${name}` : ""}</span><small>{t(open ? "collapse" : "expand")}</small>
    </button>
    <div id={bodyId} className="tap-activity-body" hidden={!open}>
      {open && parts.map((part) => <div className="tap-activity-part" key={part.id}>
        {!reasoning && <p>{t(part.kind === "tool_call" ? "toolInput" : "toolOutput")}</p>}
        <pre><code>{part.text}</code></pre>
        {part.truncated && <small className="tap-truncated">{t("truncated")}</small>}
      </div>)}
    </div>
  </section>;
}
