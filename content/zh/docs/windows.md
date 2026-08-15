# windows

Windows

## 配置代理 {#configure-proxy}

```powershell
[System.Environment]::SetEnvironmentVariable("http_proxy", "http://127.0.0.1:7890", "User")
[System.Environment]::SetEnvironmentVariable("https_proxy", "http://127.0.0.1:7890", "User")
```

## 环境变量：别用 SetEnvironmentVariable 改 PATH {#env-reg-type}

环境变量存在注册表两级：

```
HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment   机器级
HKCU\Environment                                                    用户级
```

登录时合并，**PATH 是特例：机器级在前、用户级在后**（其他变量是用户级覆盖机器级）。

值类型决定 `%VAR%` 能不能展开：

| 类型                                                | 行为                                             |
| --------------------------------------------------- | ------------------------------------------------ |
| `REG_EXPAND_SZ`（PowerShell 显示为 `ExpandString`） | `%USERPROFILE%\bin` 会展开                       |
| `REG_SZ`（`String`）                                | `%USERPROFILE%` 被当成**字面量目录名**，等于失效 |

**`[System.Environment]::SetEnvironmentVariable` 写的是 `REG_SZ`。** 用它改一次 PATH，里面所有 `%VAR%` 引用就被烤成绝对路径 —— 这就是「环境变量一改，路径全展开了」的根源。系统属性面板里那个 GUI 编辑器同样会展开。

正确写法是显式指定类型：

```powershell
# ❌ 会把类型写成 REG_SZ
[Environment]::SetEnvironmentVariable("Path", $v, "User")

# ✅
Set-ItemProperty -Path "HKCU:\Environment" -Name Path -Value $v -Type ExpandString
```

读**未展开**的原始值（否则你看到的已经是展开后的结果）：

```powershell
(Get-Item "HKCU:\Environment").GetValue("Path", "", "DoNotExpandEnvironmentNames")
```

改完广播一下，已运行的进程才会重新读取（新进程才生效，已开的终端不会变）：

```powershell
$sig = @'
[DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Auto)]
public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam,
    string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
'@
$t = Add-Type -MemberDefinition $sig -Name Win32 -Namespace Env -PassThru
[UIntPtr]$r = [UIntPtr]::Zero
$t::SendMessageTimeout([IntPtr]0xffff, 0x1A, [UIntPtr]::Zero, "Environment", 2, 5000, [ref]$r)
```

### 该用变量的地方用变量 {#use-variables}

stock Windows 的机器级 PATH 本来就是变量形式，被 GUI 展开过的机器会变成写死的绝对路径。恢复过来，换 JDK 或 CUDA 版本时只需改一个变量：

```
%SystemRoot%\system32          %SystemRoot%\System32\Wbem
%SystemRoot%\System32\WindowsPowerShell\v1.0\
%JAVA_HOME%\bin                %CUDA_PATH%\bin
```

用户级同理，全部走 `%USERPROFILE%\…`。

**但 `Program Files` 不要换成 `%ProgramFiles%`** —— 32 位进程里它会展开成 `Program Files (x86)`，会引入很难查的问题。stock Windows 自己也只对系统目录用变量。

CUDA 用 `%CUDA_PATH%` 而不是 `%CUDA_PATH_V12_9%`：前者指向当前启用的版本，后者是版本锁定的别名，用后者就失去意义了。

改动前后务必比对**展开后的值**是否一致，不一致就回滚：

```powershell
$before = [Environment]::GetEnvironmentVariable("Path","Machine")
# …修改…
$after  = [Environment]::GetEnvironmentVariable("Path","Machine")
if ($before.TrimEnd(";") -ne $after.TrimEnd(";")) { "不一致，回滚" }
```

## SSH 会话里的「不受信任的装入点」 {#untrusted-mount-point}

在 Windows 11 24H2 及以后的版本上，通过 SSH 登录后运行某些命令会报：

```
无法遍历该路径，因为它包含不受信任的装入点。
Program 'fnm.exe' failed to run: An error occurred trying to start process
'C:\Users\<user>\AppData\Local\Microsoft\WinGet\Links\fnm.exe'
```

原因是**这一代 Windows 收紧了 SSH 会话对 reparse point（符号链接 / junction）的穿透**。
本地开终端不受影响，所以问题只在 ssh 过去时出现。

### 先确认是不是这一类 {#identify}

看到「不受信任的装入点」或 `untrusted mount point` 就是它，不用往别处查。
关键变量是**系统版本**，不是配置：

|                                           | Windows 10 22H2 · 19045    | Windows 11 25H2 · 26200 |
| ----------------------------------------- | -------------------------- | ----------------------- |
| SSH 登录令牌                              | NETWORK                    | NETWORK                 |
| `fsutil behavior query SymlinkEvaluation` | L2L/L2R 启用，R2L/R2R 禁用 | 完全相同                |
| 开发人员模式                              | 已开                       | 已开                    |
| WinGet 的符号链接能否穿透                 | **能**                     | **不能**                |

三项配置全同、只有系统版本不同，所以这不是哪里配错了。

**两条弯路可以省掉**：`fsutil behavior set SymlinkEvaluation R2L:1` 对这个场景无效
（L2L/R2L 指的是链接和目标各自在本地还是网络路径，两端都在 C: 盘时属于 L2L，本来就是启用的）；
登录令牌类型也不是原因，Win10 那台同样是 NETWORK 令牌却一切正常。

### 三种修法 {#fixes}

**一、junction 被拦 → 用原生 API 重建。** `mklink /J` 建出来的能正常穿透，
各语言的库自己写 reparse 数据建出来的则不一定：

```powershell
cmd /c rmdir "<链接路径>"           # 不带 /s，只删链接不动目标
cmd /c mklink /J "<链接路径>" "<真实目标>"
```

**二、WinGet 的 shim 被拦 → 把真实包目录前置到 PATH。**
`WinGet\Links` 下全是符号链接，绕开它直接指向 `WinGet\Packages\<包 ID>`：

```powershell
$base = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages"
$real = "$base\Schniz.fnm_Microsoft.Winget.Source_8wekyb3d8bbwe"

# 注意读 User 级，不能用 $env:Path —— 那是机器级+用户级合并后的值，
# 写回去会把机器级 PATH 复制进用户级，越滚越长
$u = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$real;$u", "User")
```

**三、装 / 升级这类操作到本地或 RDP 做。** pnpm 的 `node_modules` 就是靠大量 junction 搭起来的，
在 SSH 会话里读不了自己刚建的链接，安装必然失败。已经装好的东西正常使用不受影响。

不建议为此改用密码认证 —— 那样能拿到完整令牌，但要放弃免密登录，不划算。
