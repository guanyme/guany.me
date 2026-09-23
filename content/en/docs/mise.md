---
description: 'Install and configure mise, migrate from fnm, and fix common mise errors.'
---

# mise

mise manages versions of runtimes such as Node.js, pnpm and Java, and of command-line tools. This page covers installation, shell integration, global config, supply-chain checks, migrating from fnm, and common problems.

## Installation

Use the official installer. It installs a single binary that supports `mise self-update`. mise releases often, and the docs recommend staying on a recent version.

### Install on macOS and Linux

Run the official installer. The command is the same on macOS and Linux:

```sh
curl https://mise.run | sh
```

mise is installed to `~/.local/bin/mise`.

### Install on Windows

Install with winget:

```powershell
winget install --id jdx.mise
```

The winget build supports `mise self-update`.

## Configuration

The following settings are independent. Apply the ones you need.

### Activate mise in the shell

Add to `~/.zshrc`:

```sh
eval "$($HOME/.local/bin/mise activate zsh)"
```

Add to your PowerShell profile:

```powershell
(&mise activate pwsh) | Out-String | Invoke-Expression
```

PowerShell supports `mise activate` and the `chpwd` hook. Only `[shell_alias]` is unsupported. The FAQ passage saying native Windows works only through shims is outdated; the shell compatibility table in the same docs is correct.

### Add shims for non-interactive shells

`mise activate` only works in interactive shells. Scripts, `ssh host 'command'`, LaunchAgents and CI see none of the tools mise manages. When needed, add the shims to `~/.zprofile`. It runs after macOS `path_helper` and is read by every login shell:

```sh
typeset -U path fpath

path=(
  "$HOME/.local/bin"
  "$HOME/.local/share/mise/shims"
  $path
)
```

Shims resolve the version for the current directory, so per-project switching works in non-interactive shells too:

```sh
zsh -lc 'cd ~/i/some-project && pnpm -v'   # the version the project pins
```

Place the shims in PATH as follows:

- After the installs directories that `mise activate` prepends, as a fallback only.
- Before Homebrew. Otherwise `brew install node` shadows the version mise selected.

### Global config file

The global config lives at `~/.config/mise/config.toml`. The path is the same on Windows: `~\.config\mise\`. Example:

```toml
[settings]
idiomatic_version_file_enable_tools = ["pnpm", "yarn", "npm", "node"]
minimum_release_age = "0"

