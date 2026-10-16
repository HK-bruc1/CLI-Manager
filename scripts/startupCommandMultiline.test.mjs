import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  joinStartupCommandLines,
  startupCommandContinuationChars,
} from "../src/features/terminal/lib/startupCommandText.ts";

// 用户实测的续行 ssh 命令：多组 -L 端口转发拆在多行书写。
const SSH_MULTILINE = [
  "ssh -p 22 \\",
  "  -L 123:127.0.0.1:1234 \\",
  "  -L 1111:127.0.0.1:1234 \\",
  "  -L 1234:127.0.0.1:1234 \\",
  "  root@example.com",
].join("\n");

test("single-line startup command is returned unchanged", () => {
  assert.equal(joinStartupCommandLines("npm run dev", "powershell"), "npm run dev");
  // 无换行时不做任何裁剪，保证既有单行命令逐字节不变。
  assert.equal(joinStartupCommandLines("  npm run dev  ", "powershell"), "  npm run dev  ");
  assert.equal(joinStartupCommandLines("", "bash"), "");
});

test("multi-line command without continuation characters joins into one line", () => {
  assert.equal(joinStartupCommandLines("npm\nrun\ndev", "powershell"), "npm run dev");
  assert.equal(joinStartupCommandLines("npm\r\nrun\r\ndev", "cmd"), "npm run dev");
});

test("continuation characters are mapped per shell", () => {
  assert.deepEqual(startupCommandContinuationChars("powershell"), ["`"]);
  assert.deepEqual(startupCommandContinuationChars("pwsh"), ["`"]);
  assert.deepEqual(startupCommandContinuationChars("cmd"), ["^"]);
  assert.deepEqual(startupCommandContinuationChars("wsl"), ["\\"]);
  assert.deepEqual(startupCommandContinuationChars("gitbash"), ["\\"]);
  assert.deepEqual(startupCommandContinuationChars("bash"), ["\\"]);
  assert.deepEqual(startupCommandContinuationChars("zsh"), ["\\"]);
  assert.deepEqual(startupCommandContinuationChars("fish"), ["\\"]);
  assert.deepEqual(startupCommandContinuationChars("sh"), ["\\"]);
});

test("unknown shell strips every continuation character", () => {
  assert.deepEqual(startupCommandContinuationChars(null), ["`", "^", "\\"]);
  assert.deepEqual(startupCommandContinuationChars(undefined), ["`", "^", "\\"]);
  assert.equal(joinStartupCommandLines("ssh `\n-L 1 ^\n-L 2 \\\nhost", undefined), "ssh -L 1 -L 2 host");
});

test("real-world multi-line ssh command becomes a single valid command", () => {
  const joined = joinStartupCommandLines(SSH_MULTILINE, "gitbash");
  assert.equal(joined, "ssh -p 22 -L 123:127.0.0.1:1234 -L 1111:127.0.0.1:1234 -L 1234:127.0.0.1:1234 root@example.com");
  // 结果必须是单行，否则 PTY 仍会把换行当回车逐行执行。
  assert.equal(/[\r\n]/u.test(joined), false);
  // 已经拼接过的结果再次拼接不变（幂等）。
  assert.equal(joinStartupCommandLines(joined, "gitbash"), joined);
});

test("PowerShell backtick continuation is stripped", () => {
  assert.equal(joinStartupCommandLines("ssh `\n-L 1\nhost", "powershell"), "ssh -L 1 host");
  assert.equal(joinStartupCommandLines("ssh `\r\n-L 1\r\nhost", "pwsh"), "ssh -L 1 host");
});

test("CMD caret continuation is stripped", () => {
  assert.equal(joinStartupCommandLines("ssh ^\n-L 1\nhost", "cmd"), "ssh -L 1 host");
});

test("Bash-family backslash continuation is stripped", () => {
  for (const shell of ["bash", "zsh", "sh", "fish", "wsl", "gitbash"]) {
    assert.equal(joinStartupCommandLines("ssh \\\n-L 1\nhost", shell), "ssh -L 1 host");
  }
});

test("blank lines and CR/CRLF variants are handled", () => {
  assert.equal(joinStartupCommandLines("a\n\n   \nb", "bash"), "a b");
  assert.equal(joinStartupCommandLines("a\r\nb", "bash"), "a b");
  assert.equal(joinStartupCommandLines("a\rb", "bash"), "a b");
  assert.equal(joinStartupCommandLines("\n\n", "bash"), "");
  assert.equal(joinStartupCommandLines("  \r\n \n", "bash"), "");
});

test("documented limitation: Bash-family strips a trailing path backslash", () => {
  // Bash 行尾反斜杠本义即续行符；PowerShell 只认反引号，因此保留反斜杠。
  assert.equal(joinStartupCommandLines("cd C:\\\nnpm run dev", "powershell"), "cd C:\\ npm run dev");
  assert.equal(joinStartupCommandLines("cd C:\\\nnpm run dev", "bash"), "cd C: npm run dev");
});

test("the PTY startup formatter joins multi-line commands before the Codex direct-launch check", () => {
  const source = readFileSync(
    new URL("../src/features/terminal/lib/terminalLaunch.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /joinStartupCommandLines\(command, shell \?\? null\)/);
  assert.match(source, /isDirectCodexStartupCommand\(singleLineCommand\)/);
});

test("regression: a CMD project accepts Bash-style backslash continuation", () => {
  // 用户实测：CMD 项目里按 Bash 习惯用反斜杠续行，续行符没被去掉而被当成命令内容送进终端，
  // ssh 报 hostname contains invalid characters。
  const command = [
    "ssh -p 3222 \\",
    "-L 16379:127.0.0.1:16379 \\",
    "-L 13306:127.0.0.1:3306 \\",
    "-L 15433:127.0.0.1:5433 \\",
    "root@107.172.78.135",
  ].join("\n");
  const expected =
    "ssh -p 3222 -L 16379:127.0.0.1:16379 -L 13306:127.0.0.1:3306 -L 15433:127.0.0.1:5433 root@107.172.78.135";
  assert.equal(joinStartupCommandLines(command, "cmd"), expected);
  assert.equal(joinStartupCommandLines(command, "powershell"), expected);
  assert.equal(joinStartupCommandLines(command, "pwsh"), expected);
  assert.equal(expected.includes("\\"), false);
});

test("another shell's continuation character is honoured when written as a separate marker", () => {
  assert.equal(joinStartupCommandLines("ssh `\n-L 1\nhost", "cmd"), "ssh -L 1 host");
  assert.equal(joinStartupCommandLines("ssh ^\n-L 1\nhost", "bash"), "ssh -L 1 host");
  // 与内容连写时不当作续行符：CMD/PowerShell 里行尾反斜杠仍按字面保留。
  assert.equal(joinStartupCommandLines("cd C:\\\nnpm run dev", "cmd"), "cd C:\\ npm run dev");
});
