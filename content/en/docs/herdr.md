---
description: 'Install, configure and use Herdr, run it under systemd, and fix common issues'
---

# Herdr

Herdr is a terminal multiplexer built for coding agents. It organizes terminals into workspaces, tabs and panes, and recognizes the agent running in each pane. Through the `herdr` CLI, an agent can open its own pane, dispatch a command and read the output back. This page covers installation, configuration, CLI usage and common issues.

## Installation

Run the install script for your platform, then switch the update channel if needed.

### Install Herdr

macOS / Linux:

```sh
curl -fsSL https://herdr.dev/install.sh | sh
```

Windows:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://herdr.dev/install.ps1 | iex"
```

The binary is installed to `~/.local/bin/herdr`.

### Update and switch channels

There are two channels, `stable` and `preview`:

```sh
herdr update
herdr channel show          # stable / preview
herdr channel set preview
```

## Configuration

The config file is `~/.config/herdr/config.toml`. The same directory holds `session.json` (persisted layout), `herdr.sock` (API socket) and `herdr-server.log`.

### Set basic options

Add to `~/.config/herdr/config.toml`:

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

### Use PowerShell 7 on Windows

A pane's shell defaults to `$SHELL`. When that is unset, Herdr falls back to `/bin/sh` on Unix and to the built-in Windows PowerShell 5.1 on Windows. To use PowerShell 7 in panes:

1. Optional: Install PowerShell 7: `winget install --id Microsoft.PowerShell`.
2. Set `default_shell` in `config.toml`. The value is an executable name or path, not a command line:

   ```toml
   [terminal]
   default_shell = "pwsh.exe"
   ```

3. Run `herdr server reload-config`, or open a new pane.
4. Check the version inside a pane. `5.1.x` means you are still in Windows PowerShell 5.1:

   ```powershell
   $PSVersionTable.PSVersion    # 5.1.x means it's the old one
   ```

5.1 and 7 use separate `$PROFILE` files (`WindowsPowerShell\` vs `PowerShell\`). Settings in the 5.1 profile do not apply in 7.

### Set the shell mode

`shell_mode` under `[terminal]` controls whether a new pane's shell starts as a login shell. Values:

- `"auto"` (default): starts a login shell on macOS, so login-only PATH setup such as `/usr/libexec/path_helper` and Homebrew's shell initialization runs; starts a non-login shell on other platforms.
- `"login"`: always starts a login shell.
- `"non_login"`: always starts a non-login shell.

### Set the working directory for new panes

`new_cwd` under `[terminal]` sets the directory a new pane starts in. Values:

- `"follow"` (default): inherits the directory of the source pane or workspace; with no source, starts in `$HOME`.
- `"home"`
- `"current"`
- A fixed path, such as `"~/Projects"`.

### Validate the configuration

After editing the config, check it with Herdr's built-in validator. `config: ok` means it passed:

```sh
herdr config check    # only "config: ok" counts
```

### Run Herdr under systemd

`session.json` restores the layout, cwds and pane labels, but does not rerun the commands in those panes; each pane comes back as a clean shell. To start everything at boot on a server, use two units: one starts the server, the other launches services into their panes.

1. Create `/etc/systemd/system/herdr.service`. `herdr server` is the headless server and needs no TTY:

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
   # Must be set explicitly: systemd does not take the login shell from passwd and
   # falls back to bash, so panes end up without zsh and without the starship prompt
   # configured in .zshrc
   Environment=SHELL=/usr/bin/zsh
   Environment=LANG=en_US.UTF-8
   ExecStart=/root/.local/bin/herdr server
   ExecStop=/root/.local/bin/herdr server stop
   Restart=on-failure
   RestartSec=3
   TimeoutStopSec=60
   KillMode=mixed

   [Install]
   WantedBy=multi-user.target
   ```

2. Create a oneshot unit that launches the services into panes after the server is up. Locate panes by label, not by pane id; ids change across restarts, labels do not:

   ```sh
   find_pane() {  # usage: find_pane <label>
     for pid in $(herdr pane list | jq -r '.result.panes[].pane_id'); do
       label=$(herdr pane get "$pid" | jq -r '.result.pane.label // ""')
       [ "$label" = "$1" ] && { echo "$pid"; return 0; }
     done
     return 1
   }
   ```

3. Add `Requires=herdr.service` and `After=herdr.service` to the oneshot unit. Restarting Herdr then reruns this unit.

## Usage

Use the `herdr` CLI to query and control the current session. Most commands return JSON. Read pane, tab and workspace ids from the response instead of guessing them.

### Explore commands

Running bare `herdr` launches or attaches the TUI, so do not use it to explore commands. Print a command group instead:

```sh
herdr --help
herdr pane            # prints the pane command group
herdr tab
herdr workspace
herdr agent
```

### Run a command in a pane

Split a pane, dispatch a command, then wait for and read the output:

```sh
# split to the right without stealing focus
herdr pane split --current --direction right --cwd "$PWD" --no-focus
# → .result.pane.pane_id

# dispatch, await, collect
herdr pane run <pane_id> "pnpm build"
herdr pane wait-output <pane_id> --regex "<marker>" --source visible --timeout 60000
herdr pane read <pane_id> --source visible --lines 40
```

