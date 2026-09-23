---
description: 'Linux 的代理环境变量配置'
---

# Linux

本页介绍在 Linux 上为命令行工具配置 HTTP 和 SOCKS5 代理。

## 配置 {#configuration}

代理通过环境变量设置。

### 配置代理 {#configure-a-proxy}

设置代理环境变量，HTTP 用 `7890` 端口，SOCKS5 用 `7891` 端口：

```sh
export https_proxy="http://127.0.0.1:7890"
export http_proxy="http://127.0.0.1:7890"
export all_proxy="socks5://127.0.0.1:7891"
```
