---
description: 'Surge 的 Agent Skill 安装、代理端口，以及 surge-cli 常用命令。'
---

# Surge

Surge 是 macOS / iOS 上的网络代理与规则引擎。本页介绍如何安装内置的 Agent Skill、Surge 的代理端口，以及用 `surge-cli` 查看状态和切换策略。

## 安装 {#installation}

Surge 自带 `surge-cli` 和 Agent Skill，无需另外下载。

### 安装 Agent Skill {#install-the-agent-skill}

Surge 在应用 Bundle 内自带 Agent Skill，路径：

`/Applications/Surge.app/Contents/Resources/Skills/surge`

Skill 内容放在 `~/.agents/skills`，`~/.claude/skills` 里放指向它的符号链接，与通过 Skills CLI 安装的其他 skill 布局相同，Claude Code 从 `~/.claude/skills` 加载。链接到 Bundle 而不是复制，skill 会随 Surge 一起更新。

1. 把 Bundle 里的 Skill 链接到 `~/.agents/skills`，再链接到 `~/.claude/skills`：

   ```sh
   ln -sfn "/Applications/Surge.app/Contents/Resources/Skills/surge" "$HOME/.agents/skills/surge"
   ln -sfn "../../.agents/skills/surge" "$HOME/.claude/skills/surge"
   ```

2. 验证链接生效：

   ```sh
   test -f "$HOME/.claude/skills/surge/SKILL.md" && echo "Surge skill OK"
   ```

   输出 `Surge skill OK` 即安装成功。

3. 可选：如果使用 `~/.cursor/skills`，同样链接一份：

   ```sh
   ln -sfn "../../.agents/skills/surge" "$HOME/.cursor/skills/surge"
   ```

说明：

- 无需写入 `~/.agents/.skill-lock.json`。该文件只记录 `npx skills add` 从 GitHub 安装的 skill。
- Cursor 会从 `~/.claude/skills` 加载与 Claude Code 相同的个人 skill。

## 配置 {#configuration}

Surge 本地代理的监听端口如下。

### 代理端口 {#proxy-port}

Surge 默认的 HTTP 代理端口是 **6152**，SOCKS5 是 **6153**。终端的代理环境变量和 SSH 的 `ProxyCommand` 都指向这两个端口。

## 使用 {#usage}

用 `surge-cli` 查看 Surge 状态、修改运行时设置。

### 找到 surge-cli {#locate-surge-cli}

按以下优先级查找可执行文件：

1. `PATH` 中的 `surge-cli`
2. `/Applications/Surge.app/Contents/Applications/surge-cli`

需要机器可读输出时加 `--raw`，输出 JSON。操作远程 Surge 实例时，追加 `--remote password@host:port`。

### 查看状态 {#inspect-state}

查看运行环境：

```sh
surge-cli --raw environment
```

导出策略与配置快照：

```sh
surge-cli --raw dump policy
surge-cli --raw dump profile
```

### 修改运行时设置 {#change-runtime-settings}

修改前先导出快照，修改后确认结果：

1. 导出当前策略与配置，命令见[查看状态](#inspect-state)。
2. 修改运行时项：

   ```sh
   surge-cli --raw set ProxyMode=2
   surge-cli --raw set ProxyGroupSelection.Proxy=HK
   surge-cli --raw set AutoPolicyGroupOverride.Streaming=<nil>
   ```

3. 用 `surge-cli --raw environment` 确认改动已生效。
