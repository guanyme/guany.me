# grok

xAI Grok CLI

## AGENTS.md

配置文件位置：`~/.grok/AGENTS.md`

该文件会在每次会话中作为全局规则加载；在 git 仓库内，Grok 还会从仓库根目录到当前工作目录逐层读取各目录下的 `AGENTS.md`（以及兼容的 `AGENT.md`、`CLAUDE.md` 等），更深层的内容在冲突时优先。被 `.gitignore` 忽略的文件不会加载。可用 `grok inspect` 查看实际命中的规则文件。

```markdown
- Always respond in Chinese-simplified
```
