// 养花日记页面 - 美化版
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Icon } from '../components/Icon';
import { colors, spacing, borderRadius, shadows, duration, touchTarget } from '../constants/theme';
import { getDiaries, getMyPlants, Plant } from '../services/diaryService';

interface DiaryScreenProps {
  onGoBack: () => void;
  onNavigate: (page: string, params?: any) => void;
}

interface DisplayDiary {
  id: number | string;
  plantName: string;
  date: string;
  dateLabel: string;
  content: string;
  likes: number;
  comments: number;
  compareWithPrevious?: boolean;
  images: string[];
}

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({
  icon,
  title,
  subtitle,
  actionText,
  onAction,
}) => (
  <View style={emptyStyles.container}>
    <View style={emptyStyles.iconContainer}>
      <Icon name={icon} size={48} color={colors['text-light']} />
    </View>
    <Text style={emptyStyles.title}>{title}</Text>
    <Text style={emptyStyles.subtitle}>{subtitle}</Text>
    {actionText && onAction && (
      <TouchableOpacity style={emptyStyles.button} onPress={onAction}>
        <Icon name="plus" size={18} color={colors.white} />
        <Text style={emptyStyles.buttonText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
));

EmptyState.displayName = 'EmptyState';

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors['text-secondary'],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.white,
  },
});

const formatDate = (dateString: string): { date: string; label: string } => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { date: '今天', label: '刚刚' };
  if (diffDays === 1) return { date: '昨天', label: '昨天' };
  if (diffDays === 2) return { date: '前天', label: '前天' };
  if (diffDays < 7) return { date: `${diffDays}天前`, label: `${diffDays}天前` };

  return {
    date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
    label: date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }),
  };
};

