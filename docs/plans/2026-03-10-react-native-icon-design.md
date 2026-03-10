# React Native Emoji 替换为 Vector Icons 设计文档

**日期:** 2026-03-10
**状态:** 已批准
**类型:** 前端 UI 优化

## 1. 概述

将 React Native 应用中的 emoji 图标替换为真正的 vector icons，提升 UI 一致性和专业性。

## 2. 背景

当前项目使用自定义 `Icon.tsx` 组件，但内部渲染的是 emoji 字符（如 🍃、☀️）。虽然已经将所有屏幕组件改为使用 `Icons.Leaf`、`Icons.Sun` 等组件调用，但底层仍是 emoji 渲染。

## 3. 方案选择

### 选型: react-native-vector-icons

**理由：**
- 图标库最丰富（Material、FontAwesome、Ionicons等）
- 社区成熟，维护活跃
- 支持 bare React Native 项目
- 可通过 CocoaPods 轻松安装

## 4. 架构设计

```
┌─────────────────────────────────────┐
│         Icon.tsx (修改)              │
├─────────────────────────────────────┤
│  现状: Icons.Leaf → 渲染 🍃 emoji   │
│  改后: Icons.Leaf → 渲染 vector-icon│
└─────────────────────────────────────┘
```

### 保持不变的接口

```typescript
// 使用方式保持不变，无需修改各屏幕组件
<Icons.Leaf size={24} color="#000" />
<Icons.Sun size={20} color="#f46" />
```

## 5. 图标映射

将现有的 emoji 映射到对应的 vector icons：

| 现有 Icons 名称 | 映射到 Vector Icon | 图标集 |
|----------------|-------------------|--------|
| Leaf | leaf | MaterialCommunityIcons |
| Flower2 | flower | MaterialCommunityIcons |
| Sprout | sprout | MaterialCommunityIcons |
| Tree | tree | MaterialCommunityIcons |
| Sun | white-balance-sunny | MaterialCommunityIcons |
| Cloud | cloud | MaterialCommunityIcons |
| CloudRain | weather-rainy | MaterialCommunityIcons |
| Snowflake | snowflake | MaterialCommunityIcons |
| Droplets | water | MaterialCommunityIcons |
| Star | star | MaterialCommunityIcons |
| Search | magnify | MaterialCommunityIcons |
| Settings | cog | MaterialCommunityIcons |
| User | account | MaterialCommunityIcons |
| Check | check | MaterialCommunityIcons |
| X | close | MaterialCommunityIcons |
| ChevronRight | chevron-right | MaterialCommunityIcons |
| ChevronLeft | chevron-left | MaterialCommunityIcons |
| AlertTriangle | alert | MaterialCommunityIcons |
| AlertCircle | alert-circle | MaterialCommunityIcons |

## 6. 实现步骤

### 6.1 安装依赖

```bash
cd ios
pod install
# 或在项目根目录
npm install react-native-vector-icons
```

### 6.2 修改 Icon.tsx

- 保留 `Icons` 导出接口不变
- 内部实现从 emoji 改为调用 react-native-vector-icons
- 使用 MaterialCommunityIcons 图标集（植物相关图标最丰富）

### 6.3 配置字体（iOS）

在 `Info.plist` 中添加字体文件引用，或使用 CocoaPods 自动配置。

### 6.4 测试验证

- 检查所有屏幕图标是否正常显示
- 验证颜色、大小属性是否正常工作

## 7. 风险与限制

- **iOS only:** 本方案主要针对 iOS 平台
- **字体文件:** 需要确保字体文件正确加载

## 8. 验收标准

- [ ] 所有屏幕组件无需修改，图标正常显示
- [ ] 图标颜色、大小属性正常工作
- [ ] 应用构建成功，无报错
