---
description: 'fastfetch 系统信息工具：在 macOS、Windows、Ubuntu 上安装并运行。'
---

# fastfetch

fastfetch 是一个类似 neofetch 的系统信息工具，速度更快。本页介绍它在 macOS、Windows、Ubuntu 上的安装方法和基本用法。

## 安装 {#installation}

按所用系统选择一种安装方式。

### 在 macOS 上安装 {#install-on-macos}

用 Homebrew 安装：

```sh
brew install fastfetch
```

### 在 Windows 上安装 {#install-on-windows}

用 winget 安装：

```powershell
winget install fastfetch
```

### 在 Ubuntu 上安装 {#install-on-ubuntu}

在 root shell 里添加 Fastfetch PPA，更新软件包列表，然后安装：

```sh
# 添加 Fastfetch PPA
add-apt-repository ppa:zhangsongcui3371/fastfetch

# 更新软件包列表
apt update

# 安装 Fastfetch
apt install fastfetch
```

## 使用 {#usage}

fastfetch 不带参数即可运行。

### 显示系统信息 {#show-system-information}

运行：

```sh
fastfetch
```
