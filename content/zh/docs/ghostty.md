---
description: 'Ghostty 终端的主题、光标 shader、配置文件与 SSH terminfo 问题'
---

# Ghostty

Ghostty 是一个终端模拟器。本页介绍如何安装主题和光标 shader、编写配置文件，以及处理窗口大小和 SSH terminfo 问题。

## 安装 {#installation}

配置文件引用的主题和 shader 需要先克隆到 `~/.config/ghostty` 下。

### 安装主题 {#install-the-theme}

安装 [vitesse-ghostty-theme](https://github.com/hamlim/vitesse-ghostty-theme)：

```sh
git clone https://github.com/hamlim/vitesse-ghostty-theme.git ~/.config/ghostty/themes
```

### 安装光标 shader {#install-the-cursor-shaders}

安装 [ghostty-cursor-shaders](https://github.com/sahaj-b/ghostty-cursor-shaders)：

```sh
git clone https://github.com/sahaj-b/ghostty-cursor-shaders.git ~/.config/ghostty/shaders
```

## 配置 {#configuration}

配置文件位于 `~/Library/Application Support/com.mitchellh.ghostty/config.ghostty`。在其中设置字体、主题和光标 shader：

```ini
font-family = "FiraCode Nerd Font"
font-family-bold = "FiraCode Nerd Font"
font-family-italic = "FiraCode Nerd Font"
font-family-bold-italic = "FiraCode Nerd Font"
font-size = 16

font-feature = calt
font-feature = liga

theme = light:vitesse-light,dark:vitesse-dark

custom-shader = ~/.config/ghostty/shaders/cursor_warp.glsl
custom-shader = ~/.config/ghostty/shaders/ripple_cursor.glsl

custom-shader-animation = always
```

## 使用 {#usage}

### 重置窗口大小 {#reset-window-size}

删除 plist 中的窗口位置缓存，然后重启 Ghostty：

```sh
defaults delete com.mitchellh.ghostty NSWindowLastPosition
```

## 故障排查 {#troubleshooting}

### SSH 远程提示 unknown terminal type {#unknown-terminal-type-over-ssh}

SSH 连接远程服务器时报错 `'xterm-ghostty': unknown terminal type.`。原因是远程主机上没有 `xterm-ghostty` 的 terminfo。

把本机的 terminfo 安装到远程主机，`user@host` 换成远程主机的用户名和地址：

```sh
infocmp xterm-ghostty | ssh user@host 'tic -x -'
```

## 参考 {#references}

- [vitesse-ghostty-theme](https://github.com/hamlim/vitesse-ghostty-theme)：Ghostty 的 Vitesse 主题。
- [ghostty-cursor-shaders](https://github.com/sahaj-b/ghostty-cursor-shaders)：Ghostty 的光标 shader 合集。
