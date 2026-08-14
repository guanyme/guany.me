# zsh

Zsh

## 安装 {#installation}

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

## 使用说明 {#usage}

```sh
plugins=(
  command-not-found
  zsh-autosuggestions
  zsh-syntax-highlighting
)
```

不装 `git` 插件 —— 它一次性塞进 197 个别名，实际用到的只有几个，自己定义即可，见 git 文档。
`zsh-z` 同理，跳转用 `i` 函数就够了。装了 `git` 插件时别名总数 246，去掉后是 49。

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
