---
description: 'ni 包管理器命令行工具的安装，以及 PowerShell、macOS 和 Linux 上的常用别名。'
---

# ni

ni（`@antfu/ni`）用一组统一的命令执行包管理器操作，`nr` 用来运行脚本。本页介绍安装和常用命令别名。

## 安装 {#installation}

用 npm 全局安装：

```sh
npm i -g @antfu/ni
```

## 配置 {#configuration}

以下两节按平台选用。

### 在 PowerShell 中添加别名 {#add-aliases-in-powershell}

在 PowerShell profile 里添加别名：

1. 删除 PowerShell 内置的 `ni` 别名，否则它会覆盖 ni 命令：

   ```powershell
   Remove-Item Alias:ni -Force -ErrorAction Ignore
   ```

2. 定义别名函数：

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

### 在 macOS 和 Linux 上添加别名 {#add-aliases-on-macos-and-linux}

在 shell 配置文件（如 `~/.zshrc`）里加上：

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

## 使用 {#usage}

配置好别名后，可用以下短命令：

| 别名      | 等价命令              |
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
