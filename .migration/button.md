# button

2026-09-23 · golden pair via CLI（`shadcn add button --overwrite`，style `base-nova`）· 已迁移到 `@base-ui/react/button`，typecheck、lint 通过。

## Changed

- `components/ui/button.tsx`：由 CLI 生成 base-nova 版本。`Slot` / `asChild` 换成 `ButtonPrimitive`（`@base-ui/react/button`），props 类型改为 `ButtonPrimitive.Props`。
  - CLI 把 `cn` 的导入写成了 `from "cn"`，没有解析项目别名，已手动改回 `@/lib/utils`。
  - base-nova 版本不再输出 `data-variant`、`data-size`。已确认项目里没有依赖这两个属性的选择器。
  - 该目录在 `.prettierignore` 中，保留 CLI 输出的格式（双引号）。
- `app/[locale]/projects/[slug]/page.tsx:111`、`:118`：两个外链按钮 `asChild` → `render={<a … />}` + `nativeButton={false}`。
- `components/layout/site-header.tsx`：项目、文档、使用三个图标链接（`Link`）和 GitHub 外链，共 4 处 `asChild` → `render` + `nativeButton={false}`。
- `components.json`：style `radix-nova` → `base-nova`。
- `package.json` / `pnpm-lock.yaml`：新增 `@base-ui/react@^1.8.0`，与 `radix-ui` 并存。
- 残留扫描 `grep -n "radix-ui\|@radix-ui" components/ui/button.tsx`：干净。

## Left alone

- `DropdownMenuTrigger asChild` 包着的 `Button`（`site-header.tsx`、`locale-switcher.tsx`）：属于 dropdown-menu 的调用方，随 dropdown-menu 一起迁移。
- `sheet.tsx` 里 `SheetPrimitive.Close asChild` 包着的 `Button`：随 sheet 一起迁移。
- `copy-clone-button.tsx`、`copy-markdown-button.tsx`、`mobile-nav.tsx`、`docs-toc.tsx` 里的普通 `Button`：没有用 `asChild`，调用方式不变。

## Behavior changes

- 渲染成链接的按钮设置了 `nativeButton={false}`，Base UI 不会再给 `<a>` 加 `type="button"`，键盘和点击行为与原生链接一致。
- 其余无变化。

## Verify by hand

- 顶栏在窄屏（< sm）下：点项目、文档、使用三个图标，确认跳转正常，Tab 能聚焦、Enter 能打开。
- 顶栏 GitHub 图标：新标签页打开。
- 项目详情页：「GitHub」「访问」两个按钮新标签页打开，悬停样式正常。
