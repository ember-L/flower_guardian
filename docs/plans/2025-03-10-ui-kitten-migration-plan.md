# UI Kitten 迁移实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将现有 React Native 自定义 UI 全面迁移至 UI Kitten 组件库，同时保持 #e94b52 主题色不变。

**Architecture:** 使用 UI Kitten 的主题系统将现有颜色映射到自定义主题，逐屏幕替换组件为 UI Kitten 组件，保持现有功能不变。

**Tech Stack:** React Native 0.84.1, UI Kitten components, @eva-design/eva, @react-navigation, TypeScript

---

## Task 1: 安装 UI Kitten 依赖

**Files:**
- Modify: `frontend/package.json`

**Step 1: 安装核心依赖**

```bash
cd frontend
npm install @ui-kitten/components @eva-design/eva @ui-kitten/theme react-native-svg --save
```

Expected: packages 添加到 package.json

**Step 2: 验证安装**

```bash
cat package.json | grep "@ui-kitten"
```

Expected: 看到 @ui-kitten/packages

**Step 3: 提交**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: install UI Kitten dependencies"
```

---

## Task 2: 创建 UI Kitten 主题配置文件

**Files:**
- Create: `frontend/src/theme/index.ts`
- Create: `frontend/src/theme/mappings.ts`

**Step 1: 创建主题映射文件**

```typescript
// frontend/src/theme/mappings.ts
export const lightTheme = {
  // 主色系 - 护花使者红
  'color-primary-100': '#f06b70',
  'color-primary-default': '#e94b52',
  'color-primary-700': '#c73e47',

  // 成功色系
  'color-success-100': '#7bc98a',
  'color-success-default': '#5aaf6a',

  // 警告色系
  'color-warning-100': '#f7e4b8',
  'color-warning-default': '#f5a623',

  // 错误色系
  'color-danger-100': '#fdd',
  'color-danger-default': '#e94b52',

  // 基础色系
  'color-basic-100': '#faf8f5',
  'color-basic-200': '#ffffff',
  'color-basic-300': '#f5f2ee',
  'color-basic-400': '#b3b3b3',
  'color-basic-500': '#8c8c8c',
  'color-basic-600': '#5a5a5a',
  'color-basic-700': '#3d3d3d',
  'color-basic-800': '#1a1a1a',
  'color-basic-900': '#0a0a0a',
  'color-basic-1000': '#000000',

  // 间距
  'spacing-horizontal-tiny': 8,
  'spacing-horizontal-small': 12,
  'spacing-horizontal-medium': 16,
  'spacing-horizontal-large': 24,
  'spacing-horizontal-xlarge': 32,
  'spacing-vertical-tiny': 8,
  'spacing-vertical-small': 12,
  'spacing-vertical-medium': 16,
  'spacing-vertical-large': 24,
  'spacing-vertical-xlarge': 32,

  // 圆角
  'border-radius-4': 4,
  'border-radius-8': 8,
  'border-radius-12': 12,
  'border-radius-16': 16,
  'border-radius-24': 24,
};
```

**Step 2: 创建主题入口文件**

```typescript
// frontend/src/theme/index.ts
import * as Eva from '@eva-design/eva';
import { lightTheme } from './mappings';

export const theme = { ...lightTheme, ...Eva.light };
```

**Step 3: 提交**

```bash
git add frontend/src/theme/
git commit -m "feat: create UI Kitten custom theme"
```

---

## Task 3: 配置 ApplicationProvider

**Files:**
- Modify: `frontend/App.tsx`

**Step 1: 更新 App.tsx 配置**

```typescript
// frontend/App.tsx
import React, { useState } from 'react';
import { ApplicationProvider, Layout, Text } from '@ui-kitten/components';
import { theme } from './src/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/constants/theme';

