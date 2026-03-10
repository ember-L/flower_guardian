// 百科/发现屏幕 - 养护百科内容 - UI Kitten 组件
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Input,
  Card,
  Text,
  Button,
  Layout,
  useTheme,
} from '@ui-kitten/components';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, fontSize, shadows, touchTarget } from '../constants/theme';

// 模拟数据
const categories = [
  { id: '1', name: '观叶植物', icon: '🌿', count: 120 },
  { id: '2', name: '多肉植物', icon: '🪴', count: 85 },
  { id: '3', name: '开花植物', icon: '🌸', count: 95 },
  { id: '4', name: '绿植', icon: '🎋', count: 150 },
];

const difficultyLevels = [
  { id: '1', name: '入门级', level: 1, desc: '新手也能养', color: colors.secondary },
  { id: '2', name: '初级', level: 2, desc: '需要少量养护', color: '#8bc34a' },
  { id: '3', name: '中级', level: 3, desc: '需要一定经验', color: colors.warning },
  { id: '4', name: '高级', level: 4, desc: '需要专业养护', color: '#ff9800' },
  { id: '5', name: '专家级', level: 5, desc: '挑战你的技术', color: colors.error },
];

// 避坑指南数据
const pitfallsData = [
  { id: '1', title: '浇水过多', desc: '80%的植物死于浇水过多' },
  { id: '2', title: '光照不当', desc: '喜阳植物放室内会徒长' },
  { id: '3', title: '施肥过度', desc: '薄肥勤施，切忌浓肥' },
];

// 推荐的热门植物
const popularPlants = [
  { id: '1', name: '绿萝', careLevel: 1, category: '观叶植物' },
  { id: '2', name: '虎皮兰', careLevel: 1, category: '观叶植物' },
  { id: '3', name: '吊兰', careLevel: 1, category: '观叶植物' },
  { id: '4', name: '多肉', careLevel: 2, category: '多肉植物' },
];

export function EncyclopediaScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  const handlePlantPress = (plantId: string, plantName: string) => {
    navigation.navigate('EncyclopediaDetail', { plantId, plantName });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Layout style={styles.header} level="1">
        <Text category="h2">养护百科</Text>
        <Text appearance="hint">新手进阶指南</Text>
      </Layout>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 搜索栏 - UI Kitten Input */}
        <Input
          placeholder="搜索植物名称或养护问题"
          style={styles.searchBar}
          accessoryLeft={<Icons.Search size={18} />}
        />

        {/* 难度筛选 - UI Kitten Button */}
        <Layout style={styles.section} level="1">
          <Text category="s1" style={styles.sectionTitle}>难度等级</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.difficultyScroll}>
            {difficultyLevels.map((item) => (
              <Button
                key={item.id}
                style={[styles.difficultyChip, { borderColor: item.color }]}
                appearance="outline"
                status={item.level <= 2 ? 'success' : item.level === 3 ? 'warning' : 'danger'}
                size="small"
              >
                {item.name}
              </Button>
            ))}
          </ScrollView>
        </Layout>

        {/* 分类 - UI Kitten Card */}
        <Layout style={styles.section} level="1">
          <Text category="s1" style={styles.sectionTitle}>植物分类</Text>
          <View style={styles.categoryGrid}>
            {categories.map((item) => (
              <Card key={item.id} style={styles.categoryCard} appearance="filled" status="basic">
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryEmoji}>{item.icon}</Text>
                </View>
                <Text category="s1" style={styles.categoryName}>{item.name}</Text>
                <Text appearance="hint" style={styles.categoryCount}>{item.count} 种</Text>
              </Card>
            ))}
          </View>
        </Layout>

        {/* 热门植物 - UI Kitten Card */}
        <Layout style={styles.section} level="1">
          <View style={styles.sectionHeader}>
            <Text category="s1" style={styles.sectionTitle}>热门植物</Text>
            <Button
              size="tiny"
              appearance="ghost"
              status="primary"
              accessoryRight={<Icons.ChevronRight size={14} />}
            >
              查看全部
            </Button>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plantsScroll}>
            {popularPlants.map((plant) => (
              <Card
                key={plant.id}
                style={styles.plantCard}
                onPress={() => handlePlantPress(plant.id, plant.name)}
              >
                <View style={styles.plantImage}>
                  <Text style={styles.plantEmoji}>🌿</Text>
                </View>
                <Text category="s1" style={styles.plantName}>{plant.name}</Text>
                <View style={styles.plantMeta}>
                  <Text appearance="hint" category="c1" style={styles.plantCategory}>{plant.category}</Text>
                  <View style={styles.plantLevel}>
                    {Array.from({ length: plant.careLevel }, (_, i) => (
                      <Text key={i} style={styles.star}>★</Text>
                    ))}
                  </View>
                </View>
              </Card>
            ))}
          </ScrollView>
        </Layout>

        {/* 环境指标说明 */}
        <Layout style={styles.section} level="1">
          <Text category="s1" style={styles.sectionTitle}>养护图标说明</Text>
          <Card style={styles.legendCard}>
            <View style={styles.legendGrid}>
              <View style={styles.legendItem}>
                <View style={styles.legendIcon}>
                  <Icons.Sun size={20} />
                </View>
                <Text appearance="hint">喜阳</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendIcon}>
                  <Icons.CloudRain size={20} />
                </View>
                <Text appearance="hint">喜湿</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendIcon}>
                  <Icons.Snowflake size={20} />
                </View>
                <Text appearance="hint">耐寒</Text>
              </View>
            </View>
          </Card>
        </Layout>

        {/* 避坑指南 - UI Kitten Card */}
        <Layout style={styles.section} level="1">
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icons.AlertTriangle size={18} color={colors.error} />
              <Text category="s1" status="danger">避坑指南</Text>
            </View>
          </View>
          <Text appearance="hint" style={styles.pitfallsSubtitle}>新手必看，这些坑不要踩</Text>
          <View style={styles.pitfallsGrid}>
            {pitfallsData.map((pitfall) => (
              <Card key={pitfall.id} style={styles.pitfallCard} appearance="filled" status="basic">
                <View style={styles.pitfallContent}>
                  <View style={styles.pitfallIcon}>
                    <Text category="c1" status="danger">{pitfall.id}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text category="s1">{pitfall.title}</Text>
                    <Text appearance="hint" category="c1">{pitfall.desc}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </Layout>

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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  content: {
    flex: 1,
  },
  searchBar: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  difficultyScroll: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  difficultyChip: {
    minWidth: 72,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: '47%',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    marginBottom: spacing.xs,
  },
  categoryCount: {},
  plantsScroll: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  plantCard: {
    width: 110,
  },
  plantImage: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantEmoji: {
    fontSize: 36,
  },
  plantName: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  plantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  plantCategory: {},
  plantLevel: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 10,
  },
  legendCard: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pitfallsSubtitle: {
    marginBottom: spacing.md,
  },
  pitfallsGrid: {
    gap: spacing.sm,
  },
  pitfallCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    ...shadows.sm,
  },
  pitfallContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pitfallIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.error + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
