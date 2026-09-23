---
description: 'Warp terminal: install the Vitesse theme and reset the command history.'
---

# Warp

Warp is a modern terminal. This page shows how to install the Vitesse theme on macOS and Windows and how to reset the command history.

## Configuration

Warp loads custom themes from a local themes directory.

### Install the Vitesse theme

Clone the [warp-theme-vitesse](https://github.com/HiDeoo/warp-theme-vitesse) repository and copy its `.yaml` theme files into the Warp themes directory.

macOS:

```sh
mkdir -p $HOME/.warp/themes
git clone https://github.com/HiDeoo/warp-theme-vitesse.git /tmp/warp-theme-vitesse
cp /tmp/warp-theme-vitesse/*.yaml $HOME/.warp/themes/
```

Windows:

```powershell
New-Item -Path "$env:APPDATA\warp\Warp\data\themes" -ItemType Directory -Force
git clone https://github.com/HiDeoo/warp-theme-vitesse.git "$env:TEMP\warp-theme-vitesse"
Copy-Item "$env:TEMP\warp-theme-vitesse\*.yaml" "$env:APPDATA\warp\Warp\data\themes\"
```

## Usage

Warp stores the command history in a local `warp.sqlite` database.

### Reset command history

Delete `warp.sqlite` to clear the command history.

macOS:

```sh
rm -r "$HOME/Library/Group Containers/2BBY89MBSN.dev.warp/Library/Application Support/dev.warp.Warp-Stable/warp.sqlite"
```

Windows:

```powershell
Remove-Item "$env:LOCALAPPDATA\warp\Warp\data\warp.sqlite"
```

## References

- [warp-theme-vitesse](https://github.com/HiDeoo/warp-theme-vitesse): the Vitesse theme for Warp.
