# Herdr

A terminal multiplexer built for coding agents. It organises terminals into
workspaces, tabs and panes, recognises the agent running inside a pane, and exposes
the live session through the `herdr` CLI — that last part is the real difference from
tmux: an agent can open its own pane, dispatch a command, and read the output back.

Website: [herdr.dev](https://herdr.dev)

## Install

macOS / Linux:

```sh
curl -fsSL https://herdr.dev/install.sh | sh
```

Windows:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://herdr.dev/install.ps1 | iex"
```

The binary lands in `~/.local/bin/herdr`. Note that **a non-login shell usually does
not have that directory on `PATH`** — `command -v herdr` over ssh will come back empty
even when it is installed. Don't read that as "not installed":

```sh
ssh myhost 'command -v herdr'                                  # may be empty
ssh myhost 'export PATH=$PATH:~/.local/bin; herdr --version'   # this is the real check
```

Updates and channels:

```sh
herdr update
herdr channel show          # stable / preview
herdr channel set preview
```

## Config

`~/.config/herdr/config.toml`:

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

The same directory holds `session.json` (persisted layout), `herdr.sock` (API socket)
and `herdr-server.log`.

### Point it at pwsh on Windows

A pane's shell defaults to `$SHELL`, which on Windows lands on the built-in **Windows
PowerShell 5.1** rather than PowerShell 7. To get 7 inside panes you have to say so:

```toml
[terminal]
default_shell = "pwsh.exe"
```

The documented behaviour is "when unset or empty, Herdr uses `$SHELL`, then `/bin/sh` on
Unix and PowerShell on Windows" — and that Windows fallback is the **built-in 5.1**. The
value is an executable name or path, not a shell command line.

Run `herdr server reload-config` afterwards, or just open a new pane. To check what
you're actually in:

```powershell
$PSVersionTable.PSVersion    # 5.1.x means it's the old one
```

Install 7 first if needed: `winget install --id Microsoft.PowerShell`. Note also that
5.1 and 7 have separate `$PROFILE` files (`WindowsPowerShell\` vs `PowerShell\`), so
anything configured in the old one does not carry over.

### The other two [terminal] options

`shell_mode` — `"auto"` (default) / `"login"` / `"non_login"`, controlling whether a new
pane's shell starts as a login shell. The documentation spells out the reason: **`"auto"`
starts login shells on macOS so login-only PATH setup runs in new panes** — things like
`/usr/libexec/path_helper` and Homebrew's shell initialisation.

Worth remembering: on macOS `path_helper` reorders the system paths to the front, so "the
PATH inside a pane differs from the one in my terminal" usually comes down to `shell_mode`.

`new_cwd` — `"follow"` (default) / `"home"` / `"current"` / a fixed path such as
`"~/Projects"`. `"follow"` inherits the source pane or workspace; with no source, Herdr
starts in `$HOME`.

Validate with herdr's own checker rather than by eye:

```sh
herdr config check    # only "config: ok" counts
```

## CLI

Running bare `herdr` launches or attaches the TUI, so **don't use it to explore
commands**. Print a command group instead:

```sh
herdr --help
herdr pane            # prints the pane command group
herdr tab
herdr workspace
herdr agent
```

Most commands return JSON. Read pane / tab / workspace ids out of the response rather
than guessing them.

### Running a command in a pane

```sh
# split to the right without stealing focus
herdr pane split --current --direction right --cwd "$PWD" --no-focus
# → .result.pane.pane_id

# dispatch, await, collect
herdr pane run <pane_id> "pnpm build"
herdr pane wait-output <pane_id> --regex "<marker>" --source visible --timeout 60000
herdr pane read <pane_id> --source visible --lines 40
```

Herdr injects the caller's context into every managed pane:

```sh
printf '%s\n' "$HERDR_WORKSPACE_ID" "$HERDR_TAB_ID" "$HERDR_PANE_ID"
```

`HERDR_ENV=1` means you are currently inside a herdr pane.

## Three gotchas found the hard way

### The pane is an interactive TTY, so pagers kick in

`git log`, `git diff`, `systemctl status` and friends drop into `less` and sit there.
The trailing `&& echo DONE` never runs, so `wait-output` just times out.

```sh
herdr pane run <pane_id> "git --no-pager log --oneline -3 && echo DONE"
# or prefix with PAGER=cat
```

### Completion markers must be unique per invocation

`wait-output` **searches the existing snapshot immediately**, so a fixed marker matches
leftover output from the previous command and reports a hit straight away. That is
worse than a timeout: a timeout at least raises an error, a false positive convinces
you the command finished.

```sh
TAG="DONE_$$_$RANDOM"
herdr pane run <pane_id> "pnpm test && echo ${TAG}_OK || echo ${TAG}_FAIL"
herdr pane wait-output <pane_id> --regex "${TAG}_(OK|FAIL)" --source visible --timeout 120000
```

There is also no exit code coming back from a pane — success and failure have to be
printed by the command itself.

### Read output with `--source visible`

`recent` / `recent-unwrapped` frequently come back with zero bytes. Don't use them to
decide whether a command produced output:

```
--source visible            99 bytes
--source recent              0 bytes
--source recent-unwrapped    0 bytes
```

## Running it under systemd (servers)

Herdr's `session.json` restores **the layout, cwds and pane labels — but not the
commands that were running in those panes**; what comes back is a clean shell. So
autostart needs two layers: one to bring up the server, one to launch the services
into their panes.

`/etc/systemd/system/herdr.service`:

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

`herdr server` is described upstream as the headless server; it needs no TTY.

Then a oneshot unit that launches the services once the server is up. **Locate panes by
label, not by pane id** — ids change across restarts, labels don't:

```sh
find_pane() {  # usage: find_pane <label>
  for pid in $(herdr pane list | jq -r '.result.panes[].pane_id'); do
    label=$(herdr pane get "$pid" | jq -r '.result.pane.label // ""')
    [ "$label" = "$1" ] && { echo "$pid"; return 0; }
  done
  return 1
}
```

With `Requires=herdr.service` + `After=herdr.service`, restarting herdr drags this unit
along with it.

## House rules

- Only close panes / tabs you created yourself; leave the user's alone
- Always `--no-focus` for background work
- Sequential commands reuse one pane. When you genuinely need parallelism, split
  **down** from the right-hand pane and cap the column at 3-4. Splitting right over
  and over just keeps halving the width
- Never `herdr server stop` from an active session — it takes the pane processes with it
