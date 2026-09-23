---
description: 'Warp 终端：安装 Vitesse 主题，重置命令历史记录。'
---

# Warp

Warp 是一款现代终端。本页介绍如何在 macOS 和 Windows 上安装 Vitesse 主题，以及重置命令历史记录。

## 配置 {#configuration}

Warp 从本地主题目录读取自定义主题。

### 安装 Vitesse 主题 {#install-the-vitesse-theme}

克隆 [warp-theme-vitesse](https://github.com/HiDeoo/warp-theme-vitesse) 仓库，把其中的 `.yaml` 主题文件复制到 Warp 的主题目录。

macOS：

```sh
mkdir -p $HOME/.warp/themes
git clone https://github.com/HiDeoo/warp-theme-vitesse.git /tmp/warp-theme-vitesse
cp /tmp/warp-theme-vitesse/*.yaml $HOME/.warp/themes/
```

Windows：

```powershell
New-Item -Path "$env:APPDATA\warp\Warp\data\themes" -ItemType Directory -Force
git clone https://github.com/HiDeoo/warp-theme-vitesse.git "$env:TEMP\warp-theme-vitesse"
Copy-Item "$env:TEMP\warp-theme-vitesse\*.yaml" "$env:APPDATA\warp\Warp\data\themes\"
```

## 使用 {#usage}

Warp 把命令历史记录保存在本地的 `warp.sqlite` 数据库里。

### 重置命令历史记录 {#reset-command-history}

删除 `warp.sqlite` 即可清空命令历史记录。

macOS：

```sh
rm -r "$HOME/Library/Group Containers/2BBY89MBSN.dev.warp/Library/Application Support/dev.warp.Warp-Stable/warp.sqlite"
```

Windows：

```powershell
Remove-Item "$env:LOCALAPPDATA\warp\Warp\data\warp.sqlite"
```

## 参考 {#references}

- [warp-theme-vitesse](https://github.com/HiDeoo/warp-theme-vitesse)：Warp 的 Vitesse 主题。
