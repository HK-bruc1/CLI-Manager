# 验证与交付

## 自动验证

- 定向 Node 回归 56/56：新增并发测试 10 项，既有删除/父子/身份/选择/列表刷新/转换/对话/智能命名 46 项。
- 原始重叠确认复现：暂停第二条删除，重复确认 20 次，仅一队列、一条成功提示，无 missing-session 误报；真实失败保持 1/3 部分成功并停止，重试正常。
- 真实 Store action、Workspace 回调与 ConfirmDialog JSX 均直接从生产文件执行，只注入数据/IPC/UI primitive 边界；覆盖同步取锁、单删/批删、新回调实例、失败释放、选择快照、父子实际覆盖、取消/Escape/遮罩及默认兼容。新增能力在生产 Workspace、列表三种删除入口和确认弹窗中使用。
- `npx tsc --noEmit` 与独立 `npm run check:architecture -- --strict` 通过；1305 个文件，0 超过 2000 行，0 新违规。
- `git diff --check` 通过。对基线 a960d018 的 src-tauri/apps/server/crates/package.json/package-lock.json 差异为空，未改后端、依赖、版本或数据库。
- 已逐项复核必要注释、临时执行状态不持久化、closeHistory/openHistory 不清除执行锁。未引入无入口抽象或未调用实现。

## 未覆盖及安全边界

- 不启动 CLI-Manager/Tauri、不安装、不删除用户真实历史；按项目规则，实机鼠标/Enter 连按、运行期间 Escape/遮罩、zh-CN/en-US 切换及安装后批量测试交由用户。
- 用户当次已捕获 toast 无日志，不能证明当次点击次数。已验证并修复可完整复现同一现象的并发缺陷；后续真实失败新增 history.delete.failed 诊断，只记模式、计数和错误，不记标题/转录。
- 锁作用于一个 WebView 的 feature Store；其他独立窗口或外部应用的真实并发仍按后台校验失败报告，不声称跨进程锁。
- 后台父子覆盖、备份/回滚及真实缺行报告未变；删除后下一条详情预览失败属于既有独立路径，本轮未变更。

## 提交与安装包

- 用户已确认一次提交本轮所有已识别改动后再构建 1.4.3 NSIS；不推送、不自动安装。构建结果待追加。

## 工具降级

GitNexus 与仓库引用的 Trellis skills 不在本环境，按 workflow、history/state/comment/architecture 契约、真实源码/diff 与 codebase-memory 主会话完成，保持 inline 模式。图谱未收录 JSX 调用边，实际 rg 核对 ConfirmDialog 的 22 个使用文件；默认 pending=false 保留行为。memory 的 staged 差异检测并不可靠，实际 staged diff/测试为最终证据。
