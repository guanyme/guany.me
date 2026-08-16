# Herdr

面向编码 agent 的终端复用器。把终端组织成 workspace / tab / pane，能识别 pane 里跑的
agent，并通过 `herdr` CLI 把当前会话暴露出来 —— 这一点是它和 tmux 的关键差别：
agent 可以自己开 pane、下发命令、读回输出。

官网：[herdr.dev](https://herdr.dev)

## 安装

macOS / Linux：

```sh
curl -fsSL https://herdr.dev/install.sh | sh
```

Windows：

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://herdr.dev/install.ps1 | iex"
```

二进制装在 `~/.local/bin/herdr`。注意**非登录式 shell 的 PATH 里通常没有这个目录**，
ssh 过去执行 `command -v herdr` 会报找不到，别据此判断"没装"：

```sh
ssh myhost 'command -v herdr'                          # 可能为空
ssh myhost 'export PATH=$PATH:~/.local/bin; herdr --version'   # 这才作数
```

更新与频道：

```sh
herdr update
herdr channel show          # stable / preview
herdr channel set preview
```

## 配置

`~/.config/herdr/config.toml`：

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

同目录下还有 `session.json`（布局持久化）、`herdr.sock`（API socket）、
`herdr-server.log`。

### Windows 上要指定 pwsh

pane 的 shell 默认取 `$SHELL`，Windows 上会落到**系统自带的 Windows PowerShell 5.1**
而不是 PowerShell 7。想让 pane 里是 7，得显式配：

```toml
[terminal]
default_shell = "pwsh.exe"
```

官方对这个值的说法是「留空时用 `$SHELL`，再回落到 Unix 的 `/bin/sh`、Windows 的
PowerShell」—— 注意那个回落**就是系统自带的 5.1**。填的是可执行文件名或路径，
不是命令行。

改完 `herdr server reload-config`，或者重开 pane 生效。确认当前 pane 里是哪个：

```powershell
$PSVersionTable.PSVersion    # 5.1.x 就是旧的
```

没装 7 的话先 `winget install --id Microsoft.PowerShell`。顺带一提，5.1 和 7 的
`$PROFILE` 是两个文件（`WindowsPowerShell\` 与 `PowerShell\`），在旧的里配好的东西
换过来不会自动生效。

### [terminal] 的另外两个选项 {#terminal-options}

`shell_mode` —— `"auto"`（默认）/ `"login"` / `"non_login"`，控制新 pane 的 shell
是不是以登录 shell 启动。官方说明点出了原因：**`"auto"` 在 macOS 上启动登录 shell，
是为了让只在登录时跑的 PATH 设置生效** —— `/usr/libexec/path_helper` 和 Homebrew
的初始化都属于这一类。其他平台维持非登录。

这一条值得留意：macOS 上 `path_helper` 会把系统路径整体重排到最前，所以
「pane 里的 PATH 和你终端里的不一样」多半就是 `shell_mode` 的差别造成的。

`new_cwd` —— `"follow"`（默认）/ `"home"` / `"current"` / 固定路径如 `"~/Projects"`。
`"follow"` 继承来源 pane 或 workspace；没有来源时从 `$HOME` 起。

改完用 herdr 自带的校验器确认，比肉眼看可靠：

```sh
herdr config check    # 输出 config: ok 才算过
```

## CLI

`herdr` 直接运行会启动/attach TUI，**不要用它探索命令**。查用法要带子命令组：

```sh
herdr --help
herdr pane            # 打印 pane 命令组
herdr tab
herdr workspace
herdr agent
```

大部分命令返回 JSON，pane / tab / workspace 的 id 从响应里取，不要凭猜。

### 在 pane 里跑命令

```sh
# 向右切一个 pane，不抢焦点
herdr pane split --current --direction right --cwd "$PWD" --no-focus
# → .result.pane.pane_id

# 下发、等待、读取
herdr pane run <pane_id> "pnpm build"
herdr pane wait-output <pane_id> --regex "<标记>" --source visible --timeout 60000
herdr pane read <pane_id> --source visible --lines 40
```

herdr 会把调用者的上下文注入每个受管 pane：

```sh
printf '%s\n' "$HERDR_WORKSPACE_ID" "$HERDR_TAB_ID" "$HERDR_PANE_ID"
```

`HERDR_ENV=1` 表示当前就在 herdr 的 pane 里。

## 三个实测踩出来的坑

### pane 是交互式 TTY，会触发分页器

`git log`、`git diff`、`systemctl status` 这类命令会自动进 less，然后就卡在那儿，
后面用来标记完成的 `&& echo DONE` 永远不会执行，`wait-output` 只能超时。

```sh
herdr pane run <pane_id> "git --no-pager log --oneline -3 && echo DONE"
# 或者 PAGER=cat git log ...
```

### 完成标记必须每次唯一

`wait-output` 会**立即搜索现有快照**，所以固定标记会匹配到上一条命令留下的旧输出，
直接报"命中"。这比超时危险 —— 超时至少会报错，假阳性会让你以为命令跑完了。

```sh
TAG="DONE_$$_$RANDOM"
herdr pane run <pane_id> "pnpm test && echo ${TAG}_OK || echo ${TAG}_FAIL"
herdr pane wait-output <pane_id> --regex "${TAG}_(OK|FAIL)" --source visible --timeout 120000
```

pane 里也拿不到退出码，成功失败只能靠命令自己打印。

### 读输出用 `--source visible`

`recent` / `recent-unwrapped` 经常返回 0 字节，别用它们判断命令有没有输出：

```
--source visible            99 字节
--source recent              0 字节
--source recent-unwrapped    0 字节
```

## 用 systemd 托管（服务器）

herdr 的 `session.json` 会恢复**布局、cwd 和 pane 标签，但不会重跑 pane 里的命令**
—— 恢复出来的是干净的 shell。所以开机自启要分两层：一层拉起 server，一层把服务
拉进对应的 pane。

`/etc/systemd/system/herdr.service`：

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

`herdr server` 官方描述就是 headless server，不需要 TTY。

再写一个 oneshot 单元，在 server 起来后把服务拉进 pane。**按 pane 标签定位而不是
pane id** —— 重启后 id 会变，标签不会：

```sh
find_pane() {  # 用法: find_pane <标签>
  for pid in $(herdr pane list | jq -r '.result.panes[].pane_id'); do
    label=$(herdr pane get "$pid" | jq -r '.result.pane.label // ""')
    [ "$label" = "$1" ] && { echo "$pid"; return 0; }
  done
  return 1
}
```

配合 `Requires=herdr.service` + `After=herdr.service`，重启 herdr 时这个单元会跟着跑。

## 通过 SSH 用 Windows 上的 herdr {#windows-over-ssh}

两个限制，都出在 Windows 版本上，而且**取向相反** —— 没有哪个版本两头都好。

### 鼠标需要 Win11 主机 {#mouse-needs-win11}

SSH 连过去时鼠标点选、滚动不生效，不是 herdr 没启用 mouse capture，而是
**Windows 10 的 ConPTY 在 herdr 读到之前就把鼠标报告丢掉了**。ConPTY 的鼠标事件转换
是 Windows 11 才有的能力，没有 backport 到 10，微软那边的 Terminal issue 标了 can't fix。

所以这条不是配置能绕开的，只能看主机版本：

| Build   | 系统            | SSH 鼠标 |
| ------- | --------------- | -------- |
| ≥ 22000 | Windows 11      | 可用     |
| 19045   | Windows 10 22H2 | 不可用   |

### 但 Win11 又穿不过 junction {#junction-not-traversable}

反过来，Windows 11 24H2+ 收紧了 reparse point 的遍历，**SSH 会话看不见 junction 里的内容**：

```
herdr: The term 'herdr' is not recognized as a name of a cmdlet...
```

而 `herdr` 的安装目录恰好就是个 junction：

```
%LOCALAPPDATA%\Programs\Herdr\bin  →  ~\.herdr\packages\standalone\releases\<版本>-x86_64-pc-windows-msvc
```

判据是**经链接看到的文件数少于目标本身**：

```powershell
$l = "$env:LOCALAPPDATA\Programs\Herdr\bin"
@(cmd /c "dir /b `"$l`" 2>nul").Count                        # 0
@(cmd /c "dir /b `"$((Get-Item $l -Force).Target)`" 2>nul").Count   # 3
```

**关键不在路径，在 junction 是谁创建的** —— 工具安装器自己建的穿不过，
`mklink /J` 建的能穿过。（一度以为是 print name 长度的差异，后来被推翻：
`mklink /J` 重建出来的 print name 长度 62，照样能穿。）

重建即可，`rmdir` 只删链接不动目标：

```powershell
$l = "$env:LOCALAPPDATA\Programs\Herdr\bin"
$t = (Get-Item $l -Force).Target
cmd /c rmdir "$l"
cmd /c mklink /J "$l" "$t"
```

**herdr 每次升级都会复发** —— 目标路径里带着版本号，新版本必然换目录，安装器重建的
junction 又是穿不过的那种。vite-plus 的 `current` 是同一个模式。

## 注意

- 只在自己创建的 pane / tab 上做关闭操作，别动用户的
- 后台任务一律 `--no-focus`
- 顺序执行的命令复用同一个 pane；真需要并行再从右侧 pane **向下**切，
  纵向堆叠 3~4 个封顶。反复向右切会把宽度越切越窄
- 不要在活跃会话里 `herdr server stop`，那会连同 pane 里的进程一起停掉
