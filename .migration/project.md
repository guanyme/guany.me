# project

2026-09-23 · 整个项目从 Radix UI 迁移到 Base UI · 全部完成：typecheck、lint、build 通过，结果与迁移前的基线一致。

## Changed

- 依赖：新增 `@base-ui/react@^1.8.0`，删除 `radix-ui`。`package.json` 和 `pnpm-lock.yaml` 同步更新（pnpm 12.5.1）。
- `components.json`：style `radix-nova` → `base-nova`。以后 `shadcn add` 拿到的都是 Base UI 版本。
- 按依赖顺序迁移 3 个包装，每个组件一个提交：button → dropdown-menu → sheet。三个都是原版未改动，全部通过 CLI 覆盖成 base-nova 版本。详见各组件报告。
- 调用处排查（`consumer-props.md` 全部条目）：共 13 处 `asChild`，全部改为 `render`，其中渲染成链接的 `Button` 加了 `nativeButton={false}`。没有用到 `onSelect`、`onEscapeKeyDown`、`onOpenAutoFocus` 等需要重构的属性。应用代码和 `globals.css` 里也没有依赖 `data-state` 或 `--radix-*` 的写法。
- 残留扫描：`app`、`components`、`lib`、`components.json`、`package.json` 中已没有任何 `radix` 引用。
- 构建：迁移前后都是 80 个静态页面，全部生成成功。

## Left alone

- `components/ui/input.tsx`：本来就不依赖 Radix。
- 项目里没有 cmdk、vaul、sonner、input-otp、react-day-picker、recharts 这些非 Radix 库，不涉及。

## Behavior changes

- `DropdownMenuContent` 的默认 `align` 从 `"center"` 变成 `"start"`。现有菜单都显式写了 `align`，没有影响。
- 抽屉动画从 keyframe 改为 transition，观感可能略有不同。
- 发现 CLI（shadcn 4.21.0）的一个问题：生成文件时把 `cn` 的导入写成了 `from "cn"`，没有解析 `components.json` 里的 `utils` 别名。3 个文件都已手动修正。以后用 `shadcn add` 添加组件时要留意这一点。

## Verify by hand

浏览器验证中，菜单的打开、链接渲染、Esc 关闭和焦点归还都已确认。以下需要在前台窗口实际操作：

- 窄屏打开文档页，点左上角菜单按钮：抽屉从左滑入，焦点进入抽屉，Tab 在抽屉内循环；Esc、点遮罩、点链接都能关闭，关闭动画完整。
- 顶栏窄屏图标（项目、文档、使用、LLM 菜单）和语言切换：点击和键盘操作都正常。
- 项目详情页的「GitHub」「访问」按钮：新标签页打开。

0 wrappers remain on Radix.
