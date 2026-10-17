# 验证记录 — 2026-10-17

## 最终验收

2026-10-17 用户明确反馈：「可以了验证完成。可以先进行提交了」。据此记录人工验收完成并进行本地提交，任务状态更新为 completed。用户未逐项列明设备、语言、主题或 CLI 场景，不将该确认扩写为逐项实测结果。此前端口未监听、等待人工验收的记录均为历史现场状态，不再作为当前阻塞。

自动验证合计 265 项通过、1 项性能基准显式跳过，另有类型、构建及严格架构检查通过。安装包制作、安装版替换、推送与发布不在此次执行范围。

提交前复核：master 与本地 origin/master 为 0/0；仅暂存本任务 39 个文件，保留 AGENTS.md、CLAUDE.md 和 00-join-hxx 任务的独立修改。GitNexus CLI 以 `--limit 500` 分别执行 all 与 staged 分析：all 汇总 40 文件/94 符号/15 流程，staged 汇总 38 文件/94 符号/15 流程，风险均为 HIGH，已告知用户。CLI 仍只展示前 15 个符号及前 10 条流程，且 FTS 不可用；图统计不等于 Git 文件总数或完整覆盖证明，结合此前实际差异审查与自动回归判断提交范围。暂存补丁空白检查通过。

## 续增：Codex / Claude 执行过程

用户确认对话已加载后，授权沿用 Tap 集成工具调用、输出和明文思考/摘要，并要求默认折叠；ACP 暂不迁移。

- `npm run tap:test`：39 通过。覆盖两类工具结果角色、按 ID 配对、跨页缺失调用、不猜配、默认折叠、实时更新不展开、手动展开保持、双语及转义。
- `node --test src/features/terminal/lib/webTerminalTranscript.test.mjs src/features/terminal/lib/webTerminalTranscript.integration.test.mjs`：14 通过。覆盖 opt-in、旧请求、精确绑定、迟到结果隔离、分块白名单、Unicode 截断、512 KiB 页预算连续性、正文独立预算与超长元数据。
- `cargo test --manifest-path src-tauri/Cargo.toml --lib commands::history:: --quiet`：212 通过，1 项合成内存性能基准显式跳过。包含新增 4 项真实格式合成 fixture 测试；命令/结果/摘要、Claude 纯工具/纯思考、加密/签名排除和 Diff 消息索引通过。
- 首次历史回归发现父子会话 fixture 原预期忽略两条纯工具消息；现按新增保留规则应为 4 条，已将断言改为 4 并新增两条 tool_call 的内容断言。原 Token 与工具统计断言保留且通过。
- `npx tsc --noEmit`、`npm run web:typecheck`、`npm run tap:build` 通过；`npm run check:architecture -- --strict`：1403 文件、零超限/违规；`git diff --check` 通过。
- Rust 仍有原有 ssh_agent_bridge.rs 的 fetch_update 弃用警告，本次未改该模块。
- 整批未提交差异的 GitNexus detect-changes 为 28 文件/106 符号/15 流程、HIGH，已告知用户。包含此前设备发现/阅读改造；CLI 输出有摘要截断，FTS 不可用且新文件尚未索引。另以实际 diff、定向引用和上述回归核对，未将图结果称为全量证明，未提交。

运行边界：没有启动 CLI-Manager 进行 UI 验证。只读进程检查显示用户已有开发流程于 18:32 重编译并重新启动 debug 主程序；最终 8787 无监听，HTTP 无法连接，不能声称正在运行的网页已呈现本次构建。需在开发版设置开启 Web 服务并刷新 `/tap/`。安装目录未替换。

人工验收建议：在已绑定 Codex/Claude 会话执行一条命令并产生回复；过程及工具/思考卡最初收起，手动打开可见输入和输出，后续新输出不改变折叠选择；最终回复保持展开。检查中英文、24 小时制、窄屏/深浅主题、跨页与多会话切换。思考仅显示日志实际提供的明文，不保证每轮都有。用户现已确认验证完成，具体声明范围见最终验收。

