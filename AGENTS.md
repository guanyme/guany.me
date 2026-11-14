# TanStack Start

Keep file routes under `src/routes`. Let the Vite plugin generate `src/routeTree.gen.ts`. Use the installed TanStack Intent skills for routing and server boundaries, and verify the production bundle with `pnpm preview` in the local Cloudflare Workers runtime.

```sh
pnpm dlx @tanstack/intent list
pnpm dlx @tanstack/intent load @tanstack/react-start#lifecycle/migrate-from-nextjs
```
