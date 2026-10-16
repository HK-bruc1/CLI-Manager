import type { ShellKey } from "../../../shared/platform/shell";

// 各 Shell 的行续接字符：行尾出现时，该行与下一行属于同一条命令。
// PowerShell/pwsh 用反引号，CMD 用 ^，Bash 家族（含 WSL/Git Bash）用反斜杠。
const SHELL_STARTUP_CONTINUATION: Partial<Record<ShellKey, string>> = {
  powershell: "`",
  pwsh: "`",
  cmd: "^",
  wsl: "\\",
  gitbash: "\\",
  bash: "\\",
  zsh: "\\",
  fish: "\\",
  sh: "\\",
};

// Shell 未知时三种续行符都去除：宁可多去一个行尾符号，也不把续行符当命令内容送进终端。
const ALL_STARTUP_CONTINUATION_CHARS = ["`", "^", "\\"];

/** 返回该 Shell 需要去除的行尾续行符；Shell 未知时返回全部候选字符。 */
export function startupCommandContinuationChars(shell?: ShellKey | null): string[] {
  const shellChar = shell ? SHELL_STARTUP_CONTINUATION[shell] : undefined;
  return shellChar ? [shellChar] : ALL_STARTUP_CONTINUATION_CHARS;
}

/**
 * 把多行启动命令按 Shell 语法拼接为同一条命令。
 *
 * 单行输入原样返回（含首尾空白），保证既有单行命令零回归。多行时逐行去掉行尾续行符、
 * 丢弃空行，再用单个空格拼接：PTY 只会收到一行内容加一个回车，不会把换行当回车逐行执行，
 * 因此 `ssh` 多组 `-L` 参数这类续行命令不会被拆断。
 */
export function joinStartupCommandLines(command: string, shell?: ShellKey | null): string {
  if (!/[\r\n]/u.test(command)) return command;
  const continuationChars = startupCommandContinuationChars(shell);
  const segments: string[] = [];
  for (const rawLine of command.split(/\r\n|\r|\n/u)) {
    let line = rawLine.trim();
    if (!line) continue;
    if (continuationChars.includes(line.slice(-1))) line = line.slice(0, -1).trimEnd();
    if (line) segments.push(line);
  }
  return segments.join(" ");
}
