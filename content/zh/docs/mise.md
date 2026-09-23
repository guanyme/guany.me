---
description: 'mise 多语言运行时与工具版本管理器的安装、配置、从 fnm 迁移和故障排查。'
---

# mise

mise 管理 Node.js、pnpm、Java 等运行时和命令行工具的版本。本页介绍安装、shell 集成、全局配置、供应链检查、从 fnm 迁移和常见问题。

## 安装 {#installation}

推荐用官方安装器。它装的是单文件二进制，支持 `mise self-update`。mise 发版频繁，官方建议保持较新版本。

### 在 macOS 和 Linux 上安装 {#install-on-macos-and-linux}

用官方安装器安装，macOS 和 Linux 命令相同：

```sh
curl https://mise.run | sh
```

mise 装到 `~/.local/bin/mise`。

### 在 Windows 上安装 {#install-on-windows}

用 winget 安装：

```powershell
winget install --id jdx.mise
```

winget 版支持 `mise self-update`。

## 配置 {#configuration}

以下配置互相独立，按需选用。

### 在 shell 中激活 mise {#activate-mise-in-the-shell}

在 `~/.zshrc` 里加上：

```sh
eval "$($HOME/.local/bin/mise activate zsh)"
```

在 PowerShell profile 里加上：

```powershell
(&mise activate pwsh) | Out-String | Invoke-Expression
```

PowerShell 支持 `mise activate` 和 `chpwd` 钩子，只有 `[shell_alias]` 不支持。官方 FAQ 中「native Windows 只能用 shims」的说法已过时，以文档里的 shell 兼容性表格为准。

### 为非交互 shell 添加 shims {#add-shims-for-non-interactive-shells}

`mise activate` 只在交互式 shell 里生效。脚本、`ssh 主机 '命令'`、LaunchAgent、CI 都拿不到 mise 管理的工具。需要时把 shims 加进 `~/.zprofile`。它在 macOS 的 `path_helper` 之后执行，登录 shell 都会读取：

```sh
typeset -U path fpath

path=(
  "$HOME/.local/bin"
  "$HOME/.local/share/mise/shims"
  $path
)
```

shims 按当前目录解析版本，非交互 shell 里也能按项目切换：

```sh
zsh -lc 'cd ~/i/some-project && pnpm -v'   # 拿到项目锁定的版本
```

shims 在 PATH 中的位置要满足两点：

- 排在 `mise activate` 插入的 installs 目录后面，只做兜底。
- 排在 Homebrew 前面。否则 `brew install node` 会压过 mise 选中的版本。

### 全局配置文件 {#global-config-file}

全局配置在 `~/.config/mise/config.toml`。Windows 上路径相同，为 `~\.config\mise\`。示例：

```toml
[settings]
idiomatic_version_file_enable_tools = ["pnpm", "yarn", "npm", "node"]
minimum_release_age = "0"

