# home

▲ Guany 的首页

| 分类   | 技术栈                     |
| ------ | -------------------------- |
| 框架   | Next.js 16 (App Router)    |
| UI     | shadcn/ui + Tailwind CSS 4 |
| 内容   | Streamdown                 |
| 国际化 | next-intl                  |

## 安装

```bash
pnpm install
cp .env.example .env.local
```

### 环境变量

| 变量              | 必需 | 描述                                                                    |
| ----------------- | ---- | ----------------------------------------------------------------------- |
| `SITE_URL`        | 否   | 站点公开地址，用于 sitemap 和 metadata                                  |
| `GITHUB_TOKEN`    | 是   | GitHub 个人访问令牌                                                     |
| `HOME_CONFIG_URL` | 否   | 远程项目配置 JSON 地址，例如 `https://cdn.example.com/config/home.json` |

## 使用说明

### 开发

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

### Hero 背景图配置

Hero 背景图会优先读取 `HOME_CONFIG_URL` 指向的远程项目配置，并从中读取 `hero` 字段；如果远程配置不可用或无效，则自动回退到必应每日壁纸。

`home.json` 示例：

```json
{
  "hero": {
    "mode": "custom",
    "url": "https://cdn.example.com/img/background.webp",
    "position": "center"
  }
}
```

支持字段：

- `mode`：`custom` 或 `bing`
- `url`：自定义 Hero 背景图地址
- `position`：会直接透传给 CSS `background-position`

## 使用许可

[MIT](https://opensource.org/licenses/MIT) © Guany
