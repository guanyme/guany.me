---
description: 'Configure fnm on Windows, macOS and Linux, and clean up multishells.'
---

# fnm

fnm is a Node.js version manager. This page covers shell configuration on Windows, macOS and Linux, and cleaning up multishell directories.

## Configuration

Use the section for your platform.

### Configure on Windows

Load completions in your PowerShell profile:

```powershell
fnm completions --shell powershell | Out-String | Invoke-Expression
```

Load the fnm environment in your PowerShell profile. `fnm env` must run on every startup because it creates the multishell directory for the current session:

```powershell
fnm env --use-on-cd --version-file-strategy=recursive --corepack-enabled --resolve-engines --shell powershell | Out-String | Invoke-Expression
```

Optional: set mirrors for Node.js and corepack. Run this once:

```powershell
[System.Environment]::SetEnvironmentVariable("FNM_NODE_DIST_MIRROR", "https://npmmirror.com/mirrors/node/", "User")
[System.Environment]::SetEnvironmentVariable("COREPACK_NPM_REGISTRY", "https://registry.npmmirror.com", "User")
```

### Configure on macOS and Linux

Add the following to your shell config file, such as `~/.zshrc`.

Load the environment when the Homebrew fnm is present:

```sh
FNM_PATH="/opt/homebrew/opt/fnm/bin"
if [ -d "$FNM_PATH" ]; then
  eval "`fnm env`"
fi
```

Enable version switching on directory change and related options:

```sh
eval "$(fnm env --use-on-cd --version-file-strategy=recursive --corepack-enabled --resolve-engines)"
```

Optional: set mirrors for Node.js and corepack:

```sh
export FNM_NODE_DIST_MIRROR="https://npmmirror.com/mirrors/node/"
export COREPACK_NPM_REGISTRY="https://registry.npmmirror.com"
```

## Troubleshooting

### multishell directories keep piling up

The entry count under `fnm_multishells` keeps growing, and a large count slows down traversal.

Cause: fnm creates a multishell directory for every shell and does not clean it up on exit.

- Windows: under `%LOCALAPPDATA%\fnm_multishells`. They are junctions and take almost no space.
- macOS: under `~/.local/state/fnm_multishells`. They are symlinks, and `du -sh` reports 0B.

Fix: use either cleanup method.

Clean by creation time (Windows). Delete directories created more than a day ago:

```powershell
$cut = (Get-Date).AddDays(-1)
Get-ChildItem "$env:LOCALAPPDATA\fnm_multishells" -Directory |
    Where-Object { $_.CreationTime -lt $cut } |
    Remove-Item -Recurse -Force
```

Clean by PID. The directory name is `<PID>_<timestamp>`, so you can check whether the shell that created it is still running. Open sessions are never removed:

```sh
d=~/.local/state/fnm_multishells        # Windows: $env:LOCALAPPDATA\fnm_multishells
for e in "$d"/*; do
  n=$(basename "$e")
  [ -L "$e" ] || continue               # links only
  case "$n" in [0-9]*_[0-9]*) ;; *) continue;; esac
  [ "$e" = "$FNM_MULTISHELL_PATH" ] && continue   # never the current session's
  kill -0 "${n%%_*}" 2>/dev/null || rm -f "$e"
done
```

PIDs can be reused. The worst case is skipping one stale entry, never deleting a live one.

Deleting a junction does not touch its target. The node installs under `%APPDATA%\fnm\node-versions` are safe.

### node disappears from long-running processes after cleanup

After cleaning by PID, the `node` command vanishes inside an editor's integrated terminal, an agent session, or a tmux or herdr pane.

Cause: child processes inherit their parent's PATH. The shell that created the multishell directory has exited, but a descendant process is still running and references the directory.

Check the current PATH for dangling multishell directories:

```sh
echo $PATH | tr ':' '\n' | grep fnm_multishells | while read -r p; do
  [ -e "$p" ] || echo "dangling: $p"
done
```

Fix:

1. Restart the affected processes. New shells regenerate their own entry.
2. For future cleanups, delete an entry only when both conditions hold: the process has exited and the entry is older than a day:

   ```sh
   find "$d" -maxdepth 1 -type l -mtime +1 | while read -r e; do
     n=$(basename "$e")
     case "$n" in [0-9]*_[0-9]*) ;; *) continue;; esac
     [ "$e" = "$FNM_MULTISHELL_PATH" ] && continue
     kill -0 "${n%%_*}" 2>/dev/null || rm -f "$e"
   done
   ```

### fnm_multishells appears to use several GB

On Windows, sizing `%LOCALAPPDATA%\fnm_multishells` reports several GB.

Cause: `Get-ChildItem -Recurse` follows junctions and counts the same node install many times. The directory does not actually use that much space.

Fix: nothing to fix. Clean up entries as described in [multishell directories keep piling up](#multishell-directories-keep-piling-up).
