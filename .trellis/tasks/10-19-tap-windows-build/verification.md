# 验证记录

## 基线

- 2026-10-19：远程主干从 `8a007432` 无冲突快进至 `5d1620eb`，版本 1.4.4，修复前工作区干净。
- 标准 NSIS 构建在 Tap 类型检查处报 TS2305/TS1261/TS1149，尚未进入本轮 Rust release 编译。
- 基线 Tap 测试 113/113 通过。终端定向测试 67 项中 64 通过，三项 `terminalUnicode.test.mjs` 失败：家庭组合表情表格占格、reset/备用屏光标列数、Unicode 11 回滚隔离用例。仅证明当前 Node/xterm 环境下失败，不能等同于已证实 WebView2 实机异常；本任务不修改相关源码或断言。

## 修复后

- `npm run tap:typecheck`：通过，Windows 文件名解析冲突消失。
- `npm run tap:test`：113 通过，0 失败、跳过或取消。
- `npm run check:architecture -- --strict`：1435 个源码文件，0 超长，0 违规。
- `git diff --check HEAD`：通过。
- 原组件与新文件 Git blob 均为 `34f00572d8c79ffd673ccc56c3fc0209e6a3c528`，移动前后内容完全相同。
- 生产入口和三处测试引用均更新为 `./ConversationTurnRail`；旧组件导入无残留，工具与样式路径保持原样。
- GitNexus 工具未暴露；两次刷新 codebase-memory fast 索引，以源码检索、契约与 Git diff 复核。修复前图谱未识别组件调用方，未用空 caller 结果代替实际入口检查；修复后已识别 `Conversation`，直接调用的 CRITICAL 标记已告知用户，内容原样与定向验证作为实际变更风险依据。
- codebase-memory `detect_changes` 对 staged/all 两种请求均返回空变更，与真实 Git 差异不符，因此不作为范围已验证的依据；以 `git diff --cached` 的 R100 原样移动和四处单行路径修改完成逐项复核，另有两份产品记录和本任务文档，无其他代码改动。
- 未启动应用或热部署，未做原生手机/桌面交互验收；此次没有 UI 行为或用户文案修改。

## 打包

- 源码提交 `be37dd39`（基于远程主干 `5d1620eb`），分支 `fix/tap-windows-build`，未推送。
- 标准 `npm run tauri:build:local -- --bundles nsis` 退出码 0，完成一个 NSIS bundle；复用 `src-tauri/target/local` 缓存，未清缓存、未构建 MSI。
- 桌面 `tsc && vite build`、经典 Web 与 Tap 生产构建全部通过；Rust release 编译成功，用时 5m53s。仅有既有大 chunk、bundle identifier 及 linker stdout 警告。
- 桌面 `dist/index.html`、经典 `apps/web/dist/index.html` 和 `apps/web/dist/tap/index.html` 均为本轮新生成；Tauri 现有 resources 映射包括经典 Web 和 Tap，未跳过任何客户端。
- 安装包：`F:\gitRepository\CLI-Manager\src-tauri\target\local\release\bundle\nsis\CLI-Manager_1.4.4_x64-setup.exe`。
- 生成时间：2026-10-19 16:22:27 +08:00；大小：30,393,708 字节（28.99 MiB）。
- 安装包及桌面 exe 的 FileVersion/ProductVersion 均为 `1.4.4`。
- SHA256：`BA1446CFACBED1B4AE602AE461729CD26E390ED9A0833808864C144A990D459C`。
- 未安装或启动新包；上游三个 Unicode/Emoji 用例的风险仍保留，等待用户实机验收。
