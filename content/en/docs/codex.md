---
description: 'OpenAI Codex CLI global instructions, MCP servers, shell functions and resume commands.'
---

# Codex

Codex is OpenAI's command-line coding tool (Codex CLI). This page covers its global instructions, MCP servers, shell functions and common commands.

## Configuration

Codex keeps its config files in the `~/.codex` directory.

### Global instructions

Put the following in `~/.codex/AGENTS.md`:

```markdown
- Always respond in Chinese-simplified
```

### MCP servers

Add the following to `~/.codex/config.toml`:

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

### Shell function

Wrap `codex` in a shell function of the same name so every launch gets the base arguments. Add the function to `~/.zshrc` or your PowerShell `$PROFILE`. Pick one of the two variants below.

#### Always start a new session

Start a fresh session every time, with only the base arguments.

Zsh:

```zsh
codex() {
  local base_args="--dangerously-bypass-approvals-and-sandbox"

  command codex ${=base_args} "$@"
}
```

PowerShell:

```powershell
function codex {
    $baseArgs = @("--dangerously-bypass-approvals-and-sandbox")
    $codexPath = (Get-Command codex -CommandType Application | Select-Object -First 1).Source

    & $codexPath @baseArgs @args
}
```

#### Resume the current directory's session automatically

Try to continue the latest session for the current directory first. If that fails, start a new one.

Zsh:

```zsh
codex() {
  local base_args="--dangerously-bypass-approvals-and-sandbox"

  command codex ${=base_args} resume --last "$@" 2>/dev/null || command codex ${=base_args} "$@"
}
```

PowerShell:

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

## Usage

Common commands:

```sh
# Continue the most recent interactive session for the current directory
codex resume --last

# Skip approvals and sandbox entirely, extremely dangerous
codex --dangerously-bypass-approvals-and-sandbox
```

`codex resume --last` filters sessions by the current working directory by default. Run it inside a project to continue that project's latest session. Codex does not resume automatically when you `cd` into a directory. To resume first and fall back to a new session, use a [shell function](#shell-function).
