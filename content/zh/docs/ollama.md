---
description: '配置 Ollama 的监听地址和 CORS 来源，允许局域网和跨域访问。'
---

# Ollama

Ollama 用于在本地运行大语言模型。本页介绍在 macOS、Windows 和 Linux 上开放 Ollama 的局域网访问和跨域（CORS）访问。

## 配置 {#configuration}

Ollama 通过环境变量控制监听地址和允许的跨域来源。按平台设置环境变量，必要时放行防火墙端口，然后验证。

### 环境变量 {#environment-variables}

Ollama 读取以下环境变量：

| 变量             | 用途             | 默认值                 |
| ---------------- | ---------------- | ---------------------- |
| `OLLAMA_HOST`    | 绑定地址         | `127.0.0.1:11434`      |
| `OLLAMA_ORIGINS` | 允许的 CORS 来源 | `127.0.0.1`, `0.0.0.0` |

设置 `OLLAMA_HOST=0.0.0.0:11434` 允许局域网访问。设置 `OLLAMA_ORIGINS=*` 允许所有跨域请求。

`OLLAMA_ORIGINS` 可以取以下值：

| 值                                        | 说明         |
| ----------------------------------------- | ------------ |
| `*`                                       | 允许所有来源 |
| `http://localhost:3000`                   | 允许特定来源 |
| `http://localhost:3000,https://myapp.com` | 多个来源     |

### 在 macOS 上设置环境变量 {#set-environment-variables-on-macos}

Ollama 在 macOS 上作为 GUI 应用运行，由 `launchd` 管理。

1. 用 `launchctl` 设置环境变量：

   ```sh
   launchctl setenv OLLAMA_HOST "0.0.0.0:11434"
   launchctl setenv OLLAMA_ORIGINS "*"
   ```

2. 从菜单栏退出 Ollama，再重新启动。

### 在 Windows 上设置环境变量 {#set-environment-variables-on-windows}

1. 在 PowerShell 中设置用户环境变量：

   ```powershell
   [System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:11434", "User")
   [System.Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")
   ```

2. 从开始菜单退出 Ollama，再重新启动。

### 在 Linux 上设置环境变量 {#set-environment-variables-on-linux}

Ollama 在 Linux 上作为 systemd 服务运行。在 root shell 下执行：

1. 编辑服务配置：

   ```sh
   systemctl edit ollama.service
   ```

2. 添加以下内容：

   ```ini
   [Service]
   Environment="OLLAMA_HOST=0.0.0.0:11434"
   Environment="OLLAMA_ORIGINS=*"
   ```

3. 重新加载配置并重启服务：

   ```sh
   systemctl daemon-reload
   systemctl restart ollama
   ```

### 在 Windows 防火墙中放行端口 {#allow-the-port-in-windows-firewall}

添加入站规则，放行 TCP 11434 端口：

```powershell
New-NetFirewallRule -DisplayName "Ollama API" -Direction Inbound -Protocol TCP -LocalPort 11434 -Action Allow
```

### 在 Linux 防火墙中放行端口 {#allow-the-port-in-linux-firewall}

按使用的防火墙放行 TCP 11434 端口：

```sh
# UFW
ufw allow 11434/tcp

# firewalld
firewall-cmd --permanent --add-port=11434/tcp
firewall-cmd --reload
```

### 验证配置 {#verify-the-configuration}

请求版本接口，返回版本号即表示服务可访问。

macOS 和 Linux：

```sh
curl http://localhost:11434/api/version
```

Windows：

```powershell
curl http://127.0.0.1:11434/api/version
```

## 故障排查 {#troubleshooting}

以下是 macOS 上环境变量不生效的常见情况。

### macOS 上 zshrc 中的环境变量不生效 {#environment-variables-in-zshrc-have-no-effect-on-macos}

原因：Ollama 由 `launchd` 启动，不读取 `~/.zshrc`。

解决：改用 `launchctl setenv` 设置，见[在 macOS 上设置环境变量](#set-environment-variables-on-macos)。

### macOS 重启后设置丢失 {#settings-are-lost-after-restarting-macos}

原因：`launchctl setenv` 的设置重启后不保留。

解决：任选一种方式持久化：

- 手动运行 `ollama serve`。
- 创建 LaunchAgent plist。
