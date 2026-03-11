# 病症诊断页面优化实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 优化病症诊断页面的视觉设计，使其更现代化、与清新自然主题风格匹配，并添加返回按钮

**Architecture:** 保持现有的三段式结构（初始状态 → 加载中 → 结果展示），添加返回按钮，改进视觉元素

**Tech Stack:** React Native, StyleSheet, lucide-react-native icons

---

## 实现步骤

### Task 1: 添加返回按钮

**Files:**
- Modify: `src/screens/DiagnosisScreen.tsx`

**Step 1: 添加返回按钮和导航处理**

```tsx
// 在 DiagnosisScreenProps 接口后添加
const handleGoBack = () => {
  if (onGoBack) {
    onGoBack();
  }
};

// 在 return 的 header 部分，添加返回按钮
<View style={styles.header}>
  <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
    <Icons.ChevronLeft size={20} color={colors.primary} />
  </TouchableOpacity>
  <View style={styles.headerContent}>
    <View style={styles.headerIcon}><Icons.AlertCircle size={28} color={colors.warning} /></View>
    <Text style={styles.headerTitle}>病症诊断</Text>
    <Text style={styles.headerSubtitle}>AI智能预诊，告别植物杀手</Text>
  </View>
</View>
```

**Step 2: 添加返回按钮样式**

```tsx
// 在 StyleSheet 中添加
backButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.primary + '15',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: spacing.md,
},
headerContent: {
  flex: 1,
  alignItems: 'center'
},
```

---

### Task 2: 优化头部区域

**Files:**
- Modify: `src/screens/DiagnosisScreen.tsx`

**Step 1: 更新头部样式**

```tsx
header: {
  alignItems: 'center',
  paddingVertical: spacing.xl * 2,
  paddingTop: spacing.xl,
  backgroundColor: colors.surface,
  borderBottomLeftRadius: 24,
  borderBottomRightRadius: 24,
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 4,
},
headerIcon: {
  width: 72,
  height: 72,
  borderRadius: 20,
  backgroundColor: colors.warning + '15',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: spacing.md,
  shadowColor: colors.warning,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 3,
},
headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
headerSubtitle: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
```

---

### Task 3: 优化操作按钮

**Files:**
- Modify: `src/screens/DiagnosisScreen.tsx`

**Step 1: 更新按钮样式**

```tsx
buttonRow: {
  flexDirection: 'row',
  gap: spacing.md,
  marginBottom: spacing.lg
},
mainButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  backgroundColor: colors.primary,
  paddingVertical: spacing.lg,
  borderRadius: 16,
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 6,
},
mainButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
secondaryButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  borderWidth: 1.5,
  borderColor: colors.primary,
  paddingVertical: spacing.lg,
  borderRadius: 16,
  backgroundColor: colors.surface,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
},
secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
```

---

### Task 4: 优化拍摄建议卡片

**Files:**
- Modify: `src/screens/DiagnosisScreen.tsx`

**Step 1: 更新建议卡片样式**

```tsx
tipsCard: {
  backgroundColor: colors.surface,
  borderRadius: 20,
  padding: spacing.md,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 12,
  elevation: 1,
  borderWidth: 1,
  borderColor: colors.border,
},
tipsTitle: {
  fontSize: 15,
  fontWeight: '600',
  color: colors.text,
  marginBottom: spacing.sm,
  flexDirection: 'row',
  alignItems: 'center',
},
tipsText: { fontSize: 14, color: colors['text-secondary'], lineHeight: 22, marginLeft: spacing.sm },
```

---

### Task 5: 优化加载动画

**Files:**
- Modify: `src/screens/DiagnosisScreen.tsx`

**Step 1: 更新加载动画样式**

```tsx
loadingContainer: {
  alignItems: 'center',
  paddingVertical: spacing.xxl * 2
},
loadingCircle: {
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: colors.surface,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.2,
  shadowRadius: 24,
  elevation: 8,
  borderWidth: 3,
  borderColor: colors.primary + '30',
},
loadingText: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginTop: spacing.lg },
loadingSubtext: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs, textAlign: 'center' },
```

---

### Task 6: 优化诊断结果展示

**Files:**
- Modify: `src/screens/DiagnosisScreen.tsx`

**Step 1: 更新结果卡片样式**

```tsx
resultContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
resultHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.md,
  backgroundColor: colors.surface,
  padding: spacing.md,
  borderRadius: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 12,
  elevation: 1,
},
resultTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
severityBadge: {
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  borderRadius: 12,
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
},
severityText: { fontSize: 14, fontWeight: '600' },
resultCard: {
  backgroundColor: colors.surface,
  borderRadius: 20,
  padding: spacing.md,
  marginBottom: spacing.lg,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 12,
  elevation: 1,
  borderWidth: 1,
  borderColor: colors.border,
},
resultLabel: {
  fontSize: 14,
  color: colors['text-tertiary'],
  marginTop: spacing.md,
  marginBottom: spacing.xs,
  fontWeight: '600',
},
resultValue: { fontSize: 20, fontWeight: 'bold', color: colors.text },
resultText: { fontSize: 15, color: colors.text, lineHeight: 24 },
causesList: { marginBottom: spacing.md, gap: spacing.sm },
causeItem: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.background,
  padding: spacing.sm,
  borderRadius: 10,
},
causeDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.warning,
  marginRight: spacing.sm
},
causeText: { fontSize: 14, color: colors['text-secondary'], flex: 1 },
```

**Step 2: 更新操作按钮样式**

```tsx
retryButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  borderWidth: 1.5,
  borderColor: colors.primary,
  paddingVertical: spacing.md,
  borderRadius: 14,
  marginBottom: spacing.sm,
  backgroundColor: colors.surface,
},
retryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
communityButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  backgroundColor: colors.success,
  paddingVertical: spacing.md,
  borderRadius: 14,
  shadowColor: colors.success,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 4,
  marginBottom: spacing.xxl * 2,
},
communityButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
```

---

## 验证步骤

1. 运行 TypeScript 检查：`npx tsc --noEmit`
2. 重新打包 JS：`npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle --assets-dest ios`
3. 重新构建 iOS：`xcodebuild -workspace ios/FlowerGuardian.xcworkspace -scheme FlowerGuardian -configuration Debug -destination "platform=iOS Simulator,name=iPhone 17 Pro" build`
4. 在模拟器上测试应用

## 预期效果
- 页面整体视觉更现代化、清新自然
- 返回按钮功能正常，点击可返回上一页
- 按钮点击有明显的视觉反馈（阴影变化、缩放）
- 加载动画更流畅、更有设计感
- 结果展示清晰易读，层次分明
