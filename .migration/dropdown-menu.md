# dropdown-menu

2026-09-23 · golden pair via CLI（`shadcn add dropdown-menu --overwrite`，style `base-nova`）· 已迁移到 `@base-ui/react/menu`，typecheck、lint 通过。

## Changed

- `components/ui/dropdown-menu.tsx`：由 CLI 生成 base-nova 版本。`Content` 改为 `Portal > Positioner > Popup`，定位属性（`align`、`alignOffset`、`side`、`sideOffset`）转交给 `Positioner`。`Label` → `GroupLabel`，`ItemIndicator` → `CheckboxItemIndicator` / `RadioItemIndicator`，`Sub` / `SubTrigger` → `SubmenuRoot` / `SubmenuTrigger`。CSS 变量换成 `--available-height`、`--anchor-width`、`--transform-origin`。
  - 同 button：CLI 写成了 `from "cn"`，已改回 `@/lib/utils`。
  - 原文件相对 radix-nova 原版的差异都来自 CLI 安装时的转换（lucide 图标、去掉 `cn-*` 钩子类名），不是手动定制，因此直接覆盖。
- `components/locale-switcher.tsx:31`：`DropdownMenuTrigger asChild` 包 `Button` → `render={<Button … />}`。
- `components/layout/site-header.tsx`：
  - 窄屏 LLM 菜单的 `DropdownMenuTrigger asChild` 包 `Button` → `render={<Button … />}`。
  - 两个菜单里的 4 个 `DropdownMenuItem asChild` 包 `NextLink` → `render={<NextLink href="…" />}`。
- 残留扫描 `grep -n "radix-ui\|@radix-ui" components/ui/dropdown-menu.tsx`：干净。
- 应用代码和 `globals.css` 里没有 `data-state`、`--radix-*` 之类依赖 Radix 属性的写法。

## Left alone

- 桌面端 LLM 菜单的 `DropdownMenuTrigger`：没用 `asChild`，本身就是按钮，调用方式不变。
- `locale-switcher.tsx` 里各语言选项：已经用的是 `onClick`（不是 `onSelect`），两边写法一致。

## Behavior changes

- `DropdownMenuContent` 的默认 `align` 从 Radix 的 `"center"` 变成 base-nova 包装的 `"start"`。项目里 3 个菜单都显式写了 `align`（`start` / `end`），实际无影响；以后新写菜单时要注意。
- 链接菜单项用 `DropdownMenuItem render={<NextLink />}`，而不是 Base UI 推荐的 `Menu.LinkItem`：官方包装没有导出 `LinkItem`，而且 `LinkItem` 默认 `closeOnClick={false}`，点击后菜单不关闭，与 Radix 行为不同。`Menu.Item` 默认点击后关闭，与现在一致。
- 触发器的打开状态标记从 `data-state="open"` 变为 `data-popup-open`。项目中没有依赖它的样式。

## Verify by hand

- 顶栏「LLM」菜单（宽屏）和机器人图标菜单（窄屏）：点击打开，方向键上下移动，Enter 打开 llms.txt，菜单随即关闭。
- Esc 关闭菜单后，焦点回到触发按钮。
- 语言切换菜单：右对齐展开，选另一种语言后切换语言，地址里的 hash 保留。
- 菜单打开和关闭的淡入缩放动画正常，没有闪烁。
