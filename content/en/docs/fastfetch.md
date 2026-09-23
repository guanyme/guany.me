---
description: 'fastfetch system info tool: install and run it on macOS, Windows and Ubuntu.'
---

# fastfetch

fastfetch is a neofetch-like system information tool that runs faster. This page covers installing it on macOS, Windows and Ubuntu and basic usage.

## Installation

Choose the method for your operating system.

### Install on macOS

Install with Homebrew:

```sh
brew install fastfetch
```

### Install on Windows

Install with winget:

```powershell
winget install fastfetch
```

### Install on Ubuntu

In a root shell, add the Fastfetch PPA, update the package list, then install:

```sh
# Add the Fastfetch PPA
add-apt-repository ppa:zhangsongcui3371/fastfetch

# Update the package list
apt update

# Install Fastfetch
apt install fastfetch
```

## Usage

fastfetch runs without arguments.

### Show system information

Run:

```sh
fastfetch
```
