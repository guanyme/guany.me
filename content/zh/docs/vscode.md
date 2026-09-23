---
description: 'VS Code 用户设置：字体、主题、终端与 Git 相关的 settings.json 配置。'
---

# VS Code

VS Code 是微软推出的代码编辑器。本页给出一份用户设置 `settings.json`，以及对应的配置仓库。

## 配置 {#configuration}

VS Code 的用户设置保存在 `settings.json` 里。

### 编辑 settings.json {#edit-settingsjson}

在用户 `settings.json` 里写入：

```json
{
  "editor.cursorSmoothCaretAnimation": "on",
  "editor.fontFamily": "'FiraCode Nerd Font', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  "editor.fontLigatures": true,
  "editor.fontSize": 16,
  "editor.gotoLocation.multipleDefinitions": "goto",
  "editor.guides.bracketPairs": "active",
  "editor.linkedEditing": true,
  "editor.smoothScrolling": true,
  "extensions.ignoreRecommendations": true,
  "files.simpleDialog.enable": true,
  "git.blame.editorDecoration.enabled": true,
  "git.openRepositoryInParentFolders": "always",
  "github.gitProtocol": "ssh",
  "i18n-ally.displayLanguage": "zh",
  "liveServer.settings.donotShowInfoMsg": true,
  "security.workspace.trust.enabled": false,
  "terminal.integrated.cursorBlinking": true,
  "terminal.integrated.cursorStyle": "line",
  "terminal.integrated.fontSize": 16,
  "terminal.integrated.initialHint": false,
  "terminal.integrated.smoothScrolling": true,
  "where-am-i.colorful": false,
  "window.autoDetectColorScheme": true,
  "window.dialogStyle": "custom",
  "window.nativeTabs": true,
  "workbench.iconTheme": "catppuccin-mocha",
  "workbench.list.smoothScrolling": true,
  "workbench.preferredDarkColorTheme": "Vitesse Dark",
  "workbench.preferredLightColorTheme": "Vitesse Light",
  "workbench.productIconTheme": "icons-carbon",
  "workbench.startupEditor": "none"
}
```

## 参考 {#references}

- [Guany VS Code profile](https://github.com/guanyme/vscode-profile/)：本页设置所在的 VS Code 配置仓库。
