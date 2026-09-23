---
description: 'macOS terminal tips: set a proxy, show hidden files, reset system components.'
---

# macOS

This page collects common macOS terminal commands: set a terminal proxy, show hidden files, and reset Launchpad, the Dock and Notification Center.

## Configuration

These settings are applied from the command line and take effect immediately.

### Configure a proxy

Set the proxy environment variables in the current shell. The HTTP port is 6152 and the SOCKS5 port is 6153, the default ports of Surge:

```sh
export https_proxy="http://127.0.0.1:6152"
export http_proxy="http://127.0.0.1:6152"
export all_proxy="socks5://127.0.0.1:6153"
```

### Show hidden files

Make Finder show hidden files, then restart Finder:

```sh
defaults write com.apple.finder AppleShowAllFiles -bool true; killall Finder
```

## Usage

These commands restore a system component to its defaults and restart the related process.

### Reset Launchpad

Delete the Launchpad database, then restart the Dock:

```sh
rm -rf /private$(getconf DARWIN_USER_DIR)com.apple.dock.launchpad; killall Dock
```

### Reset the Dock

Delete the Dock preferences, then restart the Dock:

```sh
defaults delete com.apple.dock
killall Dock
```

### Reset Notification Center

Delete the Notification Center preferences, then restart Notification Center:

```sh
defaults delete com.apple.notificationcenterui
killall NotificationCenter
```
