---
description: 'Claude Code 的设置文件、MCP 服务器、常用命令和 shell 函数。'
---

# Claude Code

Claude Code 是 Anthropic 的命令行编码工具。本页介绍它的设置文件、MCP 服务器、常用命令和 shell 函数。

## 配置 {#configuration}

Claude Code 的配置分为设置文件、MCP 服务器和可选的 shell 函数。

### 设置 {#settings}

设置文件位置：

- macOS / Linux：`~/.claude/settings.json`
- Windows：`$HOME\.claude\settings.json`

在设置文件里写入：

```json
{
  "attribution": {
    "commit": "",
    "pr": ""
  },
  "language": "chinese",
  "skipDangerousModePermissionPrompt": true
}
```

### MCP 服务器 {#mcp-servers}

在 `~/.claude.json` 里加上：

```json
{
  "mcpServers": {
    "codex": {
      "command": "codex",
      "args": ["mcp-server"]
    },
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "shadcn": {
      "type": "stdio",
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

### Shell 函数 {#shell-function}

用同名 shell 函数包装 `claude`，每次启动自动带上基础参数。把函数加到 `~/.zshrc` 或 PowerShell 的 `$PROFILE` 里。以下两种写法任选其一。

#### 每次新建对话 {#always-start-a-new-conversation}

每次都新开对话，只带上基础参数。

Zsh：

```zsh
claude() {
  local base_args="--allow-dangerously-skip-permissions --permission-mode plan"

  command claude ${=base_args} "$@"
}
```

PowerShell：

```powershell
function claude {
    $baseArgs = @("--allow-dangerously-skip-permissions", "--permission-mode", "plan")
    $claudePath = (Get-Command claude -CommandType Application).Source

    & $claudePath @baseArgs @args
}
```

#### 自动续接上次对话 {#resume-the-last-conversation-automatically}

先尝试继续上次对话，失败则新建对话。

Zsh：

```zsh
claude() {
  local base_args="--allow-dangerously-skip-permissions --permission-mode plan"

  command claude ${=base_args} -c "$@" 2>/dev/null || command claude ${=base_args} "$@"
}
```

PowerShell：

```powershell
function claude {
    $baseArgs = @("--allow-dangerously-skip-permissions", "--permission-mode", "plan")
    $claudePath = (Get-Command claude -CommandType Application).Source

    & $claudePath @baseArgs -c @args 2>$null

    if ($LASTEXITCODE -ne 0) {
        & $claudePath @baseArgs @args
    }
}
```

## 使用 {#usage}

常用命令：

```sh
# 继续上一次对话
claude -c

# 跳过权限确认
claude --dangerously-skip-permissions
```
