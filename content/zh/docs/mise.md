# mise

mise

## 安装 {#installation}

官方安装器装的是优化过的单文件二进制，且**只有它支持 `mise self-update`**：

```sh
curl https://mise.run | sh
```

装到 `~/.local/bin/mise`。macOS 和 Linux 是同一条命令。

Windows：

```powershell
winget install --id jdx.mise
```

**包管理器装的版本会滞后，而且不能自更新。** Homebrew 版跑 `mise self-update` 会直接拒绝：

```
mise ERROR mise is installed via a package manager, cannot update
```

mise 发版很密（几乎每天），而它要对接 aqua、GitHub releases、各语言的 registry，这些上游一直在变，所以官方明确建议保持在较新版本。把更新权交给 formula 维护者不划算。winget 版倒是允许 `self-update`。

## Shell 集成 {#shell-integration}

```sh
eval "$(mise activate zsh)"
```

```powershell
(&mise activate pwsh) | Out-String | Invoke-Expression
```

PowerShell 的 `mise activate` 和 `chpwd` 钩子都是支持的。官方 FAQ 里那段「native Windows 只能用 shims，因为没人实现 powershell 支持」是**过时内容** —— 同一份文档的 shell 兼容性表格写着 PowerShell 的 `mise activate` 是 Yes。只有 `[shell_alias]` 确实不支持。

### 非交互 shell 要用 shims 兜底 {#shims-fallback}

`mise activate` 只能写在 `.zshrc` 里，而 `.zshrc` 非交互不读。`ssh 主机 '命令'`、LaunchAgent、cron、CI 走的都是非交互路径，拿不到 mise 管的任何工具。

补法是把 shims 目录放进 `.zshenv`：

```sh
path=(
  "$HOME/.local/bin"
  "$HOME/.local/share/mise/shims"
  $path
)
```

shims 会自己解析当前目录该用哪个版本，所以非交互下**也能按项目切**：

```sh
zsh -lc 'cd ~/i/some-project && pnpm -v'   # 拿到项目锁定的版本，不是全局兜底值
```

这比 fnm 的 `aliases/default/bin` 兜底强 —— 那个是钉死的固定版本。

### PATH 顺序：installs 在前，shims 在后 {#path-order}

交互式下 `mise activate` 会把 `~/.local/share/mise/installs/*` 插到 PATH 前面，shims 只是兜底，必须排在它后面。

macOS 上还要注意 `path_helper`：它在 `/etc/zprofile` 里把系统路径整体提前，`.zshenv` 里设的 shims 会被压到 `/usr/bin` 甚至 `/opt/homebrew/bin` 之后。所以 shims 也要在 `.zprofile` 里重新前置一次：

```sh
path=(
  "$HOME/.local/bin"
  "$HOME/.local/share/mise/shims"     # 必须排在 homebrew 之前
  $path
)
```

不这么做的话，哪天 `brew install node` 就会静默压过 mise 选中的版本。

## 版本从哪来 {#version-sources}