function App() {
  const [currentTab, setCurrentTab] = useState('Identify');

  return (
    <ApplicationProvider {...theme}>
      <Layout style={{ flex: 1, backgroundColor: colors.background }}>
        <AppNavigator currentTab={currentTab} onTabChange={setCurrentTab} />
      </Layout>
    </ApplicationProvider>
  );
}

export default App;
```

**Step 2: 更新 AppNavigator 使用 UI Kitten BottomNavigation**

```typescript
// frontend/src/navigation/AppNavigator.tsx
import { BottomNavigation, BottomNavigationTab, Icon } from '@ui-kitten/components';
import { layout, text } from '@ui-kitten/eva';

const tabs = [
  { title: '识别', icon: 'camera-outline' },
  { title: '花园', icon: 'flower2-outline' },
  { title: '百科', icon: 'book-open-outline' },
  { title: '我的', icon: 'person-outline' },
];

// 替换 TabBar 为 BottomNavigation
```

**Step 3: 测试应用启动**

```bash
cd frontend
npm start
```

Expected: 应用启动，UI Kitten 样式生效

**Step 4: 提交**

```bash
git add frontend/App.tsx frontend/src/navigation/
git commit -m "feat: configure ApplicationProvider with UI Kitten theme"
```

---

## Task 4: 更新 Icon 组件适配 UI Kitten

**Files:**
- Modify: `frontend/src/components/Icon.tsx`

**Step 1: 保留 Icon 组件作为补充**

```typescript
// frontend/src/components/Icon.tsx
// 保留自定义 Icon 组件用于 emoji 后备
// UI Kitten 也有 Icon 组件，但保留此组件用于特定场景

// 导出给需要 emoji 图标的组件
export const EmojiIcon = ({ emoji, size = 24 }: { emoji: string; size?: number }) => (
  <Text style={{ fontSize: size }}>{emoji}</Text>
);
```

**Step 2: 提交**

```bash
git add frontend/src/components/Icon.tsx
git commit -m "refactor: update Icon component for UI Kitten compatibility"
```

---

## Task 5: 重构 IdentifyScreen（识别页）

**Files:**
- Modify: `frontend/src/screens/IdentifyScreen.tsx`

**Step 1: 替换主按钮为 UI Kitten Button**

```typescript
// frontend/src/screens/IdentifyScreen.tsx
import { Button, Card, Text, useTheme } from '@ui-kitten/components';

export function IdentifyScreen() {
  const theme = useTheme();

  // 替换主按钮
  <Button
    style={styles.identifyButton}
    appearance="filled"
    status="primary"
    size="giant"
    accessoryLeft={<eva.icon name="camera" {...eva.dispatch({})} />}
    onPress={() => handleIdentify('camera')}
  >
    拍照识别
  </Button>
}
```

**Step 2: 替换相册按钮**

```typescript
<Button
  appearance="outline"
  status="basic"
  style={styles.actionButton}
  onPress={() => handleIdentify('gallery')}
  accessoryLeft={<eva.icon name="image-outline" {...eva.dispatch({})} />}
>
  相册导入
</Button>
```

**Step 3: 替换提示卡片为 Card**

```typescript
<Card
  header={(props) => (
    <Text {...props} category="h6">新手推荐</Text>
  )}
  style={styles.tips}
  footer={
    <Button size="small" appearance="ghost" status="primary">
      开始推荐
    </Button>
  }
>
  <Text>不确定养什么？试试场景问答推荐</Text>
