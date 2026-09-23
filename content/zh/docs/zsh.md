---
description: '用 oh-my-zsh、插件和 Starship 配置 Zsh，并排查 PATH 问题'
---

# Zsh

本页介绍如何用 oh-my-zsh、插件和 Starship 配置 Zsh shell，以及如何排查常见的 PATH 问题。

## 安装 {#installation}

按顺序安装 oh-my-zsh、插件和 Starship：

1. 安装 oh-my-zsh：

   ```sh
   sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
   ```

2. 把 zsh-autosuggestions 和 zsh-syntax-highlighting 克隆到 oh-my-zsh 的插件目录：

   ```sh
   git clone https://github.com/zsh-users/zsh-autosuggestions.git ~/.oh-my-zsh/plugins/zsh-autosuggestions
   git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/plugins/zsh-syntax-highlighting
   ```

3. 安装 Starship：

   ```sh
   curl -sS https://starship.rs/install.sh | sh
   ```

## 配置 {#configuration}

配置写在 `~/.zshrc` 里。插件列表写在 `source $ZSH/oh-my-zsh.sh` 之前，其余配置写在它之后。

### 插件 {#plugins}

在 `~/.zshrc` 里启用插件：

```sh
plugins=(
  command-not-found
  zsh-autosuggestions
  zsh-syntax-highlighting
)
```

不启用 `git` 和 `zsh-z` 插件。git 别名在下面单独定义，目录跳转用下面的 `i` 函数。

### 提示符 {#prompt}

在 `~/.zshrc` 里启用 Starship：

```sh
eval "$(starship init zsh)"
```

### 函数 {#functions}

在 `~/.zshrc` 里定义 `i` 函数：

```sh
i() {
  cd ~/i/$1
}
```

`i <目录>` 跳到 `~/i` 下的对应目录。

### 别名 {#aliases}

oh-my-zsh 自带 `la='ls -lAh'`，以长格式列出包括隐藏项在内的所有文件。

Ubuntu 的 `.bashrc` 默认是 `la='ls -A'`。要得到同样的效果，在 `~/.bashrc` 里改成：

```sh
# alias la='ls -A'
alias la='ls -lAh'
```

在 `~/.zshrc` 里加上 git 和 `nr` 的别名：

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

### 环境变量 {#environment-variables}

在 `~/.zshrc` 里设置编辑器和 PATH：

```sh
export EDITOR='code'
export PATH="$HOME/.local/bin:$PATH"
```

uv、claude、codex、mise 的官方安装器都装到 `~/.local/bin`。

### 语言运行时 {#runtimes}

node、pnpm、java 等由 mise 管理。在 `~/.zshrc` 里激活 mise：

```sh
eval "$($HOME/.local/bin/mise activate zsh)"
```

bun 和 Maven 的配置：

```sh
export MAVEN_HOME="/usr/local/maven"
export PATH="$MAVEN_HOME/bin:$PATH"

[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

### 其他启动文件 {#other-startup-files}

Homebrew 写在 `~/.zprofile`：

```sh
eval "$(/opt/homebrew/bin/brew shellenv zsh)"
```

### 只给单条命令注入密钥 {#pass-secrets-to-a-single-command}

`.zshrc` 里 `export` 的密钥，所有子进程都能读到。只在需要它的那条命令上临时注入：

```sh
TAURI_SIGNING_PRIVATE_KEY="$(<~/.tauri/tauri.key)" nr build
```

## 故障排查 {#troubleshooting}

### 脚本里的 PATH 和终端里不一样 {#path-differs-in-scripts}

zsh 按以下顺序读取启动文件：

```text
~/.zshenv      所有 zsh，包括脚本、cron、LaunchAgent
/etc/zprofile  macOS 在这里跑 path_helper
~/.zprofile    登录 shell
~/.zshrc       仅交互式
```

写在 `.zshrc` 里的 PATH 和 `mise activate`，`ssh <主机> '<命令>'`、LaunchAgent、CI 都读不到。macOS 的 `path_helper` 还会把系统路径整体提到最前，打乱 `.zshenv` 里设的顺序。

1. 把 PATH 优先级写进 `~/.zprofile`，它在 `path_helper` 之后执行：

   ```sh
   typeset -U path fpath

   path=(
     "$HOME/.local/bin"
     "$HOME/.local/share/mise/shims"
     $path
   )
   ```

2. 验证交互和非交互 shell 的结果一致：

   ```sh
   zsh -lic 'command -v python3'   # 交互
   zsh -lc  'command -v python3'   # 非交互，结果应该一样
   ```

### 运行的不是预期的同名命令 {#a-command-runs-the-wrong-executable}

PATH 里排在前面的目录优先。列出所有在多个目录里重名的可执行文件：

```sh
echo $PATH | tr ':' '\n' | while read -r d; do
  find "$d" -maxdepth 1 -type f -perm -u+x 2>/dev/null | while read -r f; do
    echo "$(basename "$f")|$d"
  done
done | sort -t'|' -k1,1 | awk -F'|' '$1==p{print $1" <- "$2} {p=$1}'
```

常见的两种情况：

- **uv 的 python 和 Homebrew 的 pip 不同源。** `~/.local/bin` 只有 `python3` 的软链时，`pip3` 会落到 Homebrew，装的包 `python3` import 不到。改用 `python3 -m pip`，或者把 uv python 目录下的 `pip` 也软链到 `~/.local/bin`。
- **两个工具抢一个名字。** Cursor CLI 和 Grok 都会装一个 `agent`，PATH 里排在前面的生效。

## 参考 {#references}

- [Guany config](https://github.com/guanyme/config)：Guany 的配置仓库。
