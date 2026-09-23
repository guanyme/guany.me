---
description: 'Manage ZeroTier networks and Moons with zerotier-cli, and uninstall ZeroTier on macOS.'
---

# ZeroTier

ZeroTier creates virtual LANs. This page covers common `zerotier-cli` commands and uninstalling ZeroTier on macOS.

## Installation

This section covers uninstallation only.

### Uninstall ZeroTier on macOS

1. Run the uninstall script:

   ```sh
   sudo "/Library/Application Support/ZeroTier/One/uninstall.sh"
   ```

2. Optional: remove user configuration to reset settings:

   ```sh
   rm -rf ~/Library/Application\ Support/ZeroTier
   ```

## Usage

Run the commands below with `sudo`. Replace `<network_id>` with the network ID and `<moon_id>` with the Moon ID.

### Join a network

Join a network:

```sh
sudo zerotier-cli join <network_id>
```

### Leave a network

Leave a network:

```sh
sudo zerotier-cli leave <network_id>
```

### Check status

Show the status of this node:

```sh
sudo zerotier-cli status
```

### List joined networks

List the networks this node has joined:

```sh
sudo zerotier-cli listnetworks
```

### List peers

List all peers:

```sh
sudo zerotier-cli listpeers
```

### Join a Moon

Join a Moon:

```sh
sudo zerotier-cli orbit <moon_id> <moon_id>
```

### Leave a Moon

Leave a Moon:

```sh
sudo zerotier-cli deorbit <moon_id>
```
