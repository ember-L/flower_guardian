# 养花日记页面完善实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完善养花日记页面，连接后端API，实现完整的CRUD功能，支持图片日记、生长数据记录、生长曲线可视化和对比功能。

**Architecture:** 采用分层架构：Service层处理API通信 -> Screen层处理UI交互 -> 复用现有UI组件和样式系统。导航使用现有的AppNavigator体系。

**Tech Stack:** React Native, TypeScript, axios, react-native-image-picker, react-native-svg (图表)

---

## Task 1: 创建日记服务层 (diaryService)

**Files:**
- Create: `APP/src/services/diaryService.ts`

**Step 1: 创建日记服务**

```typescript
// APP/src/services/diaryService.ts
import axios from 'axios';
import { getToken } from './auth';

const API_BASE = 'http://localhost:8000/api';

export interface Diary {
  id: number;
  user_id: number;
  user_plant_id: number;
  content: string;
  images: string[];
  height?: number;
  leaf_count?: number;
  created_at: string;
  plant_name?: string;
}

export interface DiaryCreate {
  user_plant_id: number;
  content: string;
  images?: string[];
  height?: number;
  leaf_count?: number;
}

export interface Plant {
  id: number;
  name: string;
  image?: string;
}

const getHeaders = async () => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// 获取日记列表
export const getDiaries = async (plantId?: number): Promise<Diary[]> => {
  const headers = await getHeaders();
  const params = plantId ? `?plant_id=${plantId}` : '';
  const response = await axios.get(`${API_BASE}/diaries${params}`, { headers });
  return response.data;
};

// 创建日记
export const createDiary = async (diary: DiaryCreate): Promise<Diary> => {
  const headers = await getHeaders();
  const response = await axios.post(`${API_BASE}/diaries`, diary, { headers });
  return response.data;
};

// 获取日记详情
export const getDiary = async (id: number): Promise<Diary> => {
  const headers = await getHeaders();
  const response = await axios.get(`${API_BASE}/diaries/${id}`, { headers });
  return response.data;
};

// 更新日记
export const updateDiary = async (id: number, diary: Partial<DiaryCreate>): Promise<Diary> => {
  const headers = await getHeaders();
  const response = await axios.put(`${API_BASE}/diaries/${id}`, diary, { headers });
  return response.data;
};

// 删除日记
export const deleteDiary = async (id: number): Promise<void> => {
  const headers = await getHeaders();
  await axios.delete(`${API_BASE}/diaries/${id}`, { headers });
};

// 获取用户植物列表
export const getMyPlants = async (): Promise<Plant[]> => {
  const headers = await getHeaders();
  const response = await axios.get(`${API_BASE}/plants/my`, { headers });
  return response.data;
};
```

**Step 2: 提交**

```bash
git add APP/src/services/diaryService.ts
git commit -m "feat: add diary service with API calls"
```

---

## Task 2: 添加日记相关类型定义

**Files:**
- Create: `APP/src/types/diary.ts`
- Modify: `APP/src/navigation/AppNavigator.tsx` (添加新页面类型)

**Step 1: 创建类型定义**

```typescript
// APP/src/types/diary.ts
export interface Diary {
  id: number;
  user_id: number;
  user_plant_id: number;
  content: string;
  images: string[];
  height?: number;
  leaf_count?: number;
  created_at: string;
  plant_name?: string;
}

export interface DiaryCreate {
  user_plant_id: number;
  content: string;
  images?: string[];
  height?: number;
  leaf_count?: number;
}

export interface Plant {
  id: number;
  name: string;
  image?: string;
}
```

**Step 2: 修改导航类型**

在 `AppNavigator.tsx` 中添加新的页面名称到 SubPageName 类型：
- `'WriteDiary'`
- `'DiaryDetail'`
- `'GrowthCurve'`

**Step 3: 提交**

```bash
git add APP/src/types/diary.ts APP/src/navigation/AppNavigator.tsx
git commit -m "feat: add diary types and navigation types"
```

---

## Task 3: 创建写日记页面 (WriteDiaryScreen)

**Files:**
- Create: `APP/src/screens/WriteDiaryScreen.tsx`

