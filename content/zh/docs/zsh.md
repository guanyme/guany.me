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
`zsh-z` 同理，跳转用 `i` 函数就够了。

```sh
eval "$(starship init zsh)"
```

```sh
i() {
  cd ~/i/$1
}
```

## 别名 {#aliases}

跨机器统一的 ls 别名只有 `la` 一个。git 相关见 git 文档。

```sh
alias la='ls -lAh'     # 长格式 + 隐藏项
```

Ubuntu 的 `.bashrc` 默认给的是 `la='ls -A'`（只列隐藏、短格式），语义不同。
改在**原处** —— 把发行版默认那行注释掉，新值紧跟其后：

```sh
# some more ls aliases
alias ll='ls -alF'
# alias la='ls -A'
alias la='ls -lAh'
alias l='ls -CF'
```

堆在文件末尾也能生效（后定义的赢），但改在原处才看得出「这里换过约定」，
不然下次读 `.bashrc` 会以为发行版默认还在起作用。

**`ll` 和 `l` 不统一，保持各发行版原样。** oh-my-zsh 给的是 `ll='ls -lh'`、`l='ls -lah'`，
Ubuntu 给的是 `ll='ls -alF'`、`l='ls -CF'` —— 确实不一致，但既然日常只敲 `la`，
统一它们没有收益。跨机器对齐的意义在于「换机器不踩空」，而踩空只发生在真正会用的命令上；
不用的别名统一了没人受益，改动本身反倒是噪音。

oh-my-zsh 自带 `la`，装了就有，不用重复定义。

## 加载顺序 {#load-order}

```
①  ~/.zshenv       所有 zsh 都读，包括脚本、cron、LaunchAgent
②  /etc/zprofile   ← macOS 在这里跑 path_helper
③  ~/.zprofile     登录 shell
④  /etc/zshrc
⑤  ~/.zshrc        仅交互式
```

### path_helper 会重排 PATH {#path-helper}

macOS 的 `/etc/zprofile` 里有这么一段：

```sh
if [ -x /usr/libexec/path_helper ]; then
	eval `/usr/libexec/path_helper -s`
fi
```

它把 `/etc/paths` 和 `/etc/paths.d/*` 里的系统路径**整体移到最前面**，`~/.zshenv` 设的用户目录会被压到 `/usr/bin` 之后：

```
仅 ~/.zshenv：    ~/.local/bin  ~/.cargo/bin  /opt/homebrew/bin  …
经过 .zprofile：  /opt/homebrew/bin  /usr/local/bin  /usr/bin  …  ~/.local/bin
```

**所以在 macOS 上把 PATH 优先级寄望于 `.zshenv` 是不成立的。** `.zshenv` 只保证「脚本能找到」，真正的优先级必须在 `path_helper` 之后重新确立。

### 非交互登录 shell 会静默降级 {#non-interactive-login}

如果优先级只写在 `.zshrc` 里，同一个命令在两种场景下会解析到不同实现 —— 因为 `.zshrc` 非交互不读：

```sh
zsh -lic 'command -v python3; command -v tar'   # 交互：uv 的 python、GNU tar
zsh -lc  'command -v python3; command -v tar'   # 非交互：homebrew 的 python、bsdtar
```

`ssh 本机 '命令'`、LaunchAgent、CI 走的都是后者。GNU tar 与 bsdtar 在 `--wildcards`、`--transform` 上行为不同，交互式调通的命令写进脚本就可能跑不通。

**修法是把优先级放进 `~/.zprofile`** —— 它在 `path_helper` 之后执行，且交互与非交互登录 shell 都会读：

```sh
typeset -U path fpath

path=(
  "$HOME/.local/bin"
  "${HOMEBREW_PREFIX:-/opt/homebrew}/opt/gnu-tar/libexec/gnubin"
  $path
)
```

想连 `zsh -c` 跑的脚本也一致，再在 `~/.zshenv` 里加一份（`typeset -U` 会去重）。

## 命令遮挡 {#shadowing}

同名可执行文件出现在多个 PATH 目录时，只有最前面那个生效。列出全部重名：

```sh
echo $PATH | tr ':' '\n' | while read -r d; do
  find "$d" -maxdepth 1 -type f -perm -u+x 2>/dev/null | while read -r f; do
    echo "$(basename "$f")|$d"
  done
done | sort -t'|' -k1,1 | awk -F'|' '$1==p{print $1" <- "$2} {p=$1}'
```

统计时**只算可执行文件** —— 目录软链（如 gnu-tar 的 `gnuman`）也带执行位，会造成误报。

### uv 的 python 与 pip 要一起软链 {#uv-pip}

`~/.local/bin` 里如果只有 `python`/`python3`，`pip3` 就会落到 Homebrew，于是 `pip3 install` 装的包 `python3` 根本 import 不到：

```sh
python3 -m pip --version   # ~/.local/share/uv/python/.../site-packages/pip
pip3 --version             # /opt/homebrew/lib/python3.14/site-packages/pip   ← 不同源
```

uv 的 python 目录里本来就带 pip，补上软链即可：

```sh
base="$HOME/.local/share/uv/python/cpython-3.14-macos-aarch64-none/bin"
for f in pip pip3 pip3.14; do ln -s "$base/$f" ~/.local/bin/$f; done
```

### 上游会抢同一个命令名 {#name-collision}

Cursor 的 CLI 二进制就叫 `agent`，装进 `~/.local/bin`；Grok 的安装器则同时创建 `grok` 和 `agent` 两个软链到 `~/.grok/bin`，指向同一个二进制。两者都占用 `agent`，谁在 PATH 前面谁生效。

这种情况优先保留**只有一个名字的那个**（Cursor 的 `agent` 丢了就没了，Grok 的 `agent` 只是 `grok` 的别名，丢掉零损失）。

## 密钥不要常驻环境变量 {#secrets-on-demand}

在 `.zshrc` 里 `export` 私钥，等于让**所有子进程**都能读到 —— npm 的 postinstall 脚本、CLI 的崩溃上报、agent 的 env dump 都会顺带带走。改成按需注入，密钥只在被包装的那条命令的生命周期内存在：

```sh
tauri-sign() {
  local k="$HOME/.tauri/tauri.key" p="$HOME/.tauri/tauri.pass"
  [ -r "$k" ] || { print -u2 "tauri-sign: 缺少 $k"; return 1 }
  [ -r "$p" ] || { print -u2 "tauri-sign: 缺少 $p"; return 1 }
  [ $# -gt 0 ] || { print -u2 "用法: tauri-sign <命令> [参数...]"; return 2 }
  TAURI_SIGNING_PRIVATE_KEY="$(<"$k")" \
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$(<"$p")" \
    "$@"
}
```

```sh
tauri-sign nr build
env | grep -c '^TAURI_SIGNING'   # 平时为 0
```

密钥文件本身用 `chmod 600`，目录 `chmod 700`。

## config

[⚙︎ Guany config](https://github.com/guanyme/config)
