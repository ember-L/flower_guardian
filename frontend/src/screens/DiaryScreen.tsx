// 养花日记页面
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, Calendar, TrendingUp, Image as ImageIcon, Share2, Heart, MessageCircle } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

const { width } = Dimensions.get('window');

// 日记记录
interface DiaryEntry {
  id: string;
  plantName: string;
  date: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  compareWithPrevious?: boolean;
}

// 植物生长数据
interface GrowthData {
  date: string;
  height: number;
  leafCount: number;
}

const mockDiaries: DiaryEntry[] = [
  {
    id: '1',
    plantName: '绿萝',
    date: '2024-01-20',
    content: '今天给绿萝换了一个大一点的花盆，加了新土，期待它长得更好！',
    images: [],
    likes: 12,
    comments: 3,
    compareWithPrevious: true,
  },
  {
    id: '2',
    plantName: '绿萝',
    date: '2024-01-15',
    content: '发现一片新叶子冒出来了，开心！最近天气好，放在阳台生长速度明显加快了。',
    images: [],
    likes: 8,
    comments: 2,
  },
  {
    id: '3',
    plantName: '虎皮兰',
    date: '2024-01-10',
    content: '虎皮兰依旧坚挺，半个月没浇水了还是状态良好，不愧是最省心的植物。',
    images: [],
    likes: 15,
    comments: 5,
  },
];

const mockGrowthData: GrowthData[] = [
  { date: '01-01', height: 15, leafCount: 5 },
  { date: '01-08', height: 18, leafCount: 6 },
  { date: '01-15', height: 22, leafCount: 7 },
  { date: '01-20', height: 25, leafCount: 8 },
];

export function DiaryScreen() {
  const navigation = useNavigation();
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [showGrowthChart, setShowGrowthChart] = useState(false);

  const plants = ['全部', '绿萝', '虎皮兰', '吊兰'];

  const renderGrowthChart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>生长曲线</Text>
        <TouchableOpacity onPress={() => setShowGrowthChart(false)}>
          <Text style={styles.chartClose}>关闭</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chart}>
        <View style={styles.chartYAxis}>
          <Text style={styles.axisLabel}>30cm</Text>
          <Text style={styles.axisLabel}>20cm</Text>
          <Text style={styles.axisLabel}>10cm</Text>
          <Text style={styles.axisLabel}>0cm</Text>
        </View>
        <View style={styles.chartArea}>
          {mockGrowthData.map((data, index) => (
            <View key={index} style={styles.chartBar}>
              <View
                style={[
                  styles.bar,
                  { height: `${(data.height / 30) * 100}%` },
                ]}
              >
                <Text style={styles.barHeight}>{data.height}cm</Text>
              </View>
              <Text style={styles.barLabel}>{data.date}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.growthStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>+10cm</Text>
          <Text style={styles.statLabel}>本月增高</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>+3片</Text>
          <Text style={styles.statLabel}>新叶数量</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>95%</Text>
          <Text style={styles.statLabel}>健康指数</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>养花日记</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 植物筛选 */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {plants.map((plant) => (
            <TouchableOpacity
              key={plant}
              style={[
                styles.filterChip,
                (selectedPlant === plant || (plant === '全部' && !selectedPlant)) &&
                  styles.filterChipActive,
              ]}
              onPress={() => setSelectedPlant(plant === '全部' ? null : plant)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  (selectedPlant === plant || (plant === '全部' && !selectedPlant)) &&
                    styles.filterChipTextActive,
                ]}
              >
                {plant}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 功能按钮 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowGrowthChart(!showGrowthChart)}
          >
            <TrendingUp size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>生长曲线</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <ImageIcon size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>对比图</Text>
          </TouchableOpacity>
        </View>

        {/* 生长曲线 */}
        {showGrowthChart && renderGrowthChart()}

        {/* 日记列表 */}
        <View style={styles.diaryList}>
          {mockDiaries.map((diary) => (
            <View key={diary.id} style={styles.diaryCard}>
              <View style={styles.diaryHeader}>
                <View style={styles.diaryInfo}>
                  <Text style={styles.diaryPlant}>{diary.plantName}</Text>
                  <View style={styles.diaryDate}>
                    <Calendar size={12} color={colors['text-light']} />
                    <Text style={styles.diaryDateText}>{diary.date}</Text>
                  </View>
                </View>
                {diary.compareWithPrevious && (
                  <View style={styles.compareBadge}>
                    <ImageIcon size={12} color={colors.secondary} />
                    <Text style={styles.compareText}>有对比</Text>
                  </View>
                )}
              </View>

              <Text style={styles.diaryContent}>{diary.content}</Text>

              {/* 模拟图片区域 */}
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={32} color={colors['text-light']} />
                <Text style={styles.imagePlaceholderText}>点击添加图片</Text>
              </View>

              <View style={styles.diaryFooter}>
                <TouchableOpacity style={styles.actionItem}>
                  <Heart size={16} color={colors.primary} />
                  <Text style={styles.actionCount}>{diary.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionItem}>
                  <MessageCircle size={16} color={colors['text-secondary']} />
                  <Text style={styles.actionCount}>{diary.comments}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 添加日记按钮 */}
      <TouchableOpacity style={styles.addButton}>
        <Plus size={24} color={colors.white} />
      </TouchableOpacity>
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
  shareButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  filterContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.primary,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  chartClose: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  chart: {
    flexDirection: 'row',
    height: 150,
    marginBottom: spacing.md,
  },
  chartYAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: spacing.sm,
  },
  axisLabel: {
    fontSize: 10,
    color: colors['text-light'],
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.background,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 30,
    backgroundColor: colors.secondary,
    borderRadius: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  barHeight: {
    fontSize: 8,
    color: colors.white,
    fontWeight: '500',
  },
  barLabel: {
    fontSize: 10,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
  growthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors['text-secondary'],
    marginTop: 2,
  },
  diaryList: {
    gap: spacing.md,
  },
  diaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  diaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  diaryInfo: {
    flex: 1,
  },
  diaryPlant: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  diaryDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  diaryDateText: {
    fontSize: fontSize.xs,
    color: colors['text-light'],
  },
  compareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  compareText: {
    fontSize: 10,
    color: colors.secondary,
  },
  diaryContent: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 22,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  imagePlaceholderText: {
    fontSize: fontSize.sm,
    color: colors['text-light'],
  },
  diaryFooter: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
