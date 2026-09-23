---
description: 'Claude Code settings, MCP servers, common commands and shell functions.'
---

# Claude Code

Claude Code is Anthropic's command-line coding tool. This page covers its settings file, MCP servers, common commands and shell functions.

## Configuration

Claude Code is configured through a settings file, MCP servers and optional shell functions.

### Settings

Settings file location:

- macOS / Linux: `~/.claude/settings.json`
- Windows: `$HOME\.claude\settings.json`

Put the following in the settings file:

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

### MCP servers

Add the following to `~/.claude.json`:

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

### Shell function

Wrap `claude` in a shell function of the same name so every launch gets the base arguments. Add the function to `~/.zshrc` or your PowerShell `$PROFILE`. Pick one of the two variants below.

#### Always start a new conversation

Start a fresh conversation every time, with only the base arguments.

Zsh:

```zsh
claude() {
  local base_args="--allow-dangerously-skip-permissions --permission-mode plan"

  command claude ${=base_args} "$@"
}
```

PowerShell:

```powershell
function claude {
    $baseArgs = @("--allow-dangerously-skip-permissions", "--permission-mode", "plan")
    $claudePath = (Get-Command claude -CommandType Application).Source

    & $claudePath @baseArgs @args
}
```

#### Resume the last conversation automatically

Try to continue the last conversation first. If that fails, start a new one.

Zsh:

```zsh
claude() {
  local base_args="--allow-dangerously-skip-permissions --permission-mode plan"

  command claude ${=base_args} -c "$@" 2>/dev/null || command claude ${=base_args} "$@"
}
```

PowerShell:

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

## Usage

Common commands:

```sh
# Continue the last conversation
claude -c

# Skip permission confirmation
claude --dangerously-skip-permissions
```