</Card>
```

**Step 4: 测试识别页功能**

Expected: 按钮显示正常，颜色为主题色，点击响应正常

**Step 5: 提交**

```bash
git add frontend/src/screens/IdentifyScreen.tsx
git commit -m "refactor(identify): migrate to UI Kitten components"
```

---

## Task 6: 重构 GardenScreen（花园页）

**Files:**
- Modify: `frontend/src/screens/GardenScreen.tsx`

**Step 1: 导入 UI Kitten 组件**

```typescript
import {
  List,
  ListItem,
  ListItemProps,
  Avatar,
  Button,
  Card,
  Text,
  useTheme
} from '@ui-kitten/components';
import { Icons } from '../components/Icon';
import { Layout } from '@ui-kitten/eva';
```

**Step 2: 替换植物列表为 UI Kitten List**

```typescript
<List
  data={mockPlants}
  ItemPreviewComponent={({ item, ...listProps }: ListItemProps) => (
    <ListItem
      {...listProps}
      style={styles.plantCard}
      accessoryLeft={<Avatar source={{ uri: item.image }} />}
      description={props => (
        <View style={styles.plantAction}>
          <Icons.Droplets size={14} color={colors.primary} />
          <Text {...props} style={styles.actionText}>
            {item.nextAction} · {item.daysUntil}天后
          </Text>
        </View>
      )}
      accessoryRight={<Icons.Scissors size={20} />}
    />
  )}
/>
```

**Step 3: 替换添加按钮为 FAB**

```typescript
<Button
  style={styles.addButton}
  size="large"
  appearance="filled"
  status="primary"
  accessoryLeft={<eva.icon name="plus" {...eva.dispatch({})} />}
/>
```

**Step 4: 提交**

```bash
git add frontend/src/screens/GardenScreen.tsx
git commit -m "refactor(garden): migrate to UI Kitten List and Avatar"
```

---

## Task 7: 重构 EncyclopediaScreen（百科页）

**Files:**
- Modify: `frontend/src/screens/EncyclopediaScreen.tsx`

**Step 1: 导入 UI Kitten 组件**

```typescript
import {
  Card,
  Text,
  Button,
  Chip,
  Avatar,
  Divider,
  Input,
  useTheme
} from '@ui-kitten/components';
```

**Step 2: 替换搜索栏为 Input**

```typescript
<Input
  placeholder="搜索植物名称或养护问题"
  size="medium"
  accessoryLeft={<eva.icon name="search-outline" {...eva.dispatch({})} />}
  style={styles.searchBar}
/>
```

**Step 3: 替换难度筛选为 Chip**

```typescript
<ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
  {difficultyLevels.map((level) => (
    <Chip
      key={level.id}
      style={[styles.chip, { borderColor: level.color }]}
      appearance="outline"
      status={level.color === colors.secondary ? 'success' : 'warning'}
    >
      {level.name}
    </Chip>
  ))}
</ScrollView>
```

**Step 4: 替换分类卡片为 Card + Avatar**

```typescript
<Card style={styles.categoryCard}>
  <Avatar
    source={require('../../assets/category-icon.png')}
    size="large"
  />
  <Text category="label">{item.name}</Text>
  <Text appearance="hint">{item.count} 种</Text>
</Card>
```

**Step 5: 提交**

```bash
git add frontend/src/screens/EncyclopediaScreen.tsx
git commit -m "refactor(encyclopedia): migrate to UI Kitten Card, Chip, Input"
```

---

## Task 8: 重构 ProfileScreen（个人中心）

**Files:**
- Modify: `frontend/src/screens/ProfileScreen.tsx`

**Step 1: 导入 UI Kitten 组件**

```typescript
import {
  List,
  ListItem,
  Avatar,
  Divider,
  Text,
  Button,
  TopNavigation,
  useTheme
} from '@ui-kitten/components';
import { Icons } from '../components/Icon';
```

**Step 2: 替换菜单列表为 UI Kitten List**

```typescript
List
  data={menuItems}
  ItemPreviewComponent={({ item, ...listProps }) => (
    <ListItem
      {...listProps}
      style={styles.menuItem}
      accessoryLeft={
        <Avatar
          size="small"
          style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}
        >
          <item.icon size={20} {...eva.dispatch({})} />
        </Avatar>
      }
      description={props => (
        <Text {...props} appearance="hint">{item.subtitle}</Text>
      )}
      accessoryRight={<eva.icon name="arrow-right" {...eva.dispatch({})} />}
    />
  )}
