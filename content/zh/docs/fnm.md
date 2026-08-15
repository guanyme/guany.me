# fnm

fnm

## 配置 {#configuration}

### Windows

```powershell
fnm completions --shell powershell | Out-String | Invoke-Expression
```

```powershell
fnm env --use-on-cd --version-file-strategy=recursive --corepack-enabled --resolve-engines --shell powershell | Out-String | Invoke-Expression
```

```powershell
[System.Environment]::SetEnvironmentVariable("FNM_NODE_DIST_MIRROR", "https://npmmirror.com/mirrors/node/", "User")
[System.Environment]::SetEnvironmentVariable("COREPACK_NPM_REGISTRY", "https://registry.npmmirror.com", "User")
```

#### 缓存补全脚本 {#cache-completions}

`fnm completions` 生成的脚本约 42 KB，每次启动重新生成要 30 ms。它只随 fnm 二进制变化，
缓存起来即可：

```powershell
$__f = "$HOME\.cache\pwsh\fnm-completions.ps1"
$__src = (Get-Command fnm -ErrorAction SilentlyContinue).Source
if ($__src -and ((-not (Test-Path $__f)) -or (Get-Item $__src).LastWriteTime -gt (Get-Item $__f).LastWriteTime)) {
    fnm completions --shell powershell | Out-String | Set-Content $__f -Encoding utf8
}
if (Test-Path $__f) { . $__f }
```

`fnm env` **不能**这样处理 —— 它必须每次执行，为当前会话创建 multishell 目录。

#### multishell 目录会一直堆积 {#multishell-buildup}

每开一个 shell，fnm 都会在 `%LOCALAPPDATA%\fnm_multishells` 下建一个目录，
Windows 上退出时不清理，会一直累积。

它们是 junction，本身几乎不占空间，但目录数多了会拖慢遍历。清理陈旧的：

```powershell
$cut = (Get-Date).AddDays(-1)
Get-ChildItem "$env:LOCALAPPDATA\fnm_multishells" -Directory |
    Where-Object { $_.CreationTime -lt $cut } |
    Remove-Item -Recurse -Force
```

删 junction 不会动到目标 —— `%APPDATA%\fnm\node-versions` 下的 node 安装是安全的。
统计这个目录的体积时要注意：`Get-ChildItem -Recurse` 会穿透 junction，
把同一份 node 重复计上千遍，看起来像几个 GB，实际并没有。

**macOS 同样会堆积**，位置是 `~/.local/state/fnm_multishells`。那边是符号链接，
`du -sh` 显示 0B，所以不占空间，但条目数会无限增长。

### 按 PID 清理比按时间准 {#cleanup-by-pid}

目录名的格式是 `<PID>_<时间戳>`，所以可以直接判断创建它的 shell 还在不在，
这样不会误删今天开着的会话：

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

PID 可能被复用，最坏情况只是漏删一个，不会误删活着的。

**但这个判据有个盲区：祖先已退出、后代还在跑。** 子进程会继承父进程的 PATH，
所以一个「创建者已死」的目录，可能仍被某个长期运行的进程（编辑器的集成终端、
agent 的会话、tmux/herdr 里的 pane）引用着。删掉之后那些进程里 `node` 会直接消失：

```sh
echo $PATH | tr ':' '\n' | grep fnm_multishells | while read -r p; do
  [ -e "$p" ] || echo "已失效: $p"
done
```

稳妥做法是**两个条件都满足才删** —— 进程已退出，且创建时间超过一天：

```sh
find "$d" -maxdepth 1 -type l -mtime +1 | while read -r e; do
  n=$(basename "$e")
  case "$n" in [0-9]*_[0-9]*) ;; *) continue;; esac
  [ "$e" = "$FNM_MULTISHELL_PATH" ] && continue
  kill -0 "${n%%_*}" 2>/dev/null || rm -f "$e"
done
```

真误删了也不严重：新开的 shell 会重新生成，受影响的进程重启一下即可。

### MacOS/Linux

```sh
FNM_PATH="/opt/homebrew/opt/fnm/bin"
if [ -d "$FNM_PATH" ]; then
  eval "`fnm env`"
fi
```

```sh
eval "$(fnm env --use-on-cd --version-file-strategy=recursive --corepack-enabled --resolve-engines)"
```

```sh
export FNM_NODE_DIST_MIRROR="https://npmmirror.com/mirrors/node/"
export COREPACK_NPM_REGISTRY="https://registry.npmmirror.com"
```
