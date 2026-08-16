# mise

mise

## Installation

The official installer ships an optimized single binary, and it is **the only method that supports
`mise self-update`**:

```sh
curl https://mise.run | sh
```

It lands in `~/.local/bin/mise`. Same command on macOS and Linux.

Windows:

```powershell
winget install --id jdx.mise
```

**Package-manager builds lag behind and cannot self-update.** The Homebrew build refuses outright:

```
mise ERROR mise is installed via a package manager, cannot update
```

mise releases almost daily, and it talks to aqua, GitHub releases and language registries that keep
changing upstream — which is why the docs recommend staying on a recent version. Handing that
schedule to a formula maintainer is a poor trade. The winget build does allow `self-update`.

## Shell Integration

```sh
eval "$(mise activate zsh)"
```

```powershell
(&mise activate pwsh) | Out-String | Invoke-Expression
```

PowerShell supports both `mise activate` and the `chpwd` hook. The FAQ passage claiming native
Windows only works "via the use of shims until someone adds powershell support" is **stale** — the
shell compatibility table in the same docs lists `mise activate` as Yes for PowerShell. Only
`[shell_alias]` is genuinely unsupported.

### Non-interactive shells need shims

`mise activate` belongs in `.zshrc`, and `.zshrc` is never read non-interactively. `ssh host
'command'`, LaunchAgents, cron and CI all take that path and would see none of the managed tools.

Put the shims directory in `.zshenv` to cover them:

```sh
path=(
  "$HOME/.local/bin"
  "$HOME/.local/share/mise/shims"
  $path
)
```

Shims resolve the version for the current directory themselves, so **per-project switching still
works** without activation:

```sh
zsh -lc 'cd ~/i/some-project && pnpm -v'   # the version the project pins, not the global fallback
```

That is strictly better than fnm's `aliases/default/bin` fallback, which is pinned to one version.

### PATH order: installs first, shims after

In interactive shells `mise activate` prepends `~/.local/share/mise/installs/*`. Shims are only a
fallback and must sit behind them.

On macOS also mind `path_helper`: it runs from `/etc/zprofile` and moves the system paths to the
front, pushing anything set in `.zshenv` behind `/usr/bin` and even `/opt/homebrew/bin`. So the
shims need to be re-prepended in `.zprofile` as well:

```sh
path=(
  "$HOME/.local/bin"
  "$HOME/.local/share/mise/shims"     # must come before homebrew
  $path
)
```

Skip this and a future `brew install node` will silently shadow whatever version mise selected.

## Where Versions Come From

The global config lives at `~/.config/mise/config.toml` (same path on Windows, `~\.config\mise\`):

```toml
[tools]
node = "24"
pnpm = "11.21.0"
"npm:@antfu/ni" = "latest"
```

A `mise.toml` or `.tool-versions` in the project overrides it.

### package.json fields are off by default

`.nvmrc`, `.node-version` and the package.json fields are what mise calls idiomatic version files,
and they are **all disabled by default**. Enable them explicitly:

```toml
[settings]
idiomatic_version_file_enable_tools = ["node", "pnpm", "npm", "yarn"]
```

Once enabled, mise reads the `packageManager` and `devEngines` fields
([jdx/mise#8059](https://github.com/jdx/mise/pull/8059)) — enough to replace corepack for
per-project pnpm versions.

**It does not read the traditional `engines.node`.** That PR
([#2288](https://github.com/jdx/mise/pull/2288)) was never merged. fnm's `--resolve-engines` reads
exactly that field, so the capability is lost in the migration — projects relying on `engines.node`
need `devEngines.runtime` or a `.node-version` instead.

## The GitHub API Rate Limit

mise queries the GitHub Releases API to resolve versions, and the anonymous quota is only **60
requests per hour**. Once exhausted, every install fails:

```
mise WARN  GitHub rate limit exceeded
mise WARN  [pnpm/pnpm] failed to fetch version tags: HTTP status client error (403 Forbidden)
```

mise reads a token from the gh CLI's `hosts.yml` by default (`github.gh_cli_tokens` is true).
**But when gh stores its token in the system keyring, `hosts.yml` holds nothing**, so that path
yields no token:

```sh
gh auth status     # ✓ Logged in ... (keyring)
grep token ~/.config/gh/hosts.yml    # nothing
```

Fetch it on demand instead — the token never touches disk or the environment:

```toml
[settings.github]
credential_command = "gh auth token"
```

It exists only for the instant mise needs it, which is a different thing from `export`ing a
credential into every child process.

## Completions Need usage, in the Right Order

mise's completion script shells out to the `usage` CLI at runtime. Homebrew pulls it in as a
dependency; the official installer and winget do not, so declare it:

```toml
[tools]
usage = "latest"
```

There is a second trap: **`activate` must come before the completions**. `usage` is itself a
mise-managed tool, so before activation it is not on PATH, and every new shell prints:

```
WARNING: Error: usage CLI not found. This is required for completions to work in mise.
```

Correct order:

```powershell
(&mise activate pwsh) | Out-String | Invoke-Expression   # activate first

$__f = "$__cacheDir\mise-completions.ps1"                 # completions after, cached
$__src = (Get-Command mise -ErrorAction SilentlyContinue).Source
if ($__src -and ((-not (Test-Path $__f)) -or (Get-Item $__src).LastWriteTime -gt (Get-Item $__f).LastWriteTime)) {
    mise completion powershell | Out-String | Set-Content $__f -Encoding utf8
}
if (Test-Path $__f) { . $__f }
```

On Windows that warning is more than cosmetic — with PowerShell as `DefaultShell`, **any profile
output to stdout breaks scp/sftp**:

```
scp: Received message too long 458961715
scp: Ensure the remote shell produces no output for non-interactive sessions.
```

Fix the order, the warning goes away, and scp works again immediately.

## Migrating From fnm

| fnm                                                      | mise                                                        |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| `fnm env --use-on-cd`                                    | `mise activate` (chpwd hook built in)                       |
| `--version-file-strategy=recursive`                      | searches upward by default                                  |
| `--corepack-enabled` + corepack reading `packageManager` | mise reads `packageManager` directly; corepack layer can go |
| `--resolve-engines` (reads `engines.node`)               | **no equivalent**, see above                                |
| `aliases/default/bin` fallback                           | `shims`, and they switch per project                        |

After uninstalling, clear the data directories: fnm keeps node under `%APPDATA%\fnm` (Windows) or
`~/.local/share/fnm`, and multishells under `%LOCALAPPDATA%\fnm_multishells` /
`~/.local/state/fnm_multishells`.

**Check for running processes first**:

```powershell
Get-Process node -EA SilentlyContinue | Where-Object { $_.Path -like "*fnm*" }
```

A running node holds the exe inside `node-versions` open, and `Remove-Item` silently skips those
files, leaving a directory that will not delete. The multishells are junctions: removing the link
does not disturb already-running processes (their file handles stay valid), but those processes
will fail once they try to spawn a child.

On Windows the winget package needs a separate uninstall, and it **cannot be done from an elevated
session**:

```
The package installed for user scope cannot be uninstalled when running with administrator privileges.
```

SSH sessions are elevated by default, so run `winget uninstall --id Schniz.fnm --exact` from a
normal local PowerShell.

## config

[⚙︎ Guany config](https://github.com/guanyme/config)
