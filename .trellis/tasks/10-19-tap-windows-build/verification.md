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
- GitNexus 工具未暴露；两次刷新 codebase-memory fast 索引，以源码检索、契约与 Git diff 复核。组件是 memo 变量，图谱无 JSX 调用边，未用空 caller 结果代替实际入口检查。
- codebase-memory `detect_changes` 对 staged/all 两种请求均返回空变更，与真实 Git 差异不符，因此不作为范围已验证的依据；以 `git diff --cached` 的 R100 原样移动和四处单行路径修改完成逐项复核，另有两份产品记录和本任务文档，无其他代码改动。
- 未启动应用或热部署，未做原生手机/桌面交互验收；此次没有 UI 行为或用户文案修改。

## 打包

- 验证后提交，再执行标准 `npm run tauri:build:local -- --bundles nsis`，保留缓存、完整经典 Web 与 Tap 资源。产物核验结果在构建结束后补充。