[tools]
java = "lts"
ni = "latest"
node = "lts"
opencode = "latest"
pi = "latest"
pnpm = "latest"
vercel = { version = "latest", allow_builds = ["esbuild"], trust_policy_excludes = ["undici"] }
yarn = "latest"
```

全局值只是兜底。项目里的 `mise.toml`、`.node-version` 和 `package.json` 的 `packageManager` 会就近覆盖它。

- 需要 JDK 8 或 17 的 Java 项目，在项目的 `mise.toml` 里声明。
- Yarn 1 仓库要在 `packageManager` 里声明版本。否则用 Yarn 4 运行会把 lockfile 迁成 Berry 格式。
- `minimum_release_age` 和 `vercel` 一行的例外，见[供应链检查](#supply-chain-checks)。

### 从 package.json 读取版本 {#read-versions-from-packagejson}

mise 把 `.nvmrc`、`.node-version` 和 `package.json` 里的版本字段统称为 idiomatic version files。它们默认全部关闭，要显式打开：

```toml
[settings]
idiomatic_version_file_enable_tools = ["node", "pnpm", "npm", "yarn"]
```

打开后，mise 会读 `packageManager` 和 `devEngines` 两个字段（[jdx/mise#8059](https://github.com/jdx/mise/pull/8059)）。这足以替代 corepack 按项目切换 pnpm 版本。

mise 不读传统的 `engines.node`，相关 PR（[#2288](https://github.com/jdx/mise/pull/2288)）没有合并。靠 `engines.node` 指定版本的项目，要改用 `devEngines.runtime` 或补一个 `.node-version`。

### 启用补全 {#enable-completions}

按以下步骤加载 mise 补全：

1. 声明 `usage` 工具。补全运行时要调用 `usage` CLI。Homebrew 装 mise 时会自动带上，官方安装器和 winget 不会：

   ```toml
   [tools]
   usage = "latest"
   ```

2. 把补全放在 `activate` 后面。`usage` 也由 mise 管理，`activate` 之前不在 PATH 里，否则每开一个 shell 都会打印 `usage CLI not found`：

   ```powershell
   (&mise activate pwsh) | Out-String | Invoke-Expression
   mise completion powershell | Out-String | Invoke-Expression
   ```

在 Windows 上，PowerShell 作为 OpenSSH 的默认 shell 时，这行警告会导致 scp 失败。

### 供应链检查 {#supply-chain-checks}

mise 的 `npm:` 后端默认用内置的 aube 安装。aube 有三层供应链检查：

- **信任降级检查**：依赖的新版本失去可信发布者签名时拦截。
- **构建脚本审批**：沿用 pnpm 的 build approval 模型。依赖的 `preinstall`、`install`、`postinstall` 默认不执行，自己项目的脚本照常执行。
- **版本年龄闸**：`minimum_release_age`，默认 24h。只安装发布超过该时长的版本，给社区时间发现被投毒的发布。对应 pnpm 的 `minimumReleaseAge` 和 Renovate 的同名机制。

三层互相独立。被 trust policy 拦下时，调整 `minimum_release_age` 没有作用。

安装被拦时，按包添加最小例外，不要关全局开关。具体做法见[故障排查](#troubleshooting)。

`npm.shell_out = true`（改用 npm CLI）和 `npm.package_manager = "pnpm"` 都会对所有包绕过 trust policy。官方把 `shell_out` 标为 last resort。`npm.shell_out` 仍会给 npm 传 `--ignore-scripts`，所以也不能解决构建脚本问题。

| 后端                 | trust policy | 构建脚本                  |
| -------------------- | ------------ | ------------------------- |
| `auto`（默认，aube） | ✅           | 默认拒绝 + `allow_builds` |
| `pnpm`               | ❌           | 默认拒绝 + `allow_builds` |
| `npm.shell_out`      | ❌           | `--ignore-scripts`        |

## 使用 {#usage}

### 从 fnm 迁移 {#migrate-from-fnm}

fnm 的选项与 mise 的对应关系：

| fnm                                                 | mise                                                                        |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| `fnm env --use-on-cd`                               | `mise activate`（chpwd 钩子内置）                                           |
| `--version-file-strategy=recursive`                 | 默认就向上查找                                                              |
| `--corepack-enabled` + corepack 读 `packageManager` | mise 直接读 `packageManager`，corepack 这层可以去掉                         |
| `--resolve-engines`（读 `engines.node`）            | 没有对应功能，见[从 package.json 读取版本](#read-versions-from-packagejson) |
| `aliases/default/bin` 兜底                          | `shims`，而且能按项目切换                                                   |

卸载 fnm 并清理数据：

1. 确认没有进程在用 fnm 的 node：

   ```powershell
   Get-Process node -EA SilentlyContinue | Where-Object { $_.Path -like "*fnm*" }
   ```

   运行中的 node 会占用 `node-versions` 里的 exe。`Remove-Item` 会静默跳过这些文件，目录删不干净。

2. 删除数据目录。node 安装在 `%APPDATA%\fnm`（Windows）或 `~/.local/share/fnm`。multishell 在 `%LOCALAPPDATA%\fnm_multishells` 或 `~/.local/state/fnm_multishells`。

   multishell 是 junction。删掉链接不影响已在运行的进程，但这些进程之后再启动子进程会失败。

3. Windows 上单独卸载 winget 装的 fnm。在本地打开普通权限的 PowerShell，运行：

   ```powershell
   winget uninstall --id Schniz.fnm --exact
   ```

   不能在管理员会话里卸载，否则会报错：

   ```text
   The package installed for user scope cannot be uninstalled when running with administrator privileges.
   ```

   SSH 会话默认是管理员权限，所以要在本地执行。

## 故障排查 {#troubleshooting}

### Homebrew 版 self-update 失败 {#self-update-fails-on-a-homebrew-install}

在 Homebrew 装的 mise 上运行 `mise self-update`，会报错：

```text
mise ERROR mise is installed via a package manager, cannot update
```

原因：Homebrew 等包管理器装的版本不能自更新，而且版本滞后。

解决：卸载包管理器版本，改用[官方安装器](#install-on-macos-and-linux)安装。

### 安装时提示 GitHub rate limit exceeded {#installs-fail-with-github-rate-limit-exceeded}

安装任何工具都失败，并输出：

```text
mise WARN  GitHub rate limit exceeded
mise WARN  [pnpm/pnpm] failed to fetch version tags: HTTP status client error (403 Forbidden)
```

原因：mise 查版本要调用 GitHub Releases API，匿名配额只有每小时 60 次。mise 默认从 gh CLI 的 `hosts.yml` 读 token（`github.gh_cli_tokens` 默认为 true）。gh 用系统钥匙串存 token 时，`hosts.yml` 里没有 token。

确认 token 存在钥匙串里：

```sh
gh auth status     # ✓ Logged in ... (keyring)
grep token ~/.config/gh/hosts.yml    # 什么都没有
```

解决：在 `~/.config/mise/config.toml` 里改为按需调用命令取 token：

```toml
[settings.github]
credential_command = "gh auth token"
```

token 只在 mise 需要时取出，不落盘，也不进环境变量。

### 安装时提示 trust downgrade {#install-fails-with-trust-downgrade}

安装 npm 工具时报错：

```text
trust downgrade for @smithy/core@3.33.0 (trustPolicy=no-downgrade):
earlier published version 3.24.6 had trusted publisher but this version has no trust evidence
```

原因：某个间接依赖的旧版本有可信发布者签名，新版本没有。常见成因是上游手动发布、backport 绕过了可信工作流，或镜像源剥掉了元数据，不一定是被篡改。AWS SDK 的 `@smithy/*` 系列就是这种情况。

解决：用 `trust_policy_excludes` 按包豁免。把 `某工具` 换成要安装的包名：

```toml
[tools]
"npm:某工具" = { version = "latest", trust_policy_excludes = ["@smithy/core", "@smithy/node-http-handler"] }
```

带版本号只豁免那一个版本，裸包名豁免该包所有版本。对 `@smithy/*` 这类频繁发版的系列，用裸包名。

### 装好的工具在 Windows 上提示版本不兼容 {#installed-tool-reports-it-is-not-compatible-with-windows}

用 `npm:` 后端装好工具后，运行时报错：

```powershell
# 装完得到的 opencode.exe 只有 479 字节
该版本的 opencode.exe 与你运行的 Windows 版本不兼容。请查看计算机的系统信息…
```

原因：这个包靠 postinstall 下载平台专用二进制，而 aube 默认不执行依赖的构建脚本。装出来的 479 字节文件不是 PE 文件（文件头是 `ec` 而非 `MZ`），而是包作者写的「postinstall 没跑」提示脚本。报错与架构无关。

解决：用 `allow_builds` 放行该包的构建脚本：

```toml
"npm:opencode-ai" = { version = "latest", allow_builds = true }
```

`allow_builds` 也接受数组，只放行指定的依赖：`allow_builds = ["esbuild"]`。

### 刚发布的版本装不上 {#newly-published-version-fails-to-install}

刚 publish 的 npm 包无法立即安装验证。

原因：`minimum_release_age` 默认为 24h，只安装发布超过 24 小时的版本。

解决：任选一种。把 `@自己的scope` 换成自己的 npm scope：

```toml
# 全局关掉
minimum_release_age = "0"

# 或者只放行自己的包，其余仍有 24h 缓冲（更推荐）
minimum_release_age = "24h"
minimum_release_age_excludes = ["npm:@自己的scope/*"]
```

### 在配置仓库目录里提示 not trusted {#mise-reports-not-trusted-inside-a-config-repository}

进入备份配置用的仓库后，mise 报 `not trusted`，该目录下的 node、pnpm 都无法使用。

原因：仓库里也有一份 `.config/mise/config.toml`，mise 把它当作项目配置加载。

解决：用环境变量忽略这份配置。这是启动早期的设置，写在 `mise.toml` 里无效。在 `~/.zshenv` 里加上，并把路径换成你的仓库位置：

```sh
export MISE_IGNORED_CONFIG_PATHS="$HOME/i/guanyme/config/.config/mise/config.toml"
```

## 参考 {#references}

- [Guany config](https://github.com/guanyme/config)：包含本页 mise 配置的配置仓库。
