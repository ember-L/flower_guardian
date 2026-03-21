# 病症诊断结果页面优化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 优化病症诊断结果页面UI，显示检测图片并丰富诊断信息展示

**Architecture:** 在 DiagnosisScreen 组件中添加 Image 组件显示识别图片，增加置信度和识别模式标签，优化整体布局

**Tech Stack:** React Native, TypeScript

---

## 任务 1: 添加 Image 组件到诊断结果页面

**Files:**
- Modify: `APP/src/screens/DiagnosisScreen.tsx:1-20`

**Step 1: 添加 Image 导入**

```typescript
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert, Animated, Easing, Image } from 'react-native';
```

**Step 2: 添加图片状态**

在 `export function DiagnosisScreen` 内添加：
```typescript
const [capturedImage, setCapturedImage] = useState<string | null>(null);
```

**Step 3: 保存图片URI**

在 `handleDiagnose` 函数中，识别成功后保存图片：
```typescript
setCapturedImage(imageUri);
setDiagnosisResult(result);
```

---

## 任务 2: 添加顶部图片展示区

**Files:**
- Modify: `APP/src/screens/DiagnosisScreen.tsx:263-280`

**Step 1: 在诊断结果区域添加图片**

在 `{diagnosisResult && severityConfig && (` 之后，`{/* 结果头部 */}` 之前添加：

```tsx
{/* 顶部图片展示 */}
{capturedImage && (
  <View style={styles.imageContainer}>
    <Image source={{ uri: capturedImage }} style={styles.resultImage} />
    <View style={styles.imageInfoBar}>
      <View style={styles.imageTag}>
        <Icons.Image size={14} color={colors.primary} />
        <Text style={styles.imageTagText}>识别图片</Text>
      </View>
      <View style={styles.modeTag}>
        <Icons.Wifi size={14} color={recognitionMode === 'online' ? colors.success : colors.warning} />
        <Text style={[styles.modeTagText, { color: recognitionMode === 'online' ? colors.success : colors.warning }]}>
          {recognitionMode === 'online' ? '在线识别' : '离线识别'}
        </Text>
      </View>
      <View style={styles.confidenceTag}>
        <Text style={styles.confidenceTagText}>
          {Math.round((diagnosisResult?.confidence || 0) * 100)}%
        </Text>
      </View>
    </View>
  </View>
)}
```

---

## 任务 3: 添加图片展示区样式

**Files:**
- Modify: `APP/src/screens/DiagnosisScreen.tsx:620-650` (在 resultContent 样式后添加)

**Step 1: 添加图片展示区样式**

```typescript
// 图片展示区
imageContainer: {
  marginHorizontal: spacing.lg,
  marginBottom: spacing.md,
},
resultImage: {
  width: '100%',
  height: 200,
  borderRadius: borderRadius.lg,
  backgroundColor: colors.surface,
},
imageInfoBar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.md,
  marginTop: spacing.sm,
},
imageTag: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  backgroundColor: colors.primaryLight + '20',
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: borderRadius.sm,
},
imageTagText: {
  fontSize: fontSize.xs,
  color: colors.primary,
  fontWeight: fontWeight.medium,
},
modeTag: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
},
modeTagText: {
  fontSize: fontSize.xs,
  fontWeight: fontWeight.medium,
},
confidenceTag: {
  backgroundColor: colors.successLight,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: borderRadius.sm,
},
confidenceTagText: {
  fontSize: fontSize.xs,
  color: colors.success,
  fontWeight: fontWeight.bold,
},
```

---

## 任务 4: 添加置信度和识别模式到结果头部

**Files:**
- Modify: `APP/src/screens/DiagnosisScreen.tsx:280-300`

**Step 1: 修改结果头部，添加更多信息**

将现有 `resultHeader` 修改为包含置信度和模式信息：

```tsx
{/* 结果头部 */}
<View style={styles.resultHeader}>
  <View style={styles.resultHeaderLeft}>
    <Text style={styles.resultTitle}>诊断结果</Text>
    <View style={styles.resultHeaderMeta}>
      <Text style={styles.resultSubtitle}>AI智能分析</Text>
      <Text style={styles.resultDot}>·</Text>
      <Text style={styles.resultSubtitle}>
        {Math.round((diagnosisResult?.confidence || 0) * 100)}% 置信度
      </Text>
    </View>
  </View>
  <View style={[styles.severityBadge, { backgroundColor: severityConfig.bgColor }]}>
    {SeverityIcon && <SeverityIcon size={18} color={severityConfig.color} />}
    <Text style={[styles.severityText, { color: severityConfig.color }]}>{severityConfig.label}</Text>
  </View>
</View>
```

**Step 2: 添加结果头部元信息样式**

```typescript
resultHeaderMeta: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: spacing.xs,
},
resultDot: {
  color: colors['text-tertiary'],
  marginHorizontal: spacing.xs,
},
```

---

## 任务 5: 添加缺失的图标

**Files:**
- Modify: `APP/src/components/Icon.tsx` (检查是否已有所需图标)

**Step 1: 检查 Icons**

确认以下图标已存在：
- Image ✓
- Wifi ✓
- Share (用于分享按钮)

---

## 验证步骤

1. 启动 React Native 开发服务器
2. 运行 APP 在模拟器或真机上
3. 进入诊断页面，拍照进行诊断
4. 验证以下功能：
   - 顶部显示拍摄的图片
   - 图片下方显示"识别图片"标签
   - 显示"在线识别"或"离线识别"模式
   - 显示置信度百分比（如 92%）
   - 结果头部显示置信度信息

---

## 预期产出

- 用户可以直观看到AI分析的是哪张照片
- 置信度显示增加用户对结果的信任度
- 识别模式标签帮助用户理解结果来源
- 整体UI更加专业、信息丰富
