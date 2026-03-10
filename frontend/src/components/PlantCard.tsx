// 植物档案卡弹窗组件 - UI Kitten 组件
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableWithoutFeedback } from 'react-native';
import {
  Modal,
  Button,
  Text,
  Card,
  Layout,
  useTheme,
} from '@ui-kitten/components';
import { Icons } from './Icon';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';
import { RecognitionResult } from '../services/recognitionService';

interface PlantCardProps {
  visible: boolean;
  plant: RecognitionResult | null;
  onClose: () => void;
  onAddToGarden: () => void;
}

export function PlantCard({ visible, plant, onClose, onAddToGarden }: PlantCardProps) {
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonIndex, setComparisonIndex] = useState(0);
  const theme = useTheme();

  if (!plant) return null;

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icons.Star
        key={i}
        size={14}
        color={i < level ? colors.warning : colors['text-light']}
      />
    ));
  };

  const getDifficultyText = (level: number) => {
    const texts = ['', '入门级', '初级', '中级', '高级', '专家级'];
    return texts[level] || '未知';
  };

  const getLightIcon = (requirement: string) => {
    if (requirement.includes('耐阴') || requirement.includes('弱光')) {
      return { icon: '☁️', color: colors['text-light'] };
    }
    if (requirement.includes('散光') || requirement.includes('半阴')) {
      return { icon: '⛅', color: colors.warning };
    }
    return { icon: '☀️', color: colors.warning };
  };

  const getWaterIcon = (requirement: string) => {
    if (requirement.includes('耐旱') || requirement.includes('少')) {
      return { icon: '💧', color: colors.primary };
    }
    if (requirement.includes('喜湿') || requirement.includes('多')) {
      return { icon: '💦', color: colors.primary };
    }
    return { icon: '💧', color: colors.primary };
  };

  const handlePrevComparison = () => {
    setComparisonIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextComparison = () => {
    if (plant.similarSpecies) {
      setComparisonIndex(prev => Math.min(plant.similarSpecies!.length - 1, prev + 1));
    }
  };

  // 渲染相似种对比视图
  const renderComparisonView = () => {
    if (!plant.similarSpecies || plant.similarSpecies.length === 0) return null;

    const similar = plant.similarSpecies[comparisonIndex];
    const isFirst = comparisonIndex === 0;
    const isLast = comparisonIndex === plant.similarSpecies.length - 1;

    return (
      <Card style={styles.comparisonContainer}>
        <View style={styles.comparisonHeader}>
          <Button
            size="tiny"
            appearance="ghost"
            status={isFirst ? 'basic' : 'primary'}
            accessoryLeft={<Icons.ArrowLeft size={20} />}
            onPress={handlePrevComparison}
            disabled={isFirst}
          />
          <Text category="s1" style={styles.comparisonTitle}>
            相似种对比 ({comparisonIndex + 1}/{plant.similarSpecies.length})
          </Text>
          <Button
            size="tiny"
            appearance="ghost"
            status={isLast ? 'basic' : 'primary'}
            accessoryLeft={<Icons.ArrowRight size={20} />}
            onPress={handleNextComparison}
            disabled={isLast}
          />
        </View>

        <View style={styles.comparisonContent}>
          {/* 当前识别结果 */}
          <Layout style={styles.comparisonCard} level="2">
            <Text appearance="hint" category="c1">识别结果</Text>
            <Text style={styles.plantEmoji}>🌿</Text>
            <Text category="s1" style={styles.comparisonName}>{plant.name}</Text>
            <View style={styles.comparisonMetrics}>
              <View style={styles.comparisonMetric}>
                <Text appearance="hint" category="c1">难度</Text>
                <View style={styles.stars}>{renderStars(plant.careLevel)}</View>
              </View>
            </View>
          </Layout>

          {/* 分隔线 */}
          <View style={styles.comparisonDivider}>
            <Text status="primary" category="c1">VS</Text>
          </View>

          {/* 相似种 */}
          <Layout style={styles.comparisonCard} level="2">
            <Text appearance="hint" category="c1">相似植物</Text>
            <Text style={styles.plantEmoji}>🌱</Text>
            <Text category="s1" style={styles.comparisonName}>{similar.name}</Text>
            <View style={styles.comparisonMetrics}>
              <View style={styles.comparisonMetric}>
                <Text appearance="hint" category="c1">难度</Text>
                <View style={styles.stars}>{renderStars(similar.careLevel)}</View>
              </View>
            </View>
            <Text appearance="hint" category="c1">{similar.difference}</Text>
          </Layout>
        </View>

        <View style={styles.comparisonTips}>
          <Icons.Info size={14} color={colors.secondary} />
          <Text appearance="hint" category="c1" style={styles.comparisonTipsText}>
            {similar.tips}
          </Text>
        </View>

        <Button
          style={styles.backButton}
          appearance="ghost"
          status="primary"
          accessoryLeft={<Icons.ArrowLeft size={16} />}
          onPress={() => setShowComparison(false)}
        >
          返回档案卡
        </Button>
      </Card>
    );
  };

  // 渲染档案卡视图
  const renderCardView = () => (
    <Card style={styles.card}>
      {/* 关闭按钮 */}
      <View style={styles.closeButton}>
        <Button
          size="tiny"
          appearance="ghost"
          status="basic"
          accessoryLeft={<Icons.X size={20} />}
          onPress={onClose}
        />
      </View>

      {/* 植物图片占位 */}
      <View style={styles.imageContainer}>
        <Text style={styles.plantEmoji}>🌿</Text>
      </View>

      {/* 植物名称 */}
      <Text category="h5">{plant.name}</Text>
      <Text appearance="hint" category="s1" style={styles.scientificName}>{plant.scientificName}</Text>

      {/* 置信度 */}
      <View style={styles.confidenceBadge}>
        <Text status="primary" category="c1">
          置信度 {Math.round(plant.confidence * 100)}%
        </Text>
      </View>

      {/* 养护指标 */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text appearance="hint" category="c1">养护难度</Text>
          <View style={styles.stars}>{renderStars(plant.careLevel)}</View>
          <Text category="c1">{getDifficultyText(plant.careLevel)}</Text>
        </View>

        <View style={styles.metricItem}>
          <Text appearance="hint" category="c1">光照需求</Text>
          <View style={styles.iconBox}>
            <Text style={styles.metricEmoji}>{getLightIcon(plant.lightRequirement).icon}</Text>
          </View>
          <Text category="c1">{plant.lightRequirement}</Text>
        </View>

        <View style={styles.metricItem}>
          <Text appearance="hint" category="c1">水分需求</Text>
          <View style={styles.iconBox}>
            <Text style={styles.metricEmoji}>{getWaterIcon(plant.waterRequirement).icon}</Text>
          </View>
          <Text category="c1">{plant.waterRequirement}</Text>
        </View>
      </View>

      {/* 描述 */}
      <Text appearance="hint" numberOfLines={3} style={styles.description}>
        {plant.description}
      </Text>

      {/* 相似种对比提示 */}
      {plant.similarSpecies && plant.similarSpecies.length > 0 && (
        <Button
          style={styles.similarHint}
          appearance="filled"
          status="basic"
          accessoryRight={<Icons.ArrowRight size={16} />}
          onPress={() => setShowComparison(true)}
        >
          有 {plant.similarSpecies.length} 种相似植物，点击查看对比
        </Button>
      )}

      {/* 添加按钮 */}
      <Button
        style={styles.addButton}
        appearance="filled"
        status="primary"
        accessoryLeft={<Icons.Check size={20} />}
        onPress={onAddToGarden}
      >
        加入我的花园
      </Button>
    </Card>
  );

  return (
    <Modal
      visible={visible}
      backdropStyle={styles.overlay}
      onBackdropPress={onClose}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showComparison ? renderComparisonView() : renderCardView()}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  plantEmoji: {
    fontSize: 60,
  },
  scientificName: {
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  confidenceBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  metricItem: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metricValue: {
    marginTop: spacing.xs,
  },
  description: {
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
  similarHint: {
    marginTop: spacing.md,
  },
  addButton: {
    marginTop: spacing.lg,
    width: '100%',
  },
  // 相似种对比样式
  comparisonContainer: {
    width: '100%',
    maxWidth: 360,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  comparisonTitle: {
    flex: 1,
    textAlign: 'center',
  },
  comparisonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  comparisonName: {
    marginTop: spacing.sm,
  },
  comparisonMetrics: {
    marginTop: spacing.sm,
  },
  comparisonMetric: {
    alignItems: 'center',
  },
  comparisonDivider: {
    paddingHorizontal: spacing.sm,
  },
  comparisonTips: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.secondary + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  comparisonTipsText: {
    flex: 1,
    lineHeight: 18,
  },
  backButton: {
    marginTop: spacing.lg,
  },
  metricEmoji: {
    fontSize: 18,
  },
});
