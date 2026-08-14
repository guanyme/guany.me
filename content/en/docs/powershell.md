# powershell

PowerShell

## Installation

```powershell
winget install --id Microsoft.PowerShell
```

```powershell
winget install --id Starship.Starship
```

```powershell
winget install gerardog.gsudo
```

## Usage

```powershell
Set-PSReadlineKeyHandler -Key Tab -Function MenuComplete
```

```powershell
Set-Alias -Name la -Value Get-ChildItem
```

```powershell
function i {
    param (
        [string]$DirectoryName
    )

    Set-Location -Path "$HOME\i\$DirectoryName"
}
```

Git no longer goes through the `posh-git` / `git-aliases` modules — the functions are defined
by hand instead, see the git page.

## Speeding Up Startup

Nearly all of the profile's cost is spawning subprocesses. Measured medians of
`pwsh -Command "exit"`:

|                              | Time   |
| ---------------------------- | ------ |
| `pwsh -NoProfile` (baseline) | 151 ms |
| Before                       | 630 ms |
| After                        | 524 ms |

### starship gets launched twice

`starship init powershell` prints exactly one line:

```powershell
Invoke-Expression (& 'C:\Program Files\starship\bin\starship.exe' init powershell --print-full-init | Out-String)
```

So running it launches **starship a second time**. Ask for the full script directly and cache
it to a file, which removes that whole round trip:

```powershell
$__cacheDir = "$HOME\.cache\pwsh"
if (-not (Test-Path $__cacheDir)) { New-Item -ItemType Directory $__cacheDir -Force | Out-Null }

$__f = "$__cacheDir\starship.ps1"
$__src = (Get-Command starship -ErrorAction SilentlyContinue).Source
if ($__src -and ((-not (Test-Path $__f)) -or (Get-Item $__src).LastWriteTime -gt (Get-Item $__f).LastWriteTime)) {
    starship init powershell --print-full-init | Out-String | Set-Content $__f -Encoding utf8
}
if (Test-Path $__f) { . $__f }
```

Regeneration keys off the binary's `LastWriteTime`, so a `winget upgrade` refreshes the cache
on its own — no manual clearing.

**The dot-source has to sit at the top level of the profile.** Wrap this in a function and
`. $__f` only applies inside that function's scope: the prompt never reaches global scope, and
the symptom is "the cache ran but the prompt didn't change".

fnm's completion script is around 42 KB and can be cached the same way.

### The part that cannot be reduced

The single `Set-PSReadlineKeyHandler` line costs about 183 ms, which is really the **first load
of the PSReadLine module**, not the key binding. An interactive session loads that module
anyway, so moving or deferring the line just pushes the cost to the first keystroke — it does
not feel faster.

`fnm env` cannot be cached either: it has to run every time to create the multishell directory
for the current session.

## powershell-profile

[⚙︎ Guany Powershell profile](https://github.com/guanyme/powershell-profile/)
