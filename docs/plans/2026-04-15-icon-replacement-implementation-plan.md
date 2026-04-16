# Icon 组件库替换实施计划 - Ionicons

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将自定义 SVG paths 的 Icon 组件替换为 `@react-icons/ion-icons`，提升开发效率和图标一致性。

**Architecture:** 直接使用 npm 包 `@react-icons/ion-icons`，通过 Taro 的 Babel 编译支持在微信小程序中渲染 React SVG 组件。保留 `iconPaths.ts` 作为降级后备方案。

**Tech Stack:** Taro 4.0.9 + React 18 + @react-icons/ion-icons + 微信小程序

---

## Task 1: 安装依赖

**Files:**
- Modify: `weixin/package.json`

**Step 1: 安装 @react-icons/ion-icons**

Run: `cd /Users/ember/Flower_Guardian/weixin && npm install @react-icons/ion-icons`

Expected: 安装成功，package.json 添加依赖

**Step 2: 验证包存在**

Run: `ls -la node_modules/@react-icons/ion-icons/dist/ 2>/dev/null | head -5`

Expected: 显示 ion-icons 相关文件

---

## Task 2: 创建新的 Icon 组件

**Files:**
- Create: `weixin/src/components/Icon/IoniconsIcon.tsx`
- Modify: `weixin/src/components/Icon/index.tsx`

**Step 1: 创建 IoniconsIcon.tsx**

```tsx
import React from 'react'
import * as IonIcons from '@react-icons/ion-icons'

export type IoniconsIconName =
  | 'leaf' | 'flower' | 'camera' | 'image' | 'refresh' | 'map' | 'water' | 'sunny'
  | 'bulb' | 'checkmark' | 'arrow-back' | 'chevron-forward' | 'medkit' | 'sparkles'
  | 'notifications' | 'chatbubbles' | 'time' | 'create' | 'close'
  | 'person' | 'book' | 'search' | 'trending-up' | 'grid'
  | 'pricetag' | 'star' | 'rainy' | 'thermometer' | 'warning'
  | 'document' | 'information-circle' | 'cart' | 'heart' | 'clipboard'
  | 'help-circle' | 'flower' | 'mail' | 'lock' | 'eye-off'
  | 'eye' | 'shield' | 'bug' | 'checkmark-circle' | 'sync'
  | 'moon' | 'cloud' | 'flash' | 'calendar' | 'trash'
  | 'cut' | 'notifications-off' | 'send' | 'leaf' | 'cube'
  | 'trophy' | 'flask' | 'add' | 'remove' | 'home'
  | 'checkmark-circle' | 'close-circle' | 'chevron-down' | 'funnel'
  | 'settings' | 'log-out' | 'share' | 'download'
  | 'pulse' | 'alert-circle'

// Ionicons 图标名映射
const iconNameMap: Record<IoniconsIconName, string> = {
  leaf: 'leaf',
  flower: 'flower',
  camera: 'camera',
  image: 'image',
  'refresh-cw': 'refresh',
  'map-pin': 'map',
  droplet: 'water',
  sun: 'sunny',
  lightbulb: 'bulb',
  check: 'checkmark',
  'arrow-left': 'arrow-back',
  'chevron-right': 'chevron-forward',
  stethoscope: 'medkit',
  sparkles: 'sparkles',
  bell: 'notifications',
  'message-circle': 'chatbubbles',
  clock: 'time',
  'edit-2': 'create',
  x: 'close',
  user: 'person',
  'book-open': 'book',
  search: 'search',
  'trending-up': 'trending-up',
  grid: 'grid',
  tag: 'pricetag',
  star: 'star',
  'cloud-rain': 'rainy',
  thermometer: 'thermometer',
  'alert-triangle': 'warning',
  'file-text': 'document',
  info: 'information-circle',
  'shopping-cart': 'cart',
  heart: 'heart',
  clipboard: 'clipboard',
  'help-circle': 'help-circle',
  flower2: 'flower',
  mail: 'mail',
  lock: 'lock',
  'eye-off': 'eye-off',
  eye: 'eye',
  shield: 'shield',
  bug: 'bug',
  'check-circle': 'checkmark-circle',
  loader: 'sync',
  moon: 'moon',
  cloud: 'cloud',
  wind: 'flash',
  calendar: 'calendar',
  trash: 'trash',
  scissors: 'cut',
  'bell-off': 'notifications-off',
  send: 'send',
  sprout: 'leaf',
  package: 'cube',
  trophy: 'trophy',
  'flask-conical': 'flask',
  plus: 'add',
  minus: 'remove',
  home: 'home',
  'circle-check': 'checkmark-circle',
  'circle-x': 'close-circle',
  'chevron-down': 'chevron-down',
  filter: 'funnel',
  settings: 'settings',
  'log-out': 'log-out',
  'share-2': 'share',
  download: 'download',
  activity: 'pulse',
  'alert-circle': 'alert-circle',
}

interface IoniconsIconProps {
  name: IoniconsIconName
  size?: number
  color?: string
  className?: string
  style?: React.CSSProperties
}

export const IoniconsIcon: React.FC<IoniconsIconProps> = ({
  name,
  size = 24,
  color = '#333',
  className = '',
  style
}) => {
  const ionIconName = iconNameMap[name]
  if (!ionIconName) return null

  const IconComponent = (IonIcons as any)[ionIconName.charAt(0).toUpperCase() + ionIconName.slice(1).replace(/-/g, '')]

  if (!IconComponent) {
    console.warn(`Icon not found: ${name} -> ${ionIconName}`)
    return null
  }

  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
      style={style}
    />
  )
}

export default IoniconsIcon
```

