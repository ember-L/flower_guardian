# React Native Emoji 替换为 Icons 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 React Native 应用中的 emoji 图标替换为 lucide-react-native 图标库

**Architecture:** 项目已安装 lucide-react-native 库，将修改 Icon.tsx 组件，将 emoji 渲染替换为 lucide 图标渲染。保持现有 Icons 接口不变，各屏幕组件无需修改。

**Tech Stack:** lucide-react-native, React Native

---

## Task 1: 安装 lucide-react-native 类型定义

**Files:**
- Modify: `frontend/package.json`
- Check: `frontend/node_modules/lucide-react-native` (验证库已安装)

**Step 1: 确认库已安装**

Run: `ls frontend/node_modules/lucide-react-native`
Expected: 目录存在

**Step 2: 安装类型定义（如果需要）**

Run: `cd frontend && npm install -D @types/lucide-react-native` (如果存在)
Note: lucide-react-native 可能已经包含类型定义

---

## Task 2: 修改 Icon.tsx 使用 lucide-react-native

**Files:**
- Modify: `frontend/src/components/Icon.tsx`

**Step 1: 读取当前 Icon.tsx 文件**

```typescript
// 当前 Icon.tsx 使用 emoji 渲染
// 需要改为使用 lucide-react-native
```

**Step 2: 修改 Icon.tsx 实现**

