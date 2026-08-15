# fnm

fnm

## Configuration

### Windows

```powershell
fnm completions --shell powershell | Out-String | Invoke-Expression
```

```powershell
fnm env --use-on-cd --version-file-strategy=recursive --corepack-enabled --resolve-engines --shell powershell | Out-String | Invoke-Expression
```

```powershell
[System.Environment]::SetEnvironmentVariable("FNM_NODE_DIST_MIRROR", "https://npmmirror.com/mirrors/node/", "User")
[System.Environment]::SetEnvironmentVariable("COREPACK_NPM_REGISTRY", "https://registry.npmmirror.com", "User")
```

#### Caching the completion script

`fnm completions` emits roughly 42 KB and costs about 30 ms to regenerate on every startup.
The output only changes with the fnm binary, so cache it:

```powershell
$__f = "$HOME\.cache\pwsh\fnm-completions.ps1"
$__src = (Get-Command fnm -ErrorAction SilentlyContinue).Source
if ($__src -and ((-not (Test-Path $__f)) -or (Get-Item $__src).LastWriteTime -gt (Get-Item $__f).LastWriteTime)) {
    fnm completions --shell powershell | Out-String | Set-Content $__f -Encoding utf8
}
if (Test-Path $__f) { . $__f }
```

`fnm env` **cannot** be treated this way — it has to run every time to create the multishell
directory for the current session.

#### multishell directories pile up

Every shell fnm initialises leaves a directory under `%LOCALAPPDATA%\fnm_multishells`, and
Windows never cleans them up on exit, so they accumulate indefinitely.

They are junctions, so they take almost no space themselves, but the sheer count slows any
traversal down. Clearing the stale ones:

```powershell
$cut = (Get-Date).AddDays(-1)
Get-ChildItem "$env:LOCALAPPDATA\fnm_multishells" -Directory |
    Where-Object { $_.CreationTime -lt $cut } |
    Remove-Item -Recurse -Force
```

Deleting a junction does not touch its target — the node installs under
`%APPDATA%\fnm\node-versions` are safe. Beware when sizing that folder: `Get-ChildItem
-Recurse` follows junctions and counts the same node install over and over, which makes it look
like several GB when it is not.

**macOS accumulates them too**, under `~/.local/state/fnm_multishells`. Those are symlinks, so
`du -sh` reports 0B — no disk cost, but the entry count grows without bound.

### Cleaning by PID beats cleaning by age

The directory name is `<PID>_<timestamp>`, so you can check whether the shell that created it is
still alive. That way today's open sessions are never caught in the sweep:

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

PIDs do get reused; the worst case is skipping one stale entry, never deleting a live one.

**The check has one blind spot, though: the ancestor exited but a descendant is still running.**
Child processes inherit their parent's PATH, so a directory whose creator is long gone may still
be referenced by something long-lived — an editor's integrated terminal, an agent session, a
tmux/herdr pane. Delete it and `node` simply vanishes inside those processes:

```sh
echo $PATH | tr ':' '\n' | grep fnm_multishells | while read -r p; do
  [ -e "$p" ] || echo "dangling: $p"
done
```

The safe version requires **both** conditions — process gone _and_ older than a day:

```sh
find "$d" -maxdepth 1 -type l -mtime +1 | while read -r e; do
  n=$(basename "$e")
  case "$n" in [0-9]*_[0-9]*) ;; *) continue;; esac
  [ "$e" = "$FNM_MULTISHELL_PATH" ] && continue
  kill -0 "${n%%_*}" 2>/dev/null || rm -f "$e"
done
```

Getting it wrong is not fatal: new shells regenerate their own entry, and the affected processes
just need a restart.

### MacOS/Linux

```sh
FNM_PATH="/opt/homebrew/opt/fnm/bin"
if [ -d "$FNM_PATH" ]; then
  eval "`fnm env`"
fi
```

```sh
eval "$(fnm env --use-on-cd --version-file-strategy=recursive --corepack-enabled --resolve-engines)"
```

```sh
export FNM_NODE_DIST_MIRROR="https://npmmirror.com/mirrors/node/"
export COREPACK_NPM_REGISTRY="https://registry.npmmirror.com"
```
