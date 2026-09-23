---
description: 'Proxy settings for WSL (Windows Subsystem for Linux)'
---

# WSL

WSL (Windows Subsystem for Linux) runs a Linux environment on Windows. This page covers pointing WSL at the proxy on the Windows host.

## Configuration

WSL uses the proxy through environment variables.

### Configure a proxy

Read the host IP from `/etc/resolv.conf` and set the proxy environment variables:

```sh
export hostip=$(cat /etc/resolv.conf | grep -oP '(?<=nameserver\ ).*')
export http_proxy="http://$hostip:7890"
export https_proxy="http://$hostip:7890"
```
