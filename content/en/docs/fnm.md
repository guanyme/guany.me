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
Windows never cleans them on exit. One machine here had accumulated **2433** of them.

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
