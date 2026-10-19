# 设计与影响

## 根因

Tap 的模块命名跨越 Windows 大小写不敏感文件系统与 TypeScript 扩展名解析边界：`TurnRail.tsx` 和 `turnRail.ts` 的模块名仅大小写不同，`./TurnRail` 优先匹配到工具模块 `.ts`，触发 TS2305/TS1261/TS1149。修复应消除命名歧义，而非关闭大小写检查或跳过 Tap 打包。

## 最小方案

将组件文件原样移动为 `ConversationTurnRail.tsx`，保留 `TurnRail` 导出及 `turnRail.ts` 工具模块，更新对话页和测试依赖的组件模块路径。不改任何函数或交互。

## 发现清单

- [x] `apps/web-tap/src/TurnRail.tsx`：文件移动，内容完全保留。
- [x] `apps/web-tap/src/Conversation.tsx`：唯一生产调用入口，仅更新导入路径。
- [x] `activity.test.mjs`、`conversation.test.mjs`、`timeline.test.mjs`：更新组件模块 mock 路径。
- [x] `turnRail.ts`、`turnRail.test.mjs`、`turnRail.css`：纯逻辑及样式引用正确，与修改无关，保持原样。
- [x] 根 `web:build`、Tap tsconfig、Tauri 资源配置：已有经典 Web → Tap 构建及资源封装链路正确，不修改。
- [x] 桌面、经典 Web、Rust、协议及 Unicode 行为：无调用路径或行为调整，保持原样。

## 影响分析与工具降级

GitNexus MCP 未暴露；按契约降级为刷新后的 codebase-memory 索引、Web Service Contracts 和定向源码检索。索引识别 `TurnRail` 为导出的 memo 组件变量，但未给出 JSX 调用方，已人工复核 `Conversation` 的实际 JSX 和三个测试依赖表。直接调用方一个，风险低，无桌面/后端影响。

## 场景与回滚

大小写敏感与不敏感平台均采用不歧义路径；测试 harness 与生产模块解析同时更新。窗口焦点、分屏、CLI、Hook 与移动端交互不受文件移动影响。回滚本提交即恢复文件及引用，无数据迁移。未修改模块业务或传输契约，现有类型检查规则仍保持启用，无需另增业务契约。
