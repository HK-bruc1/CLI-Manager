# 根因、触点与实现边界

根因：Codex 将 profile 会话的新信任决定写回 profile 文件，而应用把它当纯供应商生成物覆盖；状态检查又只读全局。必须修复真实写入和有效配置投影，不能自动信任或强改颜色。

## 触点与风险

- providers scope::prepare → write_codex_profile、runtime::write_codex_profile_to_dir → 共享同名 profile 状态保留写入；后者接入远程托管启动。仅保留当前文件已有 hooks.state，不能恢复供应商原文中的信任。
- hooks settings::build_codex_status 与 11 个状态/变更命令：可选 profile 参数向后兼容；全局加指定 profile 合并后检查；查询只读。
- SidebarFooter、HookSettingsPage：当前本机 Codex profile 上下文、请求时序、失效结果和可见窗口低频刷新；显示有效路径和待审核原因，不重装代替确认。
- CLI 参数 tokenizer 与 terminal 窄公共 API：解析真实启动 profile，覆盖分离/等号/短参数、引号、resume、提示词和 -- 边界。
- shared dialog、PTY/daemon、模型网络、后端历史、全局配置应用、数据库：确认不需修改。
- 项目扩展 profile：新 snapshot 文件不是同名覆盖；不改变隔离生命周期，也不把一个 profile 的确认推广到新 profile。检测读实际项目 profile 名而不是供应商 fallback。

GitNexus 未暴露，降级为契约、codebase-memory 和源码。影响图将 scope::prepare 及多个 Hook 状态入口标 CRITICAL，已告知用户；图漏检的 JSX/跨模块边必须以 rg 和执行测试复核。遵守仓库 inline 模式。

## 验证矩阵

- 全局确认/profile 补充、覆盖、禁用、过期、不同 profile 隔离和切回全局。
- 同名重建/切供应商再切回、写前外部变化、损坏文件、写失败；供应商配置不能注入信任。
- 同窗口/分屏焦点、无终端、Claude/SSH/WSL、普通新建/resume/重连；实际命令配置优先。
- 状态检查/变更返回/可见刷新/切终端竞态；中英文提示和路径。

不启动应用或 Codex 推理，不操作真实 Hook 安装/信任或用户历史。自动化使用临时目录和真实函数；人工视觉、真实 WSL/SSH、安装验收明确留给用户。