/>
```

**Step 3: 替换用户信息区域**

```typescript
<Layout style={styles.profileHeader} level="1">
  <Avatar
    source={require('../../assets/user-avatar.png')}
    size="giant"
  />
  <Text category="h1">养花小白</Text>
  <Button
    size="tiny"
    appearance="ghost"
    status="primary"
  >
    Lv.3 园丁
  </Button>
</Layout>
```

**Step 4: 提交**

```bash
git add frontend/src/screens/ProfileScreen.tsx
git commit -m "refactor(profile): migrate to UI Kitten List, Avatar, TopNavigation"
```

---

## Task 9: 重构 DiagnosisScreen（诊断页）

**Files:**
- Modify: `frontend/src/screens/DiagnosisScreen.tsx`

**Step 1: 导入 UI Kitten 组件**

```typescript
import {
  Button,
  Card,
  Text,
  Spinner,
  TopNavigation,
  Divider,
  useTheme
} from '@ui-kitten/components';
```

**Step 2: 替换诊断按钮**

```typescript
<ButtonGroup style={styles.diagnoseButtons}>
  <Button
    appearance="filled"
    status="primary"
    size="large"
    accessoryLeft={<eva.icon name="camera" {...eva.dispatch({})} />}
    onPress={() => handleDiagnose('camera')}
  >
    拍照诊断
  </Button>
  <Button
    appearance="outline"
    status="basic"
    size="large"
    accessoryLeft={<eva.icon name="image-outline" {...eva.dispatch({})} />}
    onPress={() => handleDiagnose('gallery')}
  >
    相册选择
  </Button>
</ButtonGroup>
```

**Step 3: 替换诊断结果卡片**

```typescript
Card
  header={(props) => (
    <Layout level="4">
      <Text {...props} category="h6">诊断结果</Text>
      <Badge
        status={diagnosisResult.severity === 'high' ? 'danger' : 'warning'}
        text={getSeverityText(diagnosisResult.severity)}
      />
    </Layout>
  )}
  style={styles.resultCard}
>
  {/* 内容 */}
</Card>
```

**Step 4: 提交**

```bash
git add frontend/src/screens/DiagnosisScreen.tsx
git commit -m "refactor(diagnosis): migrate to UI Kitten components"
```

---

## Task 10: 重构 ReminderScreen（提醒页）

**Files:**
- Modify: `frontend/src/screens/ReminderScreen.tsx`

**Step 1: 导入 UI Kitten 组件**

```typescript
import {
  List,
  ListItem,
  Toggle,
  Button,
  Card,
  Text,
  TopNavigation,
  Modal,
  useTheme
} from '@ui-kitten/components';
```

**Step 2: 替换提醒列表**

```typescript
List
  data={reminders}
  ItemPreviewComponent={({ item, ...listProps }) => (
    <ListItem
      {...listProps}
      description={props => (
        <Text {...props} status={item.enabled ? 'basic' : 'hint'}>
          {item.title} · 每{item.interval}天
        </Text>
      )}
      accessoryRight={
        <Toggle
          checked={item.enabled}
          onChange={checked => toggleReminder(item.id)}
        />
      }
    />
  )}
/>
```

**Step 3: 替换环境选择弹窗**

```typescript
<Modal
  visible={showEnvModal}
  backdropStyle={styles.modalBackdrop}
  onBackdropPress={() => setShowEnvModal(false)}
>
  <Card header="选择摆放环境" footer={renderFooter}>
    <RadioGroup
      selectedIndex={selectedEnvIndex}
      onChange={index => setSelectedEnv(index)}
    >
      {envOptions.map((option, index) => (
        <Radio key={index} status="basic">
          {option.label}
        </Radio>
      ))}
    </RadioGroup>
  </Card>
