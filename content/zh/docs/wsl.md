---
description: 'WSL（Windows Subsystem for Linux）的代理配置'
---

# WSL

WSL（Windows Subsystem for Linux）在 Windows 上运行 Linux 环境。本页介绍如何让 WSL 使用 Windows 主机上的代理。

## 配置 {#configuration}

WSL 通过环境变量使用代理。

### 配置代理 {#configure-a-proxy}

从 `/etc/resolv.conf` 读取主机 IP，并设置代理环境变量：

```sh
export hostip=$(cat /etc/resolv.conf | grep -oP '(?<=nameserver\ ).*')
export http_proxy="http://$hostip:7890"
export https_proxy="http://$hostip:7890"
```
