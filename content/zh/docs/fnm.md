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
Windows 上退出时不清理。实测攒了 **2433 个**。

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