全局配置在 `~/.config/mise/config.toml`（Windows 也是 `~\.config\mise\`，路径一致）：

```toml
[tools]
node = "24"
pnpm = "11.21.0"
"npm:@antfu/ni" = "latest"
```

项目里的 `mise.toml` / `.tool-versions` 会就近覆盖。

### package.json 的字段默认不读 {#idiomatic-version-files}

`.nvmrc`、`.node-version` 和 package.json 里的字段，mise 统称 idiomatic version files，**默认全部关闭**，必须显式打开：

```toml
[settings]
idiomatic_version_file_enable_tools = ["node", "pnpm", "npm", "yarn"]
```

打开后 mise 会读 `packageManager` 和 `devEngines` 两个字段（[jdx/mise#8059](https://github.com/jdx/mise/pull/8059)），足以替代 corepack 按项目切 pnpm 版本。

**但它不认传统的 `engines.node`。** 那个 PR（[#2288](https://github.com/jdx/mise/pull/2288)）没有合并。fnm 的 `--resolve-engines` 读的正是这个字段，迁过来就没了 —— 如果项目靠 `engines.node` 指定版本，得改写成 `devEngines.runtime` 或补一个 `.node-version`。

## GitHub API 会限流 {#github-rate-limit}

mise 查版本要打 GitHub Releases API，匿名配额只有 **60 次/小时**，用完了装什么都失败：

```
mise WARN  GitHub rate limit exceeded
mise WARN  [pnpm/pnpm] failed to fetch version tags: HTTP status client error (403 Forbidden)
```

mise 默认会从 gh CLI 的 `hosts.yml` 里读 token（`github.gh_cli_tokens` 默认 true）。**但 gh 用系统钥匙串存 token 时，`hosts.yml` 里是空的**，这条路走不通：

```sh
gh auth status     # ✓ Logged in ... (keyring)
grep token ~/.config/gh/hosts.yml    # 什么都没有
```

改成按需调命令取，token 不落盘也不进环境变量：

```toml
[settings.github]
credential_command = "gh auth token"
```

只在 mise 真要用的那一刻才存在，和把密钥 `export` 到环境里是两回事。

## 补全依赖 usage，且顺序不能反 {#usage-cli}

mise 的补全脚本运行时要调 `usage` 这个 CLI。Homebrew 装 mise 时它是自动带的依赖，换成官方安装器或 winget 后就得自己声明：

```toml
[tools]
usage = "latest"
```

装完还有个坑：**`activate` 必须排在补全之前**。usage 本身也是 mise 管的工具，`activate` 之前它不在 PATH 里，于是每开一个 shell 都会打一行：

```
WARNING: Error: usage CLI not found. This is required for completions to work in mise.
```

正确顺序：

```powershell
(&mise activate pwsh) | Out-String | Invoke-Expression   # 先 activate

$__f = "$__cacheDir\mise-completions.ps1"                 # 补全在后，走缓存
$__src = (Get-Command mise -ErrorAction SilentlyContinue).Source
if ($__src -and ((-not (Test-Path $__f)) -or (Get-Item $__src).LastWriteTime -gt (Get-Item $__f).LastWriteTime)) {
    mise completion powershell | Out-String | Set-Content $__f -Encoding utf8
}
if (Test-Path $__f) { . $__f }
```

这个警告在 Windows 上不只是难看 —— PowerShell 作为 `DefaultShell` 时，**profile 往 stdout 写任何东西都会破坏 scp/sftp**：

```
scp: Received message too long 458961715
scp: Ensure the remote shell produces no output for non-interactive sessions.
```

顺序修好、警告消失，scp 立刻恢复。

## 从 fnm 迁过来 {#migrate-from-fnm}

| fnm                                                 | mise                                                |
| --------------------------------------------------- | --------------------------------------------------- |
| `fnm env --use-on-cd`                               | `mise activate`（chpwd 钩子内置）                   |
| `--version-file-strategy=recursive`                 | 默认就向上查找                                      |
| `--corepack-enabled` + corepack 读 `packageManager` | mise 直接读 `packageManager`，corepack 这层可以去掉 |
| `--resolve-engines`（读 `engines.node`）            | **没有对应物**，见上文                              |
| `aliases/default/bin` 兜底                          | `shims`，而且能按项目切                             |

卸载后记得清数据目录，fnm 的 node 安装在 `%APPDATA%\fnm`（Windows）或 `~/.local/share/fnm`，multishell 在 `%LOCALAPPDATA%\fnm_multishells` / `~/.local/state/fnm_multishells`。

**删之前先确认没有进程在用**：

```powershell
Get-Process node -EA SilentlyContinue | Where-Object { $_.Path -like "*fnm*" }
```

正在运行的 node 会占着 `node-versions` 里的 exe，`Remove-Item` 会静默跳过那些文件，留下一个删不干净的目录。multishell 那边则是 junction，删掉链接不影响已经跑起来的进程（文件句柄仍有效），但那些进程之后再 spawn 子进程就会失败。

Windows 上 winget 装的 fnm 还得单独卸，而且**不能在管理员会话里卸**：

```
The package installed for user scope cannot be uninstalled when running with administrator privileges.
```

SSH 过去默认就是管理员权限，只能在本地开普通权限的 PowerShell 执行 `winget uninstall --id Schniz.fnm --exact`。

## config

[⚙︎ Guany config](https://github.com/guanyme/config)
