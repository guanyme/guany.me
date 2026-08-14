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
function covers the jumping. With the `git` plugin loaded the alias count is 246; without it, 49.

```sh
eval "$(starship init zsh)"
```

```sh
i() {
  cd ~/i/$1
}
```

## config

[⚙︎ Guany config](https://github.com/guanyme/config)
