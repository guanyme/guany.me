---
description: 'Windows Terminal 的 settings.json 配置：默认值、PowerShell 7 和 Vitesse Dark 配色'
---

# Windows Terminal

本页给出 Windows Terminal 的 `settings.json` 配置：profile 默认值、PowerShell 7 启动命令和 Vitesse Dark 配色。

## 配置 {#configuration}

以下片段分别写进 `settings.json` 的对应字段。

### 设置 profile 默认值 {#set-profile-defaults}

在 `profiles.defaults` 里关闭提示音，设置配色和字体：

```json
{
  "bellStyle": "none",
  "colorScheme": "Vitesse Dark",
  "font": {
    "face": "FiraCode Nerd Font"
  }
}
```

### 启动 PowerShell 7 {#launch-powershell-7}

在 `profiles.list` 的 profile 里把命令行设为 PowerShell 7，`-NoLogo` 去掉启动横幅：

```json
[
  {
    "commandline": "C:\\Program Files\\PowerShell\\7\\pwsh.exe -NoLogo"
  }
]
```

### 添加 Vitesse Dark 配色 {#add-the-vitesse-dark-color-scheme}

在 `schemes` 数组里加上：

```json
{
  "background": "#121212",
  "black": "#393A34",
  "blue": "#6394BF",
  "brightBlack": "#777777",
  "brightBlue": "#6394BF",
  "brightCyan": "#5EAAB5",
  "brightGreen": "#4D9375",
  "brightPurple": "#D9739F",
  "brightRed": "#CB7676",
  "brightWhite": "#FFFFFF",
  "brightYellow": "#E6CC77",
  "cursorColor": "#CDC9BD",
  "cyan": "#5EAAB5",
  "foreground": "#CDCABE",
  "green": "#4D9375",
  "name": "Vitesse Dark",
  "purple": "#D9739F",
  "red": "#CB7676",
  "selectionBackground": "#252525",
  "white": "#CDCABE",
  "yellow": "#E6CC77"
}
```