`<pane_id>` comes from `.result.pane.pane_id` in the `split` response. `<marker>` is a unique string the command prints when it finishes. A pane returns no exit code, so the command itself must print success or failure.

### Read the pane context

Herdr injects the caller's context into every managed pane:

```sh
printf '%s\n' "$HERDR_WORKSPACE_ID" "$HERDR_TAB_ID" "$HERDR_PANE_ID"
```

`HERDR_ENV=1` means you are inside a Herdr pane.

### Pane conventions

Follow these conventions when working in a user's session:

- Close only the panes and tabs you created. Leave the user's alone.
- Always use `--no-focus` for background work.
- Reuse one pane for sequential commands. When you need parallelism, split down from the right-hand pane and stack at most 3–4 panes. Splitting right repeatedly keeps narrowing the panes.
- Do not run `herdr server stop` in an active session. It stops every process in the panes.

## Troubleshooting

### herdr not found in SSH commands

A non-login shell usually does not have `~/.local/bin` on `PATH`. `ssh <host> 'command -v herdr'` can come back empty even when Herdr is installed.

Add the directory to `PATH` when checking:

```sh
ssh myhost 'command -v herdr'                                  # may be empty
ssh myhost 'export PATH=$PATH:~/.local/bin; herdr --version'   # this is the real check
```

Replace `myhost` with your host name.

### PATH in a pane differs from the terminal

This usually comes from a different `shell_mode`. On macOS, a login shell runs `path_helper`, which moves the system paths to the front.

Adjust [`shell_mode`](#set-the-shell-mode) as needed.

### Commands hang in a pager

A pane is an interactive TTY, so `git log`, `git diff`, `systemctl status` and similar commands open `less` and wait there. The trailing `&& echo DONE` never runs, and `wait-output` times out.

Turn off the pager, for example with `--no-pager` or a `PAGER=cat` prefix:

```sh
herdr pane run <pane_id> "git --no-pager log --oneline -3 && echo DONE"
# or prefix with PAGER=cat
```

### wait-output matches before the command finishes

`wait-output` searches the existing snapshot immediately. A fixed completion marker matches leftover output from the previous command and reports a hit before the command finishes.

Generate a unique marker for each run, and mark success and failure separately:

```sh
TAG="DONE_$$_$RANDOM"
herdr pane run <pane_id> "pnpm test && echo ${TAG}_OK || echo ${TAG}_FAIL"
herdr pane wait-output <pane_id> --regex "${TAG}_(OK|FAIL)" --source visible --timeout 120000
```

### pane read returns no output

`--source recent` and `--source recent-unwrapped` often return zero bytes even when the pane has output:

```text
--source visible            99 bytes
--source recent              0 bytes
--source recent-unwrapped    0 bytes
```

Always use `--source visible` to read output or to check whether a command produced any.

### Mouse does not work over SSH on Windows

Over SSH to a Windows 10 host, clicking and scrolling do nothing. Windows 10's ConPTY drops the mouse reports before Herdr can read them. ConPTY's mouse event translation exists only on Windows 11; it was never backported to Windows 10, and the corresponding Microsoft Terminal issue is marked can't fix.

No configuration works around this. Use a Windows 11 host:

| Build    | OS              | SSH mouse     |
| -------- | --------------- | ------------- |
| >= 22000 | Windows 11      | works         |
| 19045    | Windows 10 22H2 | does not work |

Windows 11 24H2+ has a separate issue; see [the next section](#herdr-is-not-recognized-over-ssh-on-windows).

### herdr is not recognized over SSH on Windows

Over SSH to a Windows 11 24H2+ host, running `herdr` fails with:

```text
herdr: The term 'herdr' is not recognized as a name of a cmdlet...
```

Windows 11 24H2+ tightened reparse point traversal, so an SSH session cannot see through a junction. Herdr's install directory is a junction:

```text
%LOCALAPPDATA%\Programs\Herdr\bin  ->  ~\.herdr\packages\standalone\releases\<version>-x86_64-pc-windows-msvc
```

Whether it can be traversed depends on who created it: junctions created by the installer cannot be traversed, junctions created by `mklink /J` can.

1. Confirm the issue. If the link shows fewer files than its target (for example 0 vs 3), this is the cause:

   ```powershell
   $l = "$env:LOCALAPPDATA\Programs\Herdr\bin"
   @(cmd /c "dir /b `"$l`" 2>nul").Count
   @(cmd /c "dir /b `"$((Get-Item $l -Force).Target)`" 2>nul").Count
   ```

2. Rebuild the junction with `mklink /J`. `rmdir` removes only the link, not the target:

   ```powershell
   $l = "$env:LOCALAPPDATA\Programs\Herdr\bin"
   $t = (Get-Item $l -Force).Target
   cmd /c rmdir "$l"
   cmd /c mklink /J "$l" "$t"
   ```

Repeat step 2 after every Herdr upgrade. The target path includes the version number, so each release uses a new directory, and the installer recreates a junction that cannot be traversed. The `current` directory of vite-plus follows the same pattern.

## References

- [herdr.dev](https://herdr.dev): the official Herdr website.
