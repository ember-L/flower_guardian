# UI Kitten 迁移设计文档

## 项目信息
- **项目名称**: 护花使者 (Flower Guardian)
- **日期**: 2025-03-10
- **类型**: UI 组件库迁移
- **现有技术栈**: React Native 0.84.1

## 设计目标
将现有的自定义 React Native UI 组件全面迁移至 UI Kitten 组件库，同时保持现有的主题配色系统（主色 #e94b52）不变。

---

## 1. 主题配置设计

### 1.1 颜色映射

将现有 `theme.ts` 颜色系统映射到 UI Kitten 主题：

```typescript
// UI Kitten 主题配置
const customTheme = {
  // 主色系 - 护花使者红
  'color-primary-100': '#f06b70',
  'color-primary-default': '#e94b52',
  'color-primary-700': '#c73e47',

  // 次要色系 - 清新绿
  'color-success-100': '#7bc98a',
  'color-success-default': '#5aaf6a',

  // 警告色系
  'color-warning-100': '#f7e4b8',
  'color-warning-default': '#f5a623',

  // 错误色系
  'color-danger-100': '#fdd',
  'color-danger-default': '#e94b52',

  // 基础色系
  'color-basic-100': '#faf8f5',    // 背景色
  'color-basic-200': '#f0ede8',    // 分割线
  'color-basic-400': '#b3b3b3',    // 辅助文字
  'color-basic-600': '#5a5a5a',    // 次要文字
  'color-basic-800': '#1a1a1a',    // 主要文字
  'color-basic-1000': '#000000',   // 纯黑

  // 表面色
  'color-basic-100': '#faf8f5',    // 背景表面
  'color-basic-200': '#ffffff',    // 卡片表面

  // 功能色
  'color-info-default': '#5aaf6a',
  'color-info-100': '#7bc98a',
};
```

### 1.2 间距映射

```typescript
spacingMapping = {
  'spacing-small': 8,    // xs, sm
  'spacing-medium': 16,  // md
  'spacing-large': 24,   // lg, xl
  'spacing-huge': 32,    // xxl
};
```

### 1.3 圆角映射

```typescript
borderRadiusMapping = {
  'border-radius-8': 8,   // sm, md
  'border-radius-12': 12, // md, lg
  'border-radius-16': 16, // lg, xl
  'border-radius-24': 24, // xl, xxl
};
```

---

## 2. 组件映射表

### 2.1 基础组件映射

| 现有组件 | UI Kitten 组件 | 迁移说明 |
|---------|-----------------|----------|
| TouchableOpacity | `<Button>` | 按钮组件，支持 appearance="primary/outline/ghost" |
| 自定义 Input | `<Input>` | 文本输入，支持 status="error/success/warning" |
| ScrollView 卡片 | `<Card>` | 卡片容器，支持 header 和 footer |
| FlatList | `<List>` | 列表组件，配合 ListItem 使用 |
| 自定义 Modal | `<Modal>` | 弹窗组件，支持 backdropStyle |
| 自定义 Tab | `<BottomNavigation>` | 底部导航，支持图标 |
| ActivityIndicator | `<Spinner>` | 加载状态，size="small/tiny/medium/large" |
| Text | `<Text>` | 文本组件，支持 category="h1/h2/h3/p1/label" |
| Image | `<Image>` | 图片组件，支持 style="rounded" |
| 自定义 Toggle | `<Toggle>` | 开关组件 |

### 2.2 布局组件映射

| 现有组件 | UI Kitten 组件 | 迁移说明 |
|---------|-----------------|----------|
| View + Flex | `<Layout>` | 布局容器 |
| SafeAreaView | `<TopNavigation>` | 顶部导航容器 |
| View | `<Divider>` | 分割线 |

### 2.3 数据展示组件

| 现有组件 | UI Kitten 组件 | 迁移说明 |
|---------|-----------------|----------|
| 自定义 Stat | `<Text>` + category="h1" | 统计数字 |
| 自定义 Badge | `<Text>` + style="label" | 标签徽章 |
| 自定义 Avatar | `<Avatar>` | 头像组件，支持 size="tiny/small/medium/large/giant" |

---

## 3. 屏幕重构策略

