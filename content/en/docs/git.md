# git

Git

## Disable Automatic CRLF Line Ending Conversion

```sh
git config --global core.autocrlf false
```

## Configure credential helper

### WSL

```sh
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

### Linux

```sh
git config --global credential.helper store
```

## Set Default Branch to main

```sh
git config --global init.defaultBranch main
```

## Configure User Name and Email

```sh
git config --global user.name "Your Name"
```

```sh
git config --global user.email "youremail@domain.com"
```

## Configure lfs

```sh
git lfs install
```

## Aliases

Neither oh-my-zsh's `git` plugin nor PowerShell's `git-aliases` module — the former defines 197
aliases at once where only these few get used. Both sides keep identical semantics so the
muscle memory carries across platforms.

### zsh

```sh
alias g="git"
alias gaa="git add --all"
alias gcmsg="git commit --message"
alias gp="git push"
alias gl="git pull"
alias gcl="git clone --recurse-submodules"
```

### PowerShell

These have to be **functions** rather than `Set-Alias`, since an alias cannot carry fixed
arguments.

```powershell
# gp / gl are built-in read-only aliases (Get-ItemProperty / Get-Location).
# Command resolution is alias > function, so without removing them the functions below
# would never be reached
foreach ($a in "gp", "gl") { Remove-Item "Alias:$a" -Force -ErrorAction Ignore }

function g { git @args }
function gaa { git add --all @args }
function gcmsg { git commit --message @args }
function gp { git push @args }
function gl { git pull @args }
function gcl { git clone --recurse-submodules @args }
```

`Import-Module git-aliases -DisableNameChecking` is exactly what the module was doing about
this; defining the functions by hand means taking that step over yourself.

Both sides chain the same way:

```sh
g init && gaa && gcmsg "feat: initial"
```

## config

[⚙︎ Guany Git config](https://github.com/guanyme/config/blob/main/.gitconfig)
