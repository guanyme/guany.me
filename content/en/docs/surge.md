---
description: 'Surge Agent Skill setup, proxy ports and common surge-cli commands.'
---

# Surge

Surge is a network proxy and rule engine for macOS / iOS. This page covers installing the bundled Agent Skill, Surge's proxy ports, and using `surge-cli` to check status and switch policies.

## Installation

Surge ships `surge-cli` and an Agent Skill in the app. No separate download is needed.

### Install the Agent Skill

Surge ships an Agent Skill inside the app bundle:

`/Applications/Surge.app/Contents/Resources/Skills/surge`

Skill content lives in `~/.agents/skills`, and `~/.claude/skills` holds symlinks to it. This is the same layout as other skills installed with the Skills CLI; Claude Code loads skills from `~/.claude/skills`. Link to the bundle instead of copying it, so the skill updates with Surge.

1. Link the bundled skill into `~/.agents/skills`, then into `~/.claude/skills`:

   ```sh
   ln -sfn "/Applications/Surge.app/Contents/Resources/Skills/surge" "$HOME/.agents/skills/surge"
   ln -sfn "../../.agents/skills/surge" "$HOME/.claude/skills/surge"
   ```

2. Verify the link:

   ```sh
   test -f "$HOME/.claude/skills/surge/SKILL.md" && echo "Surge skill OK"
   ```

   The output `Surge skill OK` means the skill is installed.

3. Optional: if you use `~/.cursor/skills`, link it the same way:

   ```sh
   ln -sfn "../../.agents/skills/surge" "$HOME/.cursor/skills/surge"
   ```

Notes:

- You do not need to edit `~/.agents/.skill-lock.json`. That file only tracks skills installed from GitHub with `npx skills add`.
- Cursor loads the same personal skills as Claude Code from `~/.claude/skills`.

## Configuration

Surge's local proxy listens on the following ports.

### Proxy port

Surge listens on **6152** for HTTP and **6153** for SOCKS5 by default. Point the terminal proxy variables and SSH `ProxyCommand` at these two ports.

## Usage

Use `surge-cli` to check Surge's state and change runtime settings.

### Locate surge-cli

Resolve the executable in this order:

1. `surge-cli` on `PATH`
2. `/Applications/Surge.app/Contents/Applications/surge-cli`

Add `--raw` for machine-readable JSON output. Add `--remote password@host:port` to target a remote Surge instance.

### Inspect state

Inspect the runtime environment:

```sh
surge-cli --raw environment
```

Dump policy and profile snapshots:

```sh
surge-cli --raw dump policy
surge-cli --raw dump profile
```

### Change runtime settings

Dump a snapshot before the change and verify afterwards:

1. Dump the current policy and profile. See [Inspect state](#inspect-state) for the commands.
2. Apply runtime changes:

   ```sh
   surge-cli --raw set ProxyMode=2
   surge-cli --raw set ProxyGroupSelection.Proxy=HK
   surge-cli --raw set AutoPolicyGroupOverride.Streaming=<nil>
   ```

3. Run `surge-cli --raw environment` to confirm the change took effect.
