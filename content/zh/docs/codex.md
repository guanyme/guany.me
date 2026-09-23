---
description: 'OpenAI Codex CLI 的全局指令、MCP 服务器、shell 函数和会话续接命令。'
---

# Codex

Codex 是 OpenAI 的命令行编码工具（Codex CLI）。本页介绍它的全局指令、MCP 服务器、shell 函数和常用命令。

## 配置 {#configuration}

Codex 的配置文件都在 `~/.codex` 目录下。

### 全局指令 {#global-instructions}

在 `~/.codex/AGENTS.md` 里写入：

```markdown
- Always respond in Chinese-simplified
```

### MCP 服务器 {#mcp-servers}

在 `~/.codex/config.toml` 里加上：

```toml
[mcp_servers.claude-code]
command = "claude"
args = ["mcp", "serve"]

[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
```

### Shell 函数 {#shell-function}

用同名 shell 函数包装 `codex`，每次启动自动带上基础参数。把函数加到 `~/.zshrc` 或 PowerShell 的 `$PROFILE` 里。以下两种写法任选其一。

#### 每次新建会话 {#always-start-a-new-session}

每次都新开会话，只带上基础参数。

Zsh：

```zsh
codex() {
  local base_args="--dangerously-bypass-approvals-and-sandbox"

  command codex ${=base_args} "$@"
}
```

PowerShell：

```powershell
function codex {
    $baseArgs = @("--dangerously-bypass-approvals-and-sandbox")
    $codexPath = (Get-Command codex -CommandType Application | Select-Object -First 1).Source

    & $codexPath @baseArgs @args
}
```

#### 自动续接当前目录的会话 {#resume-the-current-directorys-session-automatically}

先尝试继续当前目录最近的一次会话，失败则新建会话。

Zsh：

```zsh
codex() {
  local base_args="--dangerously-bypass-approvals-and-sandbox"

  command codex ${=base_args} resume --last "$@" 2>/dev/null || command codex ${=base_args} "$@"
}
```

PowerShell：

```powershell
function codex {
    $baseArgs = @("--dangerously-bypass-approvals-and-sandbox")
    $codexPath = (Get-Command codex -CommandType Application | Select-Object -First 1).Source

    & $codexPath @baseArgs resume --last @args 2>$null

    if ($LASTEXITCODE -ne 0) {
        & $codexPath @baseArgs @args
    }
}
```

## 使用 {#usage}

常用命令：

```sh
# 继续当前目录最近的一次交互会话
codex resume --last

# 完全跳过审批和 sandbox，风险极高
codex --dangerously-bypass-approvals-and-sandbox
```

`codex resume --last` 默认按当前工作目录过滤会话。在项目目录里执行它，会续接该目录最近的一次会话。Codex 不会在 `cd` 进入目录时自动续接。需要“先续接，失败再新开”时，用 [shell 函数](#shell-function)实现。
