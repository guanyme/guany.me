# windows

Windows

## Configure Proxy

```powershell
[System.Environment]::SetEnvironmentVariable("http_proxy", "http://127.0.0.1:7890", "User")
[System.Environment]::SetEnvironmentVariable("https_proxy", "http://127.0.0.1:7890", "User")
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
Comparing three machines shows the decisive variable is the **OS version**, not configuration:

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