补正前轮设备诊断：只读查询进一步确认安装版与开发版属于不同账号，浏览器会话均属于安装版账号，因此不能仅凭全局设备在线就要求用户在该账号菜单中切换。README 已明确同账号/设备授权边界；随后用户已反馈对话成功加载。本轮不绕过或变更设备授权。

## 前期阅读与设备发现验证（历史记录）

源码实现与自动检查完成；运行中的安装版未替换，真实界面与 CLI 绑定尚待人工验收。

| 检查 | 结果 |
| --- | --- |
| 分支 | master 与本地 origin/master 0/0；未执行 fetch/pull/push/merge/rebase |
| `npm run tap:test` | 35/35，通过（含续验设备发现与选择回归） |
| `node --test src/features/terminal/lib/webTerminalTranscript.test.mjs src/features/terminal/lib/webTerminalTranscript.integration.test.mjs` | 8/8，通过 |
| `npm run tap:build` | 类型检查和 Vite 生产构建通过，输出 `apps/web/dist/tap` |
| `npm run check:architecture -- --strict` | 1400 个源文件，0 个超过 2000 行，0 个违规 |
| `git diff --check` | 通过；其他流程的规则文件有 Git CRLF 提示，无补丁空白错误 |

自动验证运行生产组件/Hook 与真实 Markdown 渲染，网络、生命周期和剪贴板采用受控替身；没有启动 CLI-Manager 服务、Tauri 或真实 CLI，也没有调用外部模型。

## 根因及发现清单

见 [design.md](design.md)：主机能力被用于隐藏对话入口；重连缺少设备能力快照刷新。正在运行的 `D:/soft/CLI-Manager` 桌面程序和 Web 辅助程序均未检出 `terminal.transcript` 字符串，仓库原生能力声明已包含该值。更新 Web 静态资源本身不能赋予旧主机读取记录的能力。

本次修改 SessionHeader/SessionView 的入口与选择、useWorkspace 的重连能力刷新、Conversation 的旧主机说明与 Markdown 代码块、局部样式和双语文案。原生 transcript 校验、服务能力门控、原生输入、Classic Web、Hook 安装及桌面生命周期均已检查且未修改。

## 回归重点

- 旧设备没有 capability，桌面/手机和中英文均能看到入口；选中对话不自动退回终端，且不发送不支持的读取 operation。
- 新能力到达后正确读取原 PTY/Worktree；Terminal、Composer 保持挂载。
- ready 补取设备能力；不扩大手机授权的设备集合；回放旧事件仍受 high-water 限制。
- 后来的单设备推送优先于快照，但不阻止其他设备获得快照更新。
- 设备切换之前捕获的回执/401 即使在 React effect 清理前到达也被拒绝；退出登录、连续 ready 和当前真实 401 分别验证。
- Markdown 标题、列表、表格、代码转义和安全链接；代码块语言、复制成功/失败反馈、折叠与空白保留。代码 renderer 类型在消息刷新时保持稳定，避免重置折叠状态。
- 现有输入/IME/分页/精确绑定/工作树导航与 24 小时时间测试继续通过。

## 图分析与局限

编辑前 MCP 无索引，按当时仓库规则采用契约与引用降级。期间其他流程生成 GitNexus 索引并更新 AGENTS.md/CLAUDE.md；这些改动保留，非本任务修改。

新索引对应当前 HEAD `8f6f4960`，时间 `2026-10-17T09:29:34.351Z`。MCP 引擎读取失败（库版本 43、运行时 42）；使用仓库 CLI 1.6.11 只读分析成功，没有重建/覆盖该索引。

