# guany.me

▲ Guany 的网站

网站使用 TanStack Start 和 Cloudflare Workers。简体中文和英文界面文案由 Paraglide JS 编译。

## 安装

```sh
pnpm install --frozen-lockfile
```

## 使用

用 `pnpm dev` 启动开发服务器。要在本地验证 Cloudflare Worker 的生产构建，运行以下命令。

```sh
pnpm build
pnpm preview --ip 127.0.0.1 --port 4179
```

在另一个终端运行 `pnpm test:routes`。预览地址不同时，用 `WORKER_PREVIEW_URL` 指定。用 `pnpm typecheck` 和 `pnpm lint` 检查源码。 用 `pnpm test:markdown` 检查远程 Markdown 的请求限制。

要为其他站点地址生成规范链接，请在构建前设置 `VITE_SITE_URL`。本地 Worker 可通过 `.dev.vars` 设置可选的 `GITHUB_TOKEN` 和 `SITE_CONFIG_URL`。生产环境请将 GitHub token 存为 Worker secret。预览环境的 `PUBLIC_DATA_CACHE` KV 绑定使用本地存储。

## 使用许可

[MIT](https://opensource.org/licenses/MIT) © Guany
