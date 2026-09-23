---
description: 'Git 全局配置：身份、默认分支、行尾、credential helper、LFS 与别名'
---

# Git

Git 是分布式版本控制系统。本页介绍常用的全局配置和跨 zsh、PowerShell 的别名。

## 配置 {#configuration}

以下命令写入全局配置 `~/.gitconfig`，按需选用。

### 设置用户名和邮箱 {#set-your-name-and-email}

把 `Your Name` 和 `youremail@domain.com` 换成自己的信息：

```sh
git config --global user.name "Your Name"
```

```sh
git config --global user.email "youremail@domain.com"
```

### 把默认分支设为 main {#set-the-default-branch-to-main}

新建仓库时默认分支名为 `main`：

```sh
git config --global init.defaultBranch main
```

### 关闭 CRLF 自动转换 {#disable-automatic-crlf-conversion}

关闭提交和检出时的行尾自动转换：

```sh
git config --global core.autocrlf false
```

### 配置 credential helper {#configure-a-credential-helper}

按系统选择 credential helper。

#### WSL {#wsl}

使用 Windows 上 Git 自带的 Git Credential Manager：

```sh
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

#### Linux {#linux}

把凭据保存在本地文件：

```sh
git config --global credential.helper store
```

### 启用 Git LFS {#enable-git-lfs}

为当前用户启用 Git LFS：

```sh
git lfs install
```

### 可选设置 {#optional-settings}

按需开启：

```sh
git config --global push.autoSetupRemote true   # 新分支第一次 push 不用 -u
git config --global pull.rebase true            # pull 用 rebase，不产生合并提交
git config --global rebase.autostash true       # rebase 前自动 stash 未提交的改动
git config --global diff.algorithm histogram    # 改动较多时 diff 更好读
git config --global help.autocorrect prompt     # 敲错子命令时提示改正
```

clone 时把 HTTPS 地址自动换成 SSH：

```sh
git config --global url."git@github.com:".insteadOf https://github.com/
```

### 别名 {#aliases}

zsh 和 PowerShell 使用同一组别名，语义一致。

#### zsh {#zsh}

在 `~/.zshrc` 里加上：

```sh
alias g="git"
alias gaa="git add --all"
alias gcmsg="git commit --message"
alias gp="git push"
alias gl="git pull"
alias gcl="git clone --recurse-submodules"
```

#### PowerShell {#powershell}

在 `$PROFILE` 里加上。PowerShell 的别名不能带固定参数，所以用函数代替 `Set-Alias`：

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

两边都可以串起来用：

```sh
g init && gaa && gcmsg "feat: initial"
```

## 参考 {#references}

- [Guany Git config](https://github.com/guanyme/config/blob/main/.gitconfig)：作者的 `.gitconfig`。