**Step 2: 修改 index.tsx 使用新组件**

```tsx
import React from 'react'
import { IoniconsIcon } from './IoniconsIcon'
import './index.scss'

export type IconName = Parameters<typeof IoniconsIcon>[0]['name']

interface IconProps {
  name: IconName
  size?: number
  color?: string
  fill?: string
  className?: string
  style?: React.CSSProperties
}

const Icon: React.FC<IconProps> = ({ name, size, color, fill, className, style }) => {
  return (
    <IoniconsIcon
      name={name}
      size={size}
      color={color || fill}
      className={`icon-component ${className}`}
      style={style}
    />
  )
}

export default Icon
```

**Step 3: 运行编译验证**

Run: `cd /Users/ember/Flower_Guardian/weixin && npm run build:weapp 2>&1 | head -50`

Expected: 无编译错误

---

## Task 3: 验证小程序渲染

**Files:**
- Test: `weixin/src/pages/index/index.tsx`

**Step 1: 检查首页 Icon 使用**

Run: `grep -n "Icon " /Users/ember/Flower_Guardian/weixin/src/pages/index/index.tsx | head -10`

Expected: 显示 Icon 组件使用位置

**Step 2: 运行开发服务器**

Run: `cd /Users/ember/Flower_Guardian/weixin && timeout 60 npm run dev:weapp 2>&1 | head -30`

Expected: 编译成功，监听模式

---

## Task 4: 全量替换验证（可选）

**Files:**
- Check: 所有使用 Icon 的页面

**Step 1: 验证所有 Icon 名称映射**

Run: `grep -rho "name=['\"][[:alnum:]-]*['\"]" /Users/ember/Flower_Guardian/weixin/src/pages --include="*.tsx" | sort | uniq | head -30`

Expected: 检查是否有未映射的图标名

---

## 验收标准

- [ ] `@react-icons/ion-icons` 安装成功
- [ ] Icon 组件编译通过
- [ ] 微信小程序可运行
- [ ] 原有 props 接口兼容（name, size, color, className, style）

---

## 风险与回退

| 风险 | 回退方案 |
|------|----------|
| 编译失败 | 保留原 `iconPaths.ts` 实现，临时切换回来 |
| 渲染异常 | 检查 Taro 是否需要额外配置支持 SVG 组件 |