**Step 1: 创建写日记页面**

```typescript
// APP/src/screens/WriteDiaryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Text,
  TextInput, Image, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { createDiary, getMyPlants, Plant } from '../services/diaryService';

interface WriteDiaryScreenProps extends Partial<NavigationProps> {
  editDiaryId?: number;
}

export function WriteDiaryScreen({ onGoBack, onNavigate, editDiaryId }: WriteDiaryScreenProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [height, setHeight] = useState('');
  const [leafCount, setLeafCount] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    try {
      const data = await getMyPlants();
      setPlants(data);
      if (data.length > 0) {
        setSelectedPlantId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load plants:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAddImage = () => {
    if (images.length >= 9) {
      Alert.alert('提示', '最多只能添加9张图片');
      return;
    }

    Alert.alert('添加图片', '选择图片来源', [
      {
        text: '拍照',
        onPress: () => {
          launchCamera({ mediaType: 'photo', quality: 0.8 }, (response) => {
            if (response.assets && response.assets[0]?.uri) {
              setImages([...images, response.assets[0].uri]);
            }
          });
        },
      },
      {
        text: '相册',
        onPress: () => {
          launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 9 - images.length }, (response) => {
            if (response.assets) {
              const newImages = response.assets.map(a => a.uri).filter(Boolean) as string[];
              setImages([...images, ...newImages].slice(0, 9));
            }
          });
        },
      },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedPlantId) {
      Alert.alert('提示', '请选择植物');
      return;
    }

    if (!content.trim() && images.length === 0) {
      Alert.alert('提示', '请添加图片或文字内容');
      return;
    }

    setLoading(true);
    try {
      await createDiary({
        user_plant_id: selectedPlantId,
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
        height: height ? parseInt(height, 10) : undefined,
        leaf_count: leafCount ? parseInt(leafCount, 10) : undefined,
      });
      Alert.alert('成功', '日记保存成功', [
        { text: '确定', onPress: () => onGoBack?.() }
      ]);
    } catch (error) {
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.headerButton}>
          <Icons.X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>写日记</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.headerButton, styles.saveButton]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>保存</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 植物选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择植物</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {plants.map((plant) => (
              <TouchableOpacity
                key={plant.id}
                style={[
                  styles.plantChip,
                  selectedPlantId === plant.id && styles.plantChipActive
                ]}
                onPress={() => setSelectedPlantId(plant.id)}
              >
                <Text style={[
                  styles.plantChipText,
                  selectedPlantId === plant.id && styles.plantChipTextActive
                ]}>
                  {plant.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 图片区域 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>图片 ({images.length}/9)</Text>
          <View style={styles.imageGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Icons.X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 9 && (
              <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
                <Icons.Plus size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 生长数据 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>生长数据（可选）</Text>
          <View style={styles.growthInputs}>
            <View style={styles.growthInput}>
              <Text style={styles.growthLabel}>高度 (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="例如: 30"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.growthInput}>
              <Text style={styles.growthLabel}>叶片数量</Text>
              <TextInput
                style={styles.input}
                value={leafCount}
                onChangeText={setLeafCount}
                placeholder="例如: 5"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* 文字内容 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>记录文字（可选）</Text>
          <TextInput
            style={styles.textArea}
            value={content}
            onChangeText={setContent}
            placeholder="今天植物有什么变化？"
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{content.length}/500</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1,
    borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  headerButton: { padding: spacing.sm },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  saveButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: spacing.md },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  content: { flex: 1, padding: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  plantChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20,
    backgroundColor: colors.surface, marginRight: spacing.sm, borderWidth: 1,
    borderColor: colors.border,
  },
  plantChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  plantChipText: { fontSize: 14, color: colors.text },
  plantChipTextActive: { color: '#fff' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  imageContainer: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  removeImageButton: {
    position: 'absolute', top: 4, right: 4, width: 20, height: 20,
    borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  addImageButton: {
    width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: colors.primary,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  growthInputs: { flexDirection: 'row', gap: spacing.md },
  growthInput: { flex: 1 },
  growthLabel: { fontSize: 14, color: colors['text-secondary'], marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, fontSize: 16, borderWidth: 1, borderColor: colors.border,
  },
  textArea: {
    backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md,
    fontSize: 16, minHeight: 120, textAlignVertical: 'top', borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: { fontSize: 12, color: colors['text-tertiary'], textAlign: 'right', marginTop: spacing.xs },
});
```

