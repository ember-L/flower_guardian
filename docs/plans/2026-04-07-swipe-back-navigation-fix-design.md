# 滑动回退导航修复设计方案

## 概述

修复诊断历史页面（DiagnosisHistory）到诊断详情页面（DiagnosisDetail）滑动回退时跳过中间页、直接返回 Profile 的问题。

## 问题描述

**复现路径**：Profile → DiagnosisHistory → DiagnosisDetail → 滑动回退

**期望行为**：滑动回退一级，回到 DiagnosisHistory

**实际行为**：滑动回退两级，跳过 DiagnosisHistory，直接回到 Profile

## 根因分析

### 双重回退机制冲突

当前实现中存在**两套回退机制**：

1. **SwipeBackWrapper 手势回退**（导航层）
   - 文件：`APP/src/components/SwipeBackWrapper.tsx`
   - 触发条件：水平滑动从左边缘开始，释放时调用 `onSwipeBack`

2. **子页面内部按钮回退**（页面层）
   - 文件：`APP/src/screens/DiagnosisDetailScreen.tsx` line 206-212
   - 头部返回按钮调用 `onGoBack`

### 问题触发流程

```
用户从左边缘开始滑动
    ↓
SwipeBackWrapper 检测到手势 → 开始动画
    ↓
用户释放手指
    ↓
SwipeBackWrapper 调用 onSwipeBack() → handleGoBack()
    ↓
handleGoBack() 从 navHistory 弹出 DiagnosisHistory
    ↓
但此时 navHistory 已被消耗，状态回到 Profile
```

### 核心缺陷

`navHistory` 是全局状态，但 `SwipeBackWrapper` 和子页面内部返回按钮**共享同一个 `handleGoBack`**，导致：

1. 滑动回退时：消耗一次 navHistory
2. 如果子页面按钮也被触发（事件冒泡或动画结束时的副作用）：再消耗一次
3. 结果：跳过了中间的 DiagnosisHistory

### 验证：DiagnosisDetailScreen 返回按钮实现

```typescript
// DiagnosisDetailScreen.tsx line 206-212
<TouchableOpacity
  onPress={onGoBack}  // <-- 这里调用了 handleGoBack
  style={styles.backButton}
>
  <Icon name="arrow-left" size={22} color={colors.text} />
</TouchableOpacity>
```

当用户点击头部返回按钮时，会额外调用一次 `handleGoBack`。

## 修复方案

### 方案 1：统一回退入口，禁用子页面内部返回按钮（推荐）

**思路**：
- `SwipeBackWrapper` 是唯一的回退入口
- 子页面头部不再直接调用 `onGoBack`，而是返回给 `SwipeBackWrapper` 处理
- 具体做法：将子页面头部返回按钮的 `onPress={onGoBack}` 改为 `onPress={() => {}}` 或移除按钮，**只依赖滑动回退**

**优点**：
- 简单直接，消除重复回调
- 符合单一职责：回退导航由导航层统一处理
- 用户体验一致：所有子页面统一使用滑动回退

**缺点**：
- 无需点击按钮回退，完全依赖滑动手势（但这是当前设计的预期行为）

**实施步骤**：
1. 修改 `DiagnosisDetailScreen`：移除或禁用头部返回按钮的 `onGoBack` 调用
2. 检查并修复所有使用 `SwipeBackWrapper` 的子页面，确保没有内部返回按钮重复调用 `onGoBack`

### 方案 2：在 SwipeBackWrapper 中添加防抖机制

**思路**：添加 `isGoingBack` 状态锁，防止重复触发

```typescript
// SwipeBackWrapper.tsx
const [isGoingBack, setIsGoingBack] = useState(false);

onSwipeBack: () => {
  if (isGoingBack) return;
  setIsGoingBack(true);
  // 执行回退动画和回调
}
```

**优点**：不需要修改子页面
**缺点**：状态管理变复杂，可能引入新的边界问题

### 方案 3：区分滑动回退和按钮回退

