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
