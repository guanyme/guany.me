---
description: 'Herdr 终端复用器的安装、配置、CLI 用法、systemd 托管与故障排查'
---

# Herdr

Herdr 是面向编码 agent 的终端复用器，把终端组织成 workspace、tab 和 pane，并能识别 pane 里运行的 agent。agent 可以通过 `herdr` CLI 自己开 pane、下发命令、读回输出。本页介绍安装、配置、CLI 用法和常见问题。

## 安装 {#installation}

按平台运行安装脚本，然后按需切换更新频道。

### 安装 Herdr {#install-herdr}

macOS / Linux：

```sh
curl -fsSL https://herdr.dev/install.sh | sh
```

Windows：

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://herdr.dev/install.ps1 | iex"
```

二进制装在 `~/.local/bin/herdr`。

### 更新并切换频道 {#update-and-switch-channels}

频道有 `stable` 和 `preview` 两个：

```sh
herdr update
herdr channel show          # stable / preview
herdr channel set preview
```

## 配置 {#configuration}

配置文件是 `~/.config/herdr/config.toml`。同目录下还有 `session.json`（布局持久化）、`herdr.sock`（API socket）和 `herdr-server.log`。

### 设置基本选项 {#set-basic-options}

在 `~/.config/herdr/config.toml` 里加上：

```toml
onboarding = false

[ui]
agent_panel_sort = "priority"

[theme]
name = "terminal"
auto_switch = false

[ui.toast]
delivery = "system"
```

### 在 Windows 上使用 PowerShell 7 {#use-powershell-7-on-windows}

pane 的 shell 默认取 `$SHELL`，未设置时 Unix 回落到 `/bin/sh`，Windows 回落到系统自带的 Windows PowerShell 5.1。要在 pane 里使用 PowerShell 7：

1. 可选：安装 PowerShell 7：`winget install --id Microsoft.PowerShell`。
2. 在 `config.toml` 里指定 `default_shell`。值是可执行文件名或路径，不是命令行：

   ```toml
   [terminal]
   default_shell = "pwsh.exe"
   ```

3. 运行 `herdr server reload-config`，或重开 pane。
4. 在 pane 里确认版本。输出 `5.1.x` 表示仍是 Windows PowerShell 5.1：

   ```powershell
   $PSVersionTable.PSVersion    # 5.1.x 就是旧的
   ```

5.1 和 7 的 `$PROFILE` 是两个文件（`WindowsPowerShell\` 与 `PowerShell\`），5.1 里的配置不会在 7 里生效。

### 设置 shell 模式 {#set-the-shell-mode}

`[terminal]` 下的 `shell_mode` 控制新 pane 的 shell 是否以登录 shell 启动。可选值：

- `"auto"`（默认）：macOS 上启动登录 shell，让 `/usr/libexec/path_helper`、Homebrew 初始化等只在登录时运行的 PATH 设置生效；其他平台启动非登录 shell。
- `"login"`：始终启动登录 shell。
- `"non_login"`：始终启动非登录 shell。

### 设置新 pane 的工作目录 {#set-the-working-directory-for-new-panes}

`[terminal]` 下的 `new_cwd` 决定新 pane 从哪个目录启动。可选值：

- `"follow"`（默认）：继承来源 pane 或 workspace 的目录；没有来源时从 `$HOME` 启动。
- `"home"`
- `"current"`
- 固定路径，如 `"~/Projects"`。

### 校验配置 {#validate-the-configuration}

修改配置后用 Herdr 自带的校验器检查。输出 `config: ok` 表示通过：

```sh
herdr config check    # 输出 config: ok 才算过
```

### 用 systemd 托管 Herdr {#run-herdr-under-systemd}

`session.json` 会恢复布局、cwd 和 pane 标签，但不会重跑 pane 里的命令，恢复出来的是干净的 shell。在服务器上开机自启需要两个单元：一个启动 server，一个把服务拉进对应的 pane。

1. 创建 `/etc/systemd/system/herdr.service`。`herdr server` 是 headless server，不需要 TTY：

   ```ini
   [Unit]
   Description=Herdr headless server
   After=network-online.target
   Wants=network-online.target

   [Service]
   Type=simple
   User=root
   Environment=HOME=/root
   Environment=PATH=/root/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
   Environment=TERM=xterm-256color
   # 必须显式指定：systemd 不用 passwd 里的登录 shell，缺省会落到 bash，
   # 于是 pane 里既不是 zsh，也没有 .zshrc 里的 starship 提示符
   Environment=SHELL=/usr/bin/zsh
   Environment=LANG=zh_CN.UTF-8
   ExecStart=/root/.local/bin/herdr server
   ExecStop=/root/.local/bin/herdr server stop
   Restart=on-failure
   RestartSec=3
   TimeoutStopSec=60
   KillMode=mixed

   [Install]
   WantedBy=multi-user.target
   ```

2. 创建一个 oneshot 单元，在 server 启动后把服务拉进 pane。按 pane 标签定位 pane，不要用 pane id，因为重启后 id 会变，标签不变：

   ```sh
   find_pane() {  # 用法: find_pane <标签>
     for pid in $(herdr pane list | jq -r '.result.panes[].pane_id'); do
       label=$(herdr pane get "$pid" | jq -r '.result.pane.label // ""')
       [ "$label" = "$1" ] && { echo "$pid"; return 0; }
     done
     return 1
   }
   ```

3. 在 oneshot 单元里加上 `Requires=herdr.service` 和 `After=herdr.service`。重启 Herdr 时这个单元会跟着运行。

## 使用 {#usage}

`herdr` CLI 用来查询和控制当前会话。大部分命令返回 JSON，pane、tab、workspace 的 id 从响应里取，不要猜。

### 查看命令 {#explore-commands}

直接运行 `herdr` 会启动或 attach TUI，不要用它查看用法。查看用法时带上子命令组：

```sh
herdr --help
herdr pane            # 打印 pane 命令组
herdr tab
herdr workspace
herdr agent
```

### 在 pane 里运行命令 {#run-a-command-in-a-pane}

切出 pane，下发命令，等待并读取输出：

```sh
# 向右切一个 pane，不抢焦点
herdr pane split --current --direction right --cwd "$PWD" --no-focus
# → .result.pane.pane_id

