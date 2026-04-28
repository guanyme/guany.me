# home

▲ Guany's home

| Category  | Stack                      |
| --------- | -------------------------- |
| Framework | Next.js 16 (App Router)    |
| UI        | shadcn/ui + Tailwind CSS 4 |
| Content   | Streamdown                 |
| I18n      | next-intl                  |

## Install

```bash
pnpm install
cp .env.example .env.local
```

### Environment Variables

| Variable          | Required | Description                                                                     |
| ----------------- | -------- | ------------------------------------------------------------------------------- |
| `SITE_URL`        | No       | Public site URL used for sitemap and metadata                                   |
| `GITHUB_TOKEN`    | Yes      | GitHub personal access token                                                    |
| `HOME_CONFIG_URL` | No       | Remote project config JSON URL, e.g. `https://assets.example.com/config/home.json` |

## Usage

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Hero Background Config

Hero background first tries to load the remote project config from `HOME_CONFIG_URL` and read the `hero` field. If the remote config is unavailable or invalid, it falls back to Bing daily wallpaper.

Example `home.json`:

```json
{
  "hero": {
    "mode": "custom",
    "url": "https://assets.example.com/img/background.webp",
    "position": "center"
  }
}
```

Supported fields:

- `mode`: `custom` or `bing`
- `url`: custom hero background image URL
- `position`: passed through to CSS `background-position`

## License

[MIT](https://opensource.org/licenses/MIT) © Guany
