import type { HistorySessionDetail, TerminalSession } from "../../../shared/types/index";
import type { TerminalTranscript } from "../../../shared/types/webBrowser";

/** Export only canonical public message text, never flattened internal/tool data. */
export function terminalTranscriptPage(
  session: Pick<TerminalSession, "id" | "cliSessionId">,
  detail: HistorySessionDetail | null,
  before?: number,
): TerminalTranscript {
  const empty = { messages: [], start: 0, total: 0 };
  if (!session.cliSessionId) return { ...empty, available: false, reason: "unbound" };
  if (!detail || detail.session_id !== session.cliSessionId)
    return { ...empty, available: false, reason: "missing" };
  const total = detail.messages.length;
  const end = Math.min(total, before ?? total);
  const start = Math.max(0, end - 40);
  const messages: TerminalTranscript["messages"] = [];
  for (let index = start; index < end; index++) {
    const message = detail.messages[index]!;
    if (message.role !== "user" && message.role !== "assistant") continue;
    const text = (message.parts ?? []).filter((part) => part.kind === "text" && !part.tool_name && !part.call_id)
      .map((part) => part.content).join("\n");
    if (!text.trim()) continue;
    // Rust JSON rejects lone surrogates; a boundary emoji must remain whole or be omitted.
    const visible = text.slice(0, 4_000).replace(/[\uD800-\uDBFF]$/, "");
    messages.push({
      id: `${session.cliSessionId}:${index}`, role: message.role,
      text: visible, truncated: text.length > 4_000,
      at: message.timestamp, model: message.model,
    });
  }
  return { available: true, cliSessionId: session.cliSessionId, start, total, messages };
}
