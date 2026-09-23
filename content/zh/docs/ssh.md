---
description: 'OpenSSH 密钥、ssh-agent、1Password SSH agent 与 Windows 服务端配置'
---

# SSH

SSH 是远程登录和 Git 传输常用的加密协议。本页介绍密钥生成、ssh-agent、1Password SSH agent、commit 签名，以及把 Windows 配置为 SSH 服务端。

## 配置 {#configuration}

以下配置互相独立，按需选用。

### 生成 SSH 密钥 {#generate-an-ssh-key}

生成一把 Ed25519 密钥，把 `your_email@example.com` 换成自己的邮箱：

```sh
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 在 Windows 上启动 ssh-agent {#start-ssh-agent-on-windows}

Windows 需要先启动 ssh-agent 服务才能添加密钥：

```powershell
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service ssh-agent
```

### 通过 HTTPS 端口连接 GitHub {#connect-to-github-over-the-https-port}

在 `~/.ssh/config` 里加上：

```sshconfig
Host github.com
  HostName ssh.github.com
  Port 443
  User git
```

### 配置代理 {#configure-a-proxy}

在 `~/.ssh/config` 的 `Host` 块里加上：

```sshconfig
ProxyCommand nc -X 5 -x 127.0.0.1:6153 %h %p
```

### 使用 1Password SSH agent {#use-the-1password-ssh-agent}

私钥只保存在 1Password 里，不落盘。SSH 认证和 commit 签名都由 1Password 的 agent 提供，每次使用需生物识别授权：

```text
1Password（唯一私钥副本）
    │  agent.sock
    ├──→ ssh          认证
    └──→ op-ssh-sign  commit 签名
```

磁盘上只留公钥，供 ssh 在 agent 里定位对应私钥。

在 `~/.ssh/config` 里加上：

```sshconfig
# 只有「同一台服务器上有多个账号」时才需要下面这两行
Host codeup-admin
  HostName codeup.aliyun.com
  IdentityFile ~/.ssh/id_ed25519_admin.pub
  IdentitiesOnly yes

Host *
  IdentityAgent "~/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"
```

写法要点：

- **通配段放在文件末尾。** ssh_config 的大多数选项是「第一个匹配生效」，具体 `Host` 写在前面才能覆盖通配值。
- **通配段只写 `IdentityAgent`。** 提供哪几把密钥、按什么顺序提供，由 [agent.toml](#configure-the-1password-key-allowlist) 决定。
- **`IdentityFile` 指向公钥（`.pub`）。** ssh 用它在 agent 里查找对应私钥，本地不需要私钥文件。
- **`IdentityFile` 和 `IdentitiesOnly` 写在具体 `Host` 里。** `IdentityFile` 是累积型选项。写进 `Host *` 后，需要专用密钥的主机会先拿到通用密钥。写在具体 `Host` 里，`IdentitiesOnly yes` 只作用于该主机，其余主机照常走 agent。

### 配置 1Password 密钥白名单 {#configure-the-1password-key-allowlist}

在 `~/.config/1Password/ssh/agent.toml` 里列出要提供的密钥，`item` 填 1Password 条目标题：

```toml
[[ssh-keys]]
item = "Guany"
```

- 不配这个文件时，agent 只提供默认保管库（Personal / Private / Employee）里的 SSH 密钥。密钥放在自定义保管库时，必须配置这个文件。
- agent 按书写顺序把密钥提供给服务器。密钥多时，用顺序避免触发服务器常见的六次密钥尝试上限。
- 条目标题按精确匹配。在 1Password 里改了条目名，要同步修改这里，见[故障排查](#load-key-reports-invalid-format)。

### 用 1Password 签名 commit {#sign-commits-with-1password}

1. 在 `~/.gitconfig` 里加上，`signingkey` 填完整公钥：

   ```gitconfig
   [gpg]
   	format = ssh
   [gpg "ssh"]
   	program = /Applications/1Password.app/Contents/MacOS/op-ssh-sign
   	allowedSignersFile = ~/.config/git/allowed_signers
   [user]
   	signingkey = ssh-ed25519 AAAA…
   [commit]
   	gpgSign = true
   ```

2. 创建 `~/.config/git/allowed_signers`，一行一个签名者：

   ```text
   邮箱 ssh-ed25519 AAAA…
   ```

   没有这个文件，本地 `git log --show-signature` 会因找不到可信签名者而报错。

3. 在 GitHub 上再添加一次公钥，类型选 **Signing Key**。认证密钥和签名密钥要分别添加。

### 统一密钥命名 {#name-keys-consistently}

公钥末尾的 comment 不参与认证，只用于识别。以下三处用同一个值，用条目标题而非邮箱：

| 位置                                  | 值      |
| ------------------------------------- | ------- |
| 1Password 条目标题                    | `Guany` |
| 1Password 的 comment 字段             | `Guany` |
| 本地 `.pub`、各机器 `authorized_keys` | `Guany` |

不要清空 comment。`authorized_keys` 有多个条目时，没有 comment 只能逐条用 `ssh-keygen -lf` 比对指纹。

浏览器填充公钥时不带 comment。目标平台把公钥原样写进 `authorized_keys` 时，改用 `ssh-copy-id`，它会带上本地 `.pub` 的 comment。

### 清除服务器上的 Git 身份 {#remove-git-identity-from-servers}

不在服务器上提交代码时，清掉 Git 身份配置：

```sh
for k in user.email user.name user.signingkey gpg.format \
         gpg.ssh.allowedSignersFile commit.gpgSign tag.gpgSign; do
  git config --global --unset "$k"
