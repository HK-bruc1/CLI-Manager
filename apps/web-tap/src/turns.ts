import type { TranscriptMessage } from "./protocol";

export type Turn = {
  key: string;
  prompt?: TranscriptMessage;
  /** Assistant text written before the final answer of the turn. */
  steps: TranscriptMessage[];
  answer?: TranscriptMessage;
  /** Elapsed time from the prompt to the final answer, when both carry timestamps. */
  elapsed?: number;
};

const time = (message?: TranscriptMessage) => {
  const value = message?.at ? Date.parse(message.at) : Number.NaN;
  return Number.isFinite(value) ? value : undefined;
};

/** Group read-only transcript text into prompt → interim replies → final answer turns. */
export function groupTurns(messages: TranscriptMessage[]): Turn[] {
  const turns: Turn[] = [];
  let current: Turn | undefined;
  let replies: TranscriptMessage[] = [];
  const close = () => {
    if (!current) return;
    current.answer = replies.at(-1);
    current.steps = replies.slice(0, -1);
    const start = time(current.prompt);
    const end = time(current.answer);
    if (start !== undefined && end !== undefined && end >= start && end - start < 86_400_000) current.elapsed = end - start;
    turns.push(current);
  };
  for (const message of messages) {
    if (message.role === "user") {
      close();
      current = { key: message.id, prompt: message, steps: [] };
      replies = [];
    } else {
      if (!current) { current = { key: message.id, steps: [] }; replies = []; }
      replies.push(message);
    }
  }
  close();
  return turns;
}
