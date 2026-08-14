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

## 注意

- 只在自己创建的 pane / tab 上做关闭操作，别动用户的
- 后台任务一律 `--no-focus`
- 顺序执行的命令复用同一个 pane；真需要并行再从右侧 pane **向下**切，
  纵向堆叠 3~4 个封顶。反复向右切会把宽度越切越窄
- 不要在活跃会话里 `herdr server stop`，那会连同 pane 里的进程一起停掉
