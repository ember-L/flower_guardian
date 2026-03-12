// 百科/发现屏幕 - 现代化设计
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, TextInput, ActivityIndicator, Alert, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, shadows, fontSize, fontWeight } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { getPlants, getPlantCategories, getPopularPlants, Plant, PlantCategory } from '../services/plantService';

interface EncyclopediaScreenProps extends Partial<NavigationProps> {}

const difficultyLevels = [
  { id: '1', name: '入门', color: colors.success, value: 1 },
  { id: '2', name: '初级', color: '#8bc34a', value: 2 },
  { id: '3', name: '中级', color: colors.warning, value: 3 },
  { id: '4', name: '高级', color: '#ff9800', value: 4 },
  { id: '5', name: '专家', color: colors.error, value: 5 },
];

const pitfallsData = [
  { id: '1', title: '浇水过多', desc: '80%的植物死于浇水过多', icon: 'Droplets' },
  { id: '2', title: '光照不当', desc: '喜阳植物放室内会徒长', icon: 'Sun' },
  { id: '3', title: '施肥过度', desc: '薄肥勤施，切忌浓肥', icon: 'Sparkles' },
];

const CATEGORY_ICONS: Record<string, any> = {
  'leaf': Icons.Leaf,
  'sprout': Icons.Sprout,
  'flower2': Icons.Flower2,
  'tree': Icons.Plant,
  'cactus': Icons.Plant,
  'default': Icons.Leaf,
};

