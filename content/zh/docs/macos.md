---
description: 'macOS 终端技巧：配置代理、显示隐藏文件、重置系统组件。'
---

# macOS

本页收录 macOS 上常用的终端命令：配置终端代理、显示隐藏文件，以及重置 Launchpad、程序坞和通知中心。

## 配置 {#configuration}

以下设置用命令行完成，改完立即生效。

### 配置代理 {#configure-a-proxy}

在当前 shell 里设置代理环境变量。HTTP 端口是 6152，SOCKS5 端口是 6153，即 Surge 的默认端口：

```sh
export https_proxy="http://127.0.0.1:6152"
export http_proxy="http://127.0.0.1:6152"
export all_proxy="socks5://127.0.0.1:6153"
```

### 显示隐藏文件 {#show-hidden-files}

让访达显示隐藏文件，并重启访达：

```sh
defaults write com.apple.finder AppleShowAllFiles -bool true; killall Finder
```

## 使用 {#usage}

以下命令把系统组件恢复为默认状态，并重启对应进程。

### 重置 Launchpad {#reset-launchpad}

删除 Launchpad 数据库，并重启程序坞：

```sh
rm -rf /private$(getconf DARWIN_USER_DIR)com.apple.dock.launchpad; killall Dock
```

### 重置程序坞 {#reset-the-dock}

删除程序坞的偏好设置，并重启程序坞：

```sh
defaults delete com.apple.dock
killall Dock
```

### 重置通知中心 {#reset-notification-center}

删除通知中心的偏好设置，并重启通知中心：

```sh
defaults delete com.apple.notificationcenterui
killall NotificationCenter
```
