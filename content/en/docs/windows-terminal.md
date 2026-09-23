---
description: 'Windows Terminal settings.json for defaults, PowerShell 7 and Vitesse Dark'
---

# Windows Terminal

This page gives a Windows Terminal `settings.json` configuration: profile defaults, a PowerShell 7 command line and the Vitesse Dark color scheme.

## Configuration

Put each of the following snippets in the matching field of `settings.json`.

### Set profile defaults

In `profiles.defaults`, turn off the bell and set the color scheme and font:

```json
{
  "bellStyle": "none",
  "colorScheme": "Vitesse Dark",
  "font": {
    "face": "FiraCode Nerd Font"
  }
}
```

### Launch PowerShell 7

In a profile in `profiles.list`, set the command line to PowerShell 7. `-NoLogo` hides the startup banner:

```json
[
  {
    "commandline": "C:\\Program Files\\PowerShell\\7\\pwsh.exe -NoLogo"
  }
]
```

### Add the Vitesse Dark color scheme

Add to the `schemes` array:

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
  "cursorColor": "#CDC9BD",
  "cyan": "#5EAAB5",
  "foreground": "#CDCABE",
  "green": "#4D9375",
  "name": "Vitesse Dark",
  "purple": "#D9739F",
  "red": "#CB7676",
  "selectionBackground": "#252525",
  "white": "#CDCABE",
  "yellow": "#E6CC77"
}
```
