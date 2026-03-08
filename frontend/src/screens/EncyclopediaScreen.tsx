// 百科/发现屏幕 - 养护百科内容
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, Sun, CloudRain, Snowflake, Flower2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

// 模拟数据
const categories = [
  { id: '1', name: '观叶植物', icon: Flower2, count: 120 },
  { id: '2', name: '多肉植物', icon: Flower2, count: 85 },
  { id: '3', name: '开花植物', icon: Flower2, count: 95 },
  { id: '4', name: '绿植', icon: Flower2, count: 150 },
];

const difficultyLevels = [
  { id: '1', name: '入门级', level: 1, desc: '新手也能养' },
  { id: '2', name: '初级', level: 2, desc: '需要少量养护' },
  { id: '3', name: '中级', level: 3, desc: '需要一定经验' },
  { id: '4', name: '高级', level: 4, desc: '需要专业养护' },
  { id: '5', name: '专家级', level: 5, desc: '挑战你的技术' },
];

// 推荐的热门植物
const popularPlants = [
  { id: '1', name: '绿萝', careLevel: 1, category: '观叶植物' },
  { id: '2', name: '虎皮兰', careLevel: 1, category: '观叶植物' },
  { id: '3', name: '吊兰', careLevel: 1, category: '观叶植物' },
  { id: '4', name: '多肉', careLevel: 2, category: '多肉植物' },
];

export function EncyclopediaScreen() {
  const navigation = useNavigation<any>();

  const handlePlantPress = (plantId: string, plantName: string) => {
    navigation.navigate('EncyclopediaDetail', { plantId, plantName });
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>养护百科</Text>
        <Text style={styles.subtitle}>新手进阶指南</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 搜索栏 */}
        <TouchableOpacity style={styles.searchBar}>
          <Search size={20} color={colors['text-light']} />
          <Text style={styles.searchPlaceholder}>搜索植物名称或养护问题</Text>
        </TouchableOpacity>

        {/* 难度筛选 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>难度等级</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.difficultyRow}>
              {difficultyLevels.map((item) => (
                <TouchableOpacity key={item.id} style={styles.difficultyChip}>
                  <Text style={styles.difficultyText}>{item.name}</Text>
                  <Text style={styles.difficultyDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 分类 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>植物分类</Text>
          <View style={styles.categoryGrid}>
            {categories.map((item) => (
              <TouchableOpacity key={item.id} style={styles.categoryCard}>
                <item.icon size={32} color={colors.secondary} />
                <Text style={styles.categoryName}>{item.name}</Text>
                <Text style={styles.categoryCount}>{item.count} 种</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 热门植物 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>热门植物</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.plantsRow}>
              {popularPlants.map((plant) => (
                <TouchableOpacity
                  key={plant.id}
                  style={styles.plantCard}
                  onPress={() => handlePlantPress(plant.id, plant.name)}
                >
                  <View style={styles.plantImage}>
                    <Text style={styles.plantEmoji}>🌿</Text>
                  </View>
                  <Text style={styles.plantName}>{plant.name}</Text>
                  <View style={styles.plantMeta}>
                    <Text style={styles.plantCategory}>{plant.category}</Text>
                    <View style={styles.plantLevel}>
                      {Array.from({ length: plant.careLevel }, (_, i) => (
                        <Text key={i} style={styles.star}>★</Text>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 环境指标说明 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>养护图标说明</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <Sun size={24} color={colors.warning} />
              <Text style={styles.legendText}>喜阳</Text>
            </View>
            <View style={styles.legendItem}>
              <CloudRain size={24} color={colors.primary} />
              <Text style={styles.legendText}>喜湿</Text>
            </View>
            <View style={styles.legendItem}>
              <Snowflake size={24} color={colors['text-light']} />
              <Text style={styles.legendText}>耐寒</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: fontSize.sm,
    color: colors['text-light'],
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  difficultyChip: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 100,
  },
  difficultyText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  difficultyDesc: {
    fontSize: fontSize.xs,
    color: colors['text-secondary'],
    marginTop: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  categoryName: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.sm,
  },
  categoryCount: {
    fontSize: fontSize.xs,
    color: colors['text-secondary'],
  },
  legendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
  plantsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  plantCard: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  plantImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantEmoji: {
    fontSize: 40,
  },
  plantName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  plantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  plantCategory: {
    fontSize: fontSize.xs,
    color: colors['text-secondary'],
  },
  plantLevel: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 10,
    color: colors.warning,
  },
});
