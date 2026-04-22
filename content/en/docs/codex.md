# Codex

OpenAI Codex CLI

## MCP Servers

Config file location: `~/.codex/config.toml`

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
# Continue the most recent interactive session for the current directory
codex resume --last

# Skip approvals and sandbox entirely, extremely dangerous
codex --dangerously-bypass-approvals-and-sandbox
```

`codex resume --last` filters by the current working directory by default, so running it inside a project will try to continue the latest session for that project. Codex does not automatically resume when you `cd` into a directory, but you can wrap that behavior in a shell function.

### Shell Function

Try to continue the latest session for the current directory first; if it fails, start a new one:

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
