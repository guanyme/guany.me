---
description: 'Proxy settings on Windows, plus fixes for PATH variables and SSH session errors'
---

# Windows

This page covers proxy environment variables on Windows, and how to fix PATH variables that stop expanding and "untrusted mount point" errors in SSH sessions.

## Configuration

Set the proxy with user-level environment variables.

### Configure a proxy

Set the proxy environment variables for the current user:

```powershell
[System.Environment]::SetEnvironmentVariable("http_proxy", "http://127.0.0.1:7890", "User")
[System.Environment]::SetEnvironmentVariable("https_proxy", "http://127.0.0.1:7890", "User")
```

## Troubleshooting

These problems commonly appear after editing PATH and in SSH sessions.

### PATH variables stop expanding

Cause: the PATH value type was changed to `REG_SZ`. References like `%USERPROFILE%` only expand when the value type is `REG_EXPAND_SZ`. `[Environment]::SetEnvironmentVariable` writes `REG_SZ`, so changing PATH with it once turns every `%VAR%` into a literal. The editor in System Properties also expands them into absolute paths.

PATH lives in two registry keys, merged at logon with the machine scope first and the user scope after it:

```text
HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment   machine
HKCU\Environment                                                    user
```

Set the type explicitly when you change PATH. `$v` is the new PATH value:

```powershell
Set-ItemProperty -Path "HKCU:\Environment" -Name Path -Value $v -Type ExpandString
```

Check the type and the raw value:

```powershell
$uk = "HKCU:\Environment"
(Get-Item $uk).GetValueKind("Path")                                 # should be ExpandString
(Get-Item $uk).GetValue("Path", "", "DoNotExpandEnvironmentNames")  # should contain %USERPROFILE%
```

Notes:

- Changes only apply to terminals opened afterwards.
- Third-party installers often write PATH with `SetEnvironmentVariable`, so installing a program can flip the type back to `REG_SZ`. Check again after installs.
- Use `%SystemRoot%` for system directories and `%JAVA_HOME%`, `%CUDA_PATH%` for the JDK and CUDA, so switching versions means changing one variable. `%CUDA_PATH%` follows the active version. Avoid version-pinned variables like `%CUDA_PATH_V12_9%`.
- Do not write `Program Files` as `%ProgramFiles%`. In 32-bit processes it expands to `Program Files (x86)`.

### SSH sessions report an untrusted mount point

```text
The path cannot be traversed because it contains an untrusted mount point.
```

Cause: since Windows 11 24H2, SSH sessions no longer follow some symbolic links and junctions. Local terminals are unaffected. The same configuration works on Windows 10 22H2, so nothing is misconfigured, and `fsutil behavior set SymlinkEvaluation` does not help.

Choose the fix by what is blocked:

- **A junction is blocked**: recreate it with `mklink /J`. Junctions made by the native API are followed:

  ```powershell
  cmd /c rmdir "<link path>"
  cmd /c mklink /J "<link path>" "<real target>"
  ```

- **A command installed by WinGet is blocked**: everything under `WinGet\Links` is a symbolic link. Put the real directory `%LOCALAPPDATA%\Microsoft\WinGet\Packages\<package ID>` at the front of the user PATH. To write PATH, see [PATH variables stop expanding](#path-variables-stop-expanding).
- **pnpm install fails**: pnpm's `node_modules` is built from junctions, so installing over SSH always fails. Install and upgrade locally or over Remote Desktop. Using what is already installed over SSH works.
