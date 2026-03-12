// 生长曲线页面
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

  // 绘制图表数据
  const chartWidth = Dimensions.get('window').width - spacing.lg * 2 - spacing.md * 2;
  const chartHeight = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const renderHeightChart = () => {
    const dataWithHeight = diaries.filter(d => d.height);
    if (dataWithHeight.length < 2) {
      return <Text style={styles.noDataText}>暂无足够数据绘制图表</Text>;
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
      date: new Date(d.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
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
      return <Text style={styles.noDataText}>暂无足够数据绘制图表</Text>;
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
                {new Date(d.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
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
          {plants.length === 0 ? (
            <Text style={styles.emptyText}>暂无植物</Text>
          ) : (
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
          )}
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
              <View style={styles.chartTitleRow}>
                <Icons.TrendingUp size={14} color={colors.primary} />
                <Text style={styles.chartTitle}> 高度变化 (cm)</Text>
              </View>
              <View style={styles.chart}>
                {renderHeightChart()}
              </View>
            </View>

            {/* 叶片数量 */}
            <View style={styles.chartSection}>
              <View style={styles.chartTitleRow}>
                <Icons.Sprout size={14} color={colors.secondary} />
                <Text style={styles.chartTitle}> 叶片数量</Text>
              </View>
              <View style={styles.chart}>
                {renderLeafChart()}
              </View>
            </View>

            {/* 数据列表 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>记录详情</Text>
              {diaries.length === 0 ? (
                <Text style={styles.noDataText}>暂无生长数据</Text>
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
  emptyText: { color: colors['text-tertiary'], fontSize: 14 },
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
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  chartTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  chart: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md },
  noDataText: { textAlign: 'center', color: colors['text-tertiary'], padding: spacing.xl },
  dataItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm,
  },
  dataDate: { fontSize: 14, color: colors.text },
  dataValues: { flexDirection: 'row', gap: spacing.md },
  dataValue: { fontSize: 13, color: colors['text-secondary'] },
});
