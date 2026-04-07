// 养护百科详情页 - 现代化设计
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { getPlantDetail, addToMyGarden, Plant } from '../services/plantService';
import { API_BASE_URL } from '../services/config';

interface EncyclopediaDetailScreenProps extends Partial<NavigationProps> {
  route?: { params?: { plantId?: number } };
}

// 获取完整的图片URL
const getFullImageUrl = (url: string | undefined): string | undefined => {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.startsWith('http')) return trimmed;
  return `${API_BASE_URL}${trimmed}`;
};

export function EncyclopediaDetailScreen({ onGoBack, ...props }: EncyclopediaDetailScreenProps) {
  const plantId = (props as any).route?.plantId;
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (plantId) {
      loadPlantDetail();
    } else {
      setLoading(false);
    }
  }, [plantId]);

  const loadPlantDetail = async () => {
    try {
      const data = await getPlantDetail(plantId);
      setPlant(data);
    } catch (error) {
      console.error('加载植物详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToGarden = async () => {
    if (!plant) return;
    try {
      await addToMyGarden({
        plant_id: plant.id,
        nickname: plant.name,
        acquired_from: 'encyclopedia',
      });
      Alert.alert('成功', '已添加到我的花园');
    } catch (error: any) {
      if (error.response?.status === 401) {
        Alert.alert('提示', '请先登录后再添加');
      } else {
        Alert.alert('提示', '添加失败，请稍后重试');
      }
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  const getLightText = (light?: string) => {
    const map: Record<string, string> = {
      'full': '喜阳 - 适合光线充足的环境',
      'partial': '半阴 - 适合散射光环境',
      'low': '耐阴 - 适合光线较弱的环境',
    };
    return map[light || ''] || '适合各种光照环境';
  };

  const getWaterText = (water?: string) => {
    const map: Record<string, string> = {
      'frequent': '经常浇水 - 保持土壤湿润',
      'weekly': '每周一次 - 保持土壤湿润',
      'biweekly': '两周一次 - 干透再浇',
      'monthly': '每月一次 - 极耐旱',
    };
    return map[water || ''] || '适量浇水';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!plant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>未找到植物数据</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero 区域 - 大图背景 */}
        <View style={styles.heroSection}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Icons.ChevronLeft size={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Icons.Share2 size={20} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.plantInfoContainer}>
            <View style={styles.plantImageWrapper}>
              {plant?.image_url && typeof plant.image_url === 'string' && plant.image_url.trim().length > 0 ? (
                <Image source={{ uri: getFullImageUrl(plant.image_url) }} style={styles.plantImage} />
              ) : (
                <View style={styles.plantImagePlaceholder}>
                  <Icons.Flower2 size={56} color={colors.white} />
                </View>
              )}
            </View>
            <Text style={styles.plantName}>{plant.name}</Text>
            {plant.scientific_name && (
              <Text style={styles.plantScientific}>{plant.scientific_name}</Text>
            )}
            <View style={styles.tagRow}>
              <View style={styles.tagPrimary}>
                <Icons.Tag size={12} color={colors.white} />
                <Text style={styles.tagTextPrimary}>{plant.category || '室内植物'}</Text>
              </View>
              <View style={styles.tagSecondary}>
                <Icons.Activity size={12} color={colors.secondary} />
                <Text style={styles.tagTextSecondary}>难度 {plant.care_level || 1}</Text>
              </View>
              {plant.beginner_friendly && plant.beginner_friendly >= 4 && (
                <View style={[styles.tagPrimary, { backgroundColor: colors.success }]}>
                  <Icons.Heart size={12} color={colors.white} />
                  <Text style={styles.tagTextPrimary}>新手友好</Text>
                </View>
              )}
              {plant.is_toxic && (
                <View style={[styles.tagPrimary, { backgroundColor: colors.error }]}>
                  <Icons.AlertTriangle size={12} color={colors.white} />
                  <Text style={styles.tagTextPrimary}>有毒</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* 简介 */}
          {plant.description && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icons.FileText size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>植物简介</Text>
              </View>
              <Text style={styles.description}>{plant.description}</Text>
            </View>
          )}

          {/* 养护要求 - 图标卡片 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icons.Heart size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>养护要求</Text>
            </View>
            <View style={styles.careGrid}>
              {/* 光照 */}
              <View style={styles.careCard}>
                <View style={[styles.careIconWrapper, { backgroundColor: colors.warning + '20' }]}>
                  <Icons.Sun size={24} color={colors.warning} />
                </View>
                <Text style={styles.careLabel}>光照需求</Text>
                <Text style={styles.careValue}>{getLightText(plant.light_requirement)}</Text>
              </View>
              {/* 浇水 */}
              <View style={styles.careCard}>
                <View style={[styles.careIconWrapper, { backgroundColor: colors.info + '20' }]}>
                  <Icons.Droplets size={24} color={colors.info} />
                </View>
                <Text style={styles.careLabel}>浇水频率</Text>
                <Text style={styles.careValue}>{getWaterText(plant.water_requirement)}</Text>
              </View>
              {/* 温度 */}
              {plant.temperature_range && (
                <View style={styles.careCard}>
                  <View style={[styles.careIconWrapper, { backgroundColor: colors.error + '20' }]}>
                    <Icons.Thermometer size={24} color={colors.error} />
                  </View>
                  <Text style={styles.careLabel}>适宜温度</Text>
                  <Text style={styles.careValue}>{plant.temperature_range}</Text>
                </View>
              )}
              {/* 湿度 */}
              {plant.humidity_range && (
                <View style={styles.careCard}>
                  <View style={[styles.careIconWrapper, { backgroundColor: colors.secondary + '20' }]}>
                    <Icons.CloudRain size={24} color={colors.secondary} />
                  </View>
                  <Text style={styles.careLabel}>适宜湿度</Text>
                  <Text style={styles.careValue}>{plant.humidity_range}</Text>
                </View>
              )}
            </View>
            {/* 浇水提示 */}
            {plant.watering_tip && (
              <View style={styles.tipCard}>
                <View style={styles.tipIconWrapper}>
                  <Icons.Lightbulb size={18} color={colors.accent} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipLabel}>浇水小贴士</Text>
                  <Text style={styles.tipText}>{plant.watering_tip}</Text>
                </View>
              </View>
            )}
          </View>

          {/* 特点标签 */}
          {plant.features && plant.features.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icons.Star size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>植物特点</Text>
              </View>
              <View style={styles.featureGrid}>
                {plant.features.map((feature, index) => (
                  <View key={index} style={styles.featureTag}>
                    <Icons.Check size={16} color={colors.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 养护小贴士 */}
          {plant.care_tips && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icons.BookOpen size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>养护小贴士</Text>
              </View>
              <View style={styles.tipsCard}>
                <Text style={styles.tipsText}>{plant.care_tips}</Text>
              </View>
            </View>
          )}

          {/* 常见问题/养护误区 */}
          {plant.common_mistakes && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icons.AlertTriangle size={20} color={colors.warning} />
                <Text style={styles.sectionTitle}>养护误区</Text>
              </View>
              <View style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <Icons.AlertCircle size={18} color={colors.warning} />
                  <Text style={styles.warningTitle}>常见错误</Text>
                </View>
                <Text style={styles.warningText}>{plant.common_mistakes}</Text>
              </View>
            </View>
          )}

          {/* 存活率 */}
          {plant.survival_rate && (
            <View style={styles.section}>
              <View style={styles.survivalCard}>
                <View style={styles.survivalIconWrapper}>
                  <Icons.Heart size={28} color={colors.white} />
                </View>
                <View style={styles.survivalInfo}>
                  <Text style={styles.survivalLabel}>新手存活率</Text>
                  <Text style={styles.survivalValue}>{plant.survival_rate}%</Text>
                </View>
                <View style={styles.survivalProgress}>
                  <View style={[styles.survivalProgressBar, { width: `${plant.survival_rate}%` }]} />
                </View>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={styles.bottomButton}>
        <TouchableOpacity style={styles.submitButton} onPress={handleAddToGarden} activeOpacity={0.8}>
          <Icons.Plus size={20} color={colors.white} />
          <Text style={styles.submitButtonText}>添加到我的花园</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors['text-tertiary'] },
  // Hero 区域
  heroSection: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl * 2,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  shareButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  plantInfoContainer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  plantImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.xxl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.lg,
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  plantImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  plantScientific: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  tagPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  tagSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  tagTextPrimary: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  tagTextSecondary: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  // Content
  content: {
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    paddingBottom: spacing.xxl * 3,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    fontSize: 15,
    color: colors['text-secondary'],
    lineHeight: 24,
  },
  // 养护卡片网格
  careGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  careCard: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  careIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  careLabel: {
    fontSize: 12,
    color: colors['text-tertiary'],
    marginBottom: spacing.xs,
  },
  careValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  // 提示卡片
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.accent + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
  tipIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  tipContent: {
    flex: 1,
  },
  tipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 13,
    color: colors['text-secondary'],
    lineHeight: 20,
  },
  // 特点网格
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success + '12',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  featureText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '500',
  },
  // 养护小贴士
  tipsCard: {
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  tipsText: {
    fontSize: 14,
    color: colors['text-secondary'],
    lineHeight: 22,
  },
  // 警告卡片
  warningCard: {
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  warningText: {
    fontSize: 14,
    color: colors['text-secondary'],
    lineHeight: 22,
  },
  // 存活率
  survivalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '12',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  survivalIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  survivalInfo: {
    flex: 1,
  },
  survivalLabel: {
    fontSize: 13,
    color: colors['text-tertiary'],
  },
  survivalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.success,
  },
  survivalProgress: {
    width: 80,
    height: 6,
    backgroundColor: colors.success + '20',
    borderRadius: 3,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  survivalProgressBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  // 底部
  bottomSpacer: {
    height: spacing.xxl,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.md,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
