---
description: 'OpenSSH keys, ssh-agent, the 1Password SSH agent, and Windows as an SSH server'
---

# SSH

SSH is the encrypted protocol for remote login and Git transport. This page covers key generation, ssh-agent, the 1Password SSH agent, commit signing, and setting up Windows as an SSH server.

## Configuration

The settings below are independent. Use the ones you need.

### Generate an SSH key

Generate an Ed25519 key. Replace `your_email@example.com` with your email address:

```sh
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### Start ssh-agent on Windows

On Windows, start the ssh-agent service before adding keys:

```powershell
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service ssh-agent
```

### Connect to GitHub over the HTTPS port

Add this to `~/.ssh/config`:

```sshconfig
Host github.com
  HostName ssh.github.com
  Port 443
  User git
```

### Configure a proxy

Add this to a `Host` block in `~/.ssh/config`:

```sshconfig
ProxyCommand nc -X 5 -x 127.0.0.1:6153 %h %p
```

### Use the 1Password SSH agent

The private key stays in 1Password and never touches disk. The 1Password agent handles both SSH authentication and commit signing, and each use requires biometric approval:

```text
1Password (sole copy of the private key)
    │  agent.sock
    ├──→ ssh           authentication
    └──→ op-ssh-sign   commit signing
```

Only public keys stay on disk. ssh uses them to locate the matching private key in the agent.

Add this to `~/.ssh/config`:

```sshconfig
# The two lines below are only needed when one server hosts several accounts
Host codeup-admin
  HostName codeup.aliyun.com
  IdentityFile ~/.ssh/id_ed25519_admin.pub
  IdentitiesOnly yes

Host *
  IdentityAgent "~/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"
```

Key points:

- **Put the wildcard block at the end of the file.** Most ssh_config options take the first matching value, so a specific `Host` must come first to override the wildcard.
- **Put only `IdentityAgent` in the wildcard block.** [agent.toml](#configure-the-1password-key-allowlist) decides which keys the agent offers and in what order.
- **Point `IdentityFile` at the public key (`.pub`).** ssh uses it to find the matching private key in the agent. No private key file is needed locally.
- **Put `IdentityFile` and `IdentitiesOnly` in the specific `Host`.** `IdentityFile` is cumulative. Under `Host *`, the host that needs a dedicated key gets the general key first. In the specific `Host`, `IdentitiesOnly yes` applies only to that host, and every other host keeps using the agent.

### Configure the 1Password key allowlist

List the keys to offer in `~/.config/1Password/ssh/agent.toml`. Set `item` to the 1Password item title:

```toml
[[ssh-keys]]
item = "Guany"
```

- Without this file, the agent only offers SSH keys from the default vault (Personal / Private / Employee). If your keys are in custom vaults, this file is required.
- The agent offers keys in the order they appear in the file. With several keys, use the order to stay under the six-attempt limit most servers impose.
- Item titles must match exactly. If you rename an item in 1Password, update this file too. See [Troubleshooting](#load-key-reports-invalid-format).

### Sign commits with 1Password

1. Add this to `~/.gitconfig`. Set `signingkey` to the full public key:

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

2. Create `~/.config/git/allowed_signers` with one signer per line:

   ```text
   email ssh-ed25519 AAAA…
   ```

   Without this file, local `git log --show-signature` fails to find a trusted signer.

3. Add the public key to GitHub a second time, with key type **Signing Key**. Authentication keys and signing keys are added separately.

### Name keys consistently

The comment at the end of a public key plays no part in authentication. It only identifies the key. Use the same value in these three places, and use the item title rather than an email address:

| Location                                 | Value   |
| ---------------------------------------- | ------- |
| 1Password item title                     | `Guany` |
| 1Password comment field                  | `Guany` |
| Local `.pub` and every `authorized_keys` | `Guany` |

Do not blank the comment. With several entries in `authorized_keys` and no comments, you have to compare fingerprints line by line with `ssh-keygen -lf`.

Browser autofill inserts the public key without a comment. If the target platform writes the key verbatim into `authorized_keys`, use `ssh-copy-id` instead. It carries the comment from the local `.pub`.

### Remove Git identity from servers

If you do not commit on a server, remove the Git identity settings:

```sh
for k in user.email user.name user.signingkey gpg.format \
         gpg.ssh.allowedSignersFile commit.gpgSign tag.gpgSign; do
  git config --global --unset "$k"
