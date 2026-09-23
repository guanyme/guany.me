---
description: 'Ghostty terminal theme, cursor shaders, config file and SSH terminfo fix'
---

# Ghostty

Ghostty is a terminal emulator. This page covers installing a theme and cursor shaders, writing the config file, and fixing window size and SSH terminfo issues.

## Installation

Clone the theme and shaders that the config file references into `~/.config/ghostty`.

### Install the theme

Install [vitesse-ghostty-theme](https://github.com/hamlim/vitesse-ghostty-theme):

```sh
git clone https://github.com/hamlim/vitesse-ghostty-theme.git ~/.config/ghostty/themes
```

### Install the cursor shaders

Install [ghostty-cursor-shaders](https://github.com/sahaj-b/ghostty-cursor-shaders):

```sh
git clone https://github.com/sahaj-b/ghostty-cursor-shaders.git ~/.config/ghostty/shaders
```

## Configuration

The config file is `~/Library/Application Support/com.mitchellh.ghostty/config.ghostty`. Set the font, theme and cursor shaders in it:

```ini
font-family = "FiraCode Nerd Font"
font-family-bold = "FiraCode Nerd Font"
font-family-italic = "FiraCode Nerd Font"
font-family-bold-italic = "FiraCode Nerd Font"
font-size = 16

font-feature = calt
font-feature = liga

theme = light:vitesse-light,dark:vitesse-dark

custom-shader = ~/.config/ghostty/shaders/cursor_warp.glsl
custom-shader = ~/.config/ghostty/shaders/ripple_cursor.glsl

custom-shader-animation = always
```

## Usage

### Reset window size

Delete the window position cache from the plist, then restart Ghostty:

```sh
defaults delete com.mitchellh.ghostty NSWindowLastPosition
```

## Troubleshooting

### Unknown terminal type over SSH

Connecting to a remote server over SSH fails with `'xterm-ghostty': unknown terminal type.`. The remote host has no terminfo entry for `xterm-ghostty`.

Install the local terminfo on the remote host. Replace `user@host` with the remote user and address:

```sh
infocmp xterm-ghostty | ssh user@host 'tic -x -'
```

## References

- [vitesse-ghostty-theme](https://github.com/hamlim/vitesse-ghostty-theme): Vitesse theme for Ghostty.
- [ghostty-cursor-shaders](https://github.com/sahaj-b/ghostty-cursor-shaders): cursor shaders for Ghostty.
