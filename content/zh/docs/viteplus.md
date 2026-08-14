# Vite+

Vite+，统一的 Web 工具链

## Approve Builds {#approve-builds}

当依赖安装后需要手动批准构建脚本时，可以通过 Vite+ 转发执行：

```sh
vp exec -c 'pnpm approve-builds'
```

这个命令本质上是在当前项目里执行 `pnpm approve-builds`。

## 常用选项 {#common-options}

```sh
vp exec -c 'pnpm approve-builds --all'
vp exec -c 'pnpm approve-builds -g'
```

## 说明 {#notes}

- `--all`：一次性批准所有待处理依赖
- `-g`：处理全局包的依赖
- 这类命令适合通过 `vp exec -c` 调用，避免直接使用包管理器命令

## Windows：ssh 过去 vp 起不来 {#windows-ssh-current-junction}

在 Windows 11 24H2 及以后的机器上 ssh 登录后运行 `vp`，会报：

```
vite-plus: failed to execute C:\Users\<user>\.vite-plus\current\bin\vp.exe
```

`.vite-plus\bin\vp.exe` 是个转发器，会跳到 `current\bin\vp.exe`，而 `current` 是 junction，
SSH 会话下穿不过去。判别方法：绕开 `current` 直接调真实版本目录，能跑就说明是这个问题。

```powershell
& "$HOME\.vite-plus\0.2.9\bin\vp.exe" --version   # 能跑
& "$HOME\.vite-plus\bin\vp.exe" --version         # 报错
```

用 `mklink /J` 重建 `current` 即可，删链接不会动到版本目录：

```powershell
cmd /c rmdir "$HOME\.vite-plus\current"
cmd /c mklink /J "$HOME\.vite-plus\current" "$HOME\.vite-plus\0.2.9"
```

vite-plus 升级后会自己重建 `current`，届时可能要再做一次。

**依赖安装是另一回事** —— pnpm 的 `node_modules` 由大量 junction 组成，SSH 会话里读不了，
所以 `vp` 的自举装依赖必然失败（日志在 `<版本目录>\install.log`）。装和升级要在本地或 RDP 里做。

背景与完整判别见 windows 文档。
