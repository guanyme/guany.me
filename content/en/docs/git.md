---
description: 'Global Git settings for identity, default branch, line endings, credentials, LFS, and aliases'
---

# Git

Git is a distributed version control system. This page covers common global settings and aliases shared by zsh and PowerShell.

## Configuration

The commands below write to the global config `~/.gitconfig`. Use the ones you need.

### Set your name and email

Replace `Your Name` and `youremail@domain.com` with your own details:

```sh
git config --global user.name "Your Name"
```

```sh
git config --global user.email "youremail@domain.com"
```

### Set the default branch to main

Name the default branch `main` in new repositories:

```sh
git config --global init.defaultBranch main
```

### Disable automatic CRLF conversion

Turn off line-ending conversion on commit and checkout:

```sh
git config --global core.autocrlf false
```

### Configure a credential helper

Choose the credential helper for your system.

#### WSL

Use the Git Credential Manager bundled with Git for Windows:

```sh
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

#### Linux

Store credentials in a local file:

```sh
git config --global credential.helper store
```

### Enable Git LFS

Enable Git LFS for the current user:

```sh
git lfs install
```

### Optional settings

Enable as needed:

```sh
git config --global push.autoSetupRemote true   # first push of a new branch without -u
git config --global pull.rebase true            # pull rebases instead of creating merge commits
git config --global rebase.autostash true       # stash uncommitted changes before a rebase
git config --global diff.algorithm histogram    # easier-to-read diffs for larger changes
git config --global help.autocorrect prompt     # offer a fix for mistyped subcommands
```

Rewrite HTTPS URLs to SSH when cloning:

```sh
git config --global url."git@github.com:".insteadOf https://github.com/
```

### Aliases

zsh and PowerShell use the same set of aliases with the same meaning.

#### zsh

Add this to `~/.zshrc`:

```sh
alias g="git"
alias gaa="git add --all"
alias gcmsg="git commit --message"
alias gp="git push"
alias gl="git pull"
alias gcl="git clone --recurse-submodules"
```

#### PowerShell

Add this to `$PROFILE`. PowerShell aliases cannot carry fixed arguments, so use functions instead of `Set-Alias`:

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

Both shells chain the same way:

```sh
g init && gaa && gcmsg "feat: initial"
```

## References

- [Guany Git config](https://github.com/guanyme/config/blob/main/.gitconfig): the author's `.gitconfig`.
