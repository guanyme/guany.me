---
description: 'Install Herdr App and herdr-core, manage local and remote terminals with hc, and set up the Vitesse theme'
---

# Herdr

Herdr App organizes terminals and coding agents into spaces, tabs, and panes. herdr-core runs those terminals in the background, and `hc` is its command-line tool. After closing the app window, you can reopen it or use `hc attach` to return to a running terminal.

## Installation

### Install Herdr App {#install-herdr}

macOS (Apple silicon) and Linux (x86-64 or ARM64):

```sh
curl -fsSL https://releases.herdr.dev/app/install.sh | sh
```

Windows (x64, PowerShell):

```powershell
irm https://releases.herdr.dev/app/install.ps1 | iex
```

The installer also installs herdr-core if it is missing. Open a new terminal and run `hc --version` to verify the CLI is available. If the command is missing on macOS or Linux, check that `~/.local/bin` is on your `PATH`. Check for desktop app updates under Settings → Updates. [Herdr App installation guide](https://github.com/herdrdev/herdr-app#install)

### Install hc on a headless machine {#install-hc}

You can install herdr-core on its own on a VPS or any machine where you only need terminals. Use the following command on macOS or Linux.

```sh
curl -fsSL https://releases.herdr.dev/core/install.sh | sh
hc --version
```

If you installed from the official script, use `hc update` to update the core. Running terminals stay alive during the update. [herdr-core installation guide](https://github.com/herdrdev/herdr-core#install)

## Configuration

### Use the Vitesse theme in Herdr App {#use-the-vitesse-theme-in-the-herdr-app}

These commands download both [herdr-theme-vitesse](https://github.com/guanyme/herdr-theme-vitesse) themes into the default Herdr App theme directory.

macOS / Linux

```sh
base=https://raw.githubusercontent.com/guanyme/herdr-theme-vitesse/main/themes
for theme in vitesse-light vitesse-dark; do
  curl --create-dirs -fsSL "$base/$theme.json" -o "$HOME/.config/herdr-app/themes/$theme.json" || break
done
```

Windows (PowerShell)

```powershell
$base = 'https://raw.githubusercontent.com/guanyme/herdr-theme-vitesse/main/themes'
$themesDir = "$HOME\.config\herdr-app\themes"
New-Item -ItemType Directory -Force -Path $themesDir | Out-Null
foreach ($theme in 'vitesse-light', 'vitesse-dark') {
  Invoke-WebRequest "$base/$theme.json" -UseBasicParsing -OutFile "$themesDir\$theme.json" -ErrorAction Stop
}
```

After downloading, select the light and dark themes in Settings or run these commands while Herdr App is open:

```sh
herdr-app do app.theme --name vitesse-light
herdr-app do app.theme --name vitesse-dark
```

To set defaults for layouts that specify no theme, merge these fields into `~/.config/herdr-app/settings.json`.

```json
{
  "theme": {
    "light": "vitesse-light",
    "dark": "vitesse-dark"
  }
}
```

## Usage

### Run a local task

Run these commands from your project directory to start a development server.

```sh
hc run --bg --outlive-parent --name web pnpm dev
hc ls
hc read --lines 60 web
hc attach web
```

`--bg` returns immediately after launch. When you start a child task from an existing hc terminal, `--outlive-parent` keeps the task running after the parent terminal exits. Press `Ctrl+\` to detach and leave the task running. To stop the development server, attach and press `Ctrl+C`.

### Run a remote task

Verify that you can connect to the remote machine over SSH. Add it in Herdr App under Settings → Machines or use the CLI. Replace the example SSH target and working directory with your own.

```sh
hc machine add user@my-server --name vps
hc machine ls
hc run --on vps --cwd /srv/my-app --bg --outlive-parent --name web pnpm dev
hc ls
```

Use the terminal address from `hc ls` to read its output or attach, for example `hc read vps/t7` or `hc attach vps/t7`. The task continues after you close the local window as long as the remote machine and core stay up.

### Use with agents

Run `hc --skill` for the installed version's terminal and agent manual. Use `hc` to read terminals, send messages, and wait for tasks. Run `herdr-app --skill` for commands that inspect or adjust the desktop window's spaces, tabs, and panes.

## References

- [Herdr App](https://github.com/herdrdev/herdr-app)
- [herdr-core command reference](https://github.com/herdrdev/herdr-core/blob/master/docs/commands.md)
- [herdr-theme-vitesse](https://github.com/guanyme/herdr-theme-vitesse)