# 下发、等待、读取
herdr pane run <pane_id> "pnpm build"
herdr pane wait-output <pane_id> --regex "<标记>" --source visible --timeout 60000
herdr pane read <pane_id> --source visible --lines 40
```

`<pane_id>` 取自 `split` 返回的 `.result.pane.pane_id`，`<标记>` 是命令完成时打印的唯一字符串。pane 不返回退出码，成功或失败要由命令自己打印。

### 读取 pane 上下文 {#read-the-pane-context}

Herdr 会把调用者的上下文注入每个受管 pane：

```sh
printf '%s\n' "$HERDR_WORKSPACE_ID" "$HERDR_TAB_ID" "$HERDR_PANE_ID"
```

`HERDR_ENV=1` 表示当前在 Herdr 的 pane 里。

### pane 使用约定 {#pane-conventions}

在用户的会话里操作 pane 时遵守以下约定：

- 只关闭自己创建的 pane 和 tab，不动用户的。
- 后台任务一律加 `--no-focus`。
- 顺序执行的命令复用同一个 pane。需要并行时，从右侧 pane 向下切，纵向最多 3～4 个。反复向右切会让 pane 越来越窄。
- 不要在活跃会话里运行 `herdr server stop`，它会停掉 pane 里的所有进程。

## 故障排查 {#troubleshooting}

### SSH 执行命令时找不到 herdr {#herdr-not-found-in-ssh-commands}

非登录 shell 的 PATH 里通常没有 `~/.local/bin`，所以 `ssh <主机> 'command -v herdr'` 可能为空，并不代表没装。

检查时手动补上 PATH：

```sh
ssh myhost 'command -v herdr'                          # 可能为空
ssh myhost 'export PATH=$PATH:~/.local/bin; herdr --version'   # 这才作数
```

`myhost` 换成你的主机名。

### pane 里的 PATH 和终端里不一样 {#path-in-a-pane-differs-from-the-terminal}

多半是 `shell_mode` 不同造成的。macOS 上登录 shell 会运行 `path_helper`，它把系统路径整体重排到最前。

按需调整 [`shell_mode`](#set-the-shell-mode)。

### 命令停在分页器里 {#commands-hang-in-a-pager}

pane 是交互式 TTY，`git log`、`git diff`、`systemctl status` 等命令会自动进入 `less` 并停住。后面的 `&& echo DONE` 不会执行，`wait-output` 只能超时。

关闭分页器再运行，例如加 `--no-pager`，或在命令前加 `PAGER=cat`：

```sh
herdr pane run <pane_id> "git --no-pager log --oneline -3 && echo DONE"
# 或者 PAGER=cat git log ...
```

### wait-output 在命令结束前就命中 {#wait-output-matches-before-the-command-finishes}

`wait-output` 会立即搜索现有快照。固定的完成标记会匹配到上一条命令留下的输出，命令还没跑完就报命中。

每次生成唯一标记，并分别标记成功和失败：

```sh
TAG="DONE_$$_$RANDOM"
herdr pane run <pane_id> "pnpm test && echo ${TAG}_OK || echo ${TAG}_FAIL"
herdr pane wait-output <pane_id> --regex "${TAG}_(OK|FAIL)" --source visible --timeout 120000
```

### pane read 读不到输出 {#pane-read-returns-no-output}

`--source recent` 和 `--source recent-unwrapped` 经常返回 0 字节，即使 pane 里有输出：

```text
--source visible            99 字节
--source recent              0 字节
--source recent-unwrapped    0 字节
```

读输出和判断命令有没有输出时，一律用 `--source visible`。

### Windows 上通过 SSH 鼠标无效 {#mouse-does-not-work-over-ssh-on-windows}

SSH 连到 Windows 10 主机时，鼠标点选和滚动不生效。原因是 Windows 10 的 ConPTY 在 Herdr 读到之前就丢掉了鼠标报告。ConPTY 的鼠标事件转换只在 Windows 11 上有，没有 backport 到 Windows 10，对应的 Microsoft Terminal issue 标为 can't fix。

配置无法绕开这个限制，只能使用 Windows 11 主机：

| Build   | 系统            | SSH 鼠标 |
| ------- | --------------- | -------- |
| ≥ 22000 | Windows 11      | 可用     |
| 19045   | Windows 10 22H2 | 不可用   |

Windows 11 24H2+ 上还有另一个问题，见[下一节](#herdr-is-not-recognized-over-ssh-on-windows)。

### Windows 上通过 SSH 提示找不到 herdr {#herdr-is-not-recognized-over-ssh-on-windows}

SSH 连到 Windows 11 24H2+ 主机后运行 `herdr`，报错：

```text
herdr: The term 'herdr' is not recognized as a name of a cmdlet...
```

Windows 11 24H2+ 收紧了 reparse point 的遍历，SSH 会话看不见 junction 里的内容。Herdr 的安装目录就是一个 junction：

```text
%LOCALAPPDATA%\Programs\Herdr\bin  →  ~\.herdr\packages\standalone\releases\<版本>-x86_64-pc-windows-msvc
```

能否穿过取决于 junction 由谁创建：安装器创建的穿不过，`mklink /J` 创建的能穿过。

1. 确认问题。经链接看到的文件数少于目标本身（例如 0 和 3），就是这个问题：

   ```powershell
   $l = "$env:LOCALAPPDATA\Programs\Herdr\bin"
   @(cmd /c "dir /b `"$l`" 2>nul").Count                        # 0
   @(cmd /c "dir /b `"$((Get-Item $l -Force).Target)`" 2>nul").Count   # 3
   ```

2. 用 `mklink /J` 重建 junction。`rmdir` 只删链接，不动目标：

   ```powershell
   $l = "$env:LOCALAPPDATA\Programs\Herdr\bin"
   $t = (Get-Item $l -Force).Target
   cmd /c rmdir "$l"
   cmd /c mklink /J "$l" "$t"
   ```

每次升级 Herdr 后都要重做第 2 步：目标路径带版本号，新版本会换目录，安装器重建的 junction 又穿不过。vite-plus 的 `current` 目录也是同样的模式。

## 参考 {#references}

- [herdr.dev](https://herdr.dev)：Herdr 官网。