export function EncyclopediaScreen({ onNavigate, currentTab, onTabChange }: EncyclopediaScreenProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [categories, setCategories] = useState<PlantCategory[]>([]);
  const [popularPlants, setPopularPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [plantsData, categoriesData, popularData] = await Promise.all([
        getPlants({ limit: 20 }),
        getPlantCategories(),
        getPopularPlants(10),
      ]);
      setPlants(plantsData.items);
      setCategories(categoriesData.categories || []);
      setPopularPlants(popularData.items || []);
    } catch (error: any) {
      console.error('加载数据失败:', error);
      const errorMsg = error.response?.data?.detail || error.message || '网络错误';
      Alert.alert('加载失败', `无法获取数据: ${errorMsg}\n\n请检查后端服务是否启动`);
    } finally {
      setLoading(false);
    }
  };

  const loadPlants = async (params?: { category?: string; care_level?: number; search?: string }) => {
    setLoading(true);
    try {
      const data = await getPlants({ limit: 20, ...params });
      setPlants(data.items);
    } catch (error: any) {
      console.error('加载植物数据失败', error);
      Alert.alert('加载失败', `无法获取植物列表: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      loadPlants({ search: searchText.trim() });
    } else {
      loadPlants();
    }
  };

  const handleCategoryPress = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    loadPlants({ category: categoryValue });
  };

  const handleAllCategoryPress = () => {
    setSelectedCategory(null);
    loadPlants();
  };

  const handlePlantPress = (plant: Plant) => {
    if (onNavigate) {
      onNavigate('EncyclopediaDetail', { plantId: plant.id });
    }
  };

  const handleDifficultyPress = (level?: number) => {
    setSelectedDifficulty(level ?? null);
    if (level) {
      loadPlants({ care_level: level });
    } else {
      loadPlants();
    }
  };

  const getDifficultyName = (level?: number) => {
    if (!level) return '入门';
    const diff = difficultyLevels.find(d => d.value === level);
    return diff?.name || '入门';
  };

  const getDifficultyColor = (level?: number) => {
    if (!level) return colors.success;
    const diff = difficultyLevels.find(d => d.value === level);
    return diff?.color || colors.success;
  };

  const renderCategoryIcon = (iconKey?: string, isSelected?: boolean) => {
    const IconComponent = CATEGORY_ICONS[iconKey || ''] || CATEGORY_ICONS.default;
    return <IconComponent size={24} color={isSelected ? colors.white : colors.secondary} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 - 渐变背景 */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Icons.BookOpen size={24} color={colors.white} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>养护百科</Text>
              <Text style={styles.headerSubtitle}>探索植物的奇妙世界</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.content}>
          {/* 搜索栏 - 浮动卡片 */}
          <View style={styles.searchContainer}>
            <View style={styles.searchIconWrapper}>
              <Icons.Search size={20} color={colors.primary} />
            </View>
            <TextInput
              placeholder="搜索植物名称或养护问题..."
              placeholderTextColor={colors['text-tertiary']}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                <Icons.X size={18} color={colors['text-tertiary']} />
              </TouchableOpacity>
            )}
          </View>

          {/* 难度筛选 - 水平滚动 */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Icons.Activity size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>难度筛选</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.difficultyContainer}>
              <TouchableOpacity
                style={[
                  styles.difficultyChip,
                  selectedDifficulty === null && styles.difficultyChipActive
                ]}
                activeOpacity={0.7}
                onPress={() => handleDifficultyPress()}
              >
                <Text style={[
                  styles.difficultyChipText,
                  selectedDifficulty === null && styles.difficultyChipTextActive
                ]}>全部</Text>
              </TouchableOpacity>
              {difficultyLevels.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.difficultyChip,
                    selectedDifficulty === item.value && { backgroundColor: item.color, borderColor: item.color }
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleDifficultyPress(item.value)}
                >
                  <View style={[styles.difficultyDot, { backgroundColor: item.color }]} />
                  <Text style={[
                    styles.difficultyChipText,
                    selectedDifficulty === item.value && styles.difficultyChipTextActive
                  ]}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 分类 - 网格布局 */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Icons.Grid size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>植物分类</Text>
            </View>
            <View style={styles.categoryGrid}>
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  selectedCategory === null && styles.categoryCardSelected
                ]}
                activeOpacity={0.8}
                onPress={handleAllCategoryPress}
              >
                <View style={[
                  styles.categoryIconWrapper,
                  selectedCategory === null && styles.categoryIconWrapperActive
                ]}>
                  <Icons.Grid size={24} color={selectedCategory === null ? colors.white : colors.secondary} />
                </View>
                <Text style={[
                  styles.categoryName,
                  selectedCategory === null && styles.categoryNameActive
                ]}>全部</Text>
                <Text style={styles.categoryCount}>{categories.reduce((sum, c) => sum + c.count, 0)} 种</Text>
              </TouchableOpacity>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.categoryCard,
                    selectedCategory === item.value && styles.categoryCardSelected
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleCategoryPress(item.value)}
                >
                  <View style={[
                    styles.categoryIconWrapper,
                    selectedCategory === item.value && styles.categoryIconWrapperActive
                  ]}>
                    {renderCategoryIcon(item.icon, selectedCategory === item.value)}
                  </View>
                  <Text style={[
                    styles.categoryName,
                    selectedCategory === item.value && styles.categoryNameActive
                  ]}>{item.name}</Text>
                  <Text style={styles.categoryCount}>{item.count} 种</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
            </View>
          )}

          {/* 热门植物 - 横向滚动 */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Icons.Star size={18} color={colors.accent} />
              <Text style={styles.sectionTitle}>热门植物</Text>
              <View style={styles.hotBadge}>
                <Icons.TrendingUp size={12} color={colors.white} />
                <Text style={styles.hotBadgeText}>TOP 10</Text>
              </View>
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : popularPlants.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plantsScrollContent}>
                {popularPlants.slice(0, 10).map((plant, index) => (
                  <TouchableOpacity
                    key={plant.id}
                    style={styles.plantCard}
                    activeOpacity={0.8}
                    onPress={() => handlePlantPress(plant)}
                  >
                    <View style={styles.plantCardRank}>
                      <Text style={styles.plantRankText}>#{index + 1}</Text>
                    </View>
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
                      <Text style={styles.plantCategory}>{plant.category || '室内植物'}</Text>
                      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(plant.care_level) + '20' }]}>
                        <Text style={[styles.difficultyText, { color: getDifficultyColor(plant.care_level) }]}>
                          {getDifficultyName(plant.care_level)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Icons.FileText size={48} color={colors['text-tertiary']} />
                <Text style={styles.emptyText}>暂无植物数据</Text>
              </View>
            )}
          </View>

          {/* 养护图标说明 */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Icons.Info size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>养护图标说明</Text>
            </View>
            <View style={styles.legendCard}>
              <View style={styles.legendGrid}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Icons.Sun size={22} color={colors.warning} />
                  </View>
                  <Text style={styles.legendLabel}>喜阳</Text>
                  <Text style={styles.legendDesc}>喜充足光照</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIcon, { backgroundColor: colors.info + '20' }]}>
                    <Icons.CloudRain size={22} color={colors.info} />
                  </View>
                  <Text style={styles.legendLabel}>喜湿</Text>
                  <Text style={styles.legendDesc}>喜湿润环境</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIcon, { backgroundColor: colors.secondary + '20' }]}>
                    <Icons.Thermometer size={22} color={colors.secondary} />
                  </View>
                  <Text style={styles.legendLabel}>耐寒</Text>
                  <Text style={styles.legendDesc}>耐低温</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIcon, { backgroundColor: colors.error + '20' }]}>
                    <Icons.AlertCircle size={22} color={colors.error} />
                  </View>
                  <Text style={styles.legendLabel}>有毒</Text>
                  <Text style={styles.legendDesc}>需注意安全</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 避坑指南 */}
          <View style={[styles.section, styles.lastSection]}>
            <View style={styles.pitfallHeader}>
              <View style={styles.pitfallHeaderIcon}>
                <Icons.AlertTriangle size={20} color={colors.white} />
              </View>
              <View>
                <Text style={styles.pitfallTitle}>避坑指南</Text>
                <Text style={styles.pitfallSubtitle}>新手必看，这些坑不要踩</Text>
              </View>
            </View>
            <View style={styles.pitfallsList}>
              {pitfallsData.map((pitfall, index) => (
                <View key={pitfall.id} style={styles.pitfallCard}>
                  <View style={styles.pitfallNumberBadge}>
                    <Text style={styles.pitfallNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.pitfallContent}>
                    <Text style={styles.pitfallItemTitle}>{pitfall.title}</Text>
                    <Text style={styles.pitfallItemDesc}>{pitfall.desc}</Text>
                  </View>
                  <Icons.ChevronRight size={18} color={colors['text-tertiary']} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  // Header - 渐变设计
  headerGradient: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  content: { paddingTop: spacing.md, paddingBottom: spacing.xxl * 2 },
  // 搜索栏 - 浮动卡片
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    ...shadows.md,
  },
  searchIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },
  // Section
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  // 难度筛选
  difficultyContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  difficultyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  difficultyChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  difficultyChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors['text-secondary'],
  },
  difficultyChipTextActive: {
    color: colors.white,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // 分类网格 - 一行三列
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '31%',
    minWidth: 90,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  categoryCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  categoryIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryIconWrapperActive: {
    backgroundColor: colors.primary,
  },
  categoryName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
  },
  categoryNameActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  categoryCount: {
    fontSize: fontSize.xs,
    color: colors['text-tertiary'],
    marginTop: 2,
  },
  // 热门植物
  plantsScrollContent: {
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  plantCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    width: 130,
    ...shadows.sm,
    alignItems: 'center',
  },
  plantCardRank: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    zIndex: 1,
  },
  plantRankText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  plantImageContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  plantImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  plantMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  plantCategory: {
    fontSize: fontSize.xs,
    color: colors['text-tertiary'],
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: fontWeight.semibold,
  },
  // Loading & Empty
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors['text-tertiary'],
    marginTop: spacing.md,
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: 'auto',
    gap: 2,
  },
  hotBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  // 分类植物列表
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
  // 图标说明
  legendCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  legendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  legendLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  legendDesc: {
    fontSize: fontSize.xs,
    color: colors['text-tertiary'],
    marginTop: 2,
  },
  // 避坑指南
  pitfallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pitfallHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pitfallTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  pitfallSubtitle: {
    fontSize: fontSize.sm,
    color: colors['text-tertiary'],
  },
  pitfallsList: {
    gap: spacing.md,
  },
  pitfallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  pitfallNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pitfallNumber: {
    color: colors.error,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },
  pitfallContent: {
    flex: 1,
  },
  pitfallItemTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  pitfallItemDesc: {
    fontSize: fontSize.sm,
    color: colors['text-tertiary'],
    marginTop: 2,
  },
  lastSection: {
    marginBottom: spacing.xxl * 2,
  },
});