| 符号 | upstream 结果 | 补查 |
| --- | --- | --- |
| SessionHeader | LOW；直接 SessionView；1 个入口（4 条流程） | Header 消费契约与双语入口测试 |
| useWorkspace | LOW；直接 App，继而 main；App 关联 7 条流程 | 6 项异步能力/鉴权回归及现有操作测试 |
| Message | LOW；TurnView → Conversation | Markdown/代码块行为测试 |
| SessionView | UNKNOWN，未解析 lazy 导入调用 | App 的 lazy import 与实际 JSX 已逐项核对；不能将 0 视为无调用 |
| Conversation | UNKNOWN，未解析 lazy 导入调用 | SessionView 的 lazy import 与实际 JSX 已逐项核对 |
| ConversationCodeBlock | 新增未跟踪符号，不在索引中 | Message 唯一生产使用点与双语/复制/折叠测试 |

`node .gitnexus/run.cjs detect-changes --scope all --repo .` 汇总为 11 文件、50 符号、15 执行链、HIGH。已向用户报告，不将其宣称为图分析全通过。CLI 文本摘要仅列前 15 符号和前 10 流程，新未跟踪文件也不在旧索引内；改动范围另以实际 diff 和新增文件逐一复核。FTS 未安装但图遍历可执行。未提交或推送。

## 人工验收清单

### 用户续验：网页一直连接不到

2026-10-17 17:50 左右再次只读核查：`/api/health` 为 ok，8787 由用户启动的开发版主进程监听。设备数据库列出的安装版 online 且 transcript=false；开发版 online 且 transcript=true，另有一个旧开发设备 offline。开发版主程序包含该能力；安装版辅助进程不包含。

根因是当前选择的安装版不提供记录，加上两个实例同名、旧刷新逻辑没有补入新上线设备。已补入服务器授权列表的新 ID、保留认证时的手机 deviceScope，并增加安装版/开发版与对话能力标签。API `list_devices` 已按用户和手机 scope 过滤，本次没有更改服务端权限。对应 useWorkspace / Sidebar upstream impact 都为 LOW（直接 App，间接 main，App 关联 7 条流程）。

用户选择「先连接开发版验证对话」。当前 Chrome DevTools 工具未找到 Chrome 可执行文件，无法代为操作用户网页；未更改浏览器配置或启动/重启桌面服务。完成后需刷新网页，从会话栏底部选择绿色在线的「开发版 · 支持对话」，再打开开发版中的会话。

新增回归覆盖：重连发现新开发设备、推送插入且不重复、发现设备不自动切换会话、手机 scope 同时过滤快照/推送、双语同名设备标识与选择 ID。

已通过只读 HTTP 确认当前 `http://127.0.0.1:8787/tap/` 提供的是本次构建入口，加载的 JS 包含 Development/Conversation supported 和 Installed/Terminal only 标签；用户刷新即可获得新的设备选择提示，无需重启现有服务。

依据 `.trellis/spec/frontend/quality-guidelines.md` 的 “AI agents must not start CLI-Manager services or the Tauri desktop app to verify runtime UI behavior”，本次只执行自动测试/静态构建，以下未宣称通过：

1. 更新包含本次源码的配套桌面构建（含 Web 辅助程序及 Tap 静态资源），重新开启桌面 Web 连接，刷新网页并选择顶部「对话」。旧安装版应看到明确说明，不能冒充能读消息。
2. 实际 Claude/Codex 会话：本机/WSL、主仓库/Worktree、Hook 已绑定/未绑定；显示正确会话或原因，切换终端后输入与草稿正常。
3. 手机与桌面宽度、浅/深主题：用户气泡、正文限宽、代码长行只在块内横向滚动；折叠代码后收到新输出仍保持折叠；复制失败时有说明。
4. Tap 设置中切换中文与英文：顶部入口、旧主机说明、代码操作和反馈同步变化，时间仍为 24 小时制。

已更新 CHANGELOG 的 TEMP 条目、功能清单、README 与 Web 契约。当时任务保持 in_progress 等待人工验收；现已按用户确认完成，见最终验收。
