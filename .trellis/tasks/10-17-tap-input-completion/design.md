# 设计与根因分诊

## 根因陈述

本次为跨边界和状态相关的根因修复，沿用已授权的 V1.4.5 任务：

1. Tap 消费设备能力时把 file.list/file.search 操作名当成能力名，主机/服务器实际约定 file.management；修复应位于消费方，重启无法修正错误名称。
2. 旧 / 菜单来自应用静态目录，不包含当前 CLI 加载的 skills，且发送后切到终端页。PTY 转录不包含可重建原生菜单的可靠结构化信息，因此在 chat 内复用真实终端呈现与交互，直接使用 CLI 自己的菜单，不从全局 skills 库推测会话激活情况。
3. 关闭和选中状态按输入文本记忆，重新输入相同内容会复用旧状态；交互身份增加单调版本，覆盖关闭、选中、结果和旧回调，而非只在显示处加兜底。

## 发现清单与代码触点

- [x] Composer：文件候选、光标/IME/草稿；有效命令前缀转交原生面板，拒绝交付保留草稿。
- [x] completion / useComposerCompletion / ComposerCompletion：相对路径、实际能力名、独立交互身份、有界列表、串行请求与旧回调隔离。
- [x] SessionView：注册上下文、同一 Terminal 挂载、chat 内原生面板、按键、焦点、返回与迟到交付隔离。
- [x] Terminal：command 只输入有界前缀，不附加回车；渲染器/连接/活跃状态校验；桌面网格过大时滚动定位提示行。
- [x] i18n / completion.css / styles.css：双语说明、主题与窄屏布局；viewport 在既有统一管理处发布可见高度。
- [x] 生产逻辑回归：completion、composerCompletion、completionSession、nativeCommand。
- [x] 主机 executeFile、server operation_capability、设备与 daemon default_capabilities：核实 file.management，确认无需修改。
- [x] extensions inventory、agent capabilities：核实发现不等同会话激活，确认无需引入扫描/新接口。
- [x] shared/builtinAiCommands、Classic、Rust、ACP、Hook、桌面窗口/进程生命周期：确认无需修改。

## 图分析

CLI-Manager 索引更新至 63bae0f9 及当前工作区。FTS 缺少运行库，概念 query 无结果，精确 context/impact 可用，并结合契约核对跨语言边界。

useComposerCompletion、completionToken、commandItems（已移除）、ComposerCompletion 为 LOW，直接或间接经 Composer 到 SessionView；Composer、Terminal 的直接调用方都是 SessionView，LOW。SessionView 的 lazy import 未被图完整识别，UNKNOWN，已定向核对 App 入口。不能把缺失边解释为无影响。

viewport.paintViewport 影响分析为 HIGH，7 个上游符号，直接 overlayHost/startViewport/useViewportBox；编辑前已向用户说明，仅在既有根元素增加可见高度变量，原上移策略有回归。

## 交互边界

- / 前缀只允许有界字母、数字、下划线、连字符和插件命名空间冒号。光标末尾折叠、活跃 Codex/Claude chat、非 IME 且未发送时才转交；带参数、路径或控制字符的粘贴保留为本地草稿。
- 原生面板不是网页重建的 MCP 设置界面，不承诺鼠标点击 CLI 的文本菜单；使用键盘与网页按键操作，内容取决于当前 CLI 版本及加载状态。
- 返回不发送清空或取消键；先在 CLI 中完成/取消并清空未发送内容。失败不自动重试，不从接收成功推断命令执行成功。
- @ 使用注册 projectId/worktreeId 与相对路径；不展示 .git 文件或目录，不读取正文。候选最多 80 项，一次一个在途请求，等待旧请求结束后只执行最新查询。
- 面板不创建另一份终端；不改权限/协议/进程，不持久化临时视图，不改变桌面拥有的网格。

## 场景矩阵

| 维度 | 处理 |
| --- | --- |
| Claude / Codex / 其他 | 前两者原生菜单与文件补全；其他保持普通草稿 |
| 本机 / WSL / Worktree | 原生菜单使用现有 PTY；文件根由主机注册 ID 解析；缺失目录显示读取失败 |
| Hook 有 / 无 | 补全不依赖 Hook；对话绑定仍走现有路径 |
| 窗口焦点 / 分屏 / 最小化 / 托盘 | 不操作桌面窗口，只使用所选 PTY；失活网页会话禁止交接 |
| 多会话 / Workspan / 切账号设备 | 原草稿 key 与新交互身份隔离，旧回执/回调不能抢焦点 |
| 手机 / 桌面 / 侧栏 / focus mode | 文件列表按可见高度收缩；原生面板提供键盘/按键和网格滚动 |
| 重复 / 或 @ / Esc 后重输 | 新交互不继承关闭状态或选中项；原生面板可反复打开 |
| IME / 光标中间 / 选区 / 空格中文路径 | 不把选字当命令交接；文件替换保留前后草稿 |
| 离线 / 缺能力 / 渲染失败 / 慢响应 | 保留草稿、显式错误/重试、单请求和过期隔离 |
| 中英文 / 深浅主题 | 使用 Tap 字典及主题变量；原时间规则仍为 24 小时制 |

## 验证边界

自动检查与用户验收记录见 verification.md。遵守 quality-guidelines，不启动 CLI-Manager 服务或 Tauri 做 UI 验证。