**Step 2: 提交**

```bash
git add APP/src/screens/WriteDiaryScreen.tsx
git commit -m "feat: add WriteDiaryScreen with image picker and growth data"
```

---

## Task 4: 创建日记详情页面 (DiaryDetailScreen)

**Files:**
- Create: `APP/src/screens/DiaryDetailScreen.tsx`

**Step 1: 创建日记详情页面**

```typescript
// APP/src/screens/DiaryDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { getDiary, deleteDiary, Diary } from '../services/diaryService';

interface DiaryDetailScreenProps extends Partial<NavigationProps> {
  diaryId: number;
}

export function DiaryDetailScreen({ onGoBack, onNavigate, diaryId }: DiaryDetailScreenProps) {
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadDiary();
  }, [diaryId]);

  const loadDiary = async () => {
    try {
      const data = await getDiary(diaryId);
      setDiary(data);
    } catch (error) {
      Alert.alert('错误', '加载失败');
      onGoBack?.();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('确认删除', '确定要删除这条日记吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDiary(diaryId);
            Alert.alert('成功', '删除成功', [{ text: '确定', onPress: () => onGoBack?.() }]);
          } catch (error) {
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!diary) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>日记不存在</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.headerButton}>
          <Icons.ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>日记详情</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
          <Icons.Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 基本信息 */}
        <View style={styles.info}>
          <View style={styles.plantInfo}>
            <View style={styles.avatar}>
              <Icons.Flower2 size={20} color={colors.secondary} />
            </View>
            <View>
              <Text style={styles.plantName}>{diary.plant_name || '我的植物'}</Text>
              <Text style={styles.date}>{formatDate(diary.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* 生长数据 */}
        {(diary.height || diary.leaf_count) && (
          <View style={styles.growthData}>
            {diary.height && (
              <View style={styles.growthItem}>
                <Icons.TrendingUp size={16} color={colors.success} />
                <Text style={styles.growthValue}>{diary.height} cm</Text>
              </View>
            )}
            {diary.leaf_count && (
              <View style={styles.growthItem}>
                <Icons.Leaves size={16} color={colors.success} />
                <Text style={styles.growthValue}>{diary.leaf_count} 片叶子</Text>
              </View>
            )}
          </View>
        )}

        {/* 图片 */}
        {diary.images && diary.images.length > 0 && (
          <View style={styles.images}>
            {diary.images.length === 1 ? (
              <Image source={{ uri: diary.images[0] }} style={styles.singleImage} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {diary.images.map((uri, index) => (
                  <Image key={index} source={{ uri }} style={styles.thumbnail} />
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* 文字内容 */}
        {diary.content && (
          <View style={styles.contentSection}>
            <Text style={styles.diaryContent}>{diary.content}</Text>
          </View>
        )}

        {/* 对比按钮 */}
        <TouchableOpacity
          style={styles.compareButton}
          onPress={() => setShowComparison(!showComparison)}
        >
          <Icons.ArrowLeftRight size={16} color={colors.primary} />
          <Text style={styles.compareButtonText}>与上次记录对比</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1,
    borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  headerButton: { padding: spacing.sm },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  content: { flex: 1, padding: spacing.lg },
  info: { marginBottom: spacing.md },
  plantInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  plantName: { fontSize: 16, fontWeight: '600', color: colors.text },
  date: { fontSize: 13, color: colors['text-tertiary'] },
  growthData: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  growthItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  growthValue: { fontSize: 14, color: colors.text },
  images: { marginBottom: spacing.md },
  singleImage: { width: '100%', height: 250, borderRadius: 16 },
  thumbnail: { width: 150, height: 150, borderRadius: 12, marginRight: spacing.sm },
  contentSection: { marginBottom: spacing.md },
  diaryContent: { fontSize: 15, color: colors['text-secondary'], lineHeight: 24 },
  compareButtonDirection: 'row: {
    flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.primary,
    marginTop: spacing.md,
  },
  compareButtonText: { color: colors.primary, fontWeight: '500' },
});
```

