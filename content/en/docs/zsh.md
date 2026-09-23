---
description: 'Configure Zsh with oh-my-zsh, plugins and Starship, and fix PATH issues'
---

# Zsh

This page covers configuring the Zsh shell with oh-my-zsh, plugins and Starship, and fixing common PATH issues.

## Installation

Install oh-my-zsh, the plugins and Starship in order:

1. Install oh-my-zsh:

   ```sh
   sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
   ```

2. Clone zsh-autosuggestions and zsh-syntax-highlighting into the oh-my-zsh plugin directory:

   ```sh
   git clone https://github.com/zsh-users/zsh-autosuggestions.git ~/.oh-my-zsh/plugins/zsh-autosuggestions
   git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/plugins/zsh-syntax-highlighting
   ```

3. Install Starship:

   ```sh
   curl -sS https://starship.rs/install.sh | sh
   ```

## Configuration

The configuration lives in `~/.zshrc`. The plugin list goes before `source $ZSH/oh-my-zsh.sh`; everything else goes after it.

### Plugins

Enable the plugins in `~/.zshrc`:

```sh
plugins=(
  command-not-found
  zsh-autosuggestions
  zsh-syntax-highlighting
)
```

The `git` and `zsh-z` plugins are not enabled. Git aliases are defined separately below; use the `i` function below to jump between directories.

### Prompt

Enable Starship in `~/.zshrc`:

```sh
eval "$(starship init zsh)"
```

### Functions

Define the `i` function in `~/.zshrc`:

```sh
i() {
  cd ~/i/$1
}
```

`i <dir>` jumps to that directory under `~/i`.

### Aliases

oh-my-zsh ships `la='ls -lAh'`, which lists all entries, hidden ones included, in long format.

Ubuntu's `.bashrc` ships `la='ls -A'`. To get the same behavior, change it in `~/.bashrc` to:

```sh
# alias la='ls -A'
alias la='ls -lAh'
```

Add the git and `nr` aliases to `~/.zshrc`:

```sh
alias g="git"
alias gaa="git add --all"
alias gcmsg="git commit --message"
alias gp="git push"
alias gl="git pull"
alias gcl="git clone --recurse-submodules"
alias grt='cd "$(git rev-parse --show-toplevel)"'

alias nio="ni --prefer-offline"
alias s="nr start"
alias d="nr dev"
alias b="nr build"
alias bw="nr build --watch"
alias t="nr test"
alias tu="nr test -u"
alias tw="nr test --watch"
alias w="nr watch"
alias p="nr play"
alias c="nr typecheck"
alias lint="nr lint"
alias lintf="nr lint --fix"
alias release="nr release"
alias re="nr release"
```

### Environment variables

Set the editor and PATH in `~/.zshrc`:

```sh
export EDITOR='code'
export PATH="$HOME/.local/bin:$PATH"
```

The official installers of uv, claude, codex and mise all install into `~/.local/bin`.

### Runtimes

node, pnpm, java and similar runtimes are managed by mise. Activate mise in `~/.zshrc`:

```sh
eval "$($HOME/.local/bin/mise activate zsh)"
```

Settings for bun and Maven:

```sh
export MAVEN_HOME="/usr/local/maven"
export PATH="$MAVEN_HOME/bin:$PATH"

[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

### Other startup files

Homebrew goes in `~/.zprofile`:

```sh
eval "$(/opt/homebrew/bin/brew shellenv zsh)"
```

### Pass secrets to a single command

A key `export`ed in `.zshrc` is readable by every child process. Inject it only into the one command that needs it:

```sh
TAURI_SIGNING_PRIVATE_KEY="$(<~/.tauri/tauri.key)" nr build
```

## Troubleshooting

### PATH differs in scripts

zsh reads its startup files in this order:

```text
~/.zshenv      every zsh, including scripts, cron, LaunchAgents
/etc/zprofile  macOS runs path_helper here
~/.zprofile    login shells
~/.zshrc       interactive only
```

PATH changes and `mise activate` in `.zshrc` never reach `ssh <host> '<command>'`, LaunchAgents or CI. On macOS, `path_helper` also moves the system paths to the front, which breaks the order set in `.zshenv`.

1. Put the PATH priority in `~/.zprofile`, which runs after `path_helper`:

   ```sh
   typeset -U path fpath

   path=(
     "$HOME/.local/bin"
     "$HOME/.local/share/mise/shims"
     $path
   )
   ```

2. Check that interactive and non-interactive shells give the same result:

   ```sh
   zsh -lic 'command -v python3'   # interactive
   zsh -lc  'command -v python3'   # non-interactive, should print the same
   ```

### A command runs the wrong executable

The directory that comes first in PATH wins. List every executable that exists in more than one directory:

```sh
echo $PATH | tr ':' '\n' | while read -r d; do
  find "$d" -maxdepth 1 -type f -perm -u+x 2>/dev/null | while read -r f; do
    echo "$(basename "$f")|$d"
  done
done | sort -t'|' -k1,1 | awk -F'|' '$1==p{print $1" <- "$2} {p=$1}'
```

Two common cases:

- **uv's python and Homebrew's pip come from different places.** If `~/.local/bin` only links `python3`, `pip3` falls through to Homebrew, and packages it installs cannot be imported by `python3`. Use `python3 -m pip`, or also link the `pip` from uv's python directory into `~/.local/bin`.
- **Two tools claim the same name.** Both the Cursor CLI and Grok install an `agent`; whichever comes first in PATH wins.

## References

- [Guany config](https://github.com/guanyme/config): Guany's configuration repository.
