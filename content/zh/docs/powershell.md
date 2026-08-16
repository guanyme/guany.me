# powershell

PowerShell

## 安装 {#installation}

```powershell
winget install --id Microsoft.PowerShell
```

```powershell
winget install --id Starship.Starship
```

```powershell
winget install gerardog.gsudo
```

## 使用说明 {#usage}

```powershell
Set-PSReadlineKeyHandler -Key Tab -Function MenuComplete
```

```powershell
# la —— 对齐 Unix 侧的约定：长格式 + 隐藏项。
# 只能写成函数 —— PowerShell 的别名不能携带固定参数（这里是 -Force）。
# 而别名的解析优先级高于函数，所以原有的 Set-Alias la 必须先移除
Remove-Item Alias:la -Force -ErrorAction Ignore

function la { Get-ChildItem -Force @args }
```

`-Force` 对应 Unix 的 `-A`，让 `la` 列出隐藏和系统项。

不定义 `ll` —— PowerShell 侧本来就没有，跨平台统一只做真正会敲的那个。

```powershell
function i {
    param (
        [string]$DirectoryName
    )

    Set-Location -Path "$HOME\i\$DirectoryName"
}
```

git 相关不再用 `posh-git` / `git-aliases` 模块，改为自己定义函数，见 git 文档。

## 加快启动 {#speed-up-startup}

profile 的开销几乎全花在拉起子进程上。实测 `pwsh -Command "exit"` 的中位值：

|                           | 耗时   |
| ------------------------- | ------ |
| `pwsh -NoProfile`（基线） | 151 ms |
| 优化前                    | 630 ms |
| 优化后                    | 524 ms |

### starship 会被拉起两次 {#starship-double-init}

`starship init powershell` 的输出只有一行：

```powershell
Invoke-Expression (& 'C:\Program Files\starship\bin\starship.exe' init powershell --print-full-init | Out-String)
```

也就是说执行它的时候会**再调一次 starship**。直接取完整脚本并缓存到文件，省掉这一整轮：

```powershell
$__cacheDir = "$HOME\.cache\pwsh"
if (-not (Test-Path $__cacheDir)) { New-Item -ItemType Directory $__cacheDir -Force | Out-Null }

$__f = "$__cacheDir\starship.ps1"
$__src = (Get-Command starship -ErrorAction SilentlyContinue).Source
if ($__src -and ((-not (Test-Path $__f)) -or (Get-Item $__src).LastWriteTime -gt (Get-Item $__f).LastWriteTime)) {
    starship init powershell --print-full-init | Out-String | Set-Content $__f -Encoding utf8
}
if (Test-Path $__f) { . $__f }
```

按二进制的 `LastWriteTime` 决定是否重新生成，`winget upgrade` 之后会自动更新，不用手动清缓存。

**dot-source 必须写在 profile 顶层。** 把这段包进函数里，`. $__f` 只会作用于函数作用域，
prompt 定义不到全局，表现就是「缓存跑了但提示符没变」。

mise 的补全脚本也用同样的方式缓存，但**必须排在 `mise activate` 之后** ——
补全运行时要调 `usage`，而 usage 本身是 mise 管的工具，activate 之前不在 PATH 里，
于是每开一个 shell 都会打一行 `usage CLI not found`。详见 mise 文档。

### 动不了的那部分 {#irreducible-cost}

`Set-PSReadlineKeyHandler` 一行约 183 ms，实际是 **PSReadLine 模块首次加载**的代价，不是设快捷键本身。
交互式会话里这个模块本来就会加载，把它挪走或延迟只是把耗时推到第一次按键，体感不会变快。

`mise activate` 也不能缓存 —— 它必须每次执行，为当前会话解析版本并挂上目录切换钩子。

## powershell-profile

[⚙︎ Guany Powershell profile](https://github.com/guanyme/powershell-profile/)
