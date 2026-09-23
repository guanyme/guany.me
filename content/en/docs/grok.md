---
description: 'xAI Grok CLI global instructions file and how rule files are loaded.'
---

# Grok

Grok CLI is xAI's command-line tool. This page covers the global instructions file and how Grok loads rule files.

## Configuration

Grok keeps its global config in the `~/.grok` directory.

### Global instructions

Put the following in `~/.grok/AGENTS.md`:

```markdown
- Always respond in Chinese-simplified
```

### Rule file load order

Grok reads rule files as follows:

- It loads `~/.grok/AGENTS.md` as global rules in every session.
- Inside a git repository, it walks from the repo root down to the current working directory and reads `AGENTS.md` in each directory, plus compatible names such as `AGENT.md` and `CLAUDE.md`.
- On conflicts, files in deeper directories take precedence.
- Files ignored by `.gitignore` are skipped.

Run `grok inspect` to see which rule files were picked up.
