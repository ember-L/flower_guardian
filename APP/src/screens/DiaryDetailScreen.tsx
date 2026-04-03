// 日记详情页面
import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { getDiary, deleteDiary, Diary } from '../services/diaryService';

interface DiaryDetailScreenProps extends Partial<NavigationProps> {
  diaryId: number;
}

export function DiaryDetailScreen({ onGoBack, onNavigate, diaryId, isLoggedIn, onRequireLogin }: DiaryDetailScreenProps) {
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  // 检查登录状态
  useEffect(() => {
    if (!isLoggedIn && onRequireLogin) {
      onRequireLogin();
    }
  }, [isLoggedIn, onRequireLogin]);

  useEffect(() => {
    if (isLoggedIn) {
      loadDiary();
    }
  }, [isLoggedIn, diaryId]);

  const loadDiary = async () => {
    if (!isLoggedIn) return;
    try {
      const data = await getDiary(diaryId);
      setDiary(data);
    } catch (error) {
      Alert.alert('错误', '加载失败');
      onGoBack?.();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('确认删除', '确定要删除这条日记吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDiary(diaryId);
            Alert.alert('成功', '删除成功', [{ text: '确定', onPress: () => onGoBack?.() }]);
          } catch (error) {
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!diary) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>日记不存在</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.headerButton}>
          <Icons.ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>日记详情</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
          <Icons.Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 基本信息 */}
        <View style={styles.info}>
          <View style={styles.plantInfo}>
            <View style={styles.avatar}>
              <Icons.Flower2 size={20} color={colors.secondary} />
            </View>
            <View>
              <Text style={styles.plantName}>{diary.plant_name || '我的植物'}</Text>
              <Text style={styles.date}>{formatDate(diary.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* 生长数据 */}
        {(diary.height || diary.leaf_count) && (
          <View style={styles.growthData}>
            {diary.height && (
              <View style={styles.growthItem}>
                <Icons.TrendingUp size={16} color={colors.success} />
                <Text style={styles.growthValue}>{diary.height} cm</Text>
              </View>
            )}
            {diary.leaf_count && (
              <View style={styles.growthItem}>
                <Icons.Sprout size={16} color={colors.success} />
                <Text style={styles.growthValue}>{diary.leaf_count} 片叶子</Text>
              </View>
            )}
          </View>
        )}

        {/* 图片 */}
        {diary.images && diary.images.length > 0 && (
          <View style={styles.images}>
            {diary.images.length === 1 && typeof diary.images[0] === 'string' && diary.images[0].trim().length > 0 ? (
              <Image source={{ uri: diary.images[0] }} style={styles.singleImage} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {diary.images.map((uri, index) => (
                  uri && typeof uri === 'string' && uri.trim().length > 0 ? <Image key={index} source={{ uri }} style={styles.thumbnail} /> : null
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* 文字内容 */}
        {diary.content && (
          <View style={styles.contentSection}>
            <Text style={styles.diaryContent}>{diary.content}</Text>
          </View>
        )}

        {/* 对比按钮 */}
        <TouchableOpacity
          style={styles.compareButton}
          onPress={() => setShowComparison(!showComparison)}
        >
          <Icons.ArrowRight size={16} color={colors.primary} />
          <Text style={styles.compareButtonText}>与上次记录对比</Text>
        </TouchableOpacity>
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
  headerButton: { padding: spacing.sm },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  content: { flex: 1, padding: spacing.lg },
  info: { marginBottom: spacing.md },
  plantInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  plantName: { fontSize: 16, fontWeight: '600', color: colors.text },
  date: { fontSize: 13, color: colors['text-tertiary'] },
  growthData: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  growthItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  growthValue: { fontSize: 14, color: colors.text },
  images: { marginBottom: spacing.md },
  singleImage: { width: '100%', height: 250, borderRadius: 16 },
  thumbnail: { width: 150, height: 150, borderRadius: 12, marginRight: spacing.sm },
  contentSection: { marginBottom: spacing.md },
  diaryContent: { fontSize: 15, color: colors['text-secondary'], lineHeight: 24 },
  compareButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.primary,
    marginTop: spacing.md,
  },
  compareButtonText: { color: colors.primary, fontWeight: '500' },
});
