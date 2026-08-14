# ssh

SSH

## Generate a New SSH Key

```sh
ssh-keygen -t ed25519 -C "your_email@example.com"
```

## View SSH Key

### macOS / Linux

```sh
cat ~/.ssh/id_ed25519.pub
```

### Windows (PowerShell)

```powershell
cat $HOME\.ssh\id_ed25519.pub
```

## Configure GitHub to Use SSH over the HTTPS Port

```
Host github.com
  HostName ssh.github.com
  Port 443
  User git
```

## Test SSH Connection

```sh
ssh -T git@github.com
```

## Configure Proxy

```
ProxyCommand nc -X 5 -x 127.0.0.1:7890 %h %p
```

## SSH Agent Key Management

### Start ssh-agent Service on Windows

On Windows, you need to start the ssh-agent service before using it:

```powershell
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service ssh-agent
```

### Add Key to SSH Agent

macOS / Linux:

```sh
ssh-add ~/.ssh/id_ed25519
```

Windows (PowerShell):

```powershell
ssh-add $HOME\.ssh\id_ed25519
```

### List Added Keys

```sh
ssh-add -l
```

### Remove Key from SSH Agent

Remove a specific key:

macOS / Linux:

```sh
ssh-add -d ~/.ssh/id_ed25519
```

Windows (PowerShell):

```powershell
ssh-add -d $HOME\.ssh\id_ed25519
```

Remove all keys:

```sh
ssh-add -D
```

## Windows as the Server

### Installing a Public Key for Passwordless Login

**Administrator accounts do not read `~/.ssh/authorized_keys`.** The Windows `sshd_config`
ends with this block:

```
Match Group administrators
    AuthorizedKeysFile __PROGRAMDATA__/ssh/administrators_authorized_keys
```

So for any account in the Administrators group the key must go into
`C:\ProgramData\ssh\administrators_authorized_keys`. Writing it to the home directory does
nothing — and reports no error either.

One command from the mac side (a password is needed the first time):

```sh
ssh <user>@<host> "powershell -c \"[IO.File]::WriteAllText('C:\ProgramData\ssh\administrators_authorized_keys', (Get-Content -Raw C:\ProgramData\ssh\administrators_authorized_keys -ErrorAction SilentlyContinue) + '$(cat ~/.ssh/id_ed25519.pub)' + [char]10); icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r /grant Administrators:F /grant SYSTEM:F; Restart-Service sshd\""
```

All three parts matter:

- `[IO.File]::WriteAllText` — used instead of `Add-Content` to **avoid a BOM**; the trailing
  `[char]10` keeps the line ending as LF rather than CRLF. Either one going wrong makes sshd
  treat the key line as malformed
- `icacls /inheritance:r` — **the step everyone forgets**. Without tightened permissions sshd
  **silently ignores the whole file**; the symptom is "the key is installed but it still asks
  for a password", with nothing useful in the log
- `Restart-Service sshd`

Verify:

```powershell
# Should contain only the key itself — no BOM, no wrapped lines
Get-Content C:\ProgramData\ssh\administrators_authorized_keys

# Only Administrators and SYSTEM should remain
icacls C:\ProgramData\ssh\administrators_authorized_keys
```

### Switching the Default Shell to PowerShell 7

An ssh session into Windows lands in `cmd.exe` by default. Switching to pwsh 7 takes three
registry values:

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

| Value                       | Purpose                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `DefaultShell`              | The shell an interactive login drops into                                                                                            |
| `DefaultShellCommandOption` | The switch used to pass `ssh host 'command'`. **Leave it unset and sshd keeps using cmd's `/c`, which breaks command mode outright** |
| `DefaultShellArguments`     | Extra startup arguments; `-NoLogo` suppresses the banner                                                                             |

No sshd restart is needed — new sessions pick it up immediately.

**Do it in two steps, not one.** A wrong `DefaultShell` breaks `ssh host 'command'`, which is
the only channel left for fixing it remotely; once it is gone the registry has to be edited at
the machine itself. Set the first two values, confirm command mode still works, then add
`DefaultShellArguments`:

```sh
ssh <host> '$PSVersionTable.PSVersion'   # should print 7.x
```

If pwsh 7 is not installed yet:

```powershell
winget install --id Microsoft.PowerShell
```

On a machine that only has Windows PowerShell 5.1, use
`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe` instead. Note that 5.1 and 7 have
separate `$PROFILE` files (`WindowsPowerShell\` vs `PowerShell\`), so anything configured in
the old one does not carry over.

### Errors that surface after the switch

While the default shell is still `cmd.exe` the profile never loads, so switching to PowerShell
is the moment any pre-existing problem in it shows up for the first time.

On Windows 11 24H2 and later the usual one is "untrusted mount point": an SSH session cannot
read symbolic links or junctions, so every tool that relies on them for version switching —
fnm, the WinGet shims, pnpm, vite-plus — trips over it here. See the windows page for the
diagnosis and the fixes.
