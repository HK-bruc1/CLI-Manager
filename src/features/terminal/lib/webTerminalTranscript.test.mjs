import assert from "node:assert/strict";
import { test } from "node:test";
import { terminalTranscriptPage } from "./webTerminalTranscript.ts";

const session = { id: "pty-a", cliSessionId: "cli-a" };
const detail = {
  session_id: "cli-a", source: "claude", messages: [
    { role: "user", content: "raw-internal-tool", parts: [{ kind: "text", content: "hello" }] },
    { role: "assistant", content: "hidden tool arguments", parts: [
      { kind: "tool_call", content: "secret internal args", tool_name: "Bash" },
      { kind: "text", content: "reply" },
    ] },
    { role: "system", content: "internal instructions" },
    { role: "assistant", content: "flattened secret", parts: [{ kind: "tool_call", content: "secret" }] },
  ],
};
test("transcript exports canonical visible text and excludes flattened/internal data", () => {
  const page = terminalTranscriptPage(session, detail);
  assert.equal(page.available, true);
  assert.deepEqual(page.messages.map((m) => [m.role, m.text]), [["user", "hello"], ["assistant", "reply"]]);
  assert.equal(JSON.stringify(page).includes("secret"), false);
});
test("no binding and mismatched native history cannot expose another conversation", () => {
  assert.equal(terminalTranscriptPage({ id: "pty-a" }, detail).reason, "unbound");
  assert.equal(terminalTranscriptPage(session, { ...detail, session_id: "other" }).reason, "missing");
});
test("older pages preserve stable source message identity and bound output", () => {
  const long = { ...detail, messages: Array.from({ length: 105 }, (_, i) => ({
    role: "assistant", parts: [{ kind: "text", content: `message ${i}` }],
  })) };
  const tail = terminalTranscriptPage(session, long);
  assert.equal(tail.start, 65);
  assert.equal(tail.messages.length, 40);
  const older = terminalTranscriptPage(session, long, tail.start);
  assert.equal(older.messages.at(-1).text, "message 64");
  assert.notEqual(older.messages.at(-1).id, tail.messages[0].id);
});
test("truncating text at the wire budget must not split a surrogate pair", () => {
  const text = "a".repeat(3999) + "🚀" + " remainder";
  const page = terminalTranscriptPage(session, { ...detail, messages: [
    { role: "assistant", parts: [{ kind: "text", content: text }] },
  ] });
  assert.equal(page.messages[0].text.isWellFormed(), true, "Rust JSON decoding rejects a lone surrogate");
  assert.equal(page.messages[0].text, "a".repeat(3999));
  assert.equal(page.messages[0].truncated, true);
});
