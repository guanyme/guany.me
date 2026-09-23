---
description: 'Install PowerShell 7 and set up completion, prompt, aliases and functions'
---

# PowerShell

This page covers installing PowerShell 7 and related tools, configuring completion, the prompt, aliases and functions in `$PROFILE`, and fixing scp failures caused by the profile.

## Installation

Install the following tools with winget.

Install PowerShell 7:

```powershell
winget install --id Microsoft.PowerShell
```

Install Starship:

```powershell
winget install --id Starship.Starship
```

Install gsudo:

```powershell
winget install gerardog.gsudo
```

## Configuration

All of the following goes in `$PROFILE`.

### Set up completion and the prompt

Add Tab menu completion and the Starship prompt to `$PROFILE`:

```powershell
Set-PSReadlineKeyHandler -Key Tab -Function MenuComplete

Invoke-Expression (&starship init powershell)
```

### Define aliases as functions

PowerShell aliases cannot take arguments, so `la`, the git shortcuts and the `nr` shortcuts are all functions. Built-in aliases take precedence over functions, so remove `la`, `gp` (Get-ItemProperty), `gl` (Get-Location) and `ni` (New-Item) first, or the functions of the same name are never reached:

```powershell
foreach ($a in "la", "gp", "gl", "ni") { Remove-Item "Alias:$a" -Force -ErrorAction Ignore }

function la { Get-ChildItem -Force @args }
```

`-Force` also lists hidden and system files.

Add the git and `nr` functions to `$PROFILE`:

```powershell
function g { git @args }
function gaa { git add --all @args }
function gcmsg { git commit --message @args }
function gp { git push @args }
function gl { git pull @args }
function gcl { git clone --recurse-submodules @args }
function grt {
    $root = git rev-parse --show-toplevel 2>$null
    if ($root) { Set-Location $root } else { Write-Warning "Not inside a git repository" }
}

function nio { ni --prefer-offline }
function s { nr start }
function d { nr dev }
function b { nr build }
function bw { nr build --watch }
function t { nr test }
function tu { nr test -u }
function tw { nr test --watch }
function w { nr watch }
function p { nr play }
function c { nr typecheck }
function lint { nr lint }
function lintf { nr lint --fix }
function release { nr release }
function re { nr release }
```

### Functions

Define the `i` function in `$PROFILE` to jump to a directory under `$HOME\i`:

```powershell
function i {
    param (
        [string]$DirectoryName
    )

    Set-Location -Path "$HOME\i\$DirectoryName"
}
```

### Runtimes

Activate mise in `$PROFILE`:

```powershell
(&mise activate pwsh) | Out-String | Invoke-Expression
```

## Troubleshooting

### Profile output breaks scp

When PowerShell is the OpenSSH `DefaultShell`, scp and sftp fail with:

```text
scp: Received message too long 458961715
scp: Ensure the remote shell produces no output for non-interactive sessions.
```

The profile is writing to stdout. Check the profile for `echo`, `Write-Output` and commands that print warnings, and remove or change them. For example, loading mise completions before `activate` prints `usage CLI not found`.

## References

- [Guany PowerShell profile](https://github.com/guanyme/powershell-profile/): Guany's PowerShell profile repository.