**Step 2: 提交**

```bash
git add APP/src/screens/DiaryDetailScreen.tsx
git commit -m "feat: add DiaryDetailScreen with comparison feature"
```

---

## Task 5: 创建生长曲线页面 (GrowthCurveScreen)

**Files:**
- Create: `APP/src/screens/GrowthCurveScreen.tsx`

**Step 1: 创建生长曲线页面**

```typescript
// APP/src/screens/GrowthCurveScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle, Text as SvgText, Rect, G } from 'react-native-svg';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { getDiaries, Diary, getMyPlants, Plant } from '../services/diaryService';

interface GrowthCurveScreenProps extends Partial<NavigationProps> {
  preselectedPlantId?: number;
}

const TIME_RANGES = [
  { label: '1个月', value: 1 },
  { label: '3个月', value: 3 },
  { label: '6个月', value: 6 },
  { label: '全部', value: 0 },
];

export function GrowthCurveScreen({ onGoBack, preselectedPlantId }: GrowthCurveScreenProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(preselectedPlantId || null);
  const [selectedRange, setSelectedRange] = useState(3);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    if (selectedPlantId) {
      loadDiaries();
    }
  }, [selectedPlantId, selectedRange]);

  const loadPlants = async () => {
    try {
      const data = await getMyPlants();
      setPlants(data);
      if (data.length > 0 && !selectedPlantId) {
        setSelectedPlantId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load plants:', error);
    }
  };

  const loadDiaries = async () => {
    if (!selectedPlantId) return;
    setLoading(true);
    try {
      const data = await getDiaries(selectedPlantId);
      // 过滤有生长数据的日记
      const filtered = data.filter(d => d.height || d.leaf_count);

      // 按时间范围过滤
      if (selectedRange > 0) {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - selectedRange);
        const filteredByDate = filtered.filter(d => new Date(d.created_at) >= cutoff);
        setDiaries(filteredByDate);
      } else {
        setDiaries(filtered);
      }
    } catch (error) {
      console.error('Failed to load diaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlant = plants.find(p => p.id === selectedPlantId);

  // 绘制图表数据
  const chartWidth = Dimensions.get('window').width - spacing.lg * 2 - spacing.md * 2;
  const chartHeight = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const renderHeightChart = () => {
    const dataWithHeight = diaries.filter(d => d.height);
    if (dataWithHeight.length < 2) {
      return <Text style={styles.noData}>暂无足够数据绘制图表</Text>;
    }

    const heights = dataWithHeight.map(d => d.height!);
    const minHeight = Math.min(...heights) - 5;
    const maxHeight = Math.max(...heights) + 5;
    const range = maxHeight - minHeight || 1;

    const xStep = (chartWidth - padding.left - padding.right) / (dataWithHeight.length - 1);
    const yScale = (chartHeight - padding.top - padding.bottom) / range;

    const points = dataWithHeight.map((d, i) => ({
      x: padding.left + i * xStep,
      y: padding.top + (maxHeight - d.height!) * yScale,
      value: d.height,
      date: new Date(d.created_at).toLocaleDateString('zh-CN', { month: 'day' }),
    }));

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <Svg width={chartWidth} height={chartHeight}>
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + (chartHeight - padding.top - padding.bottom) * ratio;
          return <Line key={i} x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke={colors.border} strokeWidth={1} strokeDasharray="4,4" />;
        })}
        {/* 折线 */}
        <Path d={pathData} fill="none" stroke={colors.primary} strokeWidth={2} />
        {/* 数据点 */}
        {points.map((p, i) => (
          <G key={i}>
            <Circle cx={p.x} cy={p.y} r={4} fill={colors.primary} />
            <SvgText x={p.x} y={chartHeight - 5} fontSize={10} fill={colors['text-tertiary']} textAnchor="middle">{p.date}</SvgText>
          </G>
        ))}
        {/* Y轴标签 */}
        <SvgText x={15} y={padding.top + 5} fontSize={10} fill={colors['text-tertiary']}>{maxHeight}</SvgText>
        <SvgText x={15} y={chartHeight - padding.bottom} fontSize={10} fill={colors['text-tertiary']}>{minHeight}</SvgText>
      </Svg>
    );
  };

  const renderLeafChart = () => {
    const dataWithLeaf = diaries.filter(d => d.leaf_count);
    if (dataWithLeaf.length < 2) {
      return <Text style={styles.noData}>暂无足够数据绘制图表</Text>;
    }

    const leafCounts = dataWithLeaf.map(d => d.leaf_count!);
    const maxLeaf = Math.max(...leafCounts);

    const xStep = (chartWidth - padding.left - padding.right) / dataWithLeaf.length;
    const yScale = (chartHeight - padding.top - padding.bottom) / (maxLeaf || 1);

    return (
      <Svg width={chartWidth} height={chartHeight}>
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + (chartHeight - padding.top - padding.bottom) * ratio;
          return <Line key={i} x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke={colors.border} strokeWidth={1} strokeDasharray="4,4" />;
        })}
        {/* 柱状图 */}
        {dataWithLeaf.map((d, i) => {
          const barHeight = d.leaf_count! * yScale;
          const x = padding.left + i * xStep + xStep * 0.2;
          const barWidth = xStep * 0.6;
          return (
            <G key={i}>
              <Rect x={x} y={chartHeight - padding.bottom - barHeight} width={barWidth} height={barHeight} fill={colors.secondary} rx={4} />
              <SvgText x={x + barWidth / 2} y={chartHeight - 5} fontSize={10} fill={colors['text-tertiary']} textAnchor="middle">
                {new Date(d.created_at).toLocaleDateString('zh-CN', { month: 'day' })}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.headerButton}>
          <Icons.ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>生长曲线</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 植物选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择植物</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {plants.map((plant) => (
              <TouchableOpacity
                key={plant.id}
                style={[styles.plantChip, selectedPlantId === plant.id && styles.plantChipActive]}
                onPress={() => setSelectedPlantId(plant.id)}
              >
                <Text style={[styles.plantChipText, selectedPlantId === plant.id && styles.plantChipTextActive]}>
                  {plant.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 时间范围选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>时间范围</Text>
          <View style={styles.rangeSelector}>
            {TIME_RANGES.map((range) => (
              <TouchableOpacity
                key={range.value}
                style={[styles.rangeButton, selectedRange === range.value && styles.rangeButtonActive]}
                onPress={() => setSelectedRange(range.value)}
              >
                <Text style={[styles.rangeButtonText, selectedRange === range.value && styles.rangeButtonTextActive]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <>
            {/* 高度变化 */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>
                <Icons.TrendingUp size={14} color={colors.primary} /> 高度变化 (cm)
              </Text>
              <View style={styles.chart}>
                {renderHeightChart()}
              </View>
            </View>

            {/* 叶片数量 */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>
                <Icons.Leaves size={14} color={colors.secondary} /> 叶片数量
              </Text>
              <View style={styles.chart}>
                {renderLeafChart()}
              </View>
            </View>

            {/* 数据列表 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>记录详情</Text>
.length === 0              {diaries ? (
                <Text style={styles.noData}>暂无生长数据</Text>
              ) : (
                diaries.map((d) => (
                  <View key={d.id} style={styles.dataItem}>
                    <Text style={styles.dataDate}>{new Date(d.created_at).toLocaleDateString()}</Text>
                    <View style={styles.dataValues}>
                      {d.height && <Text style={styles.dataValue}>高度: {d.height}cm</Text>}
                      {d.leaf_count && <Text style={styles.dataValue}>叶片: {d.leaf_count}片</Text>}
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1,
    borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  headerButton: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  content: { flex: 1, padding: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  plantChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20,
    backgroundColor: colors.surface, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  plantChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  plantChipText: { fontSize: 14, color: colors.text },
  plantChipTextActive: { color: '#fff' },
  rangeSelector: { flexDirection: 'row', gap: spacing.sm },
  rangeButton: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: 8, alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  rangeButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rangeButtonText: { fontSize: 14, color: colors['text-secondary'] },
  rangeButtonTextActive: { color: '#fff' },
  loader: { marginTop: spacing.xl * 2 },
  chartSection: { marginBottom: spacing.xl },
  chartTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  chart: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md },
  noData: { textAlign: 'center', color: colors['text-tertiary'], padding: spacing.xl },
  dataItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm,
  },
  dataDate: { fontSize: 14, color: colors.text },
  dataValues: { flexDirection: 'row', gap: spacing.md },
  dataValue: { fontSize: 13, color: colors['text-secondary'] },
});
```

