# guany.me

▲ Guany's website

| Category     | Stack                                     |
| ------------ | ----------------------------------------- |
| Framework    | TanStack Start                            |
| Localization | Paraglide JS                              |
| Deployment   | Cloudflare Workers or Docker with Node.js |

## Install

```sh
pnpm install --frozen-lockfile
```

## Usage

Run `pnpm dev` for local development. Run `pnpm typecheck` and `pnpm lint` to check the source. Run `pnpm test:markdown` to verify the remote Markdown request limits.

### Cloudflare Workers

Use the production bundle to preview the Worker locally.

```sh
pnpm build
pnpm preview --ip 127.0.0.1 --port 4179
```

In a second terminal, run `pnpm test:routes`. Set `WORKER_PREVIEW_URL` to test another preview address. Use `.dev.vars` for optional local settings such as `GITHUB_TOKEN` and `SITE_CONFIG_URL`. The `PUBLIC_DATA_CACHE` KV binding uses local storage in the preview.

Cloudflare Workers Builds deploys the `main` branch with `pnpm build` and `wrangler deploy`. Configure `GITHUB_TOKEN` and `SITE_CONFIG_URL` as runtime secrets in the Worker settings.

### Docker

```sh
docker compose up -d --build --wait
WORKER_PREVIEW_URL=http://127.0.0.1:3000 pnpm test:routes
```

Use `.env.example` as a template for an optional Compose `.env` file. Set `HOST_PORT` to publish the container on another port. The container reads `GITHUB_OWNER`, `GITHUB_TOKEN`, and `SITE_CONFIG_URL` at runtime. It caches public data in each Node.js process.

Set `VITE_SITE_URL` before either build to generate canonical URLs for another site origin. To include Git-based document update dates in a Docker build, run `node scripts/generate-content-timestamps.mjs` from a Git checkout before building the image.

To run the Node.js bundle directly, use `pnpm build:node` and `pnpm start:node`.

## License

[MIT](https://opensource.org/licenses/MIT) © Guany
