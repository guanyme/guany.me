# sheet

2026-09-23 · golden pair via CLI（`shadcn add sheet --overwrite`，style `base-nova`）· 已迁移到 `@base-ui/react/dialog`，typecheck、lint 通过。

## Changed

- `components/ui/sheet.tsx`：由 CLI 生成 base-nova 版本。`Overlay` → `Backdrop`，`Content` → `Popup`，`Close` 的 `asChild` → `render={<Button … />}`。滑入滑出动画从 `animate-in` / `animate-out` 改为基于 transition 的 `data-starting-style` / `data-ending-style`，按 `data-[side=…]` 分别设置位移。
  - 同前两个组件：CLI 写成了 `from "cn"`，已改回 `@/lib/utils`。
  - 原文件相对 radix-nova 原版的差异都来自 CLI 安装时的转换（lucide 图标、去掉 `cn-font-heading`、改导入路径），不是手动定制，因此直接覆盖。
- `components/docs/mobile-nav.tsx:27`：`SheetTrigger asChild` 包 `Button` → `render={<Button … />}`。`onOpenChange={setIsOpen}` 保持不变：Base UI 多传的 `eventDetails` 参数会被 `setIsOpen` 忽略，类型也兼容。
- 残留扫描 `grep -n "radix-ui\|@radix-ui" components/ui/sheet.tsx`：干净。

## Left alone

- `components/ui/button.tsx`：`shadcn add sheet` 会把依赖的 button 一起覆盖，覆盖后内容和已迁移版本相同，只是 `cn` 导入又被写成 `from "cn"`。已用 `git checkout` 还原为 button 那次提交的版本。
- 抽屉里的文档链接（`Link` + `onClick={() => setIsOpen(false)}`）：不涉及 Radix，不变。

## Behavior changes

- 打开和关闭动画的实现方式变了（keyframe 动画 → CSS transition），观感可能有细微差异。
- 其余无变化：`side="left"`、受控的 `open` / `onOpenChange`、焦点锁定和 Esc 关闭，Base UI 都保持同样的语义。

## Verify by hand

- 窄屏（< lg）打开文档页，点左上角菜单按钮：抽屉从左侧滑入，背景变暗并模糊。
- 按 Tab：焦点只在抽屉内循环。按 Esc 关闭后，焦点回到菜单按钮。
- 点抽屉里的任意文档链接：跳转，抽屉关闭。
- 点遮罩或右上角关闭按钮：抽屉关闭，关闭动画完整播放。
