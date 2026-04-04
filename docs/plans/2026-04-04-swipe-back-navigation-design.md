# 滑动后退导航实现设计方案

## 概述

将自定义状态导航迁移到 `@react-navigation/native-stack`，实现滑动后退手势功能。

## 目标

- 所有页面支持 iOS/Android 原生滑动返回手势
- 保持现有的底部 5 Tab 导航结构
- 使用 `beforeRemove` 监听器处理登录拦截

## 架构设计

### 路由结构

```
BottomTabNavigator
├── IdentifyStack (首页)
│   ├── Identify (主页面)
│   ├── Diagnosis
│   ├── Recommendation
│   └── Reminder
├── GardenStack (花园)
│   ├── Garden (主页面)
│   ├── PlantDetail
│   └── GrowthCurve
├── EncyclopediaStack (百科)
│   ├── Encyclopedia (主页面)
│   └── EncyclopediaDetail
├── StoreStack (商城)
│   ├── Store (主页面)
│   ├── StoreDetail
│   ├── Cart
│   └── Checkout
└── ProfileStack (我的)
    ├── Profile (主页面)
    ├── Orders
    ├── OrderDetail
    ├── DiagnosisHistory
    ├── DiagnosisDetail
    ├── Address
    ├── AddressEdit
    ├── Notification
    ├── Login
    ├── Register
    ├── EmailVerify
    └── ForgotPassword
```

## 核心实现

### 1. 导航器嵌套

- 外层：`BottomTabNavigator` (底部 Tab)
- 内层：各 `createNativeStackNavigator()` per tab

### 2. API 替换

| 原API | 新API |
|-------|-------|
| `onNavigate(page, params)` | `navigation.navigate(page, params)` |
| `onGoBack()` | `navigation.goBack()` |

### 3. 登录拦截

在根导航器添加 `beforeRemove` 监听器：

```typescript
navigation.addListener('beforeRemove', (e) => {
  if (!isLoggedIn && requiresAuth(e.data.route.name)) {
    e.preventDefault();
    navigation.navigate('Profile', { screen: 'Login' });
  }
});
```

### 4. 屏幕组件改造

将 props 接收的回调替换为 `useNavigation` hook：

```typescript
// Before
<DiagnosisScreen onGoBack={handleGoBack} onNavigate={handleNavigate} />

// After
const navigation = useNavigation();
navigation.goBack();
navigation.navigate('Diagnosis', params);
```

## 需要修改的文件

1. `APP/App.tsx` - 添加 `GestureHandlerRootView`
2. `APP/src/navigation/AppNavigator.tsx` - 重写为 React Navigation 结构
3. `APP/src/screens/*.tsx` - 所有页面组件适配新导航 API

## 实施步骤

1. 安装 `react-native-gesture-handler`
2. 修改 App.tsx 添加 GestureHandlerRootView
3. 创建新的导航结构
4. 重写 AppNavigator.tsx
5. 更新各屏幕组件使用 useNavigation
6. 测试滑动返回功能

## 兼容性

- iOS：默认支持滑动返回
- Android：默认支持手势导航（Android 10+）
