---
description: '安装 Herdr App 和 herdr-core，用 hc 管理本地与远程终端，并配置 Vitesse 主题'
---

# Herdr

Herdr App 用空间、标签页和窗格组织终端与编码 agent。herdr-core 在后台运行这些终端，`hc` 是它的命令行工具。关闭应用窗口后，可以重新打开应用或用 `hc attach` 接回仍在运行的终端。

## 安装 {#installation}

### 安装 Herdr App {#install-herdr}

macOS（Apple 芯片）和 Linux（x86-64 或 ARM64）：

```sh
curl -fsSL https://releases.herdr.dev/app/install.sh | sh
```

Windows（x64，PowerShell）：

```powershell
irm https://releases.herdr.dev/app/install.ps1 | iex
```

安装脚本会在缺少 herdr-core 时一并安装。安装后打开一个新终端，用 `hc --version` 确认 CLI 可用。macOS 和 Linux 上如果找不到命令，检查 `~/.local/bin` 是否在 `PATH` 中。桌面应用可在 Settings → Updates 查看更新。[Herdr App 安装说明](https://github.com/herdrdev/herdr-app#install)

### 在无桌面的机器上安装 hc {#install-hc}

VPS 等只需要终端的机器可以单独安装 herdr-core。以下是 macOS 和 Linux 的安装命令。

```sh
curl -fsSL https://releases.herdr.dev/core/install.sh | sh
hc --version
```

通过官方脚本安装后可用 `hc update` 更新。更新时正在运行的终端会保留。[herdr-core 安装说明](https://github.com/herdrdev/herdr-core#install)

## 配置 {#configuration}

### 在 Herdr App 中使用 Vitesse 主题 {#use-the-vitesse-theme-in-the-herdr-app}

以下命令会把 [herdr-theme-vitesse](https://github.com/guanyme/herdr-theme-vitesse) 的浅色和深色主题下载到 Herdr App 的默认主题目录。

macOS / Linux

```sh
base=https://raw.githubusercontent.com/guanyme/herdr-theme-vitesse/main/themes
for theme in vitesse-light vitesse-dark; do
  curl --create-dirs -fsSL "$base/$theme.json" -o "$HOME/.config/herdr-app/themes/$theme.json" || break
done
```

Windows（PowerShell）

```powershell
$base = 'https://raw.githubusercontent.com/guanyme/herdr-theme-vitesse/main/themes'
$themesDir = "$HOME\.config\herdr-app\themes"
New-Item -ItemType Directory -Force -Path $themesDir | Out-Null
foreach ($theme in 'vitesse-light', 'vitesse-dark') {
  Invoke-WebRequest "$base/$theme.json" -UseBasicParsing -OutFile "$themesDir\$theme.json" -ErrorAction Stop
}
```

下载后，在 Herdr App 的设置里选择浅色和深色主题，或在应用打开时运行：

```sh
herdr-app do app.theme --name vitesse-light
herdr-app do app.theme --name vitesse-dark
```

要给未指定主题的布局设置默认值，可以把下面的字段合并到 `~/.config/herdr-app/settings.json`。

```json
{
  "theme": {
    "light": "vitesse-light",
    "dark": "vitesse-dark"
  }
}
```

## 使用 {#usage}

### 在本地运行长任务 {#run-a-local-task}

在项目目录运行下面的命令，以开发服务器为例。

```sh
hc run --bg --outlive-parent --name web pnpm dev
hc ls
hc read --lines 60 web
hc attach web
```

`--bg` 启动后立即返回。通过已有的 hc 终端启动子任务时，`--outlive-parent` 让任务在父终端退出后继续运行。按 `Ctrl+\` 可退出接管并让任务继续运行。需要结束开发服务器时，可在接管后按 `Ctrl+C`。

### 在远程机器上运行任务 {#run-a-remote-task}

先确认 SSH 可以连到远程机器。可以从 Herdr App 的 Settings → Machines 添加，也可以用命令行。把示例里的 SSH 目标和工作目录换成自己的值。

```sh
hc machine add user@my-server --name vps
hc machine ls
hc run --on vps --cwd /srv/my-app --bg --outlive-parent --name web pnpm dev
hc ls
```

用 `hc ls` 返回的终端地址查看输出或接管，例如 `hc read vps/t7` 或 `hc attach vps/t7`。只要远程机器和 core 仍在运行，关闭本地窗口后任务也会继续。

### 在 agent 中使用 {#use-with-agents}

用 `hc --skill` 查看当前版本的终端与 agent 操作手册。读取终端、发送消息和等待任务完成都通过 `hc`。需要查看或调整桌面窗口时，用 `herdr-app --skill` 查看空间、标签页和窗格的操作方式。

## 参考 {#references}

- [Herdr App](https://github.com/herdrdev/herdr-app)
- [herdr-core 命令手册](https://github.com/herdrdev/herdr-core/blob/master/docs/commands.md)
- [herdr-theme-vitesse](https://github.com/guanyme/herdr-theme-vitesse)