```typescript
// src/components/Icon.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LucideProps } from 'lucide-react-native';
import { Leaf, Flower, Sprout, Tree, Sun, Cloud, CloudRain, Snowflake, Droplets, Star, Search, Settings, User, Check, X, ChevronRight, ChevronLeft, AlertTriangle, AlertCircle, Info, Home, Stethoscope, Lightbulb, Edit, Thermometer, Circle, Quote, Moon, Umbrella } from 'lucide-react-native';

// Lucide 图标组件包装器
const LucideIcon: React.FC<LucideProps & { color?: string }> = ({ color = '#000', size = 24, ...props }) => {
  // Lucide 使用 stroke 属性而非 color，需要转换
  return null; // 占位，下面会实现具体映射
};

// 创建图标映射
const iconMap: Record<string, React.FC<LucideProps & { color?: string }>> = {
  leaf: Leaf,
  flower2: Flower,
  flower: Flower,
  sprout: Sprout,
  tree: Tree,
  sun: Sun,
  'sun-medium': Sun,
  cloud: Cloud,
  'cloud-rain': CloudRain,
  snowflake: Snowflake,
  droplet: Droplets,
  droplets: Droplets,
  star: Star,
  search: Search,
  settings: Settings,
  user: User,
  check: Check,
  x: X,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  info: Info,
  home: Home,
  stethoscope: Stethoscope,
  lightbulb: Lightbulb,
  'edit-2': Edit,
  thermometer: Thermometer,
  circle: Circle,
  quote: Quote,
  moon: Moon,
  umbrella: Umbrella,
};

// 修改后的 Icon 组件
export function Icon({ name, size = 24, color = '#000' }: { name: string; size?: number; color?: string }) {
  const IconComponent = iconMap[name];

  if (IconComponent) {
    return (
      <IconComponent
        size={size}
        color={color}
        strokeWidth={2}
      />
    );
  }

  // 默认返回空心圆
  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
        },
      ]}
    />
  );
}

// 导出预定义图标组件列表
export const Icons = {
  Camera: (props: Omit<LucideProps, 'name'>) => <Icon name="camera" {...props} />,
  Image: (props: Omit<LucideProps, 'name'>) => <Icon name="image" {...props} />,
  Flower2: (props: Omit<LucideProps, 'name'>) => <Icon name="flower2" {...props} />,
  BookOpen: (props: Omit<LucideProps, 'name'>) => <Icon name="book-open" {...props} />,
  User: (props: Omit<LucideProps, 'name'>) => <Icon name="user" {...props} />,
  Search: (props: Omit<LucideProps, 'name'>) => <Icon name="search" {...props} />,
  Settings: (props: Omit<LucideProps, 'name'>) => <Icon name="settings" {...props} />,
  Star: (props: Omit<LucideProps, 'name'>) => <Icon name="star" {...props} />,
  Clock: (props: Omit<LucideProps, 'name'>) => <Icon name="clock" {...props} />,
  Bell: (props: Omit<LucideProps, 'name'>) => <Icon name="bell" {...props} />,
  Droplets: (props: Omit<LucideProps, 'name'>) => <Icon name="droplets" {...props} />,
  Sun: (props: Omit<LucideProps, 'name'>) => <Icon name="sun" {...props} />,
  CloudRain: (props: Omit<LucideProps, 'name'>) => <Icon name="cloud-rain" {...props} />,
  Snowflake: (props: Omit<LucideProps, 'name'>) => <Icon name="snowflake" {...props} />,
  Plus: (props: Omit<LucideProps, 'name'>) => <Icon name="plus" {...props} />,
  X: (props: Omit<LucideProps, 'name'>) => <Icon name="x" {...props} />,
  Check: (props: Omit<LucideProps, 'name'>) => <Icon name="check" {...props} />,
  ArrowLeft: (props: Omit<LucideProps, 'name'>) => <Icon name="arrow-left" {...props} />,
  ArrowRight: (props: Omit<LucideProps, 'name'>) => <Icon name="arrow-right" {...props} />,
  ChevronRight: (props: Omit<LucideProps, 'name'>) => <Icon name="chevron-right" {...props} />,
  ChevronLeft: (props: Omit<LucideProps, 'name'>) => <Icon name="chevron-left" {...props} />,
  Loader2: (props: Omit<LucideProps, 'name'>) => <Icon name="loader" {...props} />,
  Calendar: (props: Omit<LucideProps, 'name'>) => <Icon name="calendar" {...props} />,
  Share2: (props: Omit<LucideProps, 'name'>) => <Icon name="share" {...props} />,
  Heart: (props: Omit<LucideProps, 'name'>) => <Icon name="heart" {...props} />,
  MessageCircle: (props: Omit<LucideProps, 'name'>) => <Icon name="message-circle" {...props} />,
  Scissors: (props: Omit<LucideProps, 'name'>) => <Icon name="scissors" {...props} />,
  Sparkles: (props: Omit<LucideProps, 'name'>) => <Icon name="sparkles" {...props} />,
  AlertTriangle: (props: Omit<LucideProps, 'name'>) => <Icon name="alert-triangle" {...props} />,
  AlertCircle: (props: Omit<LucideProps, 'name'>) => <Icon name="alert-circle" {...props} />,
  Layers: (props: Omit<LucideProps, 'name'>) => <Icon name="layers" {...props} />,
  Activity: (props: Omit<LucideProps, 'name'>) => <Icon name="activity" {...props} />,
  TrendingUp: (props: Omit<LucideProps, 'name'>) => <Icon name="trending-up" {...props} />,
  SunMedium: (props: Omit<LucideProps, 'name'>) => <Icon name="sun-medium" {...props} />,
  Info: (props: Omit<LucideProps, 'name'>) => <Icon name="info" {...props} />,
  Home: (props: Omit<LucideProps, 'name'>) => <Icon name="home" {...props} />,
  Stethoscope: (props: Omit<LucideProps, 'name'>) => <Icon name="stethoscope" {...props} />,
  Lightbulb: (props: Omit<LucideProps, 'name'>) => <Icon name="lightbulb" {...props} />,
  Edit2: (props: Omit<LucideProps, 'name'>) => <Icon name="edit-2" {...props} />,
  Thermometer: (props: Omit<LucideProps, 'name'>) => <Icon name="thermometer" {...props} />,
  Circle: (props: Omit<LucideProps, 'name'>) => <Icon name="circle" {...props} />,
  Quote: (props: Omit<LucideProps, 'name'>) => <Icon name="quote" {...props} />,
  Cloud: (props: Omit<LucideProps, 'name'>) => <Icon name="cloud" {...props} />,
  Leaf: (props: Omit<LucideProps, 'name'>) => <Icon name="leaf" {...props} />,
  Sprout: (props: Omit<LucideProps, 'name'>) => <Icon name="sprout" {...props} />,
  Tree: (props: Omit<LucideProps, 'name'>) => <Icon name="tree" {...props} />,
  Umbrella: (props: Omit<LucideProps, 'name'>) => <Icon name="umbrella" {...props} />,
  Moon: (props: Omit<LucideProps, 'name'>) => <Icon name="moon" {...props} />,
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: 'transparent',
  },
});

export default Icon;
```

**Step 3: 运行测试验证**

Run: `cd frontend && npx react-native start` (Metro 启动测试)
Expected: 无报错，成功启动

---

## Task 3: 验证应用构建

**Files:**
- Check: 所有使用 Icons 的屏幕组件

**Step 1: 启动 Metro 打包器**

Run: `cd frontend && npx react-native start`
Expected: Metro 启动成功

**Step 2: 在 iOS 模拟器运行**

Run: `cd ios && pod install && cd .. && npx react-native run-ios`
Expected: 应用成功构建并在模拟器运行

---

## Task 4: 提交更改

**Step 1: 添加文件**

Run: `cd /Users/ember/Flower_Guardian && git add frontend/src/components/Icon.tsx`

**Step 2: 提交**

Run: `git commit -m "feat: replace emoji icons with lucide-react-native

- Modify Icon.tsx to use lucide-react-native instead of emoji
- Maintain Icons interface compatibility for all screen components
- Use MaterialCommunityIcons-style icons for plant-related elements

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"`
Expected: 提交成功

---

## 验收标准

- [ ] Icon.tsx 使用 lucide-react-native 渲染图标
- [ ] 所有屏幕组件无需修改，图标正常显示
- [ ] 应用构建成功，无报错
- [ ] 图标颜色、大小属性正常工作