done
rm -f ~/.config/git/allowed_signers
```

Without `user.email`, `git commit` fails with `*** Please tell me who you are.`, which prevents accidental commits on the server. Options without personal data, such as `insteadOf`, can stay for clone and pull.

For a one-off commit, pass the identity on the command line:

```sh
git -c user.name=… -c user.email=… commit -m "…"
```

### Keep a fallback login path

If the only copy of the private key is in 1Password and password login is disabled, there is a single way in. A locked account, a service outage, or a lost device without a saved Emergency Kit locks you out.

Use the cloud console's VNC or serial console as a fallback. It bypasses SSH and adds no attack surface. Verify once that it works.

### Install a public key on a Windows server

Administrator accounts on Windows do not read `~/.ssh/authorized_keys`. The Windows `sshd_config` ends with this block:

```sshconfig
Match Group administrators
    AuthorizedKeysFile __PROGRAMDATA__/ssh/administrators_authorized_keys
```

For any account in the Administrators group, the key must go into `C:\ProgramData\ssh\administrators_authorized_keys`. A key in the home directory is ignored without an error.

1. On the macOS client, run this command. Replace `<user>` and `<host>` with the server's user name and address. The first run asks for a password:

   ```sh
   ssh <user>@<host> "powershell -c \"[IO.File]::WriteAllText('C:\ProgramData\ssh\administrators_authorized_keys', (Get-Content -Raw C:\ProgramData\ssh\administrators_authorized_keys -ErrorAction SilentlyContinue) + '$(cat ~/.ssh/id_ed25519.pub)' + [char]10); icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r /grant Administrators:F /grant SYSTEM:F; Restart-Service sshd\""
   ```

   All three parts are required:

   - `[IO.File]::WriteAllText`: writes no BOM, and the trailing `[char]10` makes the line ending LF. With a BOM or CRLF, sshd treats the key as malformed.
   - `icacls /inheritance:r`: tightens permissions. With looser permissions, sshd silently ignores the whole file.
   - `Restart-Service sshd`: restarts sshd.

2. Verify on the server:

   ```powershell
   # Should contain only the key itself — no BOM, no wrapped lines
   Get-Content C:\ProgramData\ssh\administrators_authorized_keys

   # Only Administrators and SYSTEM should remain
   icacls C:\ProgramData\ssh\administrators_authorized_keys
   ```

### Set PowerShell 7 as the default shell on Windows

An SSH session into Windows starts in `cmd.exe` by default. Switching to PowerShell 7 takes three registry values:

| Value                       | Purpose                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `DefaultShell`              | The shell an interactive login starts                                                                       |
| `DefaultShellCommandOption` | The switch used to pass `ssh host 'command'`. If unset, sshd keeps using cmd's `/c` and command mode breaks |
| `DefaultShellArguments`     | Extra startup arguments. `-NoLogo` suppresses the banner                                                    |

Write them in two stages. A wrong `DefaultShell` breaks `ssh host 'command'`, and the registry then has to be fixed at the machine itself.

1. Optional: install PowerShell 7 if it is missing:

   ```powershell
   winget install --id Microsoft.PowerShell
   ```

2. Write the first two values:

   ```powershell
   $p = "HKLM:\SOFTWARE\OpenSSH"
   if (-not (Test-Path $p)) { New-Item -Path $p -Force | Out-Null }

   New-ItemProperty -Path $p -Name DefaultShell `
     -Value "C:\Program Files\PowerShell\7\pwsh.exe" -PropertyType String -Force
   New-ItemProperty -Path $p -Name DefaultShellCommandOption `
     -Value "-Command" -PropertyType String -Force
   ```

3. From the client, confirm that command mode works:

   ```sh
   ssh <host> '$PSVersionTable.PSVersion'   # should print 7.x
   ```

4. Write the third value:

   ```powershell
   New-ItemProperty -Path $p -Name DefaultShellArguments `
     -Value "-NoLogo" -PropertyType String -Force
   ```

No sshd restart is needed. New sessions pick up the change.

