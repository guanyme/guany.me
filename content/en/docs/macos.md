# macos

MacOS

## Configure Proxy

```sh
export https_proxy="http://127.0.0.1:7890"
export http_proxy="http://127.0.0.1:7890"
export all_proxy="socks5://127.0.0.1:7890"
```

## Show Hidden Files

```sh
defaults write com.apple.finder AppleShowAllFiles -bool true; killall Finder
```

## Reset Launchpad

```sh
rm -rf /private$(getconf DARWIN_USER_DIR)com.apple.dock.launchpad; killall Dock
```

## Reset Dock

```sh
defaults delete com.apple.dock
killall Dock
```

## Reset Notification Center

```sh
defaults delete com.apple.notificationcenterui
killall NotificationCenter
```
