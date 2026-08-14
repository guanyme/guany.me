# ssh

SSH

## 生成新的 SSH 密钥 {#generate-new-ssh-key}

```sh
ssh-keygen -t ed25519 -C "your_email@example.com"
```

## 查看 SSH 密钥 {#view-ssh-key}

### macOS / Linux

```sh
cat ~/.ssh/id_ed25519.pub
```

### Windows (PowerShell)

```powershell
cat $HOME\.ssh\id_ed25519.pub
```

## 配置 GitHub 在 HTTPS 端口使用 SSH {#configure-github-ssh-over-https}

```
Host github.com
  HostName ssh.github.com
  Port 443
  User git
```

## 测试 SSH 连接 {#test-ssh-connection}

```sh
ssh -T git@github.com
```

## 配置代理 {#configure-proxy}

```
ProxyCommand nc -X 5 -x 127.0.0.1:7890 %h %p
```

## SSH Agent 密钥管理 {#ssh-agent-key-management}

### Windows 启动 ssh-agent 服务 {#windows-start-ssh-agent-service}

Windows 需要先启动 ssh-agent 服务才能使用：

```powershell
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service ssh-agent
```

### 添加密钥到 SSH Agent {#add-key-to-ssh-agent}

macOS / Linux：

```sh
ssh-add ~/.ssh/id_ed25519
```

Windows (PowerShell)：

```powershell
ssh-add $HOME\.ssh\id_ed25519
```

### 查看已添加的密钥列表 {#list-added-keys}

```sh
ssh-add -l
```

### 从 SSH Agent 移除密钥 {#remove-key-from-ssh-agent}

移除指定密钥：

macOS / Linux：

```sh
ssh-add -d ~/.ssh/id_ed25519
```

Windows (PowerShell)：

```powershell
ssh-add -d $HOME\.ssh\id_ed25519
```

移除所有密钥：

```sh
ssh-add -D
```

## Windows 作为服务端 {#windows-as-server}

### 安装公钥实现免密 {#windows-install-public-key}

**管理员账户不读 `~/.ssh/authorized_keys`。** Windows 的 `sshd_config` 末尾有这么一段：

```
Match Group administrators
    AuthorizedKeysFile __PROGRAMDATA__/ssh/administrators_authorized_keys
```

所以只要账户在 Administrators 组里，公钥就必须写到
`C:\ProgramData\ssh\administrators_authorized_keys`，写进用户目录是无效的 —— 而且不会有任何报错。

在 mac 上一条命令完成（首次需要输密码）：

```sh
ssh <用户>@<主机> "powershell -c \"[IO.File]::WriteAllText('C:\ProgramData\ssh\administrators_authorized_keys', (Get-Content -Raw C:\ProgramData\ssh\administrators_authorized_keys -ErrorAction SilentlyContinue) + '$(cat ~/.ssh/id_ed25519.pub)' + [char]10); icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r /grant Administrators:F /grant SYSTEM:F; Restart-Service sshd\""
```

三段缺一不可：

- `[IO.File]::WriteAllText` —— 用它而不是 `Add-Content`，是为了**避开 BOM**；结尾的 `[char]10`
  保证换行是 LF 而不是 CRLF。这两样任意一个出问题，sshd 都会认为这行公钥格式非法
- `icacls /inheritance:r` —— **最容易漏的一步**。权限不收紧，sshd 会**静默忽略整个文件**，
  表现就是「密钥明明加了却还是要密码」，且日志里看不出所以然
- `Restart-Service sshd`

验证：

```powershell
# 内容应只有公钥本身，没有 BOM、没有断行
Get-Content C:\ProgramData\ssh\administrators_authorized_keys

# 权限应只剩 Administrators 和 SYSTEM 两条
icacls C:\ProgramData\ssh\administrators_authorized_keys
```

### 把默认 shell 改成 PowerShell 7 {#windows-default-shell}

ssh 进 Windows 默认落在 `cmd.exe`。改成 pwsh 7 要写三个注册表值：

```powershell
$p = "HKLM:\SOFTWARE\OpenSSH"
if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null }

New-ItemProperty -Path $p -Name DefaultShell `
  -Value "C:\Program Files\PowerShell\7\pwsh.exe" -PropertyType String -Force
New-ItemProperty -Path $p -Name DefaultShellCommandOption `
  -Value "-Command" -PropertyType String -Force
New-ItemProperty -Path $p -Name DefaultShellArguments `
  -Value "-NoLogo" -PropertyType String -Force
```

| 值                          | 作用                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `DefaultShell`              | 交互式登录进入的 shell                                                                      |
| `DefaultShellCommandOption` | `ssh 主机 '命令'` 传参时用的开关。**不设的话 sshd 仍按 cmd 的 `/c` 传参，命令模式直接失效** |
| `DefaultShellArguments`     | 附加启动参数，`-NoLogo` 用来去掉启动横幅                                                    |

不需要重启 sshd，新会话立即生效。

**分两步做，别一次写完** —— `DefaultShell` 写错会让 `ssh 主机 '命令'` 失效，
而那正是唯一能远程改回来的通道，一旦失效就只能到机器跟前手动改注册表。
先设前两个值并验证命令模式可用，再加 `DefaultShellArguments`：

```sh
ssh <主机> '$PSVersionTable.PSVersion'   # 应输出 7.x
```

没装 pwsh 7 的话先装：

```powershell
winget install --id Microsoft.PowerShell
```

只有 Windows PowerShell 5.1 的机器，路径换成
`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`。注意 5.1 和 7 的
`$PROFILE` 是两个不同文件（`WindowsPowerShell\` 与 `PowerShell\`），在旧的里配好的东西不会自动带过来。

### 换完 shell 后可能冒出来的报错 {#post-switch-errors}

默认 shell 还是 `cmd.exe` 时 profile 根本不加载，所以换到 PowerShell 之后，
profile 里原有的问题会第一次暴露出来。

Windows 11 24H2 及以后的机器上最常见的是「不受信任的装入点」—— ssh 会话读不了
符号链接和 junction，凡是靠它们做版本切换的工具（fnm、WinGet 的 shim、pnpm、vite-plus）
都会在这里翻车。判别和修法见 windows 文档。
