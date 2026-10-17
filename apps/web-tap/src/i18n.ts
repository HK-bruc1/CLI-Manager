export type Language = "zh-CN" | "en-US";
const zh = {
  // Sign-in, devices and authorization
  app: "Tap 工作台", authorize: "授权此浏览器", authorizeHint: "确认使用这次手机授权连接对应的执行设备。", confirm: "确认连接",
  username: "用户名", password: "密码", login: "登录", loginHint: "连接 CLI-Manager，继续项目里的原生 CLI 会话。",
  loginError: "登录失败，请检查账户或连接后重试。", authExpired: "登录已过期，请重新登录。", classic: "经典 Web", logout: "退出登录",
  device: "执行设备", chooseDevice: "切换执行设备", noDevices: "还没有执行设备", pairHint: "在桌面设置中开启 Web 连接，输入配对码。",
  pair: "配对设备", code: "配对码", deviceOffline: "执行设备离线。请在主机启动 CLI-Manager 并连接 Web 服务。",
  linkOnline: "已连接", linkConnecting: "连接中", linkLost: "连接中断", reconnect: "重新连接", reconnectNow: "立即重连",
  // Navigation and sessions
  sessions: "会话", openSessions: "打开会话导航", closeSessions: "关闭会话导航", searchSessions: "搜索项目或会话…",
  noMatches: "没有匹配的项目或会话", noProjects: "还没有项目，请先在桌面添加。", noSessions: "还没有打开的会话", emptyGroup: "分组内暂无项目",
  newSession: "新建会话", source: "启动项目配置的 CLI", unsupportedProject: "这个项目暂不支持 Web 原生终端。",
  workspace: "工作台", sessionCount: "{n} 个会话", pickSession: "选择一个会话", startSession: "从一个会话开始",
  pickHint: "从会话导航打开正在运行的 CLI，或新建一个。", startHint: "选择项目，启动它配置的 CLI。", viewSessions: "查看会话",
  statusRunning: "运行中", statusConnecting: "连接中…", statusEnded: "已结束", statusOffline: "设备离线",
  // Session header and menus
  view: "显示方式", chat: "对话", terminal: "终端", more: "更多操作", settings: "设置",
  openPanel: "打开右侧栏（详情、改动、文件）", closePanel: "收起右侧栏", fontSize: "终端字号", chatSize: "对话字号",
  smaller: "缩小", larger: "放大", endSession: "结束会话…", endTitle: "结束 CLI 进程？",
  endBody: "进程会立即终止，CLI 自己的历史记录保留。只是关闭页面不会结束会话。", endConfirm: "结束进程", cancel: "取消", close: "关闭",
  // Composer and keys
  input: "会话输入", nextStep: "给 {agent} 的下一步…", desktopHint: "（回车发送 · Shift+回车换行）", commandHint: "输入命令…",
  blockedConnecting: "正在连接…", blockedEnded: "会话已结束", blockedOffline: "执行设备离线",
  send: "发送", sending: "正在发送…", add: "添加", uploadImage: "上传图片", direct: "直接键入", directStop: "结束直接键入",
  interrupt: "中断", keys: "终端按键", showKeys: "显示终端按键", showKeysHint: "终端视图里，在输入框上方显示 Esc、方向键等按键",
  escape: "Esc", up: "上", down: "下", left: "左", right: "右", ctrl: "Ctrl 修饰键", alt: "Alt 修饰键", enter: "回车",
  tab: "Tab", shiftTab: "Shift+Tab", pageup: "Page Up", pagedown: "Page Down", slash: "斜杠",
  sendFailed: "连接已断开，草稿已保留。请重连后查看会话，再决定是否发送。",
  unknownDelivery: "发送状态未知。请查看 CLI 后再决定是否重发。",
  multiline_paste_unavailable: "CLI 尚未启用多行粘贴，请切到终端直接键入。", imageFailed: "图片没有传上去，请重试。",
  // Terminal
  readingView: "阅读版", nativeView: "原生画面", nativeHint: "切回按桌面宽度显示的原生画面，可操作 CLI 菜单", readingHint: "桌面的终端比这里宽，先按纯文本排版；切到原生画面可操作 CLI 菜单",
  desktopSize: "由桌面决定", browserSize: "跟随此浏览器", jumpBottom: "回到底部", unavailable: "终端暂时不可用",
  // Conversation
  older: "读取更早的对话", loading: "正在读取…", copy: "复制", copied: "已复制", truncated: "内容过长，此处仅显示一部分。",
  chatEmpty: "发出第一条消息，CLI 的回复会显示在这里。", jumpLatest: "回到最新", workedFor: "工作了 {time}",
  interimReplies: "{n} 条过程回复", expand: "展开", collapse: "收起", openTerminal: "查看终端",
  unbound: "还没对上这次 CLI 的对话记录。可以先在终端里继续；主机确认会话后，对话会显示在这里。",
  missing: "这次会话的记录暂时读不到，可以在终端里继续。", unsupported: "这个 CLI 暂不提供对话视图。",
  noChat: "主机还没提供这个版本的对话读取能力。",
  // Side panel
  details: "详情", changes: "改动", files: "文件", refresh: "刷新", back: "返回", readOnly: "只读",
  cleanTree: "工作区干净", filesChanged: "{n} 个文件", notRepo: "这个目录不是 Git 仓库", noFiles: "这个目录是空的",
  project: "项目", pathLabel: "项目路径", branch: "分支", worktree: "工作树", cli: "CLI", size: "终端尺寸",
  status: "状态", sessionId: "会话 ID", copyValue: "复制", environment: "环境", local: "本机",
  // Settings
  theme: "外观", light: "浅色", dark: "深色", system: "跟随系统", language: "语言", display: "显示", account: "账户",
  // Generic
  error: "操作失败", retry: "重试", ended: "已结束",
};
export type TextKey = keyof typeof zh;
const en: Record<TextKey, string> = {
  app: "Tap workspace", authorize: "Authorize this browser", authorizeHint: "Confirm this mobile authorization to connect to its execution device.",
  confirm: "Connect", username: "Username", password: "Password", login: "Sign in",
  loginHint: "Connect to CLI-Manager and continue your project's native CLI sessions.",
  loginError: "Sign-in failed. Check your account and connection, then retry.", authExpired: "Your login expired. Sign in again.",
  classic: "Classic Web", logout: "Sign out", device: "Execution device", chooseDevice: "Switch execution device",
  noDevices: "No execution devices yet", pairHint: "Enable Web connection in desktop settings and enter the pairing code.",
  pair: "Pair device", code: "Pairing code", deviceOffline: "Execution device is offline. Start CLI-Manager on the host and connect it to the Web service.",
  linkOnline: "Connected", linkConnecting: "Connecting", linkLost: "Disconnected", reconnect: "Reconnect", reconnectNow: "Reconnect now",
  sessions: "Sessions", openSessions: "Open session navigation", closeSessions: "Close session navigation", searchSessions: "Search projects or sessions…",
  noMatches: "No matching projects or sessions", noProjects: "No projects yet. Add one on the desktop first.", noSessions: "No open sessions", emptyGroup: "No projects in this group",
  newSession: "New session", source: "Start the CLI configured for a project", unsupportedProject: "This project does not support Web native terminals yet.",
  workspace: "Workspace", sessionCount: "{n} sessions", pickSession: "Pick a session", startSession: "Start a session",
  pickHint: "Open a running CLI from session navigation, or start a new one.", startHint: "Choose a project to start its configured CLI.",
  viewSessions: "View sessions", statusRunning: "Running", statusConnecting: "Connecting…", statusEnded: "Ended", statusOffline: "Device offline",
  view: "View", chat: "Conversation", terminal: "Terminal", more: "More actions", settings: "Settings",
  openPanel: "Open side panel (details, changes, files)", closePanel: "Close side panel", fontSize: "Terminal font size",
  chatSize: "Conversation text size", smaller: "Smaller", larger: "Larger", endSession: "End session…", endTitle: "End the CLI process?",
  endBody: "The process stops immediately. The CLI's own history is kept. Closing this page never ends a session.",
  endConfirm: "End process", cancel: "Cancel", close: "Close",
  input: "Session input", nextStep: "Next step for {agent}…", desktopHint: " (Enter to send · Shift+Enter for a new line)",
  commandHint: "Enter a command…", blockedConnecting: "Connecting…", blockedEnded: "Session ended", blockedOffline: "Execution device offline",
  send: "Send", sending: "Sending…", add: "Add", uploadImage: "Upload image", direct: "Type directly", directStop: "Stop typing directly",
  interrupt: "Interrupt", keys: "Terminal keys", showKeys: "Show terminal keys", showKeysHint: "Show Esc, arrows and other keys above the input in terminal view",
  escape: "Esc", up: "Up", down: "Down", left: "Left", right: "Right", ctrl: "Ctrl modifier", alt: "Alt modifier", enter: "Enter",
  tab: "Tab", shiftTab: "Shift+Tab", pageup: "Page Up", pagedown: "Page Down", slash: "Slash",
  sendFailed: "Disconnected. Your draft is kept. Reconnect and check the session before deciding to send.",
  unknownDelivery: "Delivery is uncertain. Check the CLI before deciding whether to resend.",
  multiline_paste_unavailable: "This CLI has not enabled multiline paste. Type directly in the terminal instead.",
  imageFailed: "The image was not uploaded. Try again.",
  readingView: "Reading view", nativeView: "Native screen",
  nativeHint: "Show the native screen at the desktop width to operate CLI menus",
  readingHint: "The desktop terminal is wider than this screen, so text is reflowed; switch to the native screen to operate CLI menus",
  desktopSize: "Set by desktop", browserSize: "Follows this browser", jumpBottom: "Scroll to bottom", unavailable: "Terminal unavailable",
  older: "Load earlier messages", loading: "Loading…", copy: "Copy", copied: "Copied", truncated: "This content is long; only part is shown here.",
  chatEmpty: "Send your first message. The CLI's replies will appear here.", jumpLatest: "Jump to latest", workedFor: "Worked {time}",
  interimReplies: "{n} interim replies", expand: "Show more", collapse: "Show less", openTerminal: "Open terminal",
  unbound: "This CLI's conversation has not been matched yet. Keep going in the terminal; messages appear here once the host confirms the session.",
  missing: "This session's messages are temporarily unavailable. Continue in the terminal.",
  unsupported: "This CLI does not provide a conversation view yet.", noChat: "The host does not provide conversation reading in this version yet.",
  details: "Details", changes: "Changes", files: "Files", refresh: "Refresh", back: "Back", readOnly: "Read only",
  cleanTree: "Working tree clean", filesChanged: "{n} files", notRepo: "This folder is not a Git repository", noFiles: "This folder is empty",
  project: "Project", pathLabel: "Project path", branch: "Branch", worktree: "Worktree", cli: "CLI", size: "Terminal size",
  status: "Status", sessionId: "Session ID", copyValue: "Copy", environment: "Environment", local: "Local",
  theme: "Appearance", light: "Light", dark: "Dark", system: "System", language: "Language", display: "Display", account: "Account",
  error: "Operation failed", retry: "Retry", ended: "Ended",
};
/** App-scoped translations never import desktop settings or classic UI state. */
export const translator = (language: Language) => (key: TextKey) => (language === "en-US" ? en : zh)[key];
export type Translate = ReturnType<typeof translator>;
/** Fill `{name}` placeholders in a translated string. */
export const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ""));
