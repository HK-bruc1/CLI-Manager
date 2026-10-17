# 设计与分诊

## 续增：Codex / Claude 执行过程

根因在两处：Tap 导出仅保留 text；Codex response_item 的普通工具/输出/summary 被解析器过滤，Claude 纯工具或纯 thinking 消息也可能因缺少扁平文本被跳过。先补规范源解析，再扩展显式请求的结构化详情，不能仅在网页猜测终端文本。

发现清单：message_content 的 parse_message / extract_message_part_content；历史 scanner/message_stream/json_parsers/编辑校验/Diff 消息索引（共享解析，需回归）；历史派生缓存版本；terminalTranscriptPage / executeTerminalTranscript（精确绑定及有界 opt-in 导出）；共享 webBrowser DTO；Tap Conversation/groupTurns/独立过程卡/i18n/CSS。服务端透传既有 operation result，无新增路由；PTY 输入、ACP、权限执行、设备授权及 Classic conversation 协议不变。

GitNexus 绑定当前 CLI-Manager 工作区，索引 8f6f4960 与 HEAD 相同。terminalTranscriptPage 上游 3 个符号、groupTurns/TurnView 各 1 个、extract_message_part_content 2 个，均 LOW；Conversation 的 lazy import 及 parse_message 的 Rust 导入为 UNKNOWN，已定向引用确认入口和调用链。FTS 不可用；不能把零边当无影响。共享解析涉及历史/统计/Diff，人工按中高风险处理并运行历史回归。

设计：terminal.transcript 新增可选 includeDetails，未请求仍仅返回正文；详情只传允许的分块，稳定源 ID 和 call ID。每页最多 40 条源消息，并以 JSON UTF-8 字节预算缩短页、调整 start，保持连续分页。工具/思考全部折叠，接收输出不改变用户展开选择；工具结果不建立用户轮次，不把有输出等同于成功。纯文本旧主机降级可用。长内容截断明确标注；不读取本机真实日志内容作为测试数据。

## 根因

展示层将 `terminal.transcript` 能力同时作为读取条件与入口可见条件；不具备该能力的主机使聊天入口消失，用户只剩终端文本重排。设备列表仅登录时读取，WebSocket 重连忽略历史设备事件后没有补取能力快照。

续查「一直连接不到」：健康接口返回 ok；数据库只读清单同时存在 online 的 release（无 transcript）与 development（有 transcript）。用户打开的是新版网页，但仍选旧设备；两者同名而菜单缺少 channel/capability 标注。首轮刷新逻辑仅 map 已有列表，遗漏稍后启动/配对的开发版。修复该来源消费边界：按服务器授权清单补入新设备，同时持久保留当前认证的手机 deviceScope；不自动切会话。

现场只读证据：运行路径为 `D:/soft/CLI-Manager/cli-manager.exe` 和同目录 `cli-manager-web-daemon.exe`，二者二进制均不包含 `terminal.transcript` 字符串；仓库的两条原生能力声明已有该值。源码修改不能让旧安装版凭空提供记录，需后续更新配套桌面版本。

## 发现清单与影响

编辑前 GitNexus list_repos 返回空；SessionView、SessionHeader、useWorkspace、Conversation、Message 的 upstream impact 均返回无索引。按当时仓库规则，通过 web-service-contracts 与定向引用降级核查，中等风险。工作期间另一流程建立索引并更新 AGENTS/CLAUDE；之后补做 CLI 图分析，详见 verification.md，不将 UNKNOWN 当作无影响。

- [x] App → SessionView → SessionHeader：保留顶部视图切换，选择与主机能力解耦；默认值/偏好不改。
- [x] SessionView → Conversation → Message：旧主机提示、Markdown 代码块与阅读排版。
- [x] App → useWorkspace：WebSocket ready 后补取设备列表，包含新增授权设备；清理与更新代际拒绝迟到数据，保留明确的手机 deviceScope。
- [x] App → Sidebar：显示安装版/开发版和对话能力，操作仍使用设备 ID。
- [x] preferences/i18n/session.css：保持原有偏好键与终端默认值；双语区分对话与终端文本重排。
- [x] terminalTranscriptPage / executeTerminalTranscript：保留精确绑定、40 条源消息分页和正文 4000 UTF-16 截断；执行过程续增可选 includeDetails、独立详情预算与响应字节限制。
- [x] Rust 两条 default_capabilities / server capability 检查：源码已支持，本次不修改。
- [x] Composer / Terminal：沿用现有 PTY、输入与挂载；不新增发送路径。
- [x] Classic Web / 桌面窗口与分屏 / Hook 安装：不改实现。

## 场景矩阵

| 场景 | 行为 |
| --- | --- |
| 新/旧主机 | 都显示入口；旧主机显示升级与重连说明，不发送不支持的 operation |
| 能力升级后重连 | 获取新设备快照，当前对话自动按能力读取 |
| 断线、切设备/账号、迟到 401、设备推送与快照交错 | 旧请求不能覆盖新作用域；推送优先 |
| 手机/桌面、侧栏展开/收起、窄宽屏 | 固定可发现入口、正文限宽；长代码只在代码块内横向滚动 |
| 多会话、切 Workspan、分屏、焦点/最小化/托盘 | 浏览器沿用同一 PTY；隐藏会话不读消息，不影响桌面生命周期 |
| 本机/WSL、主仓库/Worktree、Hook 有/无 | 仅使用主机精确绑定；未绑定提示，不按 cwd/时间猜配 |
| SSH/其他 CLI | 既有 unsupported 提示与终端可用性保持 |
| 中英文、浅/深色、长回复、代码复制失败 | 本地化反馈、主题表面、正文/代码各自滚动与可选折叠 |

## 实现决策

复用现有 Conversation，而非从 ANSI 屏幕提取角色。SessionView 选择不再受 capability 强制覆盖；读取仍严格受 capability 限制。顶部按钮始终存在。Conversation 显示可操作的旧主机说明与浏览器重连入口。

代码块采用独立组件接收 react-markdown 的 code 节点，保留文本安全转义和链接策略；使用原生 React 状态完成复制/折叠。正文限宽、较大行距，代码保留空格与独立横向滚动。

ready 获取服务器授权的设备快照并合入新设备；手机授权继续过滤固定 deviceScope。每次 ready 递增本地请求版本，并记录请求期间发生更新的设备 ID。异步完成检查 disposed、请求版本和当前账号/设备/认证代际；收到较新推送的设备保持推送结果，其余设备接受快照。即使 React 尚未执行 effect 清理，旧设备响应也不能覆盖新作用域。设备菜单直接显示 clientKind 与 transcript 能力，不使用同名标签作操作身份。

Markdown 的代码块 renderer 使用稳定组件类型，通过局部翻译 Context 接收语言；终端输出触发消息刷新时不重新挂载代码块，保留用户折叠状态。

## 兼容与交付

不新增依赖、不改数据库结构或安装目录。执行过程通过兼容的可选字段扩展 transcript 协议，并升级派生缓存版本以重算解析结果。交付源码与 Web 构建；旧安装版需整体更新才能实际读到聊天记录。入口与样式可单独回退；执行过程涉及前端、主机导出和历史解析，需配套评估回退。
