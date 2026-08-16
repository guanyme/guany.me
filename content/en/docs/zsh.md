# zsh

Zsh

## Installation

```sh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

```sh
cd ~/.oh-my-zsh/plugins
```

```sh
gcl https://github.com/zsh-users/zsh-autosuggestions.git
```

```sh
gcl https://github.com/zsh-users/zsh-syntax-highlighting.git
```

```sh
cd ~
```

```sh
curl -sS https://starship.rs/install.sh | sh
```

## Usage

```sh
plugins=(
  command-not-found
  zsh-autosuggestions
  zsh-syntax-highlighting
)
```

The `git` plugin is left out — it defines 197 aliases in one go where only a handful ever get
used, so those are written by hand instead, see the git page. Same for `zsh-z`: the `i`
function covers the jumping.

```sh
eval "$(starship init zsh)"
```

```sh
i() {
  cd ~/i/$1
}
```

## Aliases

The handful kept identical across machines. Git ones live on the git page; these are the
shell-side ones:

```sh
alias ll='ls -lh'      # long format
alias la='ls -lAh'     # long format + hidden entries
```

**Note this is the opposite of Ubuntu's defaults.** Ubuntu's `.bashrc` ships `ll='ls -alF'`
(everything) and `la='ls -A'` (hidden only, short format); the pair above follows the oh-my-zsh
convention instead — `ll` does not show hidden entries, `la` is what covers them. Pick one
convention: mixing them means guessing wrong every time you switch machines.

On bash hosts, edit them **in place** — comment out the distro defaults and put the new values
right below:

```sh
# some more ls aliases
# alias ll='ls -alF'
alias ll='ls -lh'
# alias la='ls -A'
alias la='ls -lAh'
alias l='ls -CF'
```

Appending at the end of the file works too (the last definition wins), but editing in place is
what makes the change visible — otherwise the next reader assumes the distro defaults are still
in effect.

oh-my-zsh defines both already, so there is nothing to add where it is installed.

## Load Order

```
①  ~/.zshenv       every zsh, including scripts, cron and LaunchAgents
②  /etc/zprofile   ← macOS runs path_helper here
③  ~/.zprofile     login shells
④  /etc/zshrc
⑤  ~/.zshrc        interactive only
```

### path_helper reorders PATH

macOS ships this in `/etc/zprofile`:

```sh
if [ -x /usr/libexec/path_helper ]; then
	eval `/usr/libexec/path_helper -s`
fi
```

It moves everything from `/etc/paths` and `/etc/paths.d/*` **to the front**, pushing the user
directories set in `~/.zshenv` behind `/usr/bin`:

```
~/.zshenv only:      ~/.local/bin  ~/.cargo/bin  /opt/homebrew/bin  …
after .zprofile:     /opt/homebrew/bin  /usr/local/bin  /usr/bin  …  ~/.local/bin
```

**So on macOS, relying on `~/.zshenv` for PATH priority does not hold.** `.zshenv` only
guarantees that scripts can find things; the actual priority has to be re-established after
`path_helper` runs.

### Non-interactive login shells degrade silently

If the priority lives only in `.zshrc`, the same command resolves differently depending on the
shell — because `.zshrc` is never read non-interactively:

```sh
zsh -lic 'command -v python3; command -v tar'   # interactive: uv's python, GNU tar
zsh -lc  'command -v python3; command -v tar'   # non-interactive: homebrew python, bsdtar
```

`ssh host 'command'`, LaunchAgents and CI all take the latter path. GNU tar and bsdtar differ on
`--wildcards` and `--transform`, so a command that works interactively can fail once it lands in
a script.

**The fix is to put the priority block in `~/.zprofile`** — it runs after `path_helper`, and both
interactive and non-interactive login shells read it:

```sh
typeset -U path fpath

path=(
  "$HOME/.local/bin"
  "${HOMEBREW_PREFIX:-/opt/homebrew}/opt/gnu-tar/libexec/gnubin"
  $path
)
```

To cover `zsh -c` scripts as well, add the same entries to `~/.zshenv` (`typeset -U` dedupes).

## Command Shadowing

When the same executable name exists in several PATH directories, only the first one wins. To
list every duplicate:

```sh
echo $PATH | tr ':' '\n' | while read -r d; do
  find "$d" -maxdepth 1 -type f -perm -u+x 2>/dev/null | while read -r f; do
    echo "$(basename "$f")|$d"
  done
done | sort -t'|' -k1,1 | awk -F'|' '$1==p{print $1" <- "$2} {p=$1}'
```

Count **executable files only** — directory symlinks (such as gnu-tar's `gnuman`) also carry the
execute bit and produce false positives.

### uv's python and pip must be linked together

If `~/.local/bin` holds only `python`/`python3`, then `pip3` falls through to Homebrew, and
packages installed by `pip3 install` are invisible to `python3`:

```sh
python3 -m pip --version   # ~/.local/share/uv/python/.../site-packages/pip
pip3 --version             # /opt/homebrew/lib/python3.14/site-packages/pip   ← different
```

uv's python directory already ships pip; just add the links:

```sh
base="$HOME/.local/share/uv/python/cpython-3.14-macos-aarch64-none/bin"
for f in pip pip3 pip3.14; do ln -s "$base/$f" ~/.local/bin/$f; done
```

### Upstreams compete for the same command name

Cursor's CLI binary is literally called `agent` and installs into `~/.local/bin`; the Grok
installer creates both `grok` and `agent` in `~/.grok/bin` as symlinks to the same binary. Both
claim `agent`, and whichever comes first on PATH wins.

Prefer keeping the one that **has only that name** — Cursor's `agent` is gone if shadowed, while
Grok's `agent` is merely an alias for `grok` and costs nothing to lose.

## Keep Secrets Out of the Environment

`export`ing a private key from `.zshrc` makes it readable by **every child process** — npm
postinstall scripts, CLI crash reporters and agent env dumps all carry it along. Inject it on
demand instead, so the key only exists for the duration of the wrapped command:

```sh
tauri-sign() {
  local k="$HOME/.tauri/tauri.key" p="$HOME/.tauri/tauri.pass"
  [ -r "$k" ] || { print -u2 "tauri-sign: missing $k"; return 1 }
  [ -r "$p" ] || { print -u2 "tauri-sign: missing $p"; return 1 }
  [ $# -gt 0 ] || { print -u2 "usage: tauri-sign <command> [args...]"; return 2 }
  TAURI_SIGNING_PRIVATE_KEY="$(<"$k")" \
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$(<"$p")" \
    "$@"
}
```

```sh
tauri-sign nr build
env | grep -c '^TAURI_SIGNING'   # 0 the rest of the time
```

Keep the key files at `chmod 600` and the directory at `chmod 700`.

## config

[⚙︎ Guany config](https://github.com/guanyme/config)
