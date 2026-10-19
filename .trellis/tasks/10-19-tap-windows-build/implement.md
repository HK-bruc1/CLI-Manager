# 实施与验证

- [x] 原样移动组件，更新唯一生产导入和三处测试引用。
- [x] 核对移动文件内容哈希、旧导入残留及实际 Git diff。
- [x] 执行 Tap 类型检查、Tap 全部测试及独立 strict architecture。
- [x] 更新 1.4.4 CHANGELOG 与 Tap 功能清单，记录已知上游 Unicode 风险。
- [x] 提交前执行可用的 detect_changes 并复核 staged diff；只提交本轮文件。工具返回空变更与实际 Git 不符，已按真实 staged diff 核对。
- [ ] 复用缓存执行 `npm run tauri:build:local -- --bundles nsis`。
- [ ] 核对 NSIS 产物路径、版本、时间、大小和 SHA256，更新验证记录。

用户已批准本轮有界修复与提交后打包；不合入其他修复，不推送远程，不启动或安装应用。