[tools]
java = "lts"
ni = "latest"
node = "lts"
opencode = "latest"
pi = "latest"
pnpm = "latest"
vercel = { version = "latest", allow_builds = ["esbuild"], trust_policy_excludes = ["undici"] }
yarn = "latest"
```

Global values are only fallbacks. A project's `mise.toml`, `.node-version` or the `packageManager` field in `package.json` overrides them.

- Java projects that need JDK 8 or 17 declare it in the project's `mise.toml`.
- Yarn 1 repositories must declare their version in `packageManager`. Otherwise Yarn 4 migrates the lockfile to the Berry format.
- For `minimum_release_age` and the exceptions on the `vercel` line, see [Supply-chain checks](#supply-chain-checks).

### Read versions from package.json

mise calls `.nvmrc`, `.node-version` and the version fields in `package.json` idiomatic version files. They are all disabled by default. Enable them explicitly:

```toml
[settings]
idiomatic_version_file_enable_tools = ["node", "pnpm", "npm", "yarn"]
```

Once enabled, mise reads the `packageManager` and `devEngines` fields ([jdx/mise#8059](https://github.com/jdx/mise/pull/8059)). This is enough to replace corepack for per-project pnpm versions.

mise does not read the traditional `engines.node`; the PR for it ([#2288](https://github.com/jdx/mise/pull/2288)) was not merged. Projects that rely on `engines.node` need `devEngines.runtime` or a `.node-version` file instead.

### Enable completions

Load mise completions as follows:

1. Declare the `usage` tool. The completion script calls the `usage` CLI at runtime. Homebrew installs it along with mise; the official installer and winget do not:

   ```toml
   [tools]
   usage = "latest"
   ```

2. Load completions after `activate`. `usage` is managed by mise and is not on PATH before activation. Otherwise every new shell prints `usage CLI not found`:

   ```powershell
   (&mise activate pwsh) | Out-String | Invoke-Expression
   mise completion powershell | Out-String | Invoke-Expression
   ```

On Windows, when PowerShell is the OpenSSH default shell, that warning makes scp fail.

### Supply-chain checks

mise's `npm:` backend installs through the embedded aube by default. aube runs three supply-chain checks:

- **Trust downgrade check**: blocks a dependency whose newer version lost its trusted-publisher evidence.
- **Build script approval**: follows pnpm's build approval model. A dependency's `preinstall`, `install` and `postinstall` do not run by default. Your own project's scripts still run.
- **Release-age gate**: `minimum_release_age`, 24h by default. Only versions published longer ago than the threshold are installed, giving the community time to catch a compromised release. It mirrors pnpm's `minimumReleaseAge` and Renovate's equivalent.

The three checks are independent. When the trust policy blocks an install, changing `minimum_release_age` has no effect.

When an install is blocked, add the narrowest per-package exception instead of a global switch. See [Troubleshooting](#troubleshooting).

`npm.shell_out = true` (use the npm CLI) and `npm.package_manager = "pnpm"` both bypass the trust policy for every package. The docs label `shell_out` a last resort. `npm.shell_out` still passes `--ignore-scripts` to npm, so it does not solve the build-script problem either.

| Backend                | Trust policy | Build scripts           |
| ---------------------- | ------------ | ----------------------- |
| `auto` (default, aube) | yes          | denied + `allow_builds` |
| `pnpm`                 | no           | denied + `allow_builds` |
| `npm.shell_out`        | no           | `--ignore-scripts`      |

## Usage

### Migrate from fnm

fnm options and their mise equivalents:

| fnm                                                      | mise                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `fnm env --use-on-cd`                                    | `mise activate` (chpwd hook built in)                                                 |
| `--version-file-strategy=recursive`                      | searches upward by default                                                            |
| `--corepack-enabled` + corepack reading `packageManager` | mise reads `packageManager` directly; corepack layer can go                           |
| `--resolve-engines` (reads `engines.node`)               | no equivalent, see [Read versions from package.json](#read-versions-from-packagejson) |
| `aliases/default/bin` fallback                           | `shims`, and they switch per project                                                  |

Uninstall fnm and remove its data:

1. Check that no process is using fnm's node:

   ```powershell
   Get-Process node -EA SilentlyContinue | Where-Object { $_.Path -like "*fnm*" }
   ```

   A running node holds the exe inside `node-versions` open. `Remove-Item` silently skips those files and leaves a directory that will not delete.

2. Delete the data directories. node installs live in `%APPDATA%\fnm` (Windows) or `~/.local/share/fnm`. Multishells live in `%LOCALAPPDATA%\fnm_multishells` or `~/.local/state/fnm_multishells`.

   Multishells are junctions. Removing a link does not affect running processes, but those processes fail when they later spawn a child.

3. On Windows, uninstall the winget fnm package separately. Open a normal, non-elevated local PowerShell and run:

   ```powershell
   winget uninstall --id Schniz.fnm --exact
   ```

   An elevated session fails with:

   ```text
   The package installed for user scope cannot be uninstalled when running with administrator privileges.
   ```

   SSH sessions are elevated by default, so run it locally.

## Troubleshooting

### self-update fails on a Homebrew install

Running `mise self-update` on a Homebrew install fails with:

```text
mise ERROR mise is installed via a package manager, cannot update
```

Cause: builds from package managers such as Homebrew cannot self-update and lag behind releases.

Fix: uninstall the package-manager build and install with the [official installer](#install-on-macos-and-linux).

### Installs fail with GitHub rate limit exceeded

Every install fails with:

```text
mise WARN  GitHub rate limit exceeded
mise WARN  [pnpm/pnpm] failed to fetch version tags: HTTP status client error (403 Forbidden)
```

Cause: mise queries the GitHub Releases API to resolve versions, and the anonymous quota is 60 requests per hour. mise reads a token from the gh CLI's `hosts.yml` by default (`github.gh_cli_tokens` is true). When gh stores its token in the system keyring, `hosts.yml` has no token.

Confirm the token is in the keyring:

```sh
gh auth status     # ✓ Logged in ... (keyring)
grep token ~/.config/gh/hosts.yml    # nothing
```

Fix: in `~/.config/mise/config.toml`, fetch the token on demand with a command:

```toml
[settings.github]
credential_command = "gh auth token"
```

The token is fetched only when mise needs it. It is not written to disk or exported to the environment.

### Install fails with trust downgrade

Installing an npm tool fails with:

```text
trust downgrade for @smithy/core@3.33.0 (trustPolicy=no-downgrade):
earlier published version 3.24.6 had trusted publisher but this version has no trust evidence
```

Cause: an indirect dependency's older release carried trusted-publisher evidence and the newer one does not. Common causes are a manual publish, a backport that skipped the trusted workflow, or a mirror that strips metadata. It is not necessarily tampering. The AWS SDK's `@smithy/*` family behaves this way.

Fix: exempt the packages with `trust_policy_excludes`. Replace `some-tool` with the package you are installing:

```toml
[tools]
"npm:some-tool" = { version = "latest", trust_policy_excludes = ["@smithy/core", "@smithy/node-http-handler"] }
```

A name with a version exempts only that version; a bare name exempts every version of the package. For frequently released families such as `@smithy/*`, use bare names.

### Installed tool reports it is not compatible with Windows

A tool installed through the `npm:` backend fails to run with:

```powershell
# the resulting opencode.exe is 479 bytes
This version of opencode.exe is not compatible with the version of Windows you're running…
```

Cause: the package downloads a platform binary in postinstall, and aube does not run dependency build scripts by default. The 479-byte file is not a PE file (header `ec`, not `MZ`). It is the author's "postinstall did not run" notice. The architecture is not the problem.

Fix: allow the package's build scripts with `allow_builds`:

```toml
"npm:opencode-ai" = { version = "latest", allow_builds = true }
```

`allow_builds` also takes an array to allow specific dependencies only: `allow_builds = ["esbuild"]`.

### Newly published version fails to install

An npm package you just published cannot be installed for verification.

Cause: `minimum_release_age` defaults to 24h, so only versions published more than 24 hours ago are installed.

Fix: use either option. Replace `@your-scope` with your npm scope:

```toml
# turn it off globally
minimum_release_age = "0"

# or exempt only your own packages and keep the 24h buffer for everything else (preferred)
minimum_release_age = "24h"
minimum_release_age_excludes = ["npm:@your-scope/*"]
```

### mise reports not trusted inside a config repository

After you `cd` into a repository that backs up your configuration, mise reports `not trusted`, and node and pnpm stop working in that directory.

Cause: the repository contains its own `.config/mise/config.toml`, and mise loads it as a project config.

Fix: ignore that file with an environment variable. This is an early-init setting, so it has no effect in `mise.toml`. Add to `~/.zshenv`, and replace the path with your repository's location:

```sh
export MISE_IGNORED_CONFIG_PATHS="$HOME/i/guanyme/config/.config/mise/config.toml"
```

## References

- [Guany config](https://github.com/guanyme/config): the configuration repository that contains the mise config on this page.
