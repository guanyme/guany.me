# macos

MacOS

## 配置代理 {#configure-proxy}

```sh
export https_proxy="http://127.0.0.1:7890"
export http_proxy="http://127.0.0.1:7890"
export all_proxy="socks5://127.0.0.1:7890"
```

## 显示隐藏文件 {#show-hidden-files}

```sh
defaults write com.apple.finder AppleShowAllFiles -bool true; killall Finder
```

## 重置 Launchpad {#reset-launchpad}

```sh
rm -rf /private$(getconf DARWIN_USER_DIR)com.apple.dock.launchpad; killall Dock
```

## 重置 Dock 栏 {#reset-dock}

```sh
defaults delete com.apple.dock
killall Dock
```

## 重置通知中心 {#reset-notification-center}

```sh
defaults delete com.apple.notificationcenterui
killall NotificationCenter
```