done
rm -f ~/.config/git/allowed_signers
```

没有 `user.email` 时，`git commit` 会报 `*** Please tell me who you are.`，可防止误在服务器上提交。`insteadOf` 等不含个人信息的选项可以保留，方便 clone 和 pull。

需要临时提交一次时，在命令里传入身份：

```sh
git -c user.name=… -c user.email=… commit -m "…"
```

### 保留备用登录方式 {#keep-a-fallback-login-path}

私钥唯一副本在 1Password 里时，若再关闭密码登录，就只剩一条登录路径。账号锁定、服务故障，或设备丢失且没保存 Emergency Kit 时，将无法登录。

用云控制台的 VNC 或串口登录作为备用。它不经过 SSH，不增加攻击面。确认一次可用即可。

### 在 Windows 服务端安装公钥 {#install-a-public-key-on-a-windows-server}

Windows 的管理员账户不读 `~/.ssh/authorized_keys`。`sshd_config` 末尾有这一段：

```sshconfig
Match Group administrators
    AuthorizedKeysFile __PROGRAMDATA__/ssh/administrators_authorized_keys
```

账户在 Administrators 组里时，公钥必须写到 `C:\ProgramData\ssh\administrators_authorized_keys`。写进用户目录无效，也不会报错。

1. 在 macOS 客户端上运行以下命令，`<用户>` 和 `<主机>` 换成服务端的用户名和地址。首次需要输入密码：

   ```sh
   ssh <用户>@<主机> "powershell -c \"[IO.File]::WriteAllText('C:\ProgramData\ssh\administrators_authorized_keys', (Get-Content -Raw C:\ProgramData\ssh\administrators_authorized_keys -ErrorAction SilentlyContinue) + '$(cat ~/.ssh/id_ed25519.pub)' + [char]10); icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r /grant Administrators:F /grant SYSTEM:F; Restart-Service sshd\""
   ```

   命令的三部分缺一不可：

   - `[IO.File]::WriteAllText`：不写入 BOM；结尾的 `[char]10` 使换行为 LF。有 BOM 或 CRLF 时，sshd 认为公钥格式非法。
   - `icacls /inheritance:r`：收紧权限。权限过宽时，sshd 静默忽略整个文件。
   - `Restart-Service sshd`：重启 sshd。

2. 在服务端验证：

   ```powershell
   # 内容应只有公钥本身，没有 BOM、没有断行
   Get-Content C:\ProgramData\ssh\administrators_authorized_keys

   # 权限应只剩 Administrators 和 SYSTEM 两条
   icacls C:\ProgramData\ssh\administrators_authorized_keys
   ```

### 在 Windows 服务端把默认 shell 设为 PowerShell 7 {#set-powershell-7-as-the-default-shell-on-windows}

SSH 登录 Windows 默认进入 `cmd.exe`。改为 PowerShell 7 需要写三个注册表值：

| 值                          | 作用                                                                              |
| --------------------------- | --------------------------------------------------------------------------------- |
| `DefaultShell`              | 交互式登录进入的 shell                                                            |
| `DefaultShellCommandOption` | `ssh 主机 '命令'` 传参时用的开关。不设时 sshd 仍用 cmd 的 `/c` 传参，命令模式失效 |
| `DefaultShellArguments`     | 附加启动参数，`-NoLogo` 去掉启动横幅                                              |

分两步写入。`DefaultShell` 写错会使 `ssh 主机 '命令'` 失效，之后只能在本机手动改注册表。

1. 可选：没装 PowerShell 7 时先安装：

   ```powershell
   winget install --id Microsoft.PowerShell
   ```

2. 写入前两个值：

   ```powershell
   $p = "HKLM:\SOFTWARE\OpenSSH"
   if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null }

   New-ItemProperty -Path $p -Name DefaultShell `
     -Value "C:\Program Files\PowerShell\7\pwsh.exe" -PropertyType String -Force
   New-ItemProperty -Path $p -Name DefaultShellCommandOption `
     -Value "-Command" -PropertyType String -Force
   ```

3. 从客户端验证命令模式可用：

   ```sh
   ssh <主机> '$PSVersionTable.PSVersion'   # 应输出 7.x
   ```

4. 写入第三个值：

   ```powershell
   New-ItemProperty -Path $p -Name DefaultShellArguments `
     -Value "-NoLogo" -PropertyType String -Force
   ```

