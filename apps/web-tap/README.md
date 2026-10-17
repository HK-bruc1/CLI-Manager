# Tap Web（可选工作台）

独立于经典 Web 的移动优先客户端，入口 `/tap/`。经典 `/` 与其配置、设备、原生终端保持可用；两套客户端不共享 UI 状态，仅共用浏览器协议与原生执行边界。

## 开发与构建

仓库根目录执行（Node.js 22.18+，原生 TypeScript 测试需要 Node.js 22.18+/24）：

```bash
npm ci
npm run tap:dev
```

打开 Vite 输出地址下的 `/tap/`。开发代理把 `/api`、`/ws` 转发到已有的 `127.0.0.1:8787` 服务；登录并选择已配对的在线设备。不会自动安装 CLI、创建项目或修改监听暴露范围。

```bash
npm run tap:typecheck
npm run tap:test
npm run web:build
```

`web:build` 先构建经典 Web，再构建新端到 `apps/web/dist/tap`。现有 `CLI_MANAGER_WEB_DIST` 仍指向整个 `apps/web/dist`。服务、Tauri resources 和 portable 脚本随相同目录携带两套产物。单独执行 `tap:build` 只重建新端；之后单独构建经典 workspace 会清空整个 dist，应在打包前使用根目录 `web:build`。

## 操作与数据

- 设备 → 已注册项目/Worktree → 原生 `project.start` → PTY attach。新端不会向主机发送 cwd、启动命令、环境变量或供应商密钥。
- 最近三个终端保留挂载；淘汰、关页面、切设备只解除浏览器订阅，不结束进程。“结束会话”单独确认后才发送 close。
- 手机 Enter 换行；电脑 Enter 发送；Ctrl/⌘+Enter 发送。输入法选字不触发发送。Ctrl/Alt 是下一键修饰，方向键长按连发，取消、切会话和断线都会停止。
- 组合消息采用 CLI 已启用的 bracketed paste，然后延迟发送 Enter；CLI 未启用时拒绝多行，避免逐行执行。不能确认送达时保留草稿并提示，不自动重发。
- 草稿及选中会话存于当前浏览器 localStorage，键按账号/设备/会话隔离。退出登录会清除挂载内容，但保留该账号的本地草稿供下次恢复；共享浏览器应清除站点数据。偏好仅存本机，不同步。
- 原生终端查询应答仍由主机拥有。浏览器只在 xterm 完成写入后推进 rendered cursor，保留 reset/replay/分片语义。渲染队列溢出会停止该终端输入，需手动重连回放，不静默丢帧。
- 桌面拥有尺寸时浏览器不 resize PTY；手机可用最后 800 行的纯文本重排阅读版，也可切回原生屏幕操作 TUI。阅读版不保留 ANSI 颜色/屏幕定位，不冒充新的 PTY。
- 手机软键盘只平移应用外框，不改变聊天/终端容器高度；抽屉在独立 portal 跟随可视视口，包含焦点陷阱、Esc、关闭后焦点恢复与拖动手柄。

## 对话与能力边界

对话页只读主机已精确绑定的 Claude/Codex 会话记录。新增 `terminal.transcript` operation 使用注册 `projectId`、可选 `worktreeId` 与 PTY `sessionId`，由主机验证 source、CLI ID、cwd，并在异步读取后再次验证绑定。只返回规范的 user/assistant 文本部分，不附带工具参数、推理、主机凭据字段或原始日志；正文仍可能包含用户自己输入的敏感信息，应仅授权可信浏览器。

输入始终进入同一原生 PTY，不调用 `conversation.start/prompt`。审批仍在原生 CLI 菜单中通过键帽操作；没有伪造的消息、审批卡或终端菜单自动化。设备没有 capability、未绑定或记录缺失时明确提示，终端仍可使用；不会按目录/时间猜配另一段会话。首次打开及可见时随终端输出合并刷新，空闲/隐藏时不持续轮询；旧页显式加载并保持阅读锚点。

本次提供文件列表/文本预览、Git 分支/变更/只读 Diff。未提供 SSH、完整工具轨迹、历史恢复、消息队列、用量统计、Web Push、模型/审批自动切换、文件编辑或 Service Worker。PWA manifest 仅支持添加入口，不提供离线执行。

## 来源与许可

体验参考 [Tap-Code](https://github.com/tapaixx/Tap-Code/tree/1a3d946)，包括会话分组、输入卡、键帽、三会话挂载和键盘平移策略。Tap-Code 当前没有项目级 LICENSE，因此此 PR 不搬运其源文件或图标，也不推定商业再许可权：客户端与视口处理在本仓库实现，PWA PNG 从本目录 `public/icon.svg` 生成。

浏览器 HTTP/socket、DTO、terminal stream、图片准备来自本仓库已有实现，抽到 `src/shared`，经典入口保留明确兼容导出及缓存副作用。新增代码沿用仓库 AGPL-3.0-or-later 许可。

Inconsolata 字体来自 `@fontsource-variable/inconsolata` 的 Latin WOFF2，按 SIL Open Font License 1.1 分发；完整许可在 `public/fonts/OFL-Inconsolata.txt`。其他依赖沿用各自许可。

## 验证

可复现命令、浏览器 fixture、截图和实机待验收项记录在 [Trellis 验证记录](../../.trellis/tasks/10-16-optional-tap-web/verification.md)。Chromium fixture 不等于 Windows/WSL 真 CLI、移动 Safari/Android 软键盘或安装包验收。

English: this optional client keeps Classic Web and the existing Cookie/device/native-PTY authority. Chat is read-only and requires an exact host-owned session binding. No input retry, new agent host, SSH fallback, queue, Push or automatic permission bypass is introduced.
