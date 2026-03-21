// 诊断详情页面 - Neumorphism 风格美化
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDiagnosis, toggleFavorite, rediagnose, DiagnosisRecord } from '../services/diagnosisService';
import { colors, spacing, borderRadius, shadows, duration, fontSize, fontWeight, touchTarget } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { Icon } from '../components/Icon';

interface DiagnosisDetailScreenProps extends NavigationProps {}

// 置信度阈值配置
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
};

const getConfidenceConfig = (confidence: number) => {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
    return { label: '高置信度', color: colors.success, bgColor: colors.successLight, icon: 'shield-check' };
  }
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    return { label: '中等置信度', color: colors.warning, bgColor: colors.warningLight, icon: 'alert-triangle' };
  }
  return { label: '低置信度', color: colors.error, bgColor: colors.errorLight, icon: 'alert-circle' };
};

export function DiagnosisDetailScreen({ route, onNavigate, onGoBack }: DiagnosisDetailScreenProps) {
  const { diagnosisId } = route?.params || {};
  const [record, setRecord] = useState<DiagnosisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleGoBack = () => {
    // 重置诊断页面状态后返回
    onGoBack?.();
  };

  useEffect(() => {
    loadRecord();
  }, [diagnosisId]);

  // 页面进入动画
  useEffect(() => {
    if (!loading && record) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [loading, record, fadeAnim]);

  const loadRecord = async () => {
    try {
      const data = await getDiagnosis(diagnosisId);
      setRecord(data);
    } catch (error) {
      console.error('Failed to load diagnosis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const result = await toggleFavorite(diagnosisId);
      setRecord(prev => prev ? { ...prev, is_favorite: result.is_favorite } : null);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleRediagnose = async () => {
    try {
      const newRecord = await rediagnose(diagnosisId);
      onNavigate?.('DiagnosisDetail', { diagnosisId: newRecord.id });
    } catch (error) {
      console.error('Failed to rediagnose:', error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCircle}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const confidenceConfig = getConfidenceConfig(record.confidence);

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          activeOpacity={duration.pressed}
        >
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>诊断详情</Text>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={styles.favoriteButton}
          activeOpacity={duration.pressed}
        >
          <Icon
            name={record.is_favorite ? 'star' : 'star-outline'}
            size={24}
            color={record.is_favorite ? colors.accent : colors['text-secondary']}
          />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 主图区域 */}
        <View style={styles.imageContainer}>
          {record.image_url && (
            <Image
              source={{ uri: record.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
          {/* 渐变遮罩 */}
          <View style={styles.imageGradient} />

          {/* 置信度徽章 */}
          <View style={[styles.confidenceBadge, { backgroundColor: confidenceConfig.bgColor }]}>
            <Icon name={confidenceConfig.icon} size={18} color={confidenceConfig.color} />
            <Text style={[styles.confidenceText, { color: confidenceConfig.color }]}>
              {confidenceConfig.label} · {(record.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* 诊断结果 */}
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.diseaseName}>{record.disease_name}</Text>
            <View style={styles.dateRow}>
              <Icon name="clock" size={14} color={colors['text-tertiary']} />
              <Text style={styles.dateText}>{formatDate(record.created_at)}</Text>
            </View>
          </View>

          {/* 病因描述 */}
          {record.description && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.warningLight }]}>
                  <Icon name="alert-circle" size={18} color={colors.warning} />
                </View>
                <Text style={styles.sectionTitle}>病因描述</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>{record.description}</Text>
              </View>
            </View>
          )}

          {/* 治疗建议 */}
          {record.treatment && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.successLight }]}>
                  <Icon name="stethoscope" size={18} color={colors.success} />
                </View>
                <Text style={styles.sectionTitle}>治疗建议</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>{record.treatment}</Text>
              </View>
            </View>
          )}

          {/* 预防措施 */}
          {record.prevention && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.primaryLight + '20' }]}>
                  <Icon name="shield-check" size={18} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>预防措施</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>{record.prevention}</Text>
              </View>
            </View>
          )}

          {/* 推荐产品 */}
          {record.recommended_products && record.recommended_products !== '[]' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.infoLight }]}>
                  <Icon name="shopping-bag" size={18} color={colors.info} />
                </View>
                <Text style={styles.sectionTitle}>推荐产品</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>{record.recommended_products}</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* 底部操作栏 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleFavorite}
          activeOpacity={duration.pressed}
        >
          <Icon
            name={record.is_favorite ? 'star' : 'star-outline'}
            size={22}
            color={record.is_favorite ? colors.accent : colors['text-secondary']}
          />
          <Text style={[styles.actionButtonText, record.is_favorite && styles.actionButtonTextActive]}>
            {record.is_favorite ? '已收藏' : '收藏'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRediagnose}
          activeOpacity={duration.pressed}
        >
          <Icon name="camera" size={22} color={colors.white} />
          <Text style={styles.primaryButtonText}>再次诊断</Text>
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  favoriteButton: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  // 图片区域
  imageContainer: {
    position: 'relative',
    height: 280,
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))',
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  confidenceText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // 内容区域
  content: {
    padding: spacing.lg,
  },
  titleSection: {
    marginBottom: spacing.xl,
  },
  diseaseName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors['text-tertiary'],
  },

  // 详情卡片
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  sectionContent: {
    paddingLeft: 48,
  },
  sectionText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    lineHeight: 26,
  },

  // 底部操作栏
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors['text-secondary'],
  },
  actionButtonTextActive: {
    color: colors.accent,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