</Modal>
```

**Step 4: 提交**

```bash
git add frontend/src/screens/ReminderScreen.tsx
git commit -m "refactor(reminder): migrate to UI Kitten Toggle, Radio, Modal"
```

---

## Task 11: 重构 DiaryScreen（日记页）

**Files:**
- Modify: `frontend/src/screens/DiaryScreen.tsx`

**Step 1: 导入 UI Kitten 组件**

```typescript
import {
  Card,
  Text,
  Button,
  Avatar,
  TabView,
  Tab,
  Toggle,
  Layout,
  Divider,
  useTheme
} from '@ui-kitten/components';
```

**Step 2: 替换日记卡片**

```typescript
Card
  header={(props) => (
    <Layout style={styles.diaryHeader}>
      <Text {...props} category="h6">{diary.plantName}</Text>
      <Button
        size="tiny"
        appearance="ghost"
        status="basic"
        accessoryRight={<eva.icon name="calendar" {...eva.dispatch({})} />}
      >
        {diary.date}
      </Button>
    </Layout>
  )}
  footer={
    <Layout style={styles.diaryFooter}>
      <Button
        size="tiny"
        appearance="ghost"
        accessoryLeft={<Icons.Heart size={16} />}
      >
        {diary.likes}
      </Button>
    </Layout>
  }
  style={styles.diaryCard}
>
  <Text>{diary.content}</Text>
</Card>
```

**Step 3: 提交**

```bash
git add frontend/src/screens/DiaryScreen.tsx
git commit -m "refactor(diary): migrate to UI Kitten Card, TabView, Avatar"
```

---

## Task 12: 重构 RecommendationScreen（推荐页）

**Files:**
- Modify: `frontend/src/screens/RecommendationScreen.tsx`

**Step 1: 导入 UI Kitten 组件**

```typescript
import {
  Button,
  Card,
  Text,
  Radio,
  RadioGroup,
  ProgressBar,
  TopNavigation,
  Layout,
  Divider,
  useTheme
} from '@kitten-lab/components';
```

**Step 2: 替换问答选项**

```typescript
RadioGroup
  selectedIndex={currentStep}
  onChange={index => setCurrentStep(index)}
>
  {questions[currentStep].options.map((option, index) => (
    <Radio
      key={index}
      status="basic"
    >
      {option.label}
    </Radio>
  ))}
</RadioGroup>
```

**Step 3: 添加进度条**

```typescript
<ProgressBar
  progress={((currentStep + 1) / questions.length) * 100}
  size="medium"
  status="primary"
/>
```

**Step 4: 提交**

```bash
git add frontend/src/screens/RecommendationScreen.tsx
git commit -m "refactor(recommendation): migrate to UI Kitten Radio, ProgressBar"
```

---

## Task 13: 更新 EncyclopediaDetailScreen（百科详情页）

**Files:**
- Modify: `frontend/src/screens/EncyclopediaDetailScreen.tsx`

**Step 1: 导入 UI Kitten 组件**

```typescript
import {
  TopNavigation,
  Text,
  Card,
  Layout,
  List,
  ListItem,
  Button,
  Icon,
  useTheme
} from '@ui-kitten/components';
```

**Step 2: 替换顶部导航**

```typescript
<TopNavigation
  title="植物详情"
  alignment="center"
  accessoryLeft={
    <Button
      appearance="ghost"
      status="basic"
      accessoryLeft={<eva.icon name="arrow-back" {...eva.dispatch({})} />}
      onPress={() => navigation.goBack()}
    />
  }
/>
```

**Step 3: 替换内容卡片**

```typescript
Card
  header="养护难度"
  style={styles.sectionCard}
>
  <Layout style={styles.difficultyContainer}>
    {Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name="star"
        style={[styles.star, i < plant.careLevel ? styles.starActive : null]}
        fill={i < plant.careLevel ? 'currentColor' : 'none'}
      />
    ))}
    <Text category="h6">{getDifficultyText(plant.careLevel)}</Text>
  </Layout>
