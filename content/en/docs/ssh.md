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

## Delegating Keys to 1Password

The private key never touches disk. Both authentication and commit signing go through
1Password's agent, and each use requires biometric approval.

```
1Password (sole copy of the private key)
    │  agent.sock
    ├──→ ssh           authentication
    └──→ op-ssh-sign   commit signing
```

Only public keys stay on disk — ssh uses them to locate the matching private key in the agent.

### ssh Configuration

The wildcard block belongs at the **end of the file**. Most ssh_config options take the
first matching value, so a specific `Host` must appear earlier to override the wildcard.

```sshconfig
Host *
  IdentityAgent "~/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"
  IdentitiesOnly yes

Host * !some-host-with-a-dedicated-key
  IdentityFile ~/.ssh/id_ed25519.pub
```

Three things that are easy to get wrong:

- **`IdentityFile` points at the public key (`.pub`), not the private key.** ssh uses it
  to find the matching private key inside the agent; no private key file is needed locally.
- **`IdentitiesOnly yes` only works alongside `IdentityFile`.** With `IdentityAgent` alone,
  ssh offers every key in the agent to the server one by one — `ssh -v` even shows it
  trying `id_rsa`, `id_ecdsa`, `id_ecdsa_sk` and other files that do not exist. That leaks
  all your public keys, and with enough keys it hits `MaxAuthTries`.
- **Isolate a dedicated key with a negated match.** `IdentityFile` is cumulative, and ssh
  tries keys in the order **the agent returns them**, not the order written in the config.
  When the wildcard block offers the general key unconditionally, a per-host dedicated key
  ends up behind it and never gets its turn. Exclude the host with `Host * !hostname`.

### Key Allowlist

`~/.config/1Password/ssh/agent.toml`:

```toml
[[ssh-keys]]
item = "Guany"
```

Without this file the agent exposes every SSH key in the vault to any process that asks
for a signature.

**It matches on the item title, exactly.** Rename the item in 1Password without updating
this file and the agent immediately reports `The agent has no identities` — SSH, git and
signing all break at once. The error disguises itself as:

```
Load key "~/.ssh/id_ed25519.pub": invalid format
```

That reads like a corrupted public key file. What actually happened is that the agent
offered nothing, so ssh fell back to reading the public key as if it were private.
Without knowing that connection, this sends you down the wrong path.

### Commit Signing

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

`allowedSignersFile` is the commonly missed one. Without it, local
`git log --show-signature` fails to find a trusted signer and only the remote platform can
verify anything. One signer per line:

```
email ssh-ed25519 AAAA…
```

The public key also has to be added to GitHub a **second time**, with key type
**Signing Key**. Authentication and signing are separate purposes — with only the
authentication key registered, local signing succeeds while the web UI still says Unverified.

### Naming Keys

The comment at the end of a public key plays no part in authentication; it exists purely
for identification. Keep it consistent in three places, using the item title rather than
an email address:

| Location | Value |
|---|---|
| 1Password item title | `Guany` |
| 1Password comment field | `Guany` |
| Local `.pub` and every `authorized_keys` | `Guany` |

**Do not blank the comment.** With several entries in `authorized_keys`, telling which key
is yours and which one to ask about then requires comparing fingerprints line by line with
`ssh-keygen -lf`.

Browser autofill inserts the public key without a comment (the site's name field gets the
item title instead). If the target platform writes the key verbatim into `authorized_keys`,
what lands there is bare base64 with no comment — use `ssh-copy-id` for those, since it
carries the comment from the local `.pub`.

### Agent Forwarding

Root on the remote host can read the agent socket under `/tmp` and borrow your key to reach
any machine that trusts you. Whether to enable it depends on how well you know who owns
that machine, and whether you keep long-lived connections open.

**Forwarding is per-session, so long-lived sessions (tmux, multiplexer panes) cannot use
it.** Such a session inherits the socket path from the connection that created it, and that
path dies with the connection. Pinning it behind a symlink does not help — the socket
itself is gone. Therefore:

- Do **not** set `commit.gpgSign = true` on remote hosts, or `git commit` fails outright in
  any session without an agent
- Automation should use a dedicated deploy key rather than a forwarded personal key

### Keeping Identity off Servers

If you never commit on a server, strip the git identity:

```sh
for k in user.email user.name user.signingkey gpg.format \
         gpg.ssh.allowedSignersFile commit.gpgSign tag.gpgSign; do
  git config --global --unset "$k"
done
rm -f ~/.config/git/allowed_signers
```

The side effect is a welcome one: with no `user.email`, `git commit` refuses outright with
`*** Please tell me who you are.` — turning "don't commit on servers" from a habit into
something the tooling enforces. Options that carry no personal data, such as `insteadOf`,
are worth keeping for clone/pull.

When a one-off commit really is necessary, pass the identity inline instead:

```sh
git -c user.name=… -c user.email=… commit -m "…"
```

### Verification

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

`verification.reason` is worth reading: `unsigned` means no signature at all,
`unknown_key` means the platform does not recognise the key (not added, or added as an
Authentication key), and `bad_email` means the signing key's address does not match the
commit author.

**Always run `ssh-keygen -Y sign` before deleting a local private key.** `ssh-add -l` only
proves the agent knows about the key; a successful signature proves it actually holds a
usable private key.

### Break-Glass Access

With the only copy of the private key in 1Password and password login disabled, there is a
single way in. A locked account, a service outage, or a lost device with no saved Emergency
Kit leaves you shut out.

Prefer the cloud console's VNC or serial console as a fallback: it bypasses SSH entirely and
adds no attack surface. Verifying once that it works is enough.

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