export function DiaryScreen({ onGoBack, onNavigate, isLoggedIn, onRequireLogin }: DiaryScreenProps & { isLoggedIn?: boolean; onRequireLogin?: () => void }) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [diaries, setDiaries] = useState<DisplayDiary[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 使用 useFocusEffect 每次页面获得焦点时检查登录状态
  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn && onRequireLogin) {
        onRequireLogin();
      }
    }, [isLoggedIn, onRequireLogin])
  );

  const loadData = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const [plantsData, diariesData] = await Promise.all([
        getMyPlants(),
        getDiaries(),
      ]);

      setPlants(plantsData);

      if (diariesData && diariesData.length > 0) {
        const displayDiaries: DisplayDiary[] = diariesData.map((d) => {
          const dateInfo = formatDate(d.created_at);
          return {
            id: d.id,
            plantName: d.plant_name || '我的植物',
            date: dateInfo.date,
            dateLabel: dateInfo.label,
            content: d.content || '',
            likes: 0,
            comments: 0,
            compareWithPrevious: !!d.height || !!d.leaf_count,
            images: d.images || [],
          };
        });
        setDiaries(displayDiaries);
      } else {
        setDiaries([]);
      }
    } catch (error: any) {
      console.error('Failed to load diaries:', error);
      // 401/422 未授权，跳转到登录页面
      if ((error?.response?.status === 401 || error?.response?.status === 422) && onRequireLogin) {
        onRequireLogin();
      }
      setDiaries([]);
      setPlants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleWriteDiary = () => {
    onNavigate('WriteDiary');
  };

  const handleDiaryPress = (diary: DisplayDiary) => {
    if (typeof diary.id === 'number') {
      onNavigate('DiaryDetail', { diaryId: diary.id });
    }
  };

  const handleGrowthRecordPress = (plantId?: number) => {
    onNavigate('GrowthCurve', { preselectedPlantId: plantId });
  };

  const renderDiaryCard = ({ item }: { item: DisplayDiary }) => (
    <Pressable
      style={({ pressed }) => [styles.diaryCard, pressed && styles.diaryCardPressed]}
      onPress={() => handleDiaryPress(item)}
      android_ripple={{ color: colors.primaryLight + '20' }}
    >
      {/* Header */}
      <View style={styles.diaryHeader}>
        <View style={styles.diaryUser}>
          <View style={styles.diaryAvatar}>
            <Icon name="flower2" size={16} color={colors.secondary} />
          </View>
          <View>
            <Text style={styles.diaryPlantName}>{item.plantName}</Text>
            <Text style={styles.diaryDate}>{item.dateLabel}</Text>
          </View>
        </View>
        {item.compareWithPrevious && (
          <View style={styles.growthBadge}>
            <Icon name="trending-up" size={10} color={colors.success} />
            <Text style={styles.growthBadgeText}>新变化</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text style={styles.diaryContent} numberOfLines={3}>
        {item.content}
      </Text>

      {/* Images */}
      {item.images && item.images.length > 0 && (
        <View style={styles.imageGallery}>
          {item.images.slice(0, 3).map((uri, index) => (
            uri && typeof uri === 'string' && uri.trim().length > 0 ? (
              <Image
                key={index}
                source={{ uri }}
                style={[
                  styles.galleryImage,
                  item.images.length === 1 && styles.galleryImageSingle,
                ]}
              />
            ) : null
          ))}
          {item.images.length > 3 && (
            <View style={styles.moreImagesOverlay}>
              <Text style={styles.moreImagesText}>+{item.images.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.diaryFooter}>
        <View style={styles.statItem}>
          <Icon name="heart" size={14} color={colors['text-light']} />
          <Text style={styles.statText}>{item.likes}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="message-circle" size={14} color={colors['text-light']} />
          <Text style={styles.statText}>{item.comments}</Text>
        </View>
        <TouchableOpacity style={styles.shareButton}>
          <Icon name="share" size={14} color={colors['text-secondary']} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );

  const renderPlantCard = ({ item }: { item: Plant }) => (
    <Pressable
      style={({ pressed }) => [styles.plantCard, pressed && styles.cardPressed]}
      onPress={() => handleGrowthRecordPress(item.id)}
      android_ripple={{ color: colors.primaryLight + '20' }}
    >
      <View style={styles.plantIcon}>
        <Icon name="flower2" size={24} color={colors.secondary} />
      </View>
      <View style={styles.plantInfo}>
        <Text style={styles.plantName}>{item.name}</Text>
        <Text style={styles.plantHint}>点击查看生长曲线</Text>
      </View>
      <Icon name="chevron-right" size={20} color={colors['text-light']} />
    </Pressable>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onGoBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Icon name="arrow-left" size={24} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>
          {selectedTab === 0 ? '养花日记' : '生长记录'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {selectedTab === 0 ? '记录植物的成长点滴' : '查看植物生长趋势'}
        </Text>
      </View>
      <View style={styles.headerRight}>
        {selectedTab === 0 && (
          <TouchableOpacity style={styles.writeButton} onPress={handleWriteDiary}>
            <Icon name="plus" size={18} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, selectedTab === 0 && styles.tabActive]}
          onPress={() => setSelectedTab(0)}
          android_ripple={{ color: colors.primaryLight + '20', borderless: true }}
        >
          <Icon
            name="book"
            size={16}
            color={selectedTab === 0 ? colors.primary : colors['text-secondary']}
          />
          <Text style={[styles.tabText, selectedTab === 0 && styles.tabTextActive]}>
            我的日记
          </Text>
          {selectedTab === 0 && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable
          style={[styles.tab, selectedTab === 1 && styles.tabActive]}
          onPress={() => setSelectedTab(1)}
          android_ripple={{ color: colors.primaryLight + '20', borderless: true }}
        >
          <Icon
            name="trending-up"
            size={16}
            color={selectedTab === 1 ? colors.primary : colors['text-secondary']}
          />
          <Text style={[styles.tabText, selectedTab === 1 && styles.tabTextActive]}>
            生长记录
          </Text>
          {selectedTab === 1 && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>
    </View>
  );

  const renderFloatingButton = () => (
    <TouchableOpacity
      style={styles.fab}
      onPress={handleWriteDiary}
      activeOpacity={duration.normal / 1000}
    >
      <Icon name="plus" size={24} color={colors.white} />
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTabs()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Tab 0: 我的日记
  if (selectedTab === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTabs()}
        <FlatList
          data={diaries}
          renderItem={renderDiaryCard}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={diaries.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="book"
              title="暂无日记"
              subtitle="开始记录植物的成长故事"
              actionText="写第一篇日记"
              onAction={handleWriteDiary}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
        {diaries.length > 0 && renderFloatingButton()}
      </SafeAreaView>
    );
  }

  // Tab 1: 生长记录
  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      <FlatList
        data={plants}
        renderItem={renderPlantCard}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={plants.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="sprout"
            title="暂无植物"
            subtitle="添加植物后即可记录生长数据"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors['text-secondary'],
    marginTop: 2,
  },
  headerRight: {
    width: touchTarget.minimum,
    alignItems: 'flex-end',
  },
  writeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },

  // Tabs
  tabsContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    position: 'relative',
  },
  tabActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors['text-secondary'],
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -50 }],
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  // List
  list: {
    padding: spacing.md,
  },
  emptyList: {
    flex: 1,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors['text-secondary'],
  },

  // Diary Card
  diaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diaryCardPressed: {
    backgroundColor: colors.background,
  },
  diaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  diaryUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  diaryAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diaryPlantName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  diaryDate: {
    fontSize: 12,
    color: colors['text-tertiary'],
    marginTop: 2,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  growthBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.success,
  },
  diaryContent: {
    fontSize: 15,
    color: colors['text-secondary'],
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  imageGallery: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  galleryImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  galleryImageSingle: {
    width: '100%',
    height: 180,
  },
  moreImagesOverlay: {
    position: 'absolute',
    right: 0,
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
  diaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: spacing.lg,
  },
  statText: {
    fontSize: 13,
    color: colors['text-tertiary'],
  },
  shareButton: {
    marginLeft: 'auto',
    padding: spacing.xs,
  },

  // Plant Card
  plantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    backgroundColor: colors.background,
  },
  plantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  plantHint: {
    fontSize: 13,
    color: colors['text-tertiary'],
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: spacing.xl + 60,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    elevation: 8,
  },
});
