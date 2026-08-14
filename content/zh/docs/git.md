# git

Git

## 配置关闭自动转换 CRLF 行尾 {#disable-crlf-auto-conversion}

```sh
git config --global core.autocrlf false
```

## 配置 credential helper {#configure-credential-helper}

### WSL

```sh
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

### Linux

```sh
git config --global credential.helper store
```

## 配置默认分支为 main {#set-default-branch-to-main}

```sh
git config --global init.defaultBranch main
```

## 配置用户和邮箱 {#configure-user-and-email}

```sh
git config --global user.name "Your Name"
```

```sh
git config --global user.email "youremail@domain.com"
```

## 配置 lfs {#configure-lfs}

```sh
git lfs install
```

## 别名 {#aliases}

不用 oh-my-zsh 的 `git` 插件，也不用 PowerShell 的 `git-aliases` 模块 —— 前者一次塞 197 个别名，
实际用到的就这几个。两边保持同样的语义，跨平台肌肉记忆一致。

### zsh {#aliases-zsh}

```sh
alias g="git"
alias gaa="git add --all"
alias gcmsg="git commit --message"
alias gp="git push"
alias gl="git pull"
alias gcl="git clone --recurse-submodules"
```

### PowerShell {#aliases-powershell}

PowerShell 里要用**函数**而不是 `Set-Alias`，因为别名不能带固定参数。

```powershell
# gp / gl 是内置只读别名（Get-ItemProperty / Get-Location）。
# 命令解析顺序是 别名 > 函数，不先移除的话下面的函数永远调不到
foreach ($a in "gp", "gl") { Remove-Item "Alias:$a" -Force -ErrorAction Ignore }

function g { git @args }
function gaa { git add --all @args }
function gcmsg { git commit --message @args }
function gp { git push @args }
function gl { git pull @args }
function gcl { git clone --recurse-submodules @args }
```

`git-aliases` 模块靠 `Import-Module git-aliases -DisableNameChecking` 做的就是这件事，
自己定义时这一步得自己接管。

两边都支持串起来用：

```sh
g init && gaa && gcmsg "feat: initial"
```

## config

[⚙︎ Guany Git config](https://github.com/guanyme/config/blob/main/.gitconfig)
