# guany.me

▲ Guany 的网站

此分支是 TanStack Start 迁移的第一阶段。Worker 预览覆盖双语路由、Herdr 与入门文档，以及一个项目详情地址。

## 安装

```sh
pnpm install --frozen-lockfile
```

## 使用

用 `pnpm dev` 启动开发服务器。要在本地验证 Cloudflare Worker 的生产构建，运行以下命令。

```sh
pnpm build
pnpm preview --host 127.0.0.1 --port 4179 --strictPort
```

在另一个终端运行 `pnpm test:routes`。预览地址不同时，用 `WORKER_PREVIEW_URL` 指定。用 `pnpm typecheck` 和 `pnpm lint` 检查源码。

## 使用许可

[MIT](https://opensource.org/licenses/MIT) © Guany
