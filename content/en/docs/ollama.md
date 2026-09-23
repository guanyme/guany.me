---
description: 'Configure the Ollama bind address and CORS origins for LAN and cross-origin access.'
---

# Ollama

Ollama runs large language models locally. This page covers enabling LAN access and cross-origin (CORS) access to Ollama on macOS, Windows, and Linux.

## Configuration

Ollama uses environment variables to control its bind address and allowed CORS origins. Set the variables for your platform, open the firewall port if needed, then verify.

### Environment variables

Ollama reads these environment variables:

| Variable         | Purpose              | Default                |
| ---------------- | -------------------- | ---------------------- |
| `OLLAMA_HOST`    | Bind address         | `127.0.0.1:11434`      |
| `OLLAMA_ORIGINS` | Allowed CORS origins | `127.0.0.1`, `0.0.0.0` |

Set `OLLAMA_HOST=0.0.0.0:11434` to allow LAN access. Set `OLLAMA_ORIGINS=*` to allow all cross-origin requests.

`OLLAMA_ORIGINS` accepts these values:

| Value                                     | Description           |
| ----------------------------------------- | --------------------- |
| `*`                                       | Allow all origins     |
| `http://localhost:3000`                   | Allow specific origin |
| `http://localhost:3000,https://myapp.com` | Multiple origins      |

### Set environment variables on macOS

On macOS, Ollama runs as a GUI app managed by `launchd`.

1. Set the variables with `launchctl`:

   ```sh
   launchctl setenv OLLAMA_HOST "0.0.0.0:11434"
   launchctl setenv OLLAMA_ORIGINS "*"
   ```

2. Quit Ollama from the menu bar and relaunch it.

### Set environment variables on Windows

1. Set user environment variables in PowerShell:

   ```powershell
   [System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:11434", "User")
   [System.Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")
   ```

2. Quit Ollama from the Start menu and relaunch it.

### Set environment variables on Linux

On Linux, Ollama runs as a systemd service. Run these steps in a root shell:

1. Edit the service configuration:

   ```sh
   systemctl edit ollama.service
   ```

2. Add the following content:

   ```ini
   [Service]
   Environment="OLLAMA_HOST=0.0.0.0:11434"
   Environment="OLLAMA_ORIGINS=*"
   ```

3. Reload the configuration and restart the service:

   ```sh
   systemctl daemon-reload
   systemctl restart ollama
   ```

### Allow the port in Windows Firewall

Add an inbound rule for TCP port 11434:

```powershell
New-NetFirewallRule -DisplayName "Ollama API" -Direction Inbound -Protocol TCP -LocalPort 11434 -Action Allow
```

### Allow the port in Linux firewall

Allow TCP port 11434 in the firewall you use:

```sh
# UFW
ufw allow 11434/tcp

# firewalld
firewall-cmd --permanent --add-port=11434/tcp
firewall-cmd --reload
```

### Verify the configuration

Request the version endpoint. A version number in the response means the service is reachable.

macOS and Linux:

```sh
curl http://localhost:11434/api/version
```

Windows:

```powershell
curl http://127.0.0.1:11434/api/version
```

## Troubleshooting

These are common cases where environment variables do not take effect on macOS.

### Environment variables in zshrc have no effect on macOS

Cause: Ollama is started by `launchd` and does not read `~/.zshrc`.

Fix: set the variables with `launchctl setenv` instead. See [Set environment variables on macOS](#set-environment-variables-on-macos).

### Settings are lost after restarting macOS

Cause: settings made with `launchctl setenv` do not persist across reboots.

Fix: use either method to persist them:

- Run `ollama serve` manually.
- Create a LaunchAgent plist.
