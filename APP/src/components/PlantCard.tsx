// 植物档案卡弹窗组件 - 使用 Tailwind/NativeWind
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Modal,
  TextInput,
} from 'react-native';
import { Icons } from './Icon';
import { colors, spacing, borderRadius } from '../constants/theme';

interface PlantCardProps {
  visible: boolean;
  plant: any;
  onClose: () => void;
  onAddToGarden: () => void;
}

export function PlantCard({ visible, plant, onClose, onAddToGarden }: PlantCardProps) {
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonIndex, setComparisonIndex] = useState(0);

  if (!plant) return null;

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={{ color: i < level ? colors.warning : colors['text-light'], fontSize: 12 }}>
        ★
      </Text>
    ));
  };

  const getDifficultyText = (level: number) => {
    const texts = ['', '入门级', '初级', '中级', '高级', '专家级'];
    return texts[level] || '未知';
  };

  const handlePrevComparison = () => {
    setComparisonIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextComparison = () => {
    if (plant.similarSpecies) {
      setComparisonIndex(prev => Math.min(plant.similarSpecies.length - 1, prev + 1));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 关闭按钮 */}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icons.X size={20} color={colors['text-tertiary']} />
            </TouchableOpacity>

            {/* 植物图片 */}
            <View style={styles.imageContainer}>
              <Icons.Leaf size={60} color={colors.success} />
            </View>

            {/* 植物名称 */}
            <Text style={styles.plantName}>{plant.name}</Text>
            <Text style={styles.scientificName}>{plant.scientificName}</Text>

            {/* 置信度 */}
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                置信度 {Math.round(plant.confidence * 100)}%
              </Text>
            </View>

            {/* 养护指标 */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>养护难度</Text>
                <View style={styles.stars}>{renderStars(plant.careLevel || 1)}</View>
                <Text style={styles.metricValue}>{getDifficultyText(plant.careLevel || 1)}</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>光照需求</Text>
                <Icons.Cloud size={18} color={colors['text-secondary']} />
                <Text style={styles.metricValue}>{plant.lightRequirement || '耐阴'}</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>水分需求</Text>
                <Icons.Droplets size={18} color={colors.info} />
                <Text style={styles.metricValue}>{plant.waterRequirement || '见干见湿'}</Text>
              </View>
            </View>

            {/* 描述 */}
            <Text style={styles.description} numberOfLines={3}>
              {plant.description || '这是一种美丽的植物，适合室内养护。'}
            </Text>

            {/* 添加按钮 */}
            <TouchableOpacity
              onPress={onAddToGarden}
              style={styles.addButton}
              activeOpacity={0.7}
            >
              <View style={styles.addButtonContent}>
                <Icons.Check size={20} color="#fff" />
                <Text style={styles.addButtonText}>加入我的花园</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.xs,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    alignSelf: 'center',
  },
  plantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  scientificName: {
    fontStyle: 'italic',
    color: colors['text-tertiary'],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  confidenceBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  confidenceText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '500',
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
  metricLabel: {
    color: colors['text-tertiary'],
    fontSize: 12,
  },
  stars: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  metricValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    textAlign: 'center',
    color: colors['text-secondary'],
    marginTop: spacing.md,
    lineHeight: 20,
  },
  addButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
