use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use toml_edit::{DocumentMut, Item, Table};

// 只读取本次同名普通文件；不沿 profile 符号链接覆盖用户其他配置。
fn read_profile(path: &Path) -> Result<Option<Vec<u8>>, String> {
    match fs::symlink_metadata(path) {
        Ok(metadata) if metadata.is_file() && !metadata.file_type().is_symlink() => fs::read(path)
            .map(Some)
            .map_err(|err| format!("codex_profile_read_failed: {err}")),
        Ok(_) => Err("codex_profile_not_regular_file".to_string()),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(err) => Err(format!("codex_profile_read_failed: {err}")),
    }
}

// 供应商不能提供信任；仅原样保留同一文件已有的 hooks.state，包括禁用和过期记录。
fn profile_with_saved_state(generated: &str, previous: Option<&[u8]>) -> Result<Vec<u8>, String> {
    let mut document = generated
        .parse::<DocumentMut>()
        .map_err(|err| format!("codex_profile_invalid: {err}"))?;
    if let Some(hooks) = document.get_mut("hooks") {
        hooks
            .as_table_like_mut()
            .ok_or("codex_profile_invalid_hooks")?
            .remove("state");
    }
    if let Some(previous) = previous {
        let text = std::str::from_utf8(previous).map_err(|_| "codex_profile_invalid_utf8")?;
        let previous = text
            .parse::<DocumentMut>()
            .map_err(|err| format!("codex_profile_existing_invalid: {err}"))?;
        if let Some(state) = previous.get("hooks").and_then(|hooks| hooks.get("state")) {
            if state.as_table_like().is_none() {
                return Err("codex_profile_existing_invalid_state".to_string());
            }
            if document.get("hooks").is_none() {
                document.insert("hooks", Item::Table(Table::new()));
            }
            document
                .get_mut("hooks")
                .and_then(Item::as_table_like_mut)
                .ok_or("codex_profile_invalid_hooks")?
                .insert("state", state.clone());
        }
    }
    Ok(document.to_string().into_bytes())
}

// 替换前重新核对源字节；发现其他写入者的新决定时拒绝覆盖，不声称跨进程 CAS。
fn replace_unchanged(path: &Path, staged: &Path, previous: Option<&[u8]>) -> Result<(), String> {
    if read_profile(path)?.as_deref() != previous {
        return Err("codex_profile_changed_during_write".to_string());
    }
    fs::rename(staged, path).map_err(|err| format!("codex_profile_replace_failed: {err}"))
}

