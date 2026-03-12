// 诊断历史页面 - Neumorphism 风格美化
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Animated,
} from 'react-native';
import { getDiagnoses, DiagnosisRecord } from '../services/diagnosisService';
import { colors, spacing, borderRadius, shadows, duration, fontSize, fontWeight, touchTarget } from '../constants/theme';
import { Icon } from '../components/Icon';

interface DiagnosisHistoryScreenProps {
  onGoBack: () => void;
  onNavigate: (page: string, params?: any) => void;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

interface EmptyStateProps {
  filter: 'all' | 'favorite';
  onNavigateToDiagnosis: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ filter, onNavigateToDiagnosis }) => {
  const isEmptyState = filter === 'all';

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <View style={styles.emptyIconInner}>
          <Icon
            name={isEmptyState ? 'clipboard' : 'star'}
            size={48}
            color={colors.primary}
          />
        </View>
      </View>
      <Text style={styles.emptyTitle}>
        {isEmptyState ? '暂无诊断记录' : '暂无收藏'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isEmptyState
          ? '开始拍照诊断，记录植物健康状况'
          : '点击收藏按钮，保存重要的诊断结果'}
      </Text>
      {isEmptyState && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={onNavigateToDiagnosis}
          activeOpacity={duration.pressed}
        >
          <View style={styles.emptyButtonIcon}>
            <Icon name="camera" size={20} color={colors.white} />
          </View>
          <Text style={styles.emptyButtonText}>开始诊断</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
};

const getConfidenceConfig = (confidence: number) => {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
    return { label: '高置信', color: colors.success, bgColor: colors.successLight };
  }
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    return { label: '中等', color: colors.warning, bgColor: colors.warningLight };
  }
  return { label: '低置信', color: colors.error, bgColor: colors.errorLight };
};

export function DiagnosisHistoryScreen({ onGoBack, onNavigate }: DiagnosisHistoryScreenProps) {
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorite'>('all');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const favoriteParam = filter === 'favorite' ? true : undefined;
      const data = await getDiagnoses(favoriteParam);
      setRecords(data.items);
    } catch (error) {
      console.error('Failed to load diagnoses:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const navigateToDetail = (diagnosisId: number) => {
    onNavigate('DiagnosisDetail', { diagnosisId });
  };

  const navigateToDiagnosis = () => {
    onNavigate('Diagnosis');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? '刚刚' : `${diffMins}分钟前`;
      }
      return `${diffHours}小时前`;
    }
    if (diffDays === 1) return '昨天';
    if (diffDays === 2) return '前天';
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: DiagnosisRecord }) => {
    const confidenceConfig = getConfidenceConfig(item.confidence);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        onPress={() => navigateToDetail(item.id)}
        android_ripple={{ color: colors.primaryLight + '20' }}
      >
        <View style={styles.cardImageContainer}>
          <Image
            source={{ uri: item.image_url || 'https://via.placeholder.com/80' }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          {item.is_favorite && (
            <View style={styles.favoriteBadge}>
              <Icon name="star" size={12} color={colors.accent} fill={colors.accent} />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.diseaseName} numberOfLines={1}>
              {item.disease_name}
            </Text>
          </View>

          <View style={[styles.confidenceBadge, { backgroundColor: confidenceConfig.bgColor }]}>
            <Icon name="shield-check" size={12} color={confidenceConfig.color} />
            <Text style={[styles.confidenceText, { color: confidenceConfig.color }]}>
              {confidenceConfig.label} {(item.confidence * 100).toFixed(0)}%
            </Text>
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Icon name="clock" size={14} color={colors['text-tertiary']} />
              <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardArrow}>
          <Icon name="chevron-right" size={20} color={colors['text-light']} />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onGoBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={duration.pressed}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>诊断历史</Text>
          <Text style={styles.headerSubtitle}>
            {filter === 'all' ? '全部记录' : '我的收藏'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={navigateToDiagnosis}
          activeOpacity={duration.pressed}
        >
          <Icon name="plus" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, filter === 'all' && styles.tabActive]}
            onPress={() => setFilter('all')}
            android_ripple={{ color: colors.primaryLight + '20', borderless: true }}
          >
            <Icon
              name="clipboard"
              size={18}
              color={filter === 'all' ? colors.primary : colors['text-secondary']}
            />
            <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>
              全部
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, filter === 'favorite' && styles.tabActive]}
            onPress={() => setFilter('favorite')}
            android_ripple={{ color: colors.primaryLight + '20', borderless: true }}
          >
            <Icon
              name="star"
              size={18}
              color={filter === 'favorite' ? colors.accent : colors['text-secondary']}
              fill={filter === 'favorite' ? colors.accent : 'transparent'}
            />
            <Text style={[styles.tabText, filter === 'favorite' && styles.tabTextActiveFavorite]}>
              收藏
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCircle}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : records.length === 0 ? (
        <EmptyState filter={filter} onNavigateToDiagnosis={navigateToDiagnosis} />
      ) : (
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={ListItemSeparator}
        />
      )}
    </SafeAreaView>
  );
}

const ListItemSeparator = () => <View style={{ height: spacing.md }} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors['text-tertiary'],
    marginTop: 2,
  },
  addButton: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: touchTarget.minimum / 2,
    ...shadows.md,
  },

  // Tabs
  tabsContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors['text-secondary'],
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  tabTextActiveFavorite: {
    color: colors.accent,
    fontWeight: fontWeight.semibold,
  },

  // List
  listContent: {
    padding: spacing.lg,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    ...shadows.sm,
    transform: [{ scale: 0.98 }],
  },
  cardImageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
  },
  favoriteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 4,
    ...shadows.sm,
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  cardHeader: {
    marginBottom: spacing.xs,
  },
  diseaseName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
    marginBottom: spacing.sm,
  },
  confidenceText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  cardMeta: {
    flexDirection: 'row',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors['text-tertiary'],
  },
  cardArrow: {
    justifyContent: 'center',
    paddingLeft: spacing.xs,
  },

  // Loading
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

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    marginBottom: spacing.lg,
  },
  emptyIconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    ...shadows.lg,
  },
  emptyButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
