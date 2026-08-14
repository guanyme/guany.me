# Vite+

Vite+, the unified toolchain for the web

## Approve Builds

When package installation requires manual approval for build scripts, run:

```sh
vp exec -c 'pnpm approve-builds'
```

This effectively runs `pnpm approve-builds` in the current project through Vite+.

## Common Options

```sh
vp exec -c 'pnpm approve-builds --all'
vp exec -c 'pnpm approve-builds -g'
```

## Notes

- `--all`: approve all pending dependencies without prompts
- `-g`: approve dependencies for global packages
- For commands like this, prefer `vp exec -c` instead of calling the package manager directly

## Windows: vp Will Not Start Over ssh

On Windows 11 24H2 and later, running `vp` after logging in over SSH fails with:

```
vite-plus: failed to execute C:\Users\<user>\.vite-plus\current\bin\vp.exe
```

`.vite-plus\bin\vp.exe` is a forwarder that hands off to `current\bin\vp.exe`, and `current` is
a junction that an SSH session cannot traverse. To confirm, bypass `current` and call the real
version directory — if that runs, this is the problem:

```powershell
& "$HOME\.vite-plus\0.2.9\bin\vp.exe" --version   # works
& "$HOME\.vite-plus\bin\vp.exe" --version         # fails
```

Rebuilding `current` with `mklink /J` fixes it; removing the link leaves the version directory
untouched:

```powershell
cmd /c rmdir "$HOME\.vite-plus\current"
cmd /c mklink /J "$HOME\.vite-plus\current" "$HOME\.vite-plus\0.2.9"
```

A vite-plus upgrade recreates `current` itself, so this may need repeating afterwards.

**Installing dependencies is a separate matter** — pnpm's `node_modules` is built from a large
number of junctions that an SSH session cannot read, so `vp` bootstrapping its dependencies is
bound to fail (the log lands in `<version dir>\install.log`). Install and upgrade locally or
over RDP.

See the windows page for the background and the full diagnosis.