// 生成配置先写同目录临时文件，再替换；任何解析/写入失败不截断原 profile。
pub(crate) fn write_preserving_hook_state(path: &Path, generated: &str) -> Result<(), String> {
    let previous = read_profile(path)?;
    let content = profile_with_saved_state(generated, previous.as_deref())?;
    let parent = path.parent().ok_or("codex_profile_parent_missing")?;
    fs::create_dir_all(parent).map_err(|err| format!("codex_profile_directory_failed: {err}"))?;
    let name = path
        .file_name()
        .ok_or("codex_profile_name_missing")?
        .to_string_lossy();
    let staged = parent.join(format!(".{name}.{}.tmp", uuid::Uuid::new_v4()));
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&staged)
        .map_err(|err| format!("codex_profile_stage_failed: {err}"))?;
    let outcome = (|| {
        file.write_all(&content)
            .and_then(|_| file.sync_all())
            .map_err(|err| format!("codex_profile_write_failed: {err}"))?;
        drop(file);
        replace_unchanged(path, &staged, previous.as_deref())
    })();
    if outcome.is_err() {
        let _ = fs::remove_file(&staged);
    }
    outcome
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    // 远程托管的真实入口必须与普通启动共用状态保留写入，不只是测试私有合并函数。

    #[test]
    fn runtime_writer_preserves_codex_saved_trust_when_regenerating() {
        let dir = TempDir::new().unwrap();
        let profile = crate::provider::runtime::CodexProviderProfile {
            profile_name: "managed".into(),
            model_provider: "provider".into(),
            profile_text: "model='updated'\n".into(),
        };
        let path = dir.path().join("managed.config.toml");
        fs::write(&path, "[hooks.state.saved]\ntrusted_hash='confirmed'\n").unwrap();
        crate::provider::runtime::write_codex_profile_to_dir(dir.path(), &profile).unwrap();
        let actual: toml::Value = toml::from_str(&fs::read_to_string(path).unwrap()).unwrap();
        assert_eq!(actual["model"].as_str(), Some("updated"));
        assert_eq!(
            actual["hooks"]["state"]["saved"]["trusted_hash"].as_str(),
            Some("confirmed")
        );
    }

    // 模拟 Codex 在同名 profile 写入确认后，后续供应商重建仍保留，且模型更新生效。

    #[test]
    fn rebuilding_same_profile_preserves_saved_decisions_without_importing_supplier_state() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("managed.config.toml");
        let generated = "model='new'\n[hooks.state.supplied]\ntrusted_hash='must-not-import'\n";
        write_preserving_hook_state(&path, generated).unwrap();
        assert!(!fs::read_to_string(&path)
            .unwrap()
            .contains("must-not-import"));
        fs::write(&path, "model='old'\n[hooks.state.confirmed]\ntrusted_hash='saved'\n[hooks.state.disabled]\nenabled=false\ntrusted_hash='stale'\n").unwrap();
        for _ in 0..3 {
            write_preserving_hook_state(&path, generated).unwrap();
            let actual: toml::Value = toml::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
            assert_eq!(actual["model"].as_str(), Some("new"));
            assert_eq!(
                actual["hooks"]["state"]["confirmed"]["trusted_hash"].as_str(),
                Some("saved")
            );
            assert_eq!(
                actual["hooks"]["state"]["disabled"]["enabled"].as_bool(),
                Some(false)
            );
            assert_eq!(
                actual["hooks"]["state"]["disabled"]["trusted_hash"].as_str(),
                Some("stale")
            );
            assert!(actual["hooks"]["state"].get("supplied").is_none());
        }
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 1);
    }

    // 不同 profile 不共享决定；全局配置和旧文件中的非 state 选项不被复制。

    #[test]
    fn decisions_stay_in_their_original_profile() {
        let dir = TempDir::new().unwrap();
        let first = dir.path().join("one.config.toml");
        let second = dir.path().join("two.config.toml");
        let home = dir.path().join("config.toml");
        fs::write(&home, "[hooks.state.global]\ntrusted_hash='global'\n").unwrap();
        fs::write(
            &first,
            "[hooks.state.local]\nenabled=false\n[notice]\nkey='old'\n",
        )
        .unwrap();
        write_preserving_hook_state(&first, "model='first'\n").unwrap();
        write_preserving_hook_state(&second, "model='second'\n").unwrap();
        assert!(!fs::read_to_string(&first).unwrap().contains("notice"));
        assert!(!fs::read_to_string(&second).unwrap().contains("hooks"));
        assert_eq!(
            fs::read_to_string(&home).unwrap(),
            "[hooks.state.global]\ntrusted_hash='global'\n"
        );
    }

    // 损坏旧配置或非法新配置都应报错而不丢失原字节。

    #[test]
    fn invalid_input_never_overwrites_existing_profile() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("managed.config.toml");
        for old in ["not valid toml", "[hooks]\nstate=1\n"] {
            fs::write(&path, old).unwrap();
            assert!(write_preserving_hook_state(&path, "model='new'\n").is_err());
            assert_eq!(fs::read_to_string(&path).unwrap(), old);
        }
        fs::write(&path, "model='old'\n").unwrap();
        assert!(write_preserving_hook_state(&path, "invalid!").is_err());
        assert_eq!(fs::read_to_string(&path).unwrap(), "model='old'\n");
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 1);
    }

    // 在替换前出现新的确认、禁用或文件创建时，保护其他写入者而不是覆盖。

    #[test]
    fn changed_source_is_preserved_and_reported() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("managed.config.toml");
        let staged = dir.path().join("stage.tmp");
        fs::write(&path, "new decision").unwrap();
        fs::write(&staged, "generated").unwrap();
        for previous in [None, Some(b"old decision".as_slice())] {
            assert_eq!(
                replace_unchanged(&path, &staged, previous).unwrap_err(),
                "codex_profile_changed_during_write"
            );
            assert_eq!(fs::read_to_string(&path).unwrap(), "new decision");
        }
    }
}