**Step 2: 提交**

```bash
git add APP/src/screens/GrowthCurveScreen.tsx
git commit -m "feat: add GrowthCurveScreen with charts"
```

---

## Task 6: 更新主日记页面连接后端

**Files:**
- Modify: `APP/src/screens/DiaryScreen.tsx`

**Step 1: 更新DiaryScreen连接后端API**

替换现有的 mock 数据部分，改为调用 diaryService：

```typescript
// 关键修改点 - 在组件内添加以下逻辑

// 状态
const [diaries, setDiaries] = useState<Diary[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// 加载日记
useEffect(() => {
  loadDiaries();
}, [selectedTab]);

const loadDiaries = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await getDiaries();
    setDiaries(data);
  } catch (err) {
    setError('加载失败');
    // 降级使用 mock 数据
    setDiaries(mockDiaries);
  } finally {
    setLoading(false);
  }
};

// 处理写日记
const handleWriteDiary = () => {
  onNavigate?.('WriteDiary');
};

// 处理日记点击
const handleDiaryPress = (diary: Diary) => {
  onNavigate?.('DiaryDetail', { diaryId: diary.id });
};

// 处理生长记录点击
const handleGrowthRecordPress = () => {
  onNavigate?.('GrowthCurve', { preselectedPlantId: selectedPlantId });
};
```

