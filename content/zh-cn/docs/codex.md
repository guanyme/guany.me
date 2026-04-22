# Codex

OpenAI Codex CLI

## AGENTS.md

配置文件位置：`~/.codex/AGENTS.md`

```markdown
- Always respond in Chinese-simplified
```

## MCP Servers

配置文件位置：`~/.codex/config.toml`

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

## Command

```sh
# 继续当前目录最近的一次交互会话
codex resume --last

# 完全跳过审批和 sandbox，风险极高
codex --dangerously-bypass-approvals-and-sandbox
```

`codex resume --last` 默认会按当前工作目录过滤会话，所以进入一个项目目录后执行它，就会优先尝试续接这个目录最近的那次会话。Codex 本身不会在你 `cd` 进入目录时自动弹起续接，但可以用 shell 函数把“先续接，失败再新开”包起来。

### Shell 函数 {#shell-function}

优先尝试继续当前目录最近的一次会话，失败则新建对话：

**Zsh**

```zsh
codex() {
  local base_args="--dangerously-bypass-approvals-and-sandbox"

  command codex ${=base_args} resume --last "$@" 2>/dev/null || command codex ${=base_args} "$@"
}
```

**PowerShell**

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
