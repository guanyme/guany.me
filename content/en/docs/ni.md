---
description: 'Install the ni package manager CLI and set up common aliases.'
---

# ni

ni (`@antfu/ni`) runs package manager operations through one set of commands, and `nr` runs scripts. This page covers installation and common command aliases.

## Installation

Install globally with npm:

```sh
npm i -g @antfu/ni
```

## Configuration

Use the section for your platform.

### Add aliases in PowerShell

Add the aliases to your PowerShell profile:

1. Remove PowerShell's built-in `ni` alias, which otherwise shadows the ni command:

   ```powershell
   Remove-Item Alias:ni -Force -ErrorAction Ignore
   ```

2. Define the alias functions:

   ```powershell
   function nio {
       ni --prefer-offline
   }

   function s {
       nr start
   }

   function d {
       nr dev
   }

   function b {
       nr build
   }

   function bw {
       nr build --watch
   }

   function t {
       nr test
   }

   function tu {
       nr test -u
   }

   function tw {
       nr test --watch
   }

   function w {
       nr watch
   }

   function p {
       nr play
   }

   function c {
       nr typecheck
   }

   function lint {
       nr lint
   }

   function lintf {
       nr lint --fix
   }

   function release {
       nr release
   }

   function re {
       nr release
   }
   ```

### Add aliases on macOS and Linux

Add to your shell config file, such as `~/.zshrc`:

```sh
alias nio="ni --prefer-offline"
alias s="nr start"
alias d="nr dev"
alias b="nr build"
alias bw="nr build --watch"
alias t="nr test"
alias tu="nr test -u"
alias tw="nr test --watch"
alias w="nr watch"
alias p="nr play"
alias c="nr typecheck"
alias lint="nr lint"
alias lintf="nr lint --fix"
alias release="nr release"
alias re="nr release"
```

## Usage

With the aliases in place, use these short commands:

| Alias     | Equivalent command    |
| --------- | --------------------- |
| `nio`     | `ni --prefer-offline` |
| `s`       | `nr start`            |
| `d`       | `nr dev`              |
| `b`       | `nr build`            |
| `bw`      | `nr build --watch`    |
| `t`       | `nr test`             |
| `tu`      | `nr test -u`          |
| `tw`      | `nr test --watch`     |
| `w`       | `nr watch`            |
| `p`       | `nr play`             |
| `c`       | `nr typecheck`        |
| `lint`    | `nr lint`             |
| `lintf`   | `nr lint --fix`       |
| `release` | `nr release`          |
| `re`      | `nr release`          |