**思路**：为 `SwipeBackWrapper` 添加 `enabled` prop，滑动时禁用内部按钮

```typescript
<SwipeBackWrapper enabled={!isSwiping} onSwipeBack={...}>
```

**优点**：灵活可控
**缺点**：需要更复杂的手势状态同步

## 推荐方案实施细节

### 修改文件清单

1. `APP/src/screens/DiagnosisDetailScreen.tsx`
   - 移除头部返回按钮的 `onGoBack` 调用
   - 或将 `onPress={onGoBack}` 改为 `onPress={() => {}}`

2. 检查其他使用 `SwipeBackWrapper` 的子页面：
   - `ConsultationScreen.tsx`
   - `WriteDiaryScreen.tsx`
   - `DiaryScreen.tsx`
   - 其他子页面...

### 具体代码修改

**DiagnosisDetailScreen.tsx 修改方案**：

```typescript
// Before (line 206-212)
<TouchableOpacity
  onPress={onGoBack}
  style={styles.backButton}
>
  <Icon name="arrow-left" size={22} color={colors.text} />
</TouchableOpacity>

// After - 禁用按钮回退，只依赖滑动
<TouchableOpacity
  onPress={() => {}} // 禁用按钮回退
  style={styles.backButton}
  activeOpacity={1} // 消除按压反馈
>
  <Icon name="arrow-left" size={22} color={colors.text} />
</TouchableOpacity>
```

**或者完全移除按钮**（如果滑动回退足够可靠）：

```typescript
// 完全移除返回按钮，依赖滑动回退
```

### 需要检查的所有子页面

根据 `AppNavigator.tsx` 的 `renderContent` 方法，使用 `SwipeBackWrapper` 的子页面包括：

| 页面 | 文件 | 需要检查 |
|------|------|---------|
| Diagnosis | DiagnosisScreen.tsx | 是 |
| Recommendation | RecommendationScreen.tsx | 是 |
| Reminder | ReminderScreen.tsx | 是 |
| EncyclopediaDetail | EncyclopediaDetailScreen.tsx | 是 |
| Diary | DiaryScreen.tsx | 是 |
| StoreDetail | StoreDetailScreen.tsx | 是 |
| Cart | CartScreen.tsx | 是 |
| Checkout | CartScreen.tsx | 是 |
| Orders | OrdersScreen.tsx | 是 |
| OrderDetail | OrderDetailScreen.tsx | 是 |
| DiagnosisHistory | DiagnosisHistoryScreen.tsx | 是 |
| DiagnosisDetail | DiagnosisDetailScreen.tsx | **是（主要问题）** |
| ConsultationList | ConsultationListScreen.tsx | 是 |
| Consultation | ConsultationScreen.tsx | 是 |
| Knowledge | KnowledgeScreen.tsx | 是 |
| KnowledgeDetail | KnowledgeDetailScreen.tsx | 是 |
| PlantDetail | PlantDetailScreen.tsx | 是 |
| Notification | NotificationScreen.tsx | 是 |
| WriteDiary | WriteDiaryScreen.tsx | 是 |
| DiaryDetail | DiaryDetailScreen.tsx | 是 |
| GrowthCurve | GrowthCurveScreen.tsx | 是 |
| Address | AddressScreen.tsx | 是 |
| AddressEdit | AddressEditScreen.tsx | 是 |

## 验证步骤

1. **单元验证**：修改后启动 APP，测试以下路径：
   - Profile → DiagnosisHistory → DiagnosisDetail → 滑动回退 → 应回到 DiagnosisHistory
   - 再次滑动 → 应回到 Profile

2. **回归验证**：检查所有子页面：
   - 点击头部返回按钮不应触发回退
   - 滑动回退应正确工作

3. **边界情况**：
   - 快速连续滑动
   - 滑动距离不足时弹回

## 实施时间估算

- 修改 DiagnosisDetailScreen：5 分钟
- 检查其他子页面：20 分钟
- 测试验证：15 分钟
- **总计**：约 40 分钟
