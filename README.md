# guany.me

▲ Guany's website

The site runs on TanStack Start and Cloudflare Workers. Paraglide JS compiles the English and Simplified Chinese interface messages.

## Install

```sh
pnpm install --frozen-lockfile
```

## Usage

Run the development server with `pnpm dev`. To check the Cloudflare Worker with the production bundle, run the following commands.

```sh
pnpm build
pnpm preview --ip 127.0.0.1 --port 4179
```

In a second terminal, run `pnpm test:routes`. Set `WORKER_PREVIEW_URL` if the preview uses a different origin. Run `pnpm typecheck` and `pnpm lint` to check the source. `pnpm test:markdown` checks the remote Markdown request limits.

Set `VITE_SITE_URL` before building to generate canonical URLs for a different site origin. Use `.dev.vars` for optional local Worker settings, including `GITHUB_TOKEN` and `SITE_CONFIG_URL`. Store the production GitHub token as a Worker secret. The `PUBLIC_DATA_CACHE` KV binding uses local storage in the preview.

## License

[MIT](https://opensource.org/licenses/MIT) © Guany
