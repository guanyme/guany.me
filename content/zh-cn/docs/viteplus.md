# Vite+

Vite+，统一的 Web 工具链

## Approve Builds {#approve-builds}

当依赖安装后需要手动批准构建脚本时，可以通过 Vite+ 转发执行：

```sh
vp exec -c 'pnpm approve-builds'
```

这个命令本质上是在当前项目里执行 `pnpm approve-builds`。

## 常用选项 {#common-options}

```sh
vp exec -c 'pnpm approve-builds --all'
vp exec -c 'pnpm approve-builds -g'
```

## 说明 {#notes}

- `--all`：一次性批准所有待处理依赖
- `-g`：处理全局包的依赖
- 这类命令适合通过 `vp exec -c` 调用，避免直接使用包管理器命令
