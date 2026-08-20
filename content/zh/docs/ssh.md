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

## 交给 1Password 托管 {#1password-agent}

私钥不落盘，认证和 commit 签名都由 1Password 的 agent 提供，每次使用需生物识别授权。

```
1Password（唯一私钥副本）
    │  agent.sock
    ├──→ ssh          认证
    └──→ op-ssh-sign  commit 签名
```

磁盘上只留公钥，供 ssh 在 agent 里定位对应私钥。

### ssh 配置 {#1password-ssh-config}

通配段要放在**文件末尾**。ssh_config 中大多数选项是「第一个匹配生效」，
具体 Host 写在前面才能覆盖通配值。

```sshconfig
Host *
  IdentityAgent "~/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"
  IdentitiesOnly yes

Host * !某个用专用密钥的主机
  IdentityFile ~/.ssh/id_ed25519.pub
```

三个容易错的地方：

- **`IdentityFile` 指向公钥（`.pub`）而不是私钥。** ssh 用它在 agent 里查找对应私钥，
  本地不需要有私钥文件。
- **`IdentitiesOnly yes` 必须配合 `IdentityFile`。** 只写 `IdentityAgent` 不加这条，
  ssh 会把 agent 里所有密钥依次甩给服务器，`ssh -v` 还能看到它尝试
  `id_rsa`、`id_ecdsa`、`id_ecdsa_sk` 这些根本不存在的文件 —— 既泄露全部公钥，
  密钥多了还会撞 `MaxAuthTries`。
- **专用密钥要用否定匹配隔离。** `IdentityFile` 是累积型选项，而且 ssh 实际按
  **agent 返回的密钥顺序**尝试，不是 config 里的书写顺序。通配段无条件提供通用密钥时，
  某个 Host 单独指定的专用密钥会排在后面轮不上，得用 `Host * !主机名` 把它排除。

### 密钥白名单 {#agent-toml}

`~/.config/1Password/ssh/agent.toml`：

```toml
[[ssh-keys]]
item = "Guany"
```

不配这个文件，agent 会把保管库里所有 SSH 密钥暴露给任何请求签名的进程。

**它按条目标题精确匹配。** 在 1Password 里改了条目名而没同步这里，agent 立刻变成
`The agent has no identities`，SSH、git、签名同时失效。而报错会伪装成这样：

```
Load key "~/.ssh/id_ed25519.pub": invalid format
```

看着像公钥文件坏了，实际是 agent 没提供密钥之后，ssh 退而把公钥当私钥读。
不知道这层关系的话很容易往错误方向查。

### commit 签名 {#commit-signing}

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

`allowedSignersFile` 常被漏掉。没有它，本地 `git log --show-signature` 会因为找不到
可信签名者而报错，只有远端平台能验证。内容一行一个签名者：

```
邮箱 ssh-ed25519 AAAA…
```

公钥还需要在 GitHub 上**再添加一次**，类型选 **Signing Key** —— 认证和签名是两种用途，
只加了认证密钥的话本地签名正常，网页上仍显示 Unverified。

### 密钥命名 {#key-naming}

公钥末尾的 comment 不参与认证，纯粹用于识别。三处保持一致，用条目标题而非邮箱：

| 位置 | 值 |
|---|---|
| 1Password 条目标题 | `Guany` |
| 1Password 的 comment 字段 | `Guany` |
| 本地 `.pub`、各机器 `authorized_keys` | `Guany` |

**不建议清空 comment。** `authorized_keys` 有多个条目时，清空后想分清哪把是自己的、
哪把该去问人，只能逐条 `ssh-keygen -lf` 比对指纹。

浏览器填充公钥时不带 comment（网站的名称字段会自动填成条目标题）。如果目标平台是把
公钥原样写进 `authorized_keys`，落盘的就是无 comment 的裸 base64 —— 这种场景改用
`ssh-copy-id`，它会带上本地 `.pub` 的 comment。

### agent 转发 {#agent-forwarding}

远端 root 能读 `/tmp` 下的 agent socket 并借用密钥去连任何信任你的机器。
是否开启取决于那台机器的归属是否清楚、会不会长时间挂着连接。

**转发是会话级的，常驻会话（tmux、终端复用器的 pane）用不了。** 它继承的是创建时
那次连接的 socket 路径，原连接一断就失效。想用 symlink 把路径固定下来也治标不治本 ——
socket 本身随连接消失。所以：

- 远端**不要**设 `commit.gpgSign = true`，否则没有 agent 的会话里 `git commit` 直接失败
- 自动化场景应该用专用的 deploy key，而不是转发个人密钥

### 服务器上不留个人信息 {#no-identity-on-servers}

不在服务器上提交代码的话，清掉 git 身份配置：

```sh
for k in user.email user.name user.signingkey gpg.format \
         gpg.ssh.allowedSignersFile commit.gpgSign tag.gpgSign; do
  git config --global --unset "$k"
done
rm -f ~/.config/git/allowed_signers
```

副作用是有益的：没有 `user.email` 时 `git commit` 会直接报
`*** Please tell me who you are.`，等于给「别在服务器上提交」加了一道硬防线，
比靠记性可靠。`insteadOf` 之类不含个人信息的选项可以留着，方便 clone/pull。

确实需要临时提交一次时，不留全局配置：

```sh
git -c user.name=… -c user.email=… commit -m "…"
```

### 验证 {#1password-verify}

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

`verification.reason` 有诊断价值：`unsigned` 是没签名，`unknown_key` 是平台不认识这把
钥匙（公钥没加，或加成了 Authentication 类型），`bad_email` 是签名密钥关联的邮箱与
commit author 对不上。

**删本地私钥之前一定要先跑 `ssh-keygen -Y sign`。** `ssh-add -l` 只能证明 agent
知道有这把钥匙，签名成功才证明它真的持有私钥、能用。

### 应急访问 {#break-glass}

私钥唯一副本在 1Password，若再关闭密码登录，就只剩单一进入路径 —— 账号锁定、
服务故障、设备丢失且 Emergency Kit 没保存好时会完全进不去。

优先用云控制台的 VNC / 串口登录兜底：不经过 SSH，零新增攻击面，确认一次可用即可。

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