不需要重启 sshd，新会话立即生效。

只有 Windows PowerShell 5.1 时，把路径换成 `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`。5.1 和 7 的 `$PROFILE` 是两个不同文件（`WindowsPowerShell\` 与 `PowerShell\`），配置不会自动共用。

## 使用 {#usage}

日常管理密钥和连接的命令。

### 查看公钥 {#view-a-public-key}

macOS / Linux：

```sh
cat ~/.ssh/id_ed25519.pub
```

Windows（PowerShell）：

```powershell
cat $HOME\.ssh\id_ed25519.pub
```

### 测试 SSH 连接 {#test-the-ssh-connection}

测试与 GitHub 的连接：

```sh
ssh -T git@github.com
```

### 把密钥添加到 ssh-agent {#add-a-key-to-ssh-agent}

macOS / Linux：

```sh
ssh-add ~/.ssh/id_ed25519
```

Windows（PowerShell）：

```powershell
ssh-add $HOME\.ssh\id_ed25519
```

### 列出 ssh-agent 中的密钥 {#list-keys-in-ssh-agent}

列出已添加的密钥：

```sh
ssh-add -l
```

### 从 ssh-agent 移除密钥 {#remove-a-key-from-ssh-agent}

移除指定密钥，macOS / Linux：

```sh
ssh-add -d ~/.ssh/id_ed25519
```

Windows（PowerShell）：

```powershell
ssh-add -d $HOME\.ssh\id_ed25519
```

移除所有密钥：

```sh
ssh-add -D
```

### agent 转发 {#agent-forwarding}

开启 agent 转发前注意：

- 远端 root 能读取 `/tmp` 下的 agent socket，借用密钥连接任何信任你的机器。只对归属清楚的机器开启。
- 转发是会话级的。常驻会话（tmux、终端复用器的 pane）继承创建时那次连接的 socket 路径，原连接断开后失效，用 symlink 固定路径也无效。
- 远端不要设 `commit.gpgSign = true`，否则在没有 agent 的会话里 `git commit` 会失败。
- 自动化场景用专用的 deploy key，不要转发个人密钥。

### 验证 1Password 配置 {#verify-the-1password-setup}

逐项检查 agent、认证和签名，`主机`、`文件`、`OWNER/REPO` 换成实际值：

```sh
ssh-add -l                          # agent 是否提供密钥

