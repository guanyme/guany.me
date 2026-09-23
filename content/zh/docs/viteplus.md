---
description: 'Vite+ 统一 Web 工具链的构建脚本审批，以及 Windows 上通过 SSH 运行 vp 的故障排查。'
---

# Vite+

Vite+ 是统一的 Web 工具链，命令行为 `vp`。本页介绍如何批准依赖的构建脚本，以及 Windows 上通过 SSH 使用 `vp` 的常见问题。

## 使用 {#usage}

### 批准依赖的构建脚本 {#approve-dependency-build-scripts}

依赖安装后需要手动批准构建脚本时，通过 Vite+ 转发执行 `pnpm approve-builds`：

```sh
vp exec -c 'pnpm approve-builds'
```

这条命令在当前项目里执行 `pnpm approve-builds`。这类命令通过 `vp exec -c` 调用，不直接使用包管理器命令。

常用选项：

```sh
vp exec -c 'pnpm approve-builds --all'
vp exec -c 'pnpm approve-builds -g'
```

- `--all`：一次性批准所有待处理的依赖。
- `-g`：处理全局包的依赖。

## 故障排查 {#troubleshooting}

### Windows 上通过 SSH 运行 vp 报错 {#vp-fails-to-start-over-ssh-on-windows}

在 Windows 11 24H2 及以后的版本上，通过 SSH 登录后运行 `vp`，报错：

```text
vite-plus: failed to execute C:\Users\<user>\.vite-plus\current\bin\vp.exe
```

原因：`.vite-plus\bin\vp.exe` 是转发器，会跳到 `current\bin\vp.exe`。`current` 是 junction，SSH 会话无法穿过它。

确认问题：绕开 `current`，直接调用真实的版本目录。前者能运行、后者报错，就是这个问题。把 `0.2.9` 换成实际安装的版本：

```powershell
& "$HOME\.vite-plus\0.2.9\bin\vp.exe" --version   # 能跑
& "$HOME\.vite-plus\bin\vp.exe" --version         # 报错
```

解决：用 `mklink /J` 重建 `current`。删除链接不会影响版本目录：

```powershell
cmd /c rmdir "$HOME\.vite-plus\current"
cmd /c mklink /J "$HOME\.vite-plus\current" "$HOME\.vite-plus\0.2.9"
```

vite-plus 升级后会重建 `current`，届时可能要再做一次。

### Windows 上通过 SSH 安装依赖失败 {#dependency-installs-fail-over-ssh-on-windows}

通过 SSH 安装或升级 vite-plus 时，`vp` 自举安装依赖失败。日志在 `<版本目录>\install.log`。

原因：pnpm 的 `node_modules` 由大量 junction 组成，SSH 会话里无法读取。

解决：在本地或 RDP 会话里安装和升级。
