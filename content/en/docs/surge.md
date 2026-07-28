# Surge

Network proxy and rule engine for macOS / iOS. Use `surge-cli` for status checks and policy tweaks; agents can use the bundled Skill for scripted operations.

## surge-cli

Resolve the executable in this order:

1. `surge-cli` on `PATH`
2. `/Applications/Surge.app/Contents/Applications/surge-cli`

Prefer `--raw` for JSON output. Add `--remote password@host:port` when targeting a remote Surge instance.

## Common Commands

Inspect runtime environment:

```sh
surge-cli --raw environment
```

Dump policy and profile snapshots:

```sh
surge-cli --raw dump policy
surge-cli --raw dump profile
```

Apply runtime changes (dump first, then verify with `environment`):

```sh
surge-cli --raw set ProxyMode=2
surge-cli --raw set ProxyGroupSelection.Proxy=HK
surge-cli --raw set AutoPolicyGroupOverride.Streaming=<nil>
```

## Agent Skill

Surge ships an Agent Skill inside the app bundle:

`/Applications/Surge.app/Contents/Resources/Skills/surge`

On this machine, personal skills follow the same layout as [Claude Code](./claude-code): **`~/.agents/skills` holds content**, and **`~/.claude/skills` symlinks into it**. Link to the bundle so the skill updates when Surge is upgraded.

```sh
ln -sfn "/Applications/Surge.app/Contents/Resources/Skills/surge" "$HOME/.agents/skills/surge"
ln -sfn "../../.agents/skills/surge" "$HOME/.claude/skills/surge"
```

Verify:

```sh
test -f "$HOME/.claude/skills/surge/SKILL.md" && echo "Surge skill OK"
```

Notes:

- You do not need to edit `~/.agents/.skill-lock.json`; that file tracks skills installed via `npx skills add` from GitHub only.
- Cursor loads the same personal skills from `~/.claude/skills`. If you use `~/.cursor/skills`, link the same way: `ln -sfn "../../.agents/skills/surge" "$HOME/.cursor/skills/surge"`.

## Proxy Port

Other local tools ([macOS proxy env](./macos), [WSL proxy env](./wsl)) often use **7890** for HTTP/SOCKS; keep that aligned with Surge’s HTTP/SOCKS5 listener.
