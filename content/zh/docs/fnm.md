---
description: 'fnm Node.js 版本管理器在 Windows、macOS 和 Linux 上的配置，以及 multishell 目录清理。'
---

# fnm

fnm 是 Node.js 版本管理器。本页介绍 Windows、macOS 和 Linux 上的 shell 配置，以及 multishell 目录的清理。

## 配置 {#configuration}

以下两节按平台选用。

### 在 Windows 上配置 {#configure-on-windows}

在 PowerShell profile 里加载补全：

```powershell
fnm completions --shell powershell | Out-String | Invoke-Expression
```

在 PowerShell profile 里加载 fnm 环境。`fnm env` 每次启动都要执行，它为当前会话创建 multishell 目录：

```powershell
fnm env --use-on-cd --version-file-strategy=recursive --corepack-enabled --resolve-engines --shell powershell | Out-String | Invoke-Expression
```

可选：设置 Node.js 和 corepack 的镜像源，运行一次即可：

```powershell
[System.Environment]::SetEnvironmentVariable("FNM_NODE_DIST_MIRROR", "https://npmmirror.com/mirrors/node/", "User")
[System.Environment]::SetEnvironmentVariable("COREPACK_NPM_REGISTRY", "https://registry.npmmirror.com", "User")
```

### 在 macOS 和 Linux 上配置 {#configure-on-macos-and-linux}

在 shell 配置文件（如 `~/.zshrc`）里加上以下内容。

Homebrew 装的 fnm 存在时加载环境：

```sh
FNM_PATH="/opt/homebrew/opt/fnm/bin"
if [ -d "$FNM_PATH" ]; then
  eval "`fnm env`"
fi
```

启用切换目录时自动切换版本等选项：

```sh
eval "$(fnm env --use-on-cd --version-file-strategy=recursive --corepack-enabled --resolve-engines)"
```

可选：设置 Node.js 和 corepack 的镜像源：

```sh
export FNM_NODE_DIST_MIRROR="https://npmmirror.com/mirrors/node/"
export COREPACK_NPM_REGISTRY="https://registry.npmmirror.com"
```

## 故障排查 {#troubleshooting}

### multishell 目录不断堆积 {#multishell-directories-keep-piling-up}

`fnm_multishells` 下的条目数一直增长，目录数多了会拖慢遍历。

原因：每开一个 shell，fnm 都会建一个 multishell 目录，退出时不清理。

- Windows：位于 `%LOCALAPPDATA%\fnm_multishells`，是 junction，本身几乎不占空间。
- macOS：位于 `~/.local/state/fnm_multishells`，是符号链接，`du -sh` 显示 0B。

解决：任选一种清理方式。

按创建时间清理（Windows）。删除一天前创建的目录：

```powershell
$cut = (Get-Date).AddDays(-1)
Get-ChildItem "$env:LOCALAPPDATA\fnm_multishells" -Directory |
    Where-Object { $_.CreationTime -lt $cut } |
    Remove-Item -Recurse -Force
```

按 PID 清理。目录名格式是 `<PID>_<时间戳>`，可以判断创建它的 shell 是否还在运行，不会误删当前开着的会话：

```sh
d=~/.local/state/fnm_multishells        # Windows: $env:LOCALAPPDATA\fnm_multishells
for e in "$d"/*; do
  n=$(basename "$e")
  [ -L "$e" ] || continue               # 只处理链接
  case "$n" in [0-9]*_[0-9]*) ;; *) continue;; esac
  [ "$e" = "$FNM_MULTISHELL_PATH" ] && continue   # 当前会话在用的绝不能删
  kill -0 "${n%%_*}" 2>/dev/null || rm -f "$e"
done
```

PID 可能被复用，最坏情况是漏删一个，不会误删活着的会话。

删 junction 不会影响目标，`%APPDATA%\fnm\node-versions` 下的 node 安装不受影响。

### 清理后长时间运行的进程里找不到 node {#node-disappears-from-long-running-processes-after-cleanup}

按 PID 清理后，编辑器集成终端、agent 会话、tmux 或 herdr 的 pane 里，`node` 命令消失。

原因：子进程继承父进程的 PATH。创建 multishell 目录的 shell 已退出，但它的后代进程仍在运行并引用这个目录。

检查当前 PATH 里是否有已失效的 multishell 目录：

```sh
echo $PATH | tr ':' '\n' | grep fnm_multishells | while read -r p; do
  [ -e "$p" ] || echo "已失效: $p"
done
```

解决：

1. 重启受影响的进程。新开的 shell 会重新生成自己的目录。
2. 以后清理时同时满足两个条件才删除：进程已退出，且创建时间超过一天：

   ```sh
   find "$d" -maxdepth 1 -type l -mtime +1 | while read -r e; do
     n=$(basename "$e")
     case "$n" in [0-9]*_[0-9]*) ;; *) continue;; esac
     [ "$e" = "$FNM_MULTISHELL_PATH" ] && continue
     kill -0 "${n%%_*}" 2>/dev/null || rm -f "$e"
   done
   ```

### fnm_multishells 显示占用数 GB {#fnmmultishells-appears-to-use-several-gb}

在 Windows 上统计 `%LOCALAPPDATA%\fnm_multishells` 的体积，结果有几个 GB。

原因：`Get-ChildItem -Recurse` 会穿透 junction，把同一份 node 安装重复计算很多次。实际并不占这么多空间。

解决：无需处理。按[multishell 目录不断堆积](#multishell-directories-keep-piling-up)清理条目即可。
