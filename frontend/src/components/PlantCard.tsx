// 植物档案卡弹窗组件
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { X, Sun, CloudRain, Star, Check } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';
import { RecognitionResult } from '../services/recognitionService';

interface PlantCardProps {
  visible: boolean;
  plant: RecognitionResult | null;
  onClose: () => void;
  onAddToGarden: () => void;
}

export function PlantCard({ visible, plant, onClose, onAddToGarden }: PlantCardProps) {
  if (!plant) return null;

  const renderStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        color={i < level ? colors.warning : colors['text-light']}
        fill={i < level ? colors.warning : 'transparent'}
      />
    ));
  };

  const getDifficultyText = (level: number) => {
    const texts = ['', '入门级', '初级', '中级', '高级', '专家级'];
    return texts[level] || '未知';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* 关闭按钮 */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={20} color={colors['text-secondary']} />
              </TouchableOpacity>

              {/* 植物图片占位 */}
              <View style={styles.imageContainer}>
                <Text style={styles.plantEmoji}>🌿</Text>
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
                  <View style={styles.stars}>{renderStars(plant.careLevel)}</View>
                  <Text style={styles.metricValue}>{getDifficultyText(plant.careLevel)}</Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>光照需求</Text>
                  <View style={styles.iconBox}>
                    <Sun size={20} color={colors.warning} />
                  </View>
                  <Text style={styles.metricValue}>{plant.lightRequirement}</Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>水分需求</Text>
                  <View style={styles.iconBox}>
                    <CloudRain size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.metricValue}>{plant.waterRequirement}</Text>
                </View>
              </View>

              {/* 描述 */}
              <Text style={styles.description} numberOfLines={3}>
                {plant.description}
              </Text>

              {/* 相似种对比提示 */}
              {plant.similarSpecies && plant.similarSpecies.length > 0 && (
                <View style={styles.similarHint}>
                  <Text style={styles.similarHintText}>
                    有 {plant.similarSpecies.length} 种相似植物，点击查看对比
                  </Text>
                </View>
              )}

              {/* 添加按钮 */}
              <TouchableOpacity style={styles.addButton} onPress={onAddToGarden}>
                <Check size={20} color={colors.white} />
                <Text style={styles.addButtonText}>加入我的花园</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
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
  confidenceBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  confidenceText: {
    fontSize: fontSize.xs,
    color: colors.secondary,
    fontWeight: '600',
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
    fontSize: fontSize.xs,
    color: colors['text-secondary'],
    marginBottom: spacing.xs,
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
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: '500',
  },
  description: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
  similarHint: {
    backgroundColor: colors.accent + '30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  similarHintText: {
    fontSize: fontSize.xs,
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
    width: '100%',
  },
  addButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
});