On a machine with only Windows PowerShell 5.1, use `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe` as the path. 5.1 and 7 have separate `$PROFILE` files (`WindowsPowerShell\` and `PowerShell\`), so settings in one do not apply to the other.

## Usage

Everyday commands for keys and connections.

### View a public key

macOS / Linux:

```sh
cat ~/.ssh/id_ed25519.pub
```

Windows (PowerShell):

```powershell
cat $HOME\.ssh\id_ed25519.pub
```

### Test the SSH connection

Test the connection to GitHub:

```sh
ssh -T git@github.com
```

### Add a key to ssh-agent

macOS / Linux:

```sh
ssh-add ~/.ssh/id_ed25519
```

Windows (PowerShell):

```powershell
ssh-add $HOME\.ssh\id_ed25519
```

### List keys in ssh-agent

List the keys that have been added:

```sh
ssh-add -l
```

### Remove a key from ssh-agent

Remove a specific key on macOS / Linux:

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

### Agent forwarding

Before you enable agent forwarding, note:

- Root on the remote host can read the agent socket under `/tmp` and use your key to reach any machine that trusts you. Enable forwarding only for machines whose ownership is clear.
- Forwarding is per session. Long-lived sessions (tmux, multiplexer panes) inherit the socket path of the connection that created them, and it stops working when that connection closes. Pinning the path with a symlink does not help.
- Do not set `commit.gpgSign = true` on remote hosts, or `git commit` fails in any session without an agent.
- For automation, use a dedicated deploy key instead of a forwarded personal key.

### Verify the 1Password setup

Check the agent, authentication, and signing. Replace `host`, `FILE`, and `OWNER/REPO` with real values:

```sh
ssh-add -l                          # does the agent offer any keys

ssh -v host exit 2>&1 | grep -E "Will attempt key|Server accepts"
                                    # should try exactly one key and hit on the first

ssh-keygen -Y sign -f ~/.ssh/id_ed25519.pub -n test FILE
                                    # does the agent actually hold the private key

git log -1 --format="%G? %GS"       # G=good N=none B=bad

gh api "/repos/OWNER/REPO/commits?per_page=5" \
  --jq '.[] | "\(.sha[0:7]) \(.commit.verification.reason)"'
                                    # does the remote platform accept it
```

Before you delete a local private key, run `ssh-keygen -Y sign`. `ssh-add -l` only proves that the agent knows about the key. A successful signature proves that it holds a usable private key.

## Troubleshooting

The problems below are listed by symptom.

### Connection succeeds with the wrong identity

If your default key is also a valid account on the same server, the server accepts it. The connection and commands work, but the identity is wrong.

Compare the fingerprint on the `Server accepts key` line of `ssh -v` with the output of `ssh-add -l`. Then set `IdentityFile` and `IdentitiesOnly yes` in that host's `Host` block. See [Use the 1Password SSH agent](#use-the-1password-ssh-agent).

### Load key reports invalid format

```text
Load key "~/.ssh/id_ed25519.pub": invalid format
```

Cause: the 1Password item was renamed but `item` in `agent.toml` was not updated, so the agent offers no keys (`The agent has no identities`). ssh then reads the public key as if it were private. SSH, Git, and signing all fail at once.

1. Change `item` in `~/.config/1Password/ssh/agent.toml` to the current item title.
2. Run `ssh-add -l` and confirm that the agent lists the key.

### GitHub shows commits as Unverified

Cause: the public key was added only as an authentication key, not as a signing key.

1. Add the public key to GitHub again, with key type **Signing Key**.
2. Check `verification.reason` with the `gh api` command in [Verify the 1Password setup](#verify-the-1password-setup):
   - `unsigned`: the commit has no signature.
   - `unknown_key`: the platform does not recognize the key (not added, or added as an Authentication key).
   - `bad_email`: the email linked to the signing key does not match the commit author.

### Windows server still asks for a password

The cause is usually one of the following, and the log gives no clear hint:

- The account is in the Administrators group, and the key was written to `authorized_keys` in the home directory.
- Permissions on `administrators_authorized_keys` were not tightened, so sshd ignores the whole file.
- The file has a BOM or CRLF line endings, so sshd treats the key as malformed.

Write the key again as described in [Install a public key on a Windows server](#install-a-public-key-on-a-windows-server), and run the verification commands there.

### SSH sessions show errors after switching to PowerShell

While the default shell is `cmd.exe`, the profile never loads. After switching to PowerShell, existing problems in the profile show up for the first time.

On Windows 11 24H2 and later, the most common one is "untrusted mount point": SSH sessions cannot read some symbolic links and junctions, so tools that rely on them (fnm, the WinGet shims, pnpm, vite-plus) fail. To fix it, recreate blocked junctions with `mklink /J`, put `%LOCALAPPDATA%\Microsoft\WinGet\Packages\<package ID>` at the front of the user PATH to bypass the WinGet shims, and install or upgrade locally or over Remote Desktop.