### 3.1 IdentifyScreen（识别页）
- 主按钮：`<Button appearance="primary" size="giant">`
- 相册按钮：`<Button appearance="outline" status="basic" accessoryLeft={<ImageIcon />}>`
- 提示卡片：`<Card header={(props) => <Text {...}>}>`

### 3.2 GardenScreen（花园页）
- 植物列表：`<List ItemPreview={PlantListItem} />`
- 添加按钮：浮动 FAB `<Button appearance="filled" status="control" size="large">`
- 植物卡片：使用 `ListItem` 自定义 preview

### 3.3 EncyclopediaScreen（百科页）
- 难度筛选：`<Chip>` 组件
- 分类卡片：`<Card>` 组件
- 热门植物：横向滚动列表
- 图标说明：`<Text>` + emoji

### 3.4 ProfileScreen（个人中心）
- 菜单列表：`<List>` + `<ListItem>`
- 头像：`<Avatar source={...} size="large">`
- 统计卡片：`<Card>` 组件

### 3.5 DiagnosisScreen（诊断页）
- 诊断按钮：`<Button>` 组件
- 结果卡片：`<Card>` 组件
- 状态徽章：`<Text>` + status 样式

### 3.6 ReminderScreen（提醒页）
- 提醒列表：`<List>` + `<ListItem>`
- 切换开关：`<Toggle>` 组件
- 环境选择：`<Radio Group>` + `<Radio>`

### 3.7 DiaryScreen（日记页）
- 日记卡片：`<Card>` 组件
- 标签切换：`<TabView>` 组件
- 对比图：`<Layout>` 布局

### 3.8 RecommendationScreen（推荐页）
- 选项按钮：`<Radio>` 组件
- 进度条：`<ProgressBar>` 组件
- 推荐卡片：`<Card>` 组件

---

## 4. 导航结构

### 4.1 底部导航

```typescript
import { BottomNavigation } from '@ui-kitten/components';

const tabs = [
  { title: '识别', icon: Camera },
  { title: '花园', icon: Flower2 },
  { title: '百科', icon: BookOpen },
  { title: '我的', icon: User },
];

<BottomNavigation
  selectedIndex={selectedIndex}
  onSelect={onSelect}
  appearance="noIndicator"
>
  {tabs.map((tab, index) => (
    <BottomNavigationTab
      key={index}
      title={tab.title}
      icon={tab.icon}
    />
  ))}
</BottomNavigation>
```

### 4.2 页面路由

保持现有的 `@react-navigation` 结构，配合 UI Kitten 的 `TopNavigation` 和 `BottomNavigation`。

---

## 5. 依赖安装

```bash
npm install @ui-kitten/components @eva-design/eva @ui-kitten/theme
npm install react-native-svg
```

---

## 6. 迁移步骤

### 第一阶段：基础设施
1. 安装 UI Kitten 依赖
2. 创建 UI Kitten 主题配置文件
3. 配置 ApplicationProvider

### 第二阶段：核心组件
1. 创建主题映射配置
2. 更新 Icon 组件适配 UI Kitten
3. 迁移底部导航

### 第三阶段：屏幕迁移（按优先级）
1. IdentifyScreen
2. GardenScreen
3. EncyclopediaScreen
4. ProfileScreen
5. DiagnosisScreen
6. ReminderScreen
7. DiaryScreen
8. RecommendationScreen

### 第四阶段：完善与测试
1. EncyclopediaDetailScreen
2. PlantCard 模态框
3. 测试所有交互流程
4. 调整细节样式

---

## 7. 注意事项

1. **保持品牌色**：主色 #e94b52 必须保持不变
2. **圆角一致性**：使用 borderRadiusMapping 保持圆角风格
3. **触摸目标**：确保所有可点击元素最小 44x44px
4. **图标兼容**：保留自定义 Icon 组件作为补充
5. **性能优化**：UI Kitten 组件已优化性能

---

## 8. 成功标准

- [ ] 所有屏幕使用 UI Kitten 组件
- [ ] 主题色 #e94b52 正确应用
- [ ] 所有交互功能正常
- [ ] 底部导航正常切换
- [ ] 无样式错乱或功能丢失

---

**设计师**: Claude
**日期**: 2025-03-10
