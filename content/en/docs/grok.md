# grok

xAI Grok CLI

## AGENTS.md

Config file location: `~/.grok/AGENTS.md`

Grok loads this file as global rules on every session. Inside a git repository, it also walks from the repo root down to the current working directory and reads agent rule files in each directory (including compatible names such as `AGENT.md` and `CLAUDE.md`); deeper files take precedence on conflicts. Files ignored by `.gitignore` are skipped. Run `grok inspect` to see which rule files were picked up.