ssh -v 主机 exit 2>&1 | grep -E "Will attempt key|Server accepts"
                                    # 应只尝试一把、一次命中

ssh-keygen -Y sign -f ~/.ssh/id_ed25519.pub -n test 文件
                                    # agent 是否真持有私钥

git log -1 --format="%G? %GS"       # G=有效 N=无签名 B=错误

gh api "/repos/OWNER/REPO/commits?per_page=5" \
  --jq '.[] | "\(.sha[0:7]) \(.commit.verification.reason)"'
                                    # 远端平台是否认可
```

删除本地私钥之前，先运行 `ssh-keygen -Y sign`。`ssh-add -l` 只证明 agent 知道这把密钥，签名成功才证明它持有可用的私钥。

## 故障排查 {#troubleshooting}

以下问题按现象列出。

### 连接成功但用了错误的身份 {#connection-succeeds-with-the-wrong-identity}

默认密钥在同一台服务器上也对应一个有效账号时，服务器会接受它，连接和命令都正常，只是身份错误。

对比 `ssh -v` 输出中 `Server accepts key` 那行的指纹与 `ssh-add -l` 的输出。确认后，在该主机的 `Host` 块里指定 `IdentityFile` 和 `IdentitiesOnly yes`，见[使用 1Password SSH agent](#use-the-1password-ssh-agent)。

### Load key 报 invalid format {#load-key-reports-invalid-format}

```text
Load key "~/.ssh/id_ed25519.pub": invalid format
```

原因：1Password 条目改了名，`agent.toml` 里的 `item` 没有同步，agent 不再提供密钥（`The agent has no identities`）。ssh 于是把公钥当私钥读取。此时 SSH、Git 和签名同时失效。

1. 把 `~/.config/1Password/ssh/agent.toml` 里的 `item` 改为当前条目标题。
2. 运行 `ssh-add -l`，确认 agent 列出密钥。

### GitHub 上 commit 显示 Unverified {#github-shows-commits-as-unverified}

原因：公钥只作为认证密钥添加，没有作为签名密钥添加。

1. 在 GitHub 上把公钥再添加一次，类型选 **Signing Key**。
2. 用[验证 1Password 配置](#verify-the-1password-setup)里的 `gh api` 命令查看 `verification.reason`：
   - `unsigned`：commit 没有签名。
   - `unknown_key`：平台不认识这把密钥（没添加，或添加成了 Authentication 类型）。
   - `bad_email`：签名密钥关联的邮箱与 commit author 不一致。

### Windows 服务端添加公钥后仍要求密码 {#windows-server-still-asks-for-a-password}

原因通常是以下之一，日志里没有明确提示：

- 账户在 Administrators 组里，公钥写进了用户目录的 `authorized_keys`。
- `administrators_authorized_keys` 的权限没有收紧，sshd 忽略了整个文件。
- 文件带 BOM 或 CRLF 换行，sshd 认为公钥格式非法。

按[在 Windows 服务端安装公钥](#install-a-public-key-on-a-windows-server)重新写入，并运行其中的验证命令。

### 改用 PowerShell 后 SSH 会话报错 {#ssh-sessions-show-errors-after-switching-to-powershell}

默认 shell 是 `cmd.exe` 时 profile 不加载。改用 PowerShell 后，profile 里已有的问题会第一次出现。

Windows 11 24H2 及以后最常见的是「不受信任的装入点」：SSH 会话读不了部分符号链接和 junction，依赖它们的工具（fnm、WinGet 的 shim、pnpm、vite-plus）会报错。修复方法：用 `mklink /J` 重建被拦的 junction；把 `%LOCALAPPDATA%\Microsoft\WinGet\Packages\<包 ID>` 加到用户 PATH 前面，绕开 WinGet 的 shim；安装和升级改到本地或远程桌面做。
