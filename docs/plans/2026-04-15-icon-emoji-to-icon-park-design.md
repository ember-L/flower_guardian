# Icon Emoji → @icon-park/react 替换设计方案

**日期:** 2026-04-15
**状态:** 已批准

## 概述

将 `weixin/src/components/Icon` 组件从 emoji 渲染改为 `@icon-park/react` 图标库渲染，保持现有 `IconName` 类型和全部 173 处调用不变。

## 现状

- `Icon` 组件位于 `weixin/src/components/Icon/index.tsx`
- 当前通过 `iconEmoji` 记录渲染 emoji 字符
- `font.scss` 引用了损坏的 CDN URL（从未生效）
- 项目已安装 `@icon-park/react` (2659 个图标)
- 173 处 `<Icon>` 调用分布在 21 个文件中

## 方案

修改 `Icon/index.tsx` 底层实现，改用 `@icon-park/react` 渲染图标，不改变任何调用方的代码。

## 图标映射表

| IconName | @icon-park | 备注 |
|---|---|---|
| `leaf` | `Leaf` | |
| `flower2` | `GeometricFlowers` | |
| `camera` | `Camera` | |
| `image` | `Picture` | |
| `refresh-cw` | `Refresh` | |
| `map-pin` | `MapLocation` | |
| `droplet` | `Droplets` | 复数形式 |
| `sun` | `Sun` | |
| `lightbulb` | `Lightbulb` | |
| `check` | `CheckOne` | |
| `arrow-left` | `ArrowLeft` | |
| `chevron-right` | `Right` | |
| `stethoscope` | `Stethoscope` | |
| `sparkles` | `Stars` | |
| `bell` | `BellRing` | |
| `message-circle` | `MessageOne` | |
| `clock` | `Time` | |
| `edit-2` | `EditTwo` | |
| `x` | `Close` | |
| `user` | `User` | |
| `book-open` | `BookOpen` | |
| `search` | `Search` | |
| `trending-up` | `TrendingUp` | |
| `grid` | `GridThree` | |
| `tag` | `TagsOne` | |
| `star` | `Star` | |
| `cloud-rain` | `Cloudy` | 无 rain 变体 |
| `thermometer` | `Thermometer` | |
| `alert-triangle` | `AlertTriangle` | |
| `file-text` | `FileText` | |
| `info` | `Info` | |
| `shopping-cart` | `ShoppingCart` | |
| `heart` | `Heart` | |
| `clipboard` | `Clipboard` | |
| `help-circle` | `Help` | |
| `flower` | `GeometricFlowers` | |
| `mail` | `Mail` | |
| `lock` | `LockOne` | |
| `eye-off` | `Eyes` | |
| `eye` | `Eyes` | |
| `shield` | `Shield` | |
| `bug` | `Bug` | |
| `check-circle` | `CheckCorrect` | |
| `loader` | `Rotate` | |
| `moon` | `Moon` | |
| `cloud` | `Cloudy` | |
| `wind` | `Wind` | |
| `calendar` | `Calendar` | |
| `trash` | `Delete` | |
| `scissors` | `Cut` | |
| `bell-off` | `Bell` | 无 off 变体 |
| `send` | `Send` | |
| `sprout` | `Leaf` | 无 sprout |
| `package` | `PackageOne` | |
| `trophy` | `Trophy` | |
| `flask-conical` | `Flask` | |
| `plus` | `Plus` | |
| `minus` | `Minus` | |
| `home` | `Home` | |
| `circle-check` | `CheckOne` | |
| `circle-x` | `Close` | |
| `chevron-down` | `Down` | |
| `filter` | `FilterOne` | |
| `settings` | `Set` | |
| `log-out` | `Logout` | |
| `share-2` | `ShareOne` | |
| `download` | `Download` | |

## Props 映射

| 现有 Prop | @icon-park |
|---|---|
| `size` | `size` (px) |
| `color` | `stroke` (outline 主题) |
| `fill` | `fill` |
| `theme` | 硬编码 `"outline"` |

## 文件变更

1. **`weixin/src/components/Icon/index.tsx`** — 重写，移除 `iconEmoji` 和 `iconGlyphs`，改用 `@icon-park/react` 组件
2. **`weixin/src/components/Icon/font.scss`** — 删除（不再需要）
3. **`weixin/src/components/Icon/index.scss`** — 保留（样式可能仍被使用）

## 实现步骤

1. 更新 `Icon/index.tsx`:
   - 从 `@icon-park/react` 按需引入图标组件（支持 tree-shaking）
   - 创建 `iconComponents: Record<IconName, React.FC>` 映射
   - 用 `Icon` 组件根据 `name` 动态渲染对应图标
   - `size` → `size`, `color` → `stroke`, `fill` → `fill`
   - 保留 `className` 和 `style` 传递
2. 删除 `font.scss` 文件引用
3. 验证 21 个页面文件无需修改

## 错误处理

- 若 `name` 不在映射中，返回 `null`（与原有行为一致）
