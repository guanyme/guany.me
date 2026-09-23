---
description: '用 zerotier-cli 管理 ZeroTier 网络和 Moon，以及在 macOS 上卸载 ZeroTier。'
---

# ZeroTier

ZeroTier 用于组建虚拟局域网。本页介绍 `zerotier-cli` 的常用命令，以及在 macOS 上卸载 ZeroTier。

## 安装 {#installation}

本节只包含卸载步骤。

### 在 macOS 上卸载 ZeroTier {#uninstall-zerotier-on-macos}

1. 运行卸载脚本：

   ```sh
   sudo "/Library/Application Support/ZeroTier/One/uninstall.sh"
   ```

2. 可选：删除用户配置，重置设置：

   ```sh
   rm -rf ~/Library/Application\ Support/ZeroTier
   ```

## 使用 {#usage}

以下命令用 `sudo` 执行。`<network_id>` 替换为网络 ID，`<moon_id>` 替换为 Moon ID。

### 加入网络 {#join-a-network}

加入指定网络：

```sh
sudo zerotier-cli join <network_id>
```

### 离开网络 {#leave-a-network}

离开指定网络：

```sh
sudo zerotier-cli leave <network_id>
```

### 查看状态 {#check-status}

查看本机节点状态：

```sh
sudo zerotier-cli status
```

### 列出已加入的网络 {#list-joined-networks}

列出已加入的网络：

```sh
sudo zerotier-cli listnetworks
```

### 列出 Peers {#list-peers}

列出所有 Peer：

```sh
sudo zerotier-cli listpeers
```

### 加入 Moon {#join-a-moon}

加入 Moon：

```sh
sudo zerotier-cli orbit <moon_id> <moon_id>
```

### 离开 Moon {#leave-a-moon}

离开 Moon：

```sh
sudo zerotier-cli deorbit <moon_id>
```
