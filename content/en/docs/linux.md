---
description: 'Proxy environment variables on Linux'
---

# Linux

This page covers setting HTTP and SOCKS5 proxies for command-line tools on Linux.

## Configuration

Set the proxy with environment variables.

### Configure a proxy

Set the proxy environment variables. HTTP uses port `7890` and SOCKS5 uses port `7891`:

```sh
export https_proxy="http://127.0.0.1:7890"
export http_proxy="http://127.0.0.1:7890"
export all_proxy="socks5://127.0.0.1:7891"
```
