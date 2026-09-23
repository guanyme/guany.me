---
description: 'Windows 的代理配置，以及 PATH 变量和 SSH 会话的常见问题'
---

# Windows

本页介绍 Windows 的代理环境变量配置，以及 PATH 变量不展开、SSH 会话报「不受信任的装入点」两个问题的排查方法。

## 配置 {#configuration}

代理通过用户级环境变量设置。

### 配置代理 {#configure-a-proxy}

为当前用户设置代理环境变量：

```powershell
[System.Environment]::SetEnvironmentVariable("http_proxy", "http://127.0.0.1:7890", "User")
[System.Environment]::SetEnvironmentVariable("https_proxy", "http://127.0.0.1:7890", "User")
```

## 故障排查 {#troubleshooting}

以下问题常见于修改 PATH 后和 SSH 会话中。

### 改过 PATH 之后 %VAR% 不展开 {#path-variables-stop-expanding}

原因：PATH 的值类型被改成了 `REG_SZ`。只有 `REG_EXPAND_SZ` 类型里的 `%USERPROFILE%` 这类引用才会展开。`[Environment]::SetEnvironmentVariable` 写入的是 `REG_SZ`，用它改一次 PATH，所有 `%VAR%` 都会变成字面量。系统属性里的图形编辑器也会把它们展开成绝对路径。

PATH 存在注册表的两个位置，登录时机器级在前、用户级在后合并：

```text
HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment   机器级
HKCU\Environment                                                    用户级
```

改 PATH 时显式指定类型，`$v` 是新的 PATH 值：

```powershell
Set-ItemProperty -Path "HKCU:\Environment" -Name Path -Value $v -Type ExpandString
```

检查类型和原始值：

```powershell
$uk = "HKCU:\Environment"
(Get-Item $uk).GetValueKind("Path")                                 # 应为 ExpandString
(Get-Item $uk).GetValue("Path", "", "DoNotExpandEnvironmentNames")  # 应含 %USERPROFILE%
```

注意：

- 改完只对新开的终端生效。
- 第三方安装器常用 `SetEnvironmentVariable` 写 PATH，装完软件后类型可能变回 `REG_SZ`。安装软件后再检查一次。
- 系统目录用 `%SystemRoot%`，JDK、CUDA 用 `%JAVA_HOME%`、`%CUDA_PATH%`，换版本只改一个变量。`%CUDA_PATH%` 指向当前版本，不要用 `%CUDA_PATH_V12_9%` 这种固定版本的变量。
- `Program Files` 不要写成 `%ProgramFiles%`，32 位进程里它会展开成 `Program Files (x86)`。

### SSH 会话提示不受信任的装入点 {#ssh-sessions-report-an-untrusted-mount-point}

```text
无法遍历该路径，因为它包含不受信任的装入点。
```

原因：Windows 11 24H2 起，SSH 会话不再穿透部分符号链接和 junction，本地终端不受影响。同样的配置在 Windows 10 22H2 上正常，所以不是配置错误，`fsutil behavior set SymlinkEvaluation` 也无效。

按被拦截的对象选择修法：

- **junction 被拦**：用 `mklink /J` 重建。系统原生 API 建的 junction 能正常穿透：

  ```powershell
  cmd /c rmdir "<链接路径>"
  cmd /c mklink /J "<链接路径>" "<真实目标>"
  ```

- **WinGet 安装的命令被拦**：`WinGet\Links` 下都是符号链接。把真实目录 `%LOCALAPPDATA%\Microsoft\WinGet\Packages\<包 ID>` 加到用户 PATH 前面，写入方法见[改过 PATH 之后 %VAR% 不展开](#path-variables-stop-expanding)。
- **pnpm 安装失败**：pnpm 的 `node_modules` 全是 junction，在 SSH 会话里安装必然失败。在本地或远程桌面安装、升级，装好之后通过 SSH 使用不受影响。
