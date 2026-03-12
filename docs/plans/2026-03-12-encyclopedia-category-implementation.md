# 植物百科分类展示功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 在百科页面点击分类后，在当前页面展示该分类的植物列表

**架构：** 使用现有的 `plants` 状态和 `getPlants` API，添加条件渲染的分类植物网格

**技术栈：** React Native, TypeScript

---

## Task 1: 添加分类植物状态

**Files:**
- Modify: `APP/src/screens/EncyclopediaScreen.tsx:36-42`

**Step 1: 添加状态变量**

在 `EncyclopediaScreen.tsx` 中，`plants` 状态已存在。确认使用它来存储分类植物数据：

```typescript
const [plants, setPlants] = useState<Plant[]>([]);
```

**Step 2: 验证状态存在**

确认第36-42行是否有 `plants` 状态定义。

---

## Task 2: 添加分类植物列表渲染

**Files:**
- Modify: `APP/src/screens/EncyclopediaScreen.tsx:261-262`

**Step 1: 在分类区域后添加分类植物列表**

在 `</View>` (分类网格结束) 后添加：

```tsx
{/* 分类植物列表 - 选择分类后显示 */}
{selectedCategory && plants.length > 0 && (
  <View style={styles.section}>
    <View style={styles.sectionHeaderRow}>
      <Icons.Tag size={18} color={colors.primary} />
      <Text style={styles.sectionTitle}>
        {categories.find(c => c.value === selectedCategory)?.name || selectedCategory}
      </Text>
      <Text style={styles.categoryCountText}>（共 {plants.length} 种）</Text>
    </View>
    <View style={styles.categoryPlantsGrid}>
      {plants.slice(0, 12).map((plant) => (
        <TouchableOpacity
          key={plant.id}
          style={styles.plantCard}
          activeOpacity={0.8}
          onPress={() => handlePlantPress(plant)}
        >
          <View style={styles.plantImageContainer}>
            {plant.image_url ? (
              <Image source={{ uri: plant.image_url }} style={styles.plantImage} />
            ) : (
              <View style={styles.plantImagePlaceholder}>
                <Icons.Leaf size={32} color={colors.secondary} />
              </View>
            )}
          </View>
          <Text style={styles.plantName} numberOfLines={1}>{plant.name}</Text>
          <View style={styles.plantMetaRow}>
            <Text style={styles.plantCategory}>{plant.category || '室内'}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
    {plants.length > 12 && (
      <TouchableOpacity style={styles.showMoreButton}>
        <Text style={styles.showMoreText}>查看更多 ({plants.length - 12})</Text>
        <Icons.ChevronRight size={16} color={colors.primary} />
      </TouchableOpacity>
    )}
  </View>
)}
```

**Step 2: 添加样式**

在 `styles` 对象中添加：

```typescript
categoryCountText: {
  fontSize: fontSize.sm,
  color: colors['text-tertiary'],
  marginLeft: spacing.xs,
},
categoryPlantsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.sm,
},
showMoreButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: spacing.md,
  gap: spacing.xs,
},
showMoreText: {
  fontSize: fontSize.sm,
  color: colors.primary,
  fontWeight: fontWeight.medium,
},
```

---

## Task 3: 测试功能

**Step 1: 运行应用**

```bash
cd APP && npm start
```

**Step 2: 验证流程**

1. 打开百科页面
2. 点击"室内"分类
3. 确认下方显示室内植物列表
4. 点击其他分类，确认列表更新
5. 点击植物卡片，确认可跳转详情

---

## 验收标准

1. ✅ 点击分类后正确显示该分类的植物
2. ✅ 显示分类名称和植物数量
3. ✅ 点击植物卡片可跳转到详情页
4. ✅ 切换分类时列表正确更新
5. ✅ 未选择分类时不显示分类植物区域
