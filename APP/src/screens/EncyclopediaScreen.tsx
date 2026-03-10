// 百科/发现屏幕 - 使用纯 StyleSheet
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface EncyclopediaScreenProps extends Partial<NavigationProps> {}

const categories = [
  { id: '1', name: '观叶植物', icon: 'leaf', count: 120 },
  { id: '2', name: '多肉植物', icon: 'sprout', count: 85 },
  { id: '3', name: '开花植物', icon: 'flower2', count: 95 },
  { id: '4', name: '绿植', icon: 'tree', count: 150 },
];

const difficultyLevels = [
  { id: '1', name: '入门级', color: colors.success },
  { id: '2', name: '初级', color: '#8bc34a' },
  { id: '3', name: '中级', color: colors.warning },
  { id: '4', name: '高级', color: '#ff9800' },
  { id: '5', name: '专家级', color: colors.error },
];

const pitfallsData = [
  { id: '1', title: '浇水过多', desc: '80%的植物死于浇水过多' },
  { id: '2', title: '光照不当', desc: '喜阳植物放室内会徒长' },
  { id: '3', title: '施肥过度', desc: '薄肥勤施，切忌浓肥' },
];

const popularPlants = [
  { id: '1', name: '绿萝', careLevel: 1, category: '观叶植物' },
  { id: '2', name: '虎皮兰', careLevel: 1, category: '观叶植物' },
  { id: '3', name: '吊兰', careLevel: 1, category: '观叶植物' },
  { id: '4', name: '多肉', careLevel: 2, category: '多肉植物' },
];

export function EncyclopediaScreen({ onNavigate, currentTab, onTabChange }: EncyclopediaScreenProps) {
  const handlePlantPress = () => {
    if (onNavigate) {
      onNavigate('EncyclopediaDetail');
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>养护百科</Text>
        <Text style={styles.headerSubtitle}>新手进阶指南</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 搜索栏 */}
          <View style={styles.searchContainer}>
            <Icons.Search size={18} color={colors['text-tertiary']} />
            <TextInput placeholder="搜索植物名称或养护问题" placeholderTextColor={colors['text-tertiary']} style={styles.searchInput} />
          </View>

          {/* 难度筛选 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>难度等级</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.difficultyRow}>
                {difficultyLevels.map((item) => (
                  <TouchableOpacity key={item.id} style={[styles.difficultyChip, { borderColor: item.color }]} activeOpacity={0.7}>
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
              {categories.map((item) => {
                const CategoryIcon = Icons[item.icon as keyof typeof Icons] || Icons.Leaf;
                return (
                  <TouchableOpacity key={item.id} style={styles.categoryCard} activeOpacity={0.7} onPress={handlePlantPress}>
                    <View style={styles.categoryIcon}><CategoryIcon size={28} color={colors.secondary} /></View>
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
              <TouchableOpacity style={styles.viewAllButton} activeOpacity={0.7}>
                <Text style={styles.viewAllText}>查看全部</Text>
                <Icons.ChevronRight size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.plantsRow}>
                {popularPlants.map((plant) => (
                  <TouchableOpacity key={plant.id} style={styles.plantCard} activeOpacity={0.7} onPress={handlePlantPress}>
                    <View style={styles.plantImage}><Icons.Leaf size={36} color={colors.secondary} /></View>
                    <Text style={styles.plantName}>{plant.name}</Text>
                    <View style={styles.plantMeta}>
                      <Text style={styles.plantCategory}>{plant.category}</Text>
                      <Icons.Star size={12} color={colors.warning} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* 养护图标说明 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>养护图标说明</Text>
            <View style={styles.legendCard}>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}><View style={styles.legendIcon}><Icons.Sun size={20} color={colors.warning} /></View><Text style={styles.legendText}>喜阳</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendIcon, { backgroundColor: colors.info + '15' }]}><Icons.CloudRain size={20} color={colors.info} /></View><Text style={styles.legendText}>喜湿</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendIcon, { backgroundColor: colors.info + '15' }]}><Icons.Snowflake size={20} color={colors.info} /></View><Text style={styles.legendText}>耐寒</Text></View>
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
                  <View style={styles.pitfallIcon}><Text style={styles.pitfallNumber}>{pitfall.id}</Text></View>
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
  header: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: spacing.xl * 1.5, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 15, color: colors.text },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  viewAllButton: { flexDirection: 'row', alignItems: 'center' },
  viewAllText: { color: colors.primary, fontSize: 14, marginRight: spacing.xs },
  difficultyRow: { flexDirection: 'row', gap: spacing.sm },
  difficultyChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderRadius: 20 },
  difficultyChipText: { fontSize: 14, fontWeight: '500' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  categoryCard: { width: '47%', backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  categoryIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  categoryEmoji: { fontSize: 28 },
  categoryName: { fontSize: 15, fontWeight: '500', color: colors.text },
  categoryCount: { fontSize: 13, color: colors['text-tertiary'] },
  plantsRow: { flexDirection: 'row', gap: spacing.md },
  plantCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.sm, width: 112, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  plantImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.success + '15', alignItems: 'center', justifyContent: 'center' },
  plantEmoji: { fontSize: 36 },
  plantName: { fontSize: 15, fontWeight: '500', color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  plantMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  plantCategory: { fontSize: 12, color: colors['text-tertiary'] },
  plantStars: { color: colors.warning, fontSize: 12 },
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