</Card>
```

**Step 4: 提交**

```bash
git add frontend/src/screens/EncyclopediaDetailScreen.tsx
git commit -m "refactor(encyclopedia-detail): migrate to UI Kitten components"
```

---

## Task 14: 更新 PlantCard 组件

**Files:**
- Modify: `frontend/src/components/PlantCard.tsx`

**Step 1: 使用 UI Kitten Modal**

```typescript
import { Modal, Card, Button, Text, Avatar, Icon, useTheme } from '@ui-kitten/components';

// 替换 Modal 组件
<Modal
  visible={visible}
  backdropStyle={styles.modalBackdrop}
  onBackdropPress={onClose}
>
  <Card
    header="植物档案"
    footer={
      <Button
        appearance="filled"
        status="primary"
        accessoryLeft={<eva.icon name="checkmark" {...eva.dispatch({})} />}
        onPress={onAddToGarden}
      >
        加入我的花园
      </Button>
    }
    style={styles.card}
  >
    {/* 卡片内容 */}
  </Card>
</Modal>
```

**Step 5: 提交**

```bash
git add frontend/src/components/PlantCard.tsx
git commit -m "refactor(card): migrate PlantCard to UI Kitten Modal"
```

---

## Task 15: 清理和样式调整

**Files:**
- Modify: `frontend/src/constants/theme.ts`
- Modify: `frontend/src/screens/*.tsx`

**Step 1: 更新 theme.ts 导出兼容性**

```typescript
// frontend/src/constants/theme.ts
// 保留现有导出以兼容旧代码
export { colors, spacing, borderRadius, fontSize, fontWeight, shadows, touchTarget, duration, opacity };

// 新增 UI Kitten 兼容导出
export const uiKittenTheme = {
  ...colors,
  ...spacing,
  ...borderRadius,
  ...fontSize,
};
```

**Step 2: 删除重复的样式文件**

```bash
rm -rf frontend/src/constants/*.ts.bak
```

**Step 3: 提交**

```bash
git add frontend/src/constants/theme.ts
git commit -m "refactor(theme): cleanup and add UI Kitten compatibility"
```

---

## Task 16: 测试与调试

**Files:**
- Test: 所有屏幕文件

**Step 1: 启动应用测试**

```bash
cd frontend
npm start
```

**Step 2: 逐页测试功能**

测试清单:
- [ ] 底部导航切换
- [ ] 识别页按钮点击
- [ ] 花园页列表滚动
- [ ] 百科页搜索
- [ ] 个人中心菜单
- [ ] 诊断页功能
- [ ] 提醒页开关
- [ ] 日记页标签切换
- [ ] 推荐页问答流程

**Step 3: 修复发现的问题**

使用 `react-native log-ios` 或 `adb logcat` 查看错误

**Step 4: 提交修复**

```bash
git commit -m "fix: resolve UI Kitten migration issues"
```

---

## Task 17: 更新依赖和文档

**Files:**
- Modify: `frontend/README.md`
- Create: `frontend/docs/UI_KITTN_MIGRATION.md`

**Step 1: 更新 README**

```markdown
# 护花使者 - Flower Guardian

## 技术栈
- React Native 0.84.1
- UI Kitten (UI 组件库)
- TypeScript

## 开发指南
### 主题定制
主题配置位于 `src/theme/` 和 `src/constants/theme.ts`
```

**Step 2: 提交**

```bash
git add frontend/README.md frontend/docs/
git commit -m "docs: add UI Kitten migration documentation"
```

---

## 验收标准

完成所有任务后，确认：

- [ ] 应用正常启动，UI Kitten 主题生效
- [ ] 主色 #e94b52 正确显示在所有组件上
- [ ] 底部导航 4 个 Tab 可正常切换
- [ ] 所有屏幕布局正常，无样式错乱
- [ ] 按钮点击响应正常
- [ ] 列表可正常滚动
- [ ] Modal 弹窗正常显示和关闭
- [ ] 输入框和开关等交互组件正常

---

**预计耗时**: 3-4 小时
**提交数**: 约 17 个 commits
