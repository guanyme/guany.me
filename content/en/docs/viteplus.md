---
description: 'Approve build scripts with Vite+ and fix vp over SSH on Windows.'
---

# Vite+

Vite+ is the unified toolchain for the web, with the `vp` command. This page covers approving dependency build scripts and common problems when using `vp` over SSH on Windows.

## Usage

### Approve dependency build scripts

When installed dependencies need manual approval for their build scripts, run `pnpm approve-builds` through Vite+:

```sh
vp exec -c 'pnpm approve-builds'
```

This runs `pnpm approve-builds` in the current project. Call commands like this through `vp exec -c` instead of calling the package manager directly.

Common options:

```sh
vp exec -c 'pnpm approve-builds --all'
vp exec -c 'pnpm approve-builds -g'
```

- `--all`: approve all pending dependencies without prompts.
- `-g`: approve dependencies for global packages.

## Troubleshooting

### vp fails to start over SSH on Windows

On Windows 11 24H2 and later, running `vp` after logging in over SSH fails with:

```text
vite-plus: failed to execute C:\Users\<user>\.vite-plus\current\bin\vp.exe
```

Cause: `.vite-plus\bin\vp.exe` is a forwarder that hands off to `current\bin\vp.exe`. `current` is a junction that an SSH session cannot traverse.

Confirm the problem: bypass `current` and call the real version directory. If the first command works and the second fails, this is the problem. Replace `0.2.9` with your installed version:

```powershell
& "$HOME\.vite-plus\0.2.9\bin\vp.exe" --version   # works
& "$HOME\.vite-plus\bin\vp.exe" --version         # fails
```

Fix: rebuild `current` with `mklink /J`. Removing the link leaves the version directory untouched:

```powershell
cmd /c rmdir "$HOME\.vite-plus\current"
cmd /c mklink /J "$HOME\.vite-plus\current" "$HOME\.vite-plus\0.2.9"
```

A vite-plus upgrade recreates `current`, so you may need to repeat this afterwards.

### Dependency installs fail over SSH on Windows

When you install or upgrade vite-plus over SSH, `vp` fails to bootstrap its dependencies. The log is at `<version dir>\install.log`.

Cause: pnpm's `node_modules` is built from many junctions, which an SSH session cannot read.

Fix: install and upgrade locally or over RDP.
