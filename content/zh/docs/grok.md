---
description: 'xAI Grok CLI 的全局指令文件及规则文件的加载方式。'
---

# Grok

Grok CLI 是 xAI 的命令行工具。本页介绍全局指令文件，以及 Grok 如何加载规则文件。

## 配置 {#configuration}

Grok 的全局配置在 `~/.grok` 目录下。

### 全局指令 {#global-instructions}

在 `~/.grok/AGENTS.md` 里写入：

```markdown
- Always respond in Chinese-simplified
```

### 规则文件加载顺序 {#rule-file-load-order}

Grok 按以下规则读取规则文件：

- 每次会话都把 `~/.grok/AGENTS.md` 作为全局规则加载。
- 在 git 仓库内，从仓库根目录到当前工作目录，逐层读取各目录下的 `AGENTS.md`，以及兼容的 `AGENT.md`、`CLAUDE.md` 等。
- 内容冲突时，更深层目录的文件优先。
- 被 `.gitignore` 忽略的文件不会加载。

运行 `grok inspect` 查看实际命中的规则文件。