**Step 2: 提交**

```bash
git add APP/src/screens/DiaryScreen.tsx
git commit -m "feat: connect DiaryScreen to backend API"
```

---

## Task 7: 更新导航配置

**Files:**
- Modify: `APP/src/navigation/AppNavigator.tsx`

**Step 1: 添加新页面到导航**

在 SubPageName 类型中添加新页面，并在 renderContent 函数中添加路由：

```typescript
// 添加类型
export type SubPageName = ... | 'WriteDiary' | 'DiaryDetail' | 'GrowthCurve' | null;

// 添加导入
import { WriteDiaryScreen } from '../screens/WriteDiaryScreen';
import { DiaryDetailScreen } from '../screens/DiaryDetailScreen';
import { GrowthCurveScreen } from '../screens/GrowthCurveScreen';

// 添加路由
if (currentSubPage === 'WriteDiary') {
  return <WriteDiaryScreen onGoBack={handleGoBack} onNavigate={handleNavigate} />;
}
if (currentSubPage === 'DiaryDetail') {
  return <DiaryDetailScreen onGoBack={handleGoBack} onNavigate={handleNavigate} diaryId={navParams?.diaryId} />;
}
if (currentSubPage === 'GrowthCurve') {
  return <GrowthCurveScreen onGoBack={handleGoBack} onNavigate={handleNavigate} preselectedPlantId={navParams?.preselectedPlantId} />;
}
```

**Step 2: 提交**

```bash
git add APP/src/navigation/AppNavigator.tsx
git commit -m "feat: add diary pages to navigation"
```

---

## Task 8: 验证实现

**Step 1: 运行 TypeScript 检查**

```bash
cd APP
npx tsc --noEmit
```

**Step 2: 测试应用启动**

```bash
cd APP
npm start
```

在另一个终端:
```bash
cd APP
npm run ios
# 或
npm run android
```

**Step 3: 验证功能**

- [ ] 日记列表正常显示后端数据
- [ ] 可以进入写日记页面
- [ ] 可以选择植物、添加图片、填写生长数据
- [ ] 日记详情页正常显示
- [ ] 生长曲线页面可以切换植物和时间范围
- [ ] 图表正确渲染

---

**Plan complete and saved to `docs/plans/2026-03-11-diary-screen-implementation.md`.**

Two execution options:

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
