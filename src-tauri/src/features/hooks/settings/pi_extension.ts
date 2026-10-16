// __CLI_MANAGER_PI_HOOK__
// Managed by CLI-Manager. Reinstall from Hook settings to update this extension.
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { randomUUID } from "node:crypto";

const ENABLED = {
  sessionStart: __SESSION_START__,
  running: __RUNNING__,
  stop: __STOP__,
};
const HOOK_TIMEOUT_MS = 1_000;
const OWNER_ENV = "CLI_MANAGER_PI_OWNER";
type NotifyEvent = "SessionStart" | "UserPromptSubmit" | "Stop" | "Interrupt" | "StopFailure";
type Outcome = "ended" | "aborted" | "error";
interface BridgeState {
  tabId: string;
  instanceId: string;
  instanceStartedAt: number;
  sequence: number;
  runId: number;
  sessionId: string | null;
  lease: symbol | null;
  active: boolean;
  reportedRunning: boolean;
  ended: boolean;
  outcome: Outcome;
  pending: ReturnType<typeof setTimeout> | null;
}

function nonEmpty(value: string | undefined | null): string | null {
  return value?.trim() || null;
}

// 回调只读取会话身份，不依赖交互 UI；RPC 根会话同样可以上报。
function readSessionId(ctx: ExtensionContext): string | null {
  return nonEmpty(ctx.sessionManager.getSessionId());
}

export default function (pi: ExtensionAPI) {
  const tabId = nonEmpty(process.env.CLI_MANAGER_TAB_ID);
  const port = nonEmpty(process.env.CLI_MANAGER_NOTIFY_PORT);
  const token = nonEmpty(process.env.CLI_MANAGER_NOTIFY_TOKEN);
  if (!tabId || !port || !token) return;

  // 根 Pi 写入可继承的 owner；嵌套进程不得接管父 Tab。不是鉴权凭据。
  const inherited = process.env[OWNER_ENV];
  if (inherited) {
    try {
      const owner = JSON.parse(inherited);
      if (owner.tabId === tabId && owner.pid !== process.pid) return;
    } catch {
      return;
    }
  }
  const host = globalThis as typeof globalThis & { __cliManagerPiBridgeV2?: BridgeState };
  let state = host.__cliManagerPiBridgeV2;
  if (!state || state.tabId !== tabId) {
    state = {
      tabId, instanceId: randomUUID(), instanceStartedAt: Date.now(), sequence: 0,
      runId: 0, sessionId: null, lease: null, active: false,
      reportedRunning: false, ended: false, outcome: "ended", pending: null,
    };
    host.__cliManagerPiBridgeV2 = state;
  }
  const runtime = state;
  process.env[OWNER_ENV] = JSON.stringify({ tabId, pid: process.pid });
  const lease = Symbol("pi-hook-runtime");
  // 在工厂阶段保留根租约，防止根 session_start 前启动的 SDK 子会话抢先认领。
  if (runtime.lease !== null) return;
  runtime.lease = lease;

  // 一个进程内多个 SDK session 也只允许当前持有租约的扩展上报；reload 后保留序号。
  function owns(ctx: ExtensionContext): boolean {
    return runtime.lease === lease && runtime.sessionId === readSessionId(ctx);
  }

  function cancelPending(): void {
    if (runtime.pending !== null) clearTimeout(runtime.pending);
    runtime.pending = null;
  }

  // 每条事件拍下身份/代际；请求独立超时，接收端按序号仲裁，网络不阻塞 Pi。
  async function postHookEvent(event: NotifyEvent): Promise<void> {
    const sequence = ++runtime.sequence;
    const payload = {
      tabId, source: "pi", event, sessionId: runtime.sessionId,
      cwd: process.cwd(), wslDistroName: nonEmpty(process.env.WSL_DISTRO_NAME),
      timestamp: new Date().toISOString(),
      remoteEventId: `${runtime.instanceId}:${sequence}`,
      remoteSequence: sequence,
      pi: {
        instanceId: runtime.instanceId, instanceStartedAt: runtime.instanceStartedAt,
        sequence, runId: runtime.runId,
      },
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HOOK_TIMEOUT_MS);
    try {
      await fetch(`http://127.0.0.1:${port}/api/claude-hook`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload), signal: controller.signal,
      });
    } catch {
      // 桥接不可用不能中断 Pi，也不自动重试旧事件。
    } finally {
      clearTimeout(timeout);
    }
  }

  // 总是监听身份与生命周期；模块开关只控制对外上报，stop-only 仍能正确识别主会话。
  pi.on("session_start", (_event, ctx) => {
    if (runtime.lease !== null && runtime.lease !== lease) return;
    cancelPending();
    runtime.lease = lease;
    runtime.sessionId = readSessionId(ctx);
    runtime.runId += 1;
    runtime.active = false;
    runtime.ended = false;
    runtime.reportedRunning = false;
    runtime.outcome = "ended";
    if (ENABLED.sessionStart) void postHookEvent("SessionStart");
  });

  pi.on("session_shutdown", (event, ctx) => {
    if (!owns(ctx)) return;
    cancelPending();
    // 同一扩展执行 new/resume/fork 时保留租约；只有卸载/退出才允许新工厂接管。
    if (event.reason === "reload" || event.reason === "quit" || !event.reason) runtime.lease = null;
    runtime.active = false;
    runtime.runId += 1;
  });

  // before_agent_start 标识一次会话运行，不向外重复发送 running。
  pi.on("before_agent_start", (_event, ctx) => {
    if (!owns(ctx)) return;
    cancelPending();
    runtime.runId += 1;
    runtime.active = true;
    runtime.ended = false;
    runtime.reportedRunning = false;
    runtime.outcome = "ended";
  });

  pi.on("agent_start", (_event, ctx) => {
    if (!owns(ctx)) return;
    cancelPending();
    if (!runtime.active) {
      runtime.runId += 1;
      runtime.active = true;
      runtime.ended = false;
      runtime.reportedRunning = false;
      runtime.outcome = "ended";
    }
    if (ENABLED.running && !runtime.reportedRunning) {
      runtime.reportedRunning = true;
      void postHookEvent("UserPromptSubmit");
    }
  });

  // 只记最新完成的 assistant 结果；中间失败后重试成功会覆盖 error。
  pi.on("message_end", (event, ctx) => {
    if (!owns(ctx) || event.message.role !== "assistant") return;
    const reason = event.message.stopReason;
    runtime.outcome = reason === "error" ? "error" : reason === "aborted" ? "aborted" : "ended";
  });

  pi.on("agent_settled", (event, ctx) => {
    if (!owns(ctx) || runtime.ended) return;
    cancelPending();
    const runId = runtime.runId;
    const outcome = event.aborted ? "aborted" : runtime.outcome;
    // 让同步 settle handler 排入的新运行先启动；这不是判断任意后台任务结束的冷却窗口。
    runtime.pending = setTimeout(() => {
      runtime.pending = null;
      if (!owns(ctx) || runtime.runId !== runId || runtime.ended) return;
      if (!ctx.isIdle() || ctx.hasPendingMessages()) return;
      runtime.active = false;
      runtime.ended = true;
      if (ENABLED.stop) {
        void postHookEvent(outcome === "aborted" ? "Interrupt" : outcome === "error" ? "StopFailure" : "Stop");
      }
    }, 0);
  });
}
