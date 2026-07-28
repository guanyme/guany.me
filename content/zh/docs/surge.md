# Surge

macOS / iOS 网络代理与规则引擎。日常可通过 `surge-cli` 查看状态、切换策略；Agent 可使用应用内置 Skill 做自动化运维。

## surge-cli {#surge-cli}

可执行文件路径（按优先级）：

1. `PATH` 中的 `surge-cli`
2. `/Applications/Surge.app/Contents/Applications/surge-cli`

机器可读输出建议加 `--raw`（JSON）。操作远程 Surge 实例时追加 `--remote password@host:port`。

## 常用命令 {#common-commands}

查看运行环境：

```sh
surge-cli --raw environment
```

导出策略与配置快照：

```sh
surge-cli --raw dump policy
surge-cli --raw dump profile
```

修改运行时项（改前先 dump，改后再查 `environment` 确认）：

```sh
surge-cli --raw set ProxyMode=2
surge-cli --raw set ProxyGroupSelection.Proxy=HK
surge-cli --raw set AutoPolicyGroupOverride.Streaming=<nil>
```

## Agent Skill {#agent-skill}

Surge 在应用 Bundle 内自带 Agent Skill，路径：

`/Applications/Surge.app/Contents/Resources/Skills/surge`

与 [Claude Code](./claude-code) 里其他通过 Skills CLI 安装的 skill 一样，本机采用 **`~/.agents/skills` 存内容、`~/.claude/skills` 做符号链接** 的布局。Surge 随 App 更新，因此应 **链接到 Bundle**，而不是复制一份到 home 目录。

```sh
ln -sfn "/Applications/Surge.app/Contents/Resources/Skills/surge" "$HOME/.agents/skills/surge"
ln -sfn "../../.agents/skills/surge" "$HOME/.claude/skills/surge"
```

校验：

```sh
test -f "$HOME/.claude/skills/surge/SKILL.md" && echo "Surge skill OK"
```

说明：

- 无需写入 `~/.agents/.skill-lock.json`；该文件只记录 `npx skills add` 从 GitHub 安装的 skill。
- Cursor 会从 `~/.claude/skills` 加载与 Claude Code 相同的个人 skill；若使用 `~/.cursor/skills`，可同样链接：`ln -sfn "../../.agents/skills/surge" "$HOME/.cursor/skills/surge"`。

## 代理端口 {#proxy-port}

本机其他工具（如 [macOS 配置代理](./macos#configure-proxy)、[WSL 配置代理](./wsl#configure-proxy)）常用 HTTP/SOCKS 端口 **7890**，需与 Surge「HTTP/SOCKS5 代理」监听端口一致。
