# 验证记录 — 2026-10-17

## 结果

用户报告的文件能力误判、静态命令菜单缺失真实 skills 和重复唤起失效已处理。@ 使用 file.management 契约并隔离每次交互；/ 改为对话页内的同一 CLI 原生面板。用户已表示“我验证了一下，先这样吧”，授权提交、推送与清理工作区。

原生面板直接呈现运行中 CLI 的菜单，不等同网页重建的 MCP 配置页；操作完成/取消并清空未发送输入后再返回对话。使用现有 PTY，无新增后端 API、依赖或 ACP 迁移。

## 最终自动检查

| 检查 | 结果 |
| --- | --- |
| npm run tap:test | 67/67 通过 |
| npm run tap:build | TypeScript 与 Vite 构建通过，产物 apps/web/dist/tap 保持忽略 |
| npx tsc --noEmit | 桌面类型检查通过 |
| npm run web:typecheck | Classic 类型检查通过 |
| npm run check:architecture -- --strict | 1411 源文件，0 超限，0 违规 |
| git diff --cached --check | 通过 |

回归覆盖实际能力契约、重复 / 与 @、关闭后重输、选中项复位、原生输入不带回车/粘贴包装、拒绝交付保留草稿、渲染器不可用、迟到交付/回调、账号/设备/会话/Worktree 切换、IME、控制字符、文件路径/上限/去抖串行、原生面板单渲染器与按键、StrictMode 和桌面网格滚动。

测试运行生产纯函数、React 组件/Hook 和 Terminal 输入边界；网络、DOM 和 xterm 采用受控替身，不能证明所有 CLI 版本的原生行为。Rust/服务器实现未改，不重复运行无关全套。

## 人工验收与范围

用户已接受当前实现；未逐项说明的手机、WSL、语言/主题场景不记为独立实机通过。后续使用可复测：

1. Claude/Codex 在提示符空闲且输入为空时输入 /，核对真实菜单、已有 skills 和 /mcp 后续操作；完成或取消并清空后返回，再次输入 /。
2. @ 浏览/搜索主仓库和 Worktree（含 .git 文件），选择中文/空格路径；选中、Esc、清空后再次输入 @。
3. 手机键盘、方向键/Tab/Enter、长终端网格滚动；Tap 中英文与深浅主题切换，多会话和断线后保持隔离，时间仍为 24 小时制。

遵守 .trellis/spec/frontend/quality-guidelines.md：未启动 CLI-Manager 服务或 Tauri 进行 UI 验证，也未向真实 CLI 发送探测命令或替换安装版。用户自行验收。

## 变更范围

起点 master / 63bae0f9，领先 origin/master 1 个提交；未 pull/merge/rebase。用户已明确授权本次提交和推送。清理仅含已核实的 GitNexus 自动规则段及 Trellis 初始化模板。本次必要文件为 Tap 源码/测试、V1.4.5 记录、Web 契约和本任务文档。图分析详见 design.md，提交前另执行 detect-changes 与 diff --check。

提交前重建工作区索引成功。CLI detect-changes --scope staged --repo . --limit 500 汇总 24 个有符号变更文件、307 个符号、10 条流程，风险 HIGH，已告知用户。暂存共 25 文件，全部为上述范围。额外的 RenderContentSearchRow/RenderSearchRow 流程来自桌面 InlineRenameInput 对 inputRef.current.select() 的同名关联；已核对该文件没有导入 Tap 补全模块，实际为 DOM 输入框选择，不是新增运行时依赖。CLI 展示前 15 个符号，结论结合完整暂存文件清单与定向源码核对，不将图输出视作完整证明。MCP 仍受 LadybugDB 存储版本不兼容影响，使用 CLI 回退；FTS 不可用不影响本次精确影响/差异查询。
