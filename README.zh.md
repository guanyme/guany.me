# guany.me

▲ Guany 的网站

| 分类   | 技术                               |
| ------ | ---------------------------------- |
| 框架   | TanStack Start                     |
| 国际化 | Paraglide JS                       |
| 部署   | Cloudflare Workers 或 Node.js 容器 |

## 安装

```sh
pnpm install --frozen-lockfile
```

## 使用说明

用 `pnpm dev` 启动开发服务器。用 `pnpm typecheck` 和 `pnpm lint` 检查源码，用 `pnpm test:markdown` 验证远程 Markdown 的请求限制。

### Cloudflare Workers

在本地 Worker 中预览生产构建。

```sh
pnpm build
pnpm preview --ip 127.0.0.1 --port 4179
```

在另一个终端运行 `pnpm test:routes`。预览地址不同时，用 `WORKER_PREVIEW_URL` 指定。可在 `.dev.vars` 配置本地使用的 `GITHUB_TOKEN` 和 `SITE_CONFIG_URL`。预览环境的 `PUBLIC_DATA_CACHE` KV 绑定使用本地存储。

Cloudflare Workers Builds 使用 `pnpm build` 和 `wrangler deploy` 部署 `main` 分支。在 Worker 设置中将 `GITHUB_TOKEN` 和 `SITE_CONFIG_URL` 配置为运行时密钥。

### Docker

```sh
docker compose up -d --build --wait
WORKER_PREVIEW_URL=http://127.0.0.1:3000 pnpm test:routes
```

可参考 `.env.example` 创建 Compose 的 `.env` 文件。设置 `HOST_PORT` 可以更改容器对外的端口。容器在运行时读取 `GITHUB_OWNER`、`GITHUB_TOKEN` 和 `SITE_CONFIG_URL`。每个 Node.js 进程在内存中缓存公开数据。

构建前设置 `VITE_SITE_URL` 可指定生成规范链接时使用的站点域名。如果要在 Docker 镜像里保留文档的 Git 更新日期，请在构建前从 Git 工作区运行 `node scripts/generate-content-timestamps.mjs`。

也可以用 `pnpm build:node` 构建，再用 `pnpm start:node` 直接运行 Node.js 产物。

## 使用许可

[MIT](https://opensource.org/licenses/MIT) © Guany
