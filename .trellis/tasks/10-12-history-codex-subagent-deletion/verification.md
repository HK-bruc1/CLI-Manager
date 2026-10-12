# 验证记录

## 已通过

- 定向前端策略/实际 Store action/转换/列表刷新/父子展示/身份/选择回归：36/36，包括搜索命中未在当前分页的实际路径清理。
- `cargo test --lib commands::history::`：205/205，其中 12 项新增 Codex 删除测试；真实 Windows 锁定父文件后子日志字节完整回滚、Windows junction 不跟随、header 边界均通过。
- `cargo check`、`npx tsc --noEmit` 与 `npm run check:architecture -- --strict`：通过；1300 文件，零超长/新违规。
- 新增文件 rustfmt 定向格式检查；现有大模块未进行无关全文件格式化。

## 待完成

- 提交后构建 1.4.3 NSIS，核对 SHA256/时间/大小。

## 提交前复核

- `git diff --check` 通过。memory 刷新后 ready（43839 节点/117816 边），抽查新删除入口与收集器均已索引。
- `detect_changes(scope=all)` 仅列出预期 history/翻译/文档改动，但未报告符号影响且初次不含未暂存新文件；以实际 staged diff、源码调用与编译/定向测试复核，不以空影响结果宣称无风险。
- 未引入依赖/数据库迁移/终端、Web、Hook、供应商或备份格式改变；新实现模块 256 行左右，责任仅为 Codex 关系删除。

## 边界

- 所有删除/备份/链接测试均为系统临时目录中的自建数据；未删除用户真实会话、未启动应用或安装器。
- 未进行 WSL guest 和桌面实际点击/切换语言验收；前端测试执行真实共用函数/Store action，并核对中英错误及确认文案。WSL 使用 guest find 的已有边界，安装后人工验证。
- 保留项目既有源级恢复锁和备份恢复协议。删除历史不关闭运行中的终端；无 source-wide process 阻断。
- 分支从 dc899267 新建，包含上一轮迁移修复，未同步/推送远程。

## 工具降级

GitNexus 工具与对应本地 skill 不存在；使用 history 前后端契约、codebase-memory 和真实源码/diff。memory 已刷新，直接调用风险标为 CRITICAL；generic 同名误连只作线索，真实引用为准。首轮前端旧测试回调返回 Array.push 的数字，更新为契约要求的 void；产品没有增加猜测返回值兜底。
