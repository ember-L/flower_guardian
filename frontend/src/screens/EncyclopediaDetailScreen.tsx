// 养护百科详情页
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Sun, CloudRain, Snowflake, Droplets, AlertTriangle } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

// 模拟植物详情数据
const mockPlantDetail = {
  id: '1',
  name: '绿萝',
  scientificName: 'Epipremnum aureum',
  category: '观叶植物',
  careLevel: 1,
  description: '绿萝是天南星科麒麟叶属植物，原产于印度尼西亚所罗门群岛的热带雨林。绿萝生命力顽强，易于养护，是最常见的室内观叶植物之一。它叶片翠绿，心形，能吸收空气中的甲醛、苯等有害气体，非常适合放在室内。',
  lightRequirement: '耐阴',
  waterRequirement: '见干见湿',
  temperature: '15-30°C',
  humidity: '40-60%',
  fertilization: '春夏季每2周一次',
  repotting: '每年春季换盆',
  difficulties: [
    { id: '1', title: '黄叶', solution: '可能是浇水过多或过少导致，检查土壤干湿度后调整浇水频率' },
    { id: '2', title: '叶片发白', solution: '可能是光照过强导致，应放置在散光或阴凉处' },
    { id: '3', title: '生长缓慢', solution: '可能是营养不足，可适当施肥' },
  ],
  commonMistakes: [
    '浇水过多导致烂根',
    '长时间放在强光下暴晒',
    '冬季浇水过勤',
    '不通风导致病虫害',
  ],
  tips: [
    '适合放在北向窗户边',
    '水培也很容易成活',
    '经常喷水增加空气湿度',
    '每月擦拭叶片保持光泽',
  ],
};

export function EncyclopediaDetailScreen() {
  const navigation = useNavigation();
  // const route = useRoute<RouteProp<RootStackParamList, 'EncyclopediaDetail'>>();

  const plant = mockPlantDetail;

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Text
        key={i}
        style={{
          color: i < level ? colors.warning : colors['text-light'],
          fontSize: 18,
        }}
      >
        ★
      </Text>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{plant.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 植物图片占位 */}
        <View style={styles.imageContainer}>
          <Text style={styles.plantEmoji}>🌿</Text>
        </View>

        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.plantName}>{plant.name}</Text>
          <Text style={styles.scientificName}>{plant.scientificName}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{plant.category}</Text>
          </View>
        </View>

        {/* 养护难度 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>养护难度</Text>
          <View style={styles.difficultyCard}>
            <View style={styles.starsContainer}>
              {renderStars(plant.careLevel)}
            </View>
            <Text style={styles.difficultyText}>
              {plant.careLevel === 1 ? '入门级' :
               plant.careLevel === 2 ? '初级' :
               plant.careLevel === 3 ? '中级' :
               plant.careLevel === 4 ? '高级' : '专家级'}
            </Text>
          </View>
        </View>

        {/* 生长环境指标 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>生长环境</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Sun size={28} color={colors.warning} />
              <Text style={styles.metricLabel}>光照</Text>
              <Text style={styles.metricValue}>{plant.lightRequirement}</Text>
            </View>
            <View style={styles.metricCard}>
              <CloudRain size={28} color={colors.primary} />
              <Text style={styles.metricLabel}>水分</Text>
              <Text style={styles.metricValue}>{plant.waterRequirement}</Text>
            </View>
            <View style={styles.metricCard}>
              <Snowflake size={28} color={colors['text-light']} />
              <Text style={styles.metricLabel}>温度</Text>
              <Text style={styles.metricValue}>{plant.temperature}</Text>
            </View>
            <View style={styles.metricCard}>
              <Droplets size={28} color={colors.secondary} />
              <Text style={styles.metricLabel}>湿度</Text>
              <Text style={styles.metricValue}>{plant.humidity}</Text>
            </View>
          </View>
        </View>

        {/* 养护说明 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>养护说明</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>{plant.description}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>施肥</Text>
            <Text style={styles.infoValue}>{plant.fertilization}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>换盆</Text>
            <Text style={styles.infoValue}>{plant.repotting}</Text>
          </View>
        </View>

        {/* 常见问题 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>常见问题</Text>
          {plant.difficulties.map((item) => (
            <View key={item.id} style={styles.problemCard}>
              <Text style={styles.problemTitle}>{item.title}</Text>
              <Text style={styles.problemSolution}>{item.solution}</Text>
            </View>
          ))}
        </View>

        {/* 避坑指南 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>避坑指南</Text>
          <View style={styles.warningCard}>
            <AlertTriangle size={24} color={colors.error} />
            <Text style={styles.warningTitle}>新手常见错误</Text>
          </View>
          {plant.commonMistakes.map((mistake, index) => (
            <View key={index} style={styles.mistakeItem}>
              <Text style={styles.mistakeText}>× {mistake}</Text>
            </View>
          ))}
        </View>

        {/* 养护小贴士 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>养护小贴士</Text>
          {plant.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 200,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantEmoji: {
    fontSize: 80,
  },
  section: {
    padding: spacing.lg,
  },
  plantName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  scientificName: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  categoryText: {
    fontSize: fontSize.xs,
    color: colors.secondary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  difficultyCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  difficultyText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    marginTop: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: '47%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors['text-secondary'],
    marginTop: spacing.sm,
  },
  metricValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    lineHeight: 22,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  problemCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  problemTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  problemSolution: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  warningTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.error,
  },
  mistakeItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  mistakeText: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});
