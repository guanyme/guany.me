# windows

Windows

## Configure Proxy

```powershell
[System.Environment]::SetEnvironmentVariable("http_proxy", "http://127.0.0.1:7890", "User")
[System.Environment]::SetEnvironmentVariable("https_proxy", "http://127.0.0.1:7890", "User")
```

## Environment: Don't Use SetEnvironmentVariable on PATH

Environment variables live in two registry scopes:

```
HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment   machine
HKCU\Environment                                                    user
```

They merge at logon, and **PATH is the special case: machine first, user appended** (every other
variable has the user scope override the machine one).

The value type decides whether `%VAR%` expands at all:

| Type                                           | Behaviour                                                         |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `REG_EXPAND_SZ` (`ExpandString` in PowerShell) | `%USERPROFILE%\bin` expands                                       |
| `REG_SZ` (`String`)                            | `%USERPROFILE%` is treated as a **literal directory name** — dead |

**`[System.Environment]::SetEnvironmentVariable` writes `REG_SZ`.** One call on PATH bakes every
`%VAR%` reference into an absolute path — that is exactly why "editing an environment variable
expanded everything". The GUI editor in System Properties does the same.

Specify the type explicitly instead:

```powershell
# ❌ writes REG_SZ
[Environment]::SetEnvironmentVariable("Path", $v, "User")

# ✅
Set-ItemProperty -Path "HKCU:\Environment" -Name Path -Value $v -Type ExpandString
```

Read the **unexpanded** value (otherwise what you see is already resolved):

```powershell
(Get-Item "HKCU:\Environment").GetValue("Path", "", "DoNotExpandEnvironmentNames")
```

Broadcast afterwards so running processes pick it up — new processes only, already-open terminals
will not change:

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

### Use variables where variables belong

The stock machine PATH is written with variables; a machine whose PATH has been through the GUI
editor ends up with hardcoded absolute paths. Restoring them means a JDK or CUDA upgrade only
touches one variable:

```
%SystemRoot%\system32          %SystemRoot%\System32\Wbem
%SystemRoot%\System32\WindowsPowerShell\v1.0\
%JAVA_HOME%\bin                %CUDA_PATH%\bin
```

Same for the user scope — everything under `%USERPROFILE%\…`.

**Do not convert `Program Files` to `%ProgramFiles%`**, though: inside a 32-bit process it expands
to `Program Files (x86)`, which causes bugs that are miserable to track down. Stock Windows only
uses variables for system directories.

Use `%CUDA_PATH%` rather than `%CUDA_PATH_V12_9%`: the former points at the active version, the
latter is a version-pinned alias and defeats the purpose.

Always compare the **expanded** value before and after, and roll back on any mismatch:

```powershell
$before = [Environment]::GetEnvironmentVariable("Path","Machine")
# …edit…
$after  = [Environment]::GetEnvironmentVariable("Path","Machine")
if ($before.TrimEnd(";") -ne $after.TrimEnd(";")) { "mismatch, rolling back" }
```

## "Untrusted mount point" in SSH Sessions

On Windows 11 24H2 and later, running certain commands after logging in over SSH fails with:

```
Cannot traverse the path because it contains an untrusted mount point.
Program 'fnm.exe' failed to run: An error occurred trying to start process
'C:\Users\<user>\AppData\Local\Microsoft\WinGet\Links\fnm.exe'
```

This generation of Windows **tightened how SSH sessions traverse reparse points** (symbolic
links and junctions). A terminal opened locally is unaffected, so the problem only shows up
over ssh.

### Confirming it is this

The phrase "untrusted mount point" is the whole diagnosis — no need to look elsewhere.
The decisive variable is the **OS version**, not configuration:

|                                           | Windows 10 22H2 · 19045 | Windows 11 25H2 · 26200 |
| ----------------------------------------- | ----------------------- | ----------------------- |
| SSH logon token                           | NETWORK                 | NETWORK                 |
| `fsutil behavior query SymlinkEvaluation` | L2L/L2R on, R2L/R2R off | identical               |
| Developer Mode                            | on                      | on                      |
| WinGet symlinks traversable               | **yes**                 | **no**                  |

Three settings identical, only the OS differs — so nothing is misconfigured.

**Two dead ends worth skipping**: `fsutil behavior set SymlinkEvaluation R2L:1` does nothing
here (L2L/R2L describe whether the link and its target are local or remote paths; with both on
C: it is L2L, which is already enabled). The logon token type is not the cause either — the
Win10 box hands out a NETWORK token too and works fine.

### Three fixes

**1. Junction blocked → rebuild it with the native API.** Junctions made by `mklink /J`
traverse fine; ones written by a language runtime's own reparse-data code may not:

```powershell
cmd /c rmdir "<link path>"          # no /s — removes the link, not the target
cmd /c mklink /J "<link path>" "<real target>"
```

**2. WinGet shim blocked → put the real package directory ahead on PATH.** Everything under
`WinGet\Links` is a symlink; point at `WinGet\Packages\<package id>` instead:

```powershell
$base = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages"
$real = "$base\Schniz.fnm_Microsoft.Winget.Source_8wekyb3d8bbwe"

# Read the User scope, never $env:Path — that is Machine + User already merged,
# and writing it back copies the machine PATH into the user one, growing it every time
$u = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$real;$u", "User")
```

**3. Do installs and upgrades locally or over RDP.** pnpm builds `node_modules` out of a large
number of junctions, and in an SSH session it cannot read back the links it just created, so
the install is bound to fail. Running already-installed software is unaffected.

Switching to password authentication is not worth it — it does yield a full token, but at the
cost of passwordless login.
