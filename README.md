# guany.me

▲ Guany's website

This branch starts the TanStack Start migration. Its Worker preview covers localized routing, the Herdr and getting-started documents, and a sample project URL.

## Install

```sh
pnpm install --frozen-lockfile
```

## Usage

Run the development server with `pnpm dev`. To check the Cloudflare Worker with the production bundle, run the following commands.

```sh
pnpm build
pnpm preview --host 127.0.0.1 --port 4179 --strictPort
```

In a second terminal, run `pnpm test:routes`. Set `WORKER_PREVIEW_URL` if the preview uses a different origin. Run `pnpm typecheck` and `pnpm lint` to check the source.

## License

[MIT](https://opensource.org/licenses/MIT) © Guany
