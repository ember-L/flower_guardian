// 百科/发现屏幕 - 使用纯 StyleSheet
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { getPlants, getPlantCategories, getPopularPlants, Plant, PlantCategory } from '../services/plantService';

interface EncyclopediaScreenProps extends Partial<NavigationProps> {}

const difficultyLevels = [
  { id: '1', name: '入门级', color: colors.success, value: 1 },
  { id: '2', name: '初级', color: '#8bc34a', value: 2 },
  { id: '3', name: '中级', color: colors.warning, value: 3 },
  { id: '4', name: '高级', color: '#ff9800', value: 4 },
  { id: '5', name: '专家级', color: colors.error, value: 5 },
];

const pitfallsData = [
  { id: '1', title: '浇水过多', desc: '80%的植物死于浇水过多' },
  { id: '2', title: '光照不当', desc: '喜阳植物放室内会徒长' },
  { id: '3', title: '施肥过度', desc: '薄肥勤施，切忌浓肥' },
];

export function EncyclopediaScreen({ onNavigate, currentTab, onTabChange }: EncyclopediaScreenProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [categories, setCategories] = useState<PlantCategory[]>([]);
  const [popularPlants, setPopularPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
    if (level) {
      loadPlants({ care_level: level });
    } else {
      loadPlants();
    }
  };

  const getDifficultyName = (level?: number) => {
    if (!level) return '入门级';
    const diff = difficultyLevels.find(d => d.value === level);
    return diff?.name || '入门级';
  };

  const getDifficultyColor = (level?: number) => {
    if (!level) return colors.success;
    const diff = difficultyLevels.find(d => d.value === level);
    return diff?.color || colors.success;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>养护百科</Text>
          <Text style={styles.headerSubtitle}>新手进阶指南</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 搜索栏 */}
          <View style={styles.searchContainer}>
            <View style={styles.searchIcon}>
              <Icons.Search size={18} color={colors.primary} />
            </View>
            <TextInput
              placeholder="搜索植物名称或养护问题"
              placeholderTextColor={colors['text-tertiary']}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          {/* 难度筛选 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>难度等级</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.difficultyRow}>
                <TouchableOpacity
                  style={[styles.difficultyChip, { borderColor: colors.primary }]}
                  activeOpacity={0.7}
                  onPress={() => handleDifficultyPress()}
                >
                  <Text style={[styles.difficultyChipText, { color: colors.primary }]}>全部</Text>
                </TouchableOpacity>
                {difficultyLevels.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.difficultyChip, { borderColor: item.color }]}
                    activeOpacity={0.7}
                    onPress={() => handleDifficultyPress(item.value)}
                  >
                    <Text style={[styles.difficultyChipText, { color: item.color }]}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* 分类 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>植物分类</Text>
            <View style={styles.categoryGrid}>
              <TouchableOpacity
                style={[styles.categoryCard, selectedCategory === null && styles.categoryCardSelected]}
                activeOpacity={0.7}
                onPress={handleAllCategoryPress}
              >
                <View style={styles.categoryIcon}>
                  <Icons.Leaf size={28} color={colors.secondary} />
                </View>
                <Text style={styles.categoryName}>全部</Text>
              </TouchableOpacity>
              {categories.map((item) => {
                const iconMap: Record<string, any> = {
                  'leaf': Icons.Leaf,
                  'sprout': Icons.Leaf,
                  'flower2': Icons.Flower2,
                  'tree': Icons.Leaf,
                };
                const CategoryIcon = iconMap[item.icon] || Icons.Leaf;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.categoryCard, selectedCategory === item.value && styles.categoryCardSelected]}
                    activeOpacity={0.7}
                    onPress={() => handleCategoryPress(item.value)}
                  >
                    <View style={styles.categoryIcon}>
                      <CategoryIcon size={28} color={colors.secondary} />
                    </View>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <Text style={styles.categoryCount}>{item.count} 种</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 热门植物 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>热门植物</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
            ) : popularPlants.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.plantsRow}>
                  {popularPlants.slice(0, 10).map((plant) => (
                    <TouchableOpacity
                      key={plant.id}
                      style={styles.plantCard}
                      activeOpacity={0.7}
                      onPress={() => handlePlantPress(plant)}
                    >
                      <View style={styles.plantImage}>
                        <Icons.Leaf size={36} color={colors.secondary} />
                      </View>
                      <Text style={styles.plantName}>{plant.name}</Text>
                      <View style={styles.plantMeta}>
                        <Text style={styles.plantCategory}>{plant.category || '室内'}</Text>
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(plant.care_level) + '20' }]}>
                          <Text style={[styles.difficultyText, { color: getDifficultyColor(plant.care_level) }]}>
                            {getDifficultyName(plant.care_level)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>暂无植物数据</Text>
            )}
          </View>

          {/* 养护图标说明 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>养护图标说明</Text>
            <View style={styles.legendCard}>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={styles.legendIcon}>
                    <Icons.Sun size={20} color={colors.warning} />
                  </View>
                  <Text style={styles.legendText}>喜阳</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIcon, { backgroundColor: colors.info + '15' }]}>
                    <Icons.CloudRain size={20} color={colors.info} />
                  </View>
                  <Text style={styles.legendText}>喜湿</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIcon, { backgroundColor: colors.info + '15' }]}>
                    <Icons.Snowflake size={20} color={colors.info} />
                  </View>
                  <Text style={styles.legendText}>耐寒</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 避坑指南 */}
          <View style={[styles.section, styles.lastSection]}>
            <View style={styles.pitfallHeader}>
              <Icons.AlertTriangle size={18} color={colors.error} />
              <Text style={styles.pitfallTitle}>避坑指南</Text>
            </View>
            <Text style={styles.pitfallSubtitle}>新手必看，这些坑不要踩</Text>
            <View style={styles.pitfallsList}>
              {pitfallsData.map((pitfall) => (
                <View key={pitfall.id} style={styles.pitfallCard}>
                  <View style={styles.pitfallIcon}>
                    <Text style={styles.pitfallNumber}>{pitfall.id}</Text>
                  </View>
                  <View style={styles.pitfallContent}>
                    <Text style={styles.pitfallItemTitle}>{pitfall.title}</Text>
                    <Text style={styles.pitfallItemDesc}>{pitfall.desc}</Text>
                  </View>
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
  headerGradient: { backgroundColor: colors.primary, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl * 1.5, paddingBottom: spacing.lg },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs, fontWeight: '500' },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 24, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginHorizontal: spacing.lg, marginTop: -spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  searchIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 15, color: colors.text },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  difficultyRow: { flexDirection: 'row', gap: spacing.sm },
  difficultyChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderRadius: 20 },
  difficultyChipText: { fontSize: 14, fontWeight: '500' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  categoryCard: { width: '47%', backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  categoryCardSelected: { borderWidth: 2, borderColor: colors.primary },
  categoryIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  categoryName: { fontSize: 15, fontWeight: '500', color: colors.text },
  categoryCount: { fontSize: 13, color: colors['text-tertiary'] },
  plantsRow: { flexDirection: 'row', gap: spacing.md },
  plantCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.sm, width: 112, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  plantImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.success + '15', alignItems: 'center', justifyContent: 'center' },
  plantName: { fontSize: 15, fontWeight: '500', color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  plantMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  plantCategory: { fontSize: 12, color: colors['text-tertiary'] },
  difficultyBadge: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6 },
  difficultyText: { fontSize: 10, fontWeight: '600' },
  loading: { padding: spacing.xl },
  emptyText: { textAlign: 'center', color: colors['text-tertiary'], padding: spacing.xl },
  legendCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { alignItems: 'center' },
  legendIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.warning + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  legendText: { fontSize: 13, color: colors['text-tertiary'] },
  pitfallHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  pitfallTitle: { fontSize: 18, fontWeight: '600', color: colors.error },
  pitfallSubtitle: { fontSize: 14, color: colors['text-secondary'], marginBottom: spacing.md },
  pitfallsList: { gap: spacing.sm },
  pitfallCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1, borderLeftWidth: 3, borderLeftColor: colors.error },
  pitfallIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.error + '15', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  pitfallNumber: { color: colors.error, fontWeight: 'bold', fontSize: 14 },
  pitfallContent: { flex: 1 },
  pitfallItemTitle: { fontSize: 15, fontWeight: '500', color: colors.text },
  pitfallItemDesc: { fontSize: 13, color: colors['text-tertiary'] },
  lastSection: { marginBottom: spacing.xxl * 2 },
});
