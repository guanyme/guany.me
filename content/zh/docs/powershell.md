---
description: '安装 PowerShell 7，配置 $PROFILE 里的补全、提示符、别名和函数'
---

# PowerShell

本页介绍如何安装 PowerShell 7 及相关工具，在 `$PROFILE` 里配置补全、提示符、别名和函数，并排查 profile 导致的 scp 问题。

## 安装 {#installation}

用 winget 安装以下工具。

安装 PowerShell 7：

```powershell
winget install --id Microsoft.PowerShell
```

安装 Starship：

```powershell
winget install --id Starship.Starship
```

安装 gsudo：

```powershell
winget install gerardog.gsudo
```

## 配置 {#configuration}

以下配置都写在 `$PROFILE` 里。

### 设置补全和提示符 {#set-up-completion-and-the-prompt}

在 `$PROFILE` 里加上 Tab 菜单补全和 Starship 提示符：

```powershell
Set-PSReadlineKeyHandler -Key Tab -Function MenuComplete

Invoke-Expression (&starship init powershell)
```

### 用函数定义别名 {#define-aliases-as-functions}

PowerShell 的别名不能带参数，所以 `la`、git、`nr` 这些都写成函数。内置别名的优先级比函数高，要先移除 `la`、`gp`（Get-ItemProperty）、`gl`（Get-Location）、`ni`（New-Item），否则调不到同名函数：

```powershell
foreach ($a in "la", "gp", "gl", "ni") { Remove-Item "Alias:$a" -Force -ErrorAction Ignore }

function la { Get-ChildItem -Force @args }
```

`-Force` 会同时列出隐藏文件和系统文件。

在 `$PROFILE` 里加上 git 和 `nr` 的函数：

```powershell
function g { git @args }
function gaa { git add --all @args }
function gcmsg { git commit --message @args }
function gp { git push @args }
function gl { git pull @args }
function gcl { git clone --recurse-submodules @args }
function grt {
    $root = git rev-parse --show-toplevel 2>$null
    if ($root) { Set-Location $root } else { Write-Warning "不在 git 仓库中" }
}

function nio { ni --prefer-offline }
function s { nr start }
function d { nr dev }
function b { nr build }
function bw { nr build --watch }
function t { nr test }
function tu { nr test -u }
function tw { nr test --watch }
function w { nr watch }
function p { nr play }
function c { nr typecheck }
function lint { nr lint }
function lintf { nr lint --fix }
function release { nr release }
function re { nr release }
```

### 函数 {#functions}

在 `$PROFILE` 里定义 `i` 函数，跳到 `$HOME\i` 下的对应目录：

```powershell
function i {
    param (
        [string]$DirectoryName
    )

    Set-Location -Path "$HOME\i\$DirectoryName"
}
```

### 语言运行时 {#runtimes}

在 `$PROFILE` 里激活 mise：

```powershell
(&mise activate pwsh) | Out-String | Invoke-Expression
```

## 故障排查 {#troubleshooting}

### profile 有输出会弄坏 scp {#profile-output-breaks-scp}

PowerShell 作为 OpenSSH 的 `DefaultShell` 时，scp 和 sftp 失败：

```text
scp: Received message too long 458961715
scp: Ensure the remote shell produces no output for non-interactive sessions.
```

原因是 profile 往 stdout 写了内容。检查 profile 里的 `echo`、`Write-Output` 和会打印警告的命令，删掉或改掉它们。例如 mise 补全放在 `activate` 前面会打印 `usage CLI not found`。

## 参考 {#references}

- [Guany PowerShell profile](https://github.com/guanyme/powershell-profile/)：Guany 的 PowerShell profile 仓库。
