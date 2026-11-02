---
description: 'Windows Terminal settings.json for defaults, PowerShell 7 and Vitesse'
---

# Windows Terminal

This page gives a Windows Terminal `settings.json` configuration: profile defaults, a PowerShell 7 command line and the Vitesse color schemes.

## Configuration

Put each of the following snippets in the matching field of `settings.json`.

### Set profile defaults

In `profiles.defaults`, turn off the bell and set the color scheme and font:

```json
{
  "bellStyle": "none",
  "colorScheme": {
    "light": "Vitesse Light",
    "dark": "Vitesse Dark"
  },
  "font": {
    "face": "FiraCode Nerd Font"
  }
}
```

With a light and a dark scheme, Windows Terminal follows the Windows light or dark mode while `theme` stays at its default of `system`.

### Launch PowerShell 7

In a profile in `profiles.list`, set the command line to PowerShell 7. `-NoLogo` hides the startup banner:

```json
[
  {
    "commandline": "C:\\Program Files\\PowerShell\\7\\pwsh.exe -NoLogo"
  }
]
```

### Add the Vitesse color schemes

Add both to the `schemes` array:

```json
{
  "background": "#121212",
  "black": "#393A34",
  "blue": "#6394BF",
  "brightBlack": "#777777",
  "brightBlue": "#6394BF",
  "brightCyan": "#5EAAB5",
  "brightGreen": "#4D9375",
  "brightPurple": "#D9739F",
  "brightRed": "#CB7676",
  "brightWhite": "#FFFFFF",
  "brightYellow": "#E6CC77",
  "cursorColor": "#CECABE",
  "cyan": "#5EAAB5",
  "foreground": "#CECABE",
  "green": "#4D9375",
  "name": "Vitesse Dark",
  "purple": "#D9739F",
  "red": "#CB7676",
  "selectionBackground": "#272727",
  "white": "#DBD7CA",
  "yellow": "#E6CC77"
}
```

```json
{
  "background": "#FFFFFF",
  "black": "#121212",
  "blue": "#296AA3",
  "brightBlack": "#AAAAAA",
  "brightBlue": "#296AA3",
  "brightCyan": "#2993A3",
  "brightGreen": "#1E754F",
  "brightPurple": "#A13865",
  "brightRed": "#AB5959",
  "brightWhite": "#DDDDDD",
  "brightYellow": "#BDA437",
  "cursorColor": "#393A34",
  "cyan": "#2993A3",
  "foreground": "#393A34",
  "green": "#1E754F",
  "name": "Vitesse Light",
  "purple": "#A13865",
  "red": "#AB5959",
  "selectionBackground": "#EAEAEA",
  "white": "#DBD7CA",
  "yellow": "#BDA437"
}
```
