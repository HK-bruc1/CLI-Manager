## 背景

提供一套会话导向、移动优先的可选 Web 工作台，借鉴 Tap-Code 的输入与会话接力体验。**经典 Web 不删除、不改默认入口**；新端位于 `/tap/`，适合先以 Draft 审阅“双 Web”的职责与维护边界。

Trellis 任务：`.trellis/tasks/10-16-optional-tap-web`，含 PRD、设计、实施计划、协议 fixture、[验证记录](https://github.com/nnnmdzz/CLI-Manager/blob/feat/optional-tap-web/.trellis/tasks/10-16-optional-tap-web/verification.md)和[提交前双轴复审](https://github.com/nnnmdzz/CLI-Manager/blob/feat/optional-tap-web/.trellis/tasks/10-16-optional-tap-web/review.md)。按上游 Codex inline 配置实施与检查，不声称独立多代理审计。

## 改动

- 独立 `apps/web-tap`：项目/Worktree 原生启动、分组会话、最近三终端保持挂载、账号/设备/会话草稿、手机抽屉、中英文及浅/深/系统外观。
- 输入吸取 Tap 的经验：IME 不误发、手机 Enter 换行、桌面 Enter 发送、Shift+Tab、单次 Ctrl/Alt、可取消长按方向键；bracketed paste + 延迟 Enter，送达不确定时保留草稿，不重试输入。
- 保持原生 PTY：桌面网格权威、写屏后推进 replay cursor、分片/reset 边界、预组装与渲染队列内存上限、同网格合批和跨终端公平写屏。窄屏提供纯文本阅读版/原生画面切换；键盘平移外框而不重排消息。
- 新增只读 `terminal.transcript` capability/operation。主机按精确 PTY/CLI/source/cwd 验证并在 I/O 后重验，只上传分页 user/assistant 正文。**聊天输入仍进入同一 PTY，审批在 CLI 原生菜单完成**。
- 文件文本/Git 只读入口；共用既有 Cookie/设备/operation 协议。抽取浏览器基础模块到 `src/shared`，经典兼容导出、目录缓存和完成事件副作用保留。
- `/tap/` 独立 SPA/资源路由，根 `web:build` 构建两端，Tauri/portable 资源包含新端；更新 TEMP changelog、功能清单及服务契约。

## 验证

- [x] 新旧 Web 类型检查与生产构建、桌面前端类型检查/构建。
- [x] 输入、操作完成竞态、视口、分片组装、只读转录及上下文变化回归。
- [x] 经典 Web transport/目录/图片回归；真实生产组件浏览器 smoke（11 轮回放、图片选择器、5001 块输出合批）。
- [x] Rust server 62 项 + protocol 7 项，含 Cookie/设备 scope、WS 重连、双 SPA/资源隔离。
- [x] Chromium 受控 host：桌面与 360/390/430px、草稿/选中恢复、重连不重发、IME/键帽、阅读版、文件预览、语言/外观、设备切换、手机授权确认、logout/4401 清理。
- [x] 详细复审复现并修复 11 项边界缺陷：确认目标冻结、跨设备旧回调/迟到 401、授权取消回放、单渲染器重连保留其他挂载、输入法 Esc/直接输入退出/字体拒绝、Unicode 截断与写屏合批/全局调度。新增生产浏览器回归含 5001 帧合为 4 次写屏、两终端分帧和粘贴后断线不补发 Enter。
- [x] 严格 2000 行架构检查、`git diff --check`、界面 detector 无发现。
- [ ] Windows/WSL 真 CLI 会话绑定与权限交互、真实 iOS/Android 软键盘/触控/PWA、安装包与 portable 启动。

截图来自协议 fixture，不冒充真实 CLI。[桌面对话](https://github.com/nnnmdzz/CLI-Manager/blob/feat/optional-tap-web/.trellis/tasks/10-16-optional-tap-web/screenshots/desktop-chat.png) · [手机终端](https://github.com/nnnmdzz/CLI-Manager/blob/feat/optional-tap-web/.trellis/tasks/10-16-optional-tap-web/screenshots/mobile.png) · [手机抽屉](https://github.com/nnnmdzz/CLI-Manager/blob/feat/optional-tap-web/.trellis/tasks/10-16-optional-tap-web/screenshots/mobile-drawer.png)。

## 边界与未覆盖

- 不另建主机、登录库、项目数据或 Hook，不接受浏览器 cwd/启动命令，不用 structured conversation 代发终端输入，不绕过原生审批。
- 无 SSH、完整工具轨迹、历史恢复、队列、用量、Web Push、菜单自动化、文件编辑或离线执行。旧设备/未绑定转录明确提示，终端继续可用；不猜配其他会话。
- 退出登录清理挂载内容，但保留按账号隔离的本地草稿；共享浏览器需清站点数据。阅读版仅重排最后 800 行纯文本，不是另一套 PTY。
- Linux 缺少 GTK/WebKitGTK，未完成 native Tauri 编译/实机验收。全量 rustfmt 有上游既存格式漂移，本次新增部分已整理，未扩大重排。
- 本机 build 使用补齐的依赖环境，Vite/React 与锁定版本有差异，不等同于 clean locked-install CI。锁文件只新增 workspace/link 元数据；详见验证记录的环境限定。
- Tap-Code 尚无项目级 LICENSE，本 PR 只借鉴交互规则，不搬其源文件或图标，不推定商业再许可；新实现沿用本仓库 AGPL，字体随附 OFL。

请优先审阅：是否接受独立可选客户端、共享模块边界、`terminal.transcript` 只读契约。Draft 保持，待补实机验收后再考虑 ready；本 PR 不包含合并或部署动作。
