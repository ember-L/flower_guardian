// 写日记页面 - 美化版（保持原配色）
import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Text,
  TextInput, Image, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, shadows, fontSize, fontWeight } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { createDiary, getMyPlants, uploadDiaryImages, Plant } from '../services/diaryService';

interface WriteDiaryScreenProps extends Partial<NavigationProps> {
  editDiaryId?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 12;
const IMAGE_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP * 2) / 3;

export function WriteDiaryScreen({ onGoBack, onNavigate, editDiaryId, isLoggedIn, onRequireLogin }: WriteDiaryScreenProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [height, setHeight] = useState('');
  const [leafCount, setLeafCount] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn && onRequireLogin) {
      onRequireLogin();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      loadPlants();
    }
  }, [isLoggedIn]);

  const loadPlants = async () => {
    if (!isLoggedIn) return;
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
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('权限不足', '需要相机权限');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
          if (result.assets && result.assets[0]?.uri) {
            setImages([...images, result.assets[0].uri]);
          }
        },
      },
      {
        text: '相册',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('权限不足', '需要相册权限');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsMultipleSelection: true, selectionLimit: 9 - images.length });
          if (result.assets) {
            const newImages = result.assets.map(a => a.uri).filter(Boolean) as string[];
            setImages([...images, ...newImages].slice(0, 9));
          }
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
      // 先上传所有图片到服务器，获得服务器 URL
      let serverImageUrls: string[] = [];
      if (images.length > 0) {
        console.log('[WriteDiary] 开始上传', images.length, '张图片');
        serverImageUrls = await uploadDiaryImages(images);
        console.log('[WriteDiary] 图片上传完成，获得 URL:', serverImageUrls);
      }

      // 使用服务器 URL 创建日记
      await createDiary({
        user_plant_id: selectedPlantId,
        content: content.trim(),
        images: serverImageUrls.length > 0 ? serverImageUrls : undefined,
        height: height ? parseInt(height, 10) : undefined,
        leaf_count: leafCount ? parseInt(leafCount, 10) : undefined,
      });
      Alert.alert('成功', '日记保存成功', [
        { text: '确定', onPress: () => onGoBack?.() }
      ]);
    } catch (error) {
      console.error('[WriteDiary] 保存日记失败:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 - 渐变设计 */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.closeButton} activeOpacity={0.7}>
            <Icons.X size={22} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerIconBadge}>
              <Icons.Sprout size={18} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>记录生长</Text>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.saveButtonText}>保存</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* 植物选择 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <Icons.Sprout size={16} color={colors.white} />
            </View>
            <Text style={styles.sectionTitle}>选择植物</Text>
          </View>

          {plants.length === 0 ? (
            <TouchableOpacity style={styles.emptyCard} onPress={() => onNavigate?.('Garden')} activeOpacity={0.7}>
              <View style={styles.emptyIconWrap}>
                <Icons.Plus size={24} color={colors.primary} />
              </View>
              <View style={styles.emptyContent}>
                <Text style={styles.emptyTitle}>还没有植物</Text>
                <Text style={styles.emptyDesc}>点击添加你的第一株植物</Text>
              </View>
              <Icons.ChevronRight size={20} color={colors['text-tertiary']} />
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plantScroll}>
              {plants.map((plant) => (
                <TouchableOpacity
                  key={plant.id}
                  style={[
                    styles.plantChip,
                    selectedPlantId === plant.id && styles.plantChipActive
                  ]}
                  onPress={() => setSelectedPlantId(plant.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.plantChipIcon,
                    selectedPlantId === plant.id && styles.plantChipIconActive
                  ]}>
                    <Icons.Leaf size={12} color={selectedPlantId === plant.id ? colors.white : colors.secondary} />
                  </View>
                  <Text style={[
                    styles.plantChipText,
                    selectedPlantId === plant.id && styles.plantChipTextActive
                  ]}>
                    {plant.name || plant.nickname || '植物'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 图片区域 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.accent }]}>
              <Icons.Image size={16} color={colors.white} />
            </View>
            <Text style={styles.sectionTitle}>拍照记录</Text>
            <Text style={styles.imageCount}>{images.length}/9</Text>
          </View>

          <View style={styles.imageGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                {uri ? (
                  <Image source={{ uri }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]} />
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveImage(index)}
                  activeOpacity={0.7}
                >
                  <Icons.X size={12} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 9 && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddImage} activeOpacity={0.7}>
                <View style={styles.addIconWrap}>
                  <Icons.Camera size={28} color={colors.primary} />
                </View>
                <Text style={styles.addText}>添加照片</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 生长数据 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.secondary }]}>
              <Icons.TrendingUp size={16} color={colors.white} />
            </View>
            <Text style={styles.sectionTitle}>生长数据</Text>
            <Text style={styles.optionalTag}>选填</Text>
          </View>

          <View style={styles.growthRow}>
            <View style={styles.growthCard}>
              <View style={styles.growthLabelRow}>
                <View style={[styles.growthIconBox, { backgroundColor: colors.accentLight }]}>
                  <Icons.Edit3 size={14} color={colors.accent} />
                </View>
                <Text style={styles.growthLabel}>株高</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.growthInput}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="0"
                  placeholderTextColor={colors['text-tertiary']}
                  keyboardType="numeric"
                />
                <Text style={styles.growthUnit}>cm</Text>
              </View>
            </View>

            <View style={styles.growthCard}>
              <View style={styles.growthLabelRow}>
                <View style={[styles.growthIconBox, { backgroundColor: colors.secondaryLight }]}>
                  <Icons.Leaf size={14} color={colors.secondary} />
                </View>
                <Text style={styles.growthLabel}>叶片数</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.growthInput}
                  value={leafCount}
                  onChangeText={setLeafCount}
                  placeholder="0"
                  placeholderTextColor={colors['text-tertiary']}
                  keyboardType="numeric"
                />
                <Text style={styles.growthUnit}>片</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 养护笔记 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.primaryDark }]}>
              <Icons.Edit3 size={16} color={colors.white} />
            </View>
            <Text style={styles.sectionTitle}>养护笔记</Text>
            <Text style={styles.optionalTag}>选填</Text>
          </View>

          <View style={styles.textAreaWrap}>
            <TextInput
              style={styles.textArea}
              value={content}
              onChangeText={setContent}
              placeholder="记录今天的养护心得、观察发现..."
              placeholderTextColor={colors['text-tertiary']}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <View style={styles.charCountWrap}>
              <View style={styles.charCountLeft}>
                <Icons.MessageCircle size={12} color={colors['text-tertiary']} />
                <Text style={styles.charCount}>{content.length}/500</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 底部装饰 */}
        <View style={styles.decoration}>
          <View style={styles.decorationLine} />
          <View style={styles.decorationIcon}>
            <Icons.Flower2 size={18} color={colors.primary} />
          </View>
          <View style={styles.decorationLine} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 头部 - 渐变设计
  headerGradient: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing.xs,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  saveButtonText: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },

  // 内容区
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  optionalTag: {
    fontSize: fontSize.xs,
    color: colors['text-tertiary'],
    marginLeft: spacing.sm,
  },
  imageCount: {
    fontSize: fontSize.xs,
    color: colors['text-tertiary'],
    marginLeft: 'auto',
  },

  // 植物选择
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  emptyDesc: {
    fontSize: fontSize.sm,
    color: colors['text-tertiary'],
    marginTop: 2,
  },
  plantScroll: {
    paddingRight: spacing.lg,
  },
  plantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  plantChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  plantChipIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.secondaryLight + '60',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  plantChipIconActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  plantChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  plantChipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },

  // 图片网格
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: -GRID_GAP,
  },
  imageWrapper: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    marginRight: GRID_GAP,
    marginBottom: GRID_GAP,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: colors.background,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  addIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  addText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },

  // 生长数据
  growthRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  growthCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  growthLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  growthIconBox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  growthLabel: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    fontWeight: fontWeight.medium,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthInput: {
    flex: 1,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    padding: 0,
  },
  growthUnit: {
    fontSize: fontSize.sm,
    color: colors['text-tertiary'],
    marginLeft: spacing.xs,
  },

  // 文字内容
  textAreaWrap: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  textArea: {
    padding: spacing.lg,
    fontSize: fontSize.md,
    minHeight: 150,
    color: colors.text,
    lineHeight: fontSize.md * 1.6,
  },
  charCountWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  charCountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors['text-tertiary'],
    marginLeft: spacing.xs,
  },

  // 底部装饰
  decoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  decorationLine: {
    height: 1,
    width: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  decorationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomSpacer: {
    height: spacing.xxl,
  },
});