# Icon 组件库替换方案 - Ionicons

## 1. 目标

将当前基于自定义 SVG paths 的 Icon 组件替换为 `@react-icons/ion-icons`，提升开发效率和图标一致性。

## 2. 现状分析

- **当前实现**：自定义 SVG paths 内嵌在 `iconPaths.ts`，通过 `<Image>` 组件的 data URI 渲染
- **当前图标数量**：60+ 个
- **已有依赖**：`@icon-park/react`（未使用）、`lucide-react`（未使用）
- **技术栈**：Taro 4.0.9 + 微信小程序

## 3. 方案

直接使用 `@react-icons/ion-icons` npm 包，通过 Taro 编译支持在微信小程序中渲染。

### Icon 组件设计

```tsx
import { IonIcons } from '@react-icons/ion-icons'

const iconMap = {
  leaf: 'leaf',      // Ionicons 图标名
  flower: 'flower',
  heart: 'heart',
  // ...
} as Record<string, string>

const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#333', ... }) => {
  const iconName = iconMap[name]
  if (!iconName) return null

  return (
    <IonIcons
      name={iconName}
      size={size}
      color={color}
      style={style}
    />
  )
}
```

## 4. 实施步骤

### Step 1: 安装依赖
```bash
npm install @react-icons/ion-icons
```

### Step 2: 创建新 Icon 组件
- 路径：`weixin/src/components/Icon/index.tsx`
- 保留 `iconPaths.ts` 作为后备方案

### Step 3: 验证编译
- 运行 `npm run dev:weapp`
- 检查小程序模拟器中 Icon 渲染是否正常

### Step 4: 全量替换
- 替换所有使用 Icon 组件的文件

## 5. 风险点

| 风险 | 应对 |
|------|------|
| 编译兼容性 | 需 Babel 配置支持 JSX 转换 |
| 包体积 | 使用 tree-shaking 按需引入 |
| 渲染兼容性 | 若失败，保留 iconPaths.ts 作为降级方案 |

## 6. 验收标准

- [ ] Icon 组件正常渲染
- [ ] 60+ 图标全部可用
- [ ] 微信小程序编译通过
- [ ] 原有用法完全兼容（props 接口不变）