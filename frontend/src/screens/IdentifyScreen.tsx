// 识别（首页）屏幕 - 使用纯 StyleSheet
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius } from '../constants/theme';
import { takePhoto, selectFromGallery, recognizePlant, RecognitionResult } from '../services/recognitionService';

export function IdentifyScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPlantCard, setShowPlantCard] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [plantNickname, setPlantNickname] = useState('');

  const handleIdentify = async (source: 'camera' | 'gallery') => {
    try {
      setIsLoading(true);
      const response = source === 'camera'
        ? await takePhoto()
        : await selectFromGallery();

      if (response.didCancel || !response.assets || response.assets.length === 0) {
        setIsLoading(false);
        return;
      }

      const imageUri = response.assets[0].uri;
      if (!imageUri) {
        setIsLoading(false);
        return;
      }

      const result = await recognizePlant(imageUri);
      setRecognitionResult(result);
      setShowPlantCard(true);
    } catch (error) {
      Alert.alert('识别失败', '请重试或检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToGarden = () => {
    Alert.alert('添加成功', '已添加到我的花园');
    setShowPlantCard(false);
    setRecognitionResult(null);
    setPlantNickname('');
  };

  const closePlantCard = () => {
    setShowPlantCard(false);
    setRecognitionResult(null);
    setPlantNickname('');
  };

  const quickActions = [
    { id: 'diagnose', label: '病症诊断', icon: Icons.Stethoscope, color: '#ff9500', desc: '植物看病' },
    { id: 'recommend', label: '新手推荐', icon: Icons.Sparkles, color: '#af52de', desc: '智能推荐' },
    { id: 'reminder', label: '智能提醒', icon: Icons.Bell, color: '#ff2d55', desc: '浇水施肥' },
  ];

  const tips = [
    { title: '今日光照提示', content: '晴天适合给喜阳植物晒太阳，注意遮阴保护耐阴植物' },
    { title: '浇水小技巧', content: '早晨或傍晚浇水最佳，避免中午高温时段' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.brandBadge}>
              <Icons.Sparkles size={28} color="#fff" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>护花使者</Text>
              <Text style={styles.heroSubtitle}>你的掌上植物管家</Text>
            </View>
          </View>

          <Text style={styles.heroDesc}>
            从识别植物到养护指导，从病症诊断到智能提醒，
            全方位呵护你的每一株绿植
          </Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>植物品种</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>AI</Text>
              <Text style={styles.statLabel}>智能识别</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24h</Text>
              <Text style={styles.statLabel}>养护提醒</Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* 主识别区域卡片 */}
          <View style={styles.identifyCard}>
            {!showPlantCard ? (
              <>
                <View style={styles.identifyHeader}>
                  <Text style={styles.identifyTitle}>拍照识别植物</Text>
                  <Text style={styles.identifyDesc}>拍一张植物照片，AI帮你识别</Text>
                </View>

                {/* 大拍照按钮 */}
                <View style={styles.buttonContainer}>
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <View style={styles.loadingCircle}>
                        <ActivityIndicator size="large" color={colors.primary} />
                      </View>
                      <Text style={styles.loadingText}>AI 正在识别中...</Text>
                      <Text style={styles.loadingSubtext}>请稍候，正在分析植物特征</Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={() => handleIdentify('camera')}
                        activeOpacity={0.8}
                        style={styles.mainButton}
                      >
                        <Icons.Camera size={32} color="#fff" />
                      </TouchableOpacity>
                      <Text style={styles.buttonHint}>点击拍照识别</Text>

                      {/* 相册导入 */}
                      <View style={styles.galleryButton}>
                        <TouchableOpacity
                          onPress={() => handleIdentify('gallery')}
                          style={styles.galleryButtonInner}
                          activeOpacity={0.7}
                        >
                          <Icons.Image size={18} color={colors.primary} />
                          <Text style={styles.galleryButtonText}>从相册选择</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </>
            ) : (
              // 识别结果展示
              <View>
                <Text style={styles.resultTitle}>识别结果</Text>
                <View style={styles.resultCard}>
                  <Text style={styles.plantName}>
                    {recognitionResult?.name || '识别中...'}
                  </Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {Math.round((recognitionResult?.confidence || 0) * 100)}% 匹配
                    </Text>
                  </View>
                </View>

                {/* 操作按钮 */}
                <View style={styles.resultButtons}>
                  <TouchableOpacity
                    onPress={closePlantCard}
                    style={styles.retryButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.retryButtonText}>重新识别</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddToGarden}
                    style={styles.addButton}
                    activeOpacity={0.7}
                  >
                    <Icons.Plus size={18} color="#fff" />
                    <Text style={styles.addButtonText}>加入花园</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* 快捷功能 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>快捷功能</Text>
            <View style={styles.quickActions}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.quickActionItem}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                      <Icon size={24} color="#fff" />
                    </View>
                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                    <Text style={styles.quickActionDesc}>{action.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 今日小贴士 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>今日小贴士</Text>
            <View style={styles.tipsContainer}>
              {tips.map((tip, index) => (
                <View key={index} style={styles.tipCard}>
                  <View style={styles.tipIcon}>
                    <Icons.Sun size={20} color={colors.primary} />
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipText}>{tip.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 今日推荐植物 */}
          <View style={[styles.section, styles.lastSection]}>
            <Text style={styles.sectionTitle}>今日推荐植物</Text>
            <View style={styles.recommendCard}>
              <View style={styles.recommendImage}>
                <Icons.Flower2 size={60} color="rgba(255,255,255,0.3)" />
                <View style={styles.recommendOverlay}>
                  <Text style={styles.recommendName}>绿萝</Text>
                  <Text style={styles.recommendDesc}>生命力顽强，净化空气小能手</Text>
                </View>
              </View>
              <View style={styles.recommendFooter}>
                <View style={styles.recommendTags}>
                  <View style={styles.recommendTag}>
                    <Text style={styles.recommendTagText}>易养护</Text>
                  </View>
                  <View style={[styles.recommendTag, styles.recommendTagBlue]}>
                    <Text style={[styles.recommendTagText, styles.recommendTagTextBlue]}>净化空气</Text>
                  </View>
                </View>
                <Text style={styles.recommendLink}>了解更多 →</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroSection: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl * 3,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    marginLeft: spacing.md,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  mainContent: {
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xl * 2,
  },
  identifyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  identifyHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  identifyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  identifyDesc: {
    fontSize: 14,
    color: colors['text-secondary'],
  },
  buttonContainer: {
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    marginTop: spacing.lg,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors['text-tertiary'],
    marginTop: spacing.xs,
  },
  mainButton: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonHint: {
    fontSize: 14,
    color: colors['text-secondary'],
    marginTop: spacing.md,
  },
  galleryButton: {
    width: '100%',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  galleryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
  },
  galleryButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  resultCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  confidenceBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
  },
  resultButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  retryButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors['text-secondary'],
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.sm,
  },
  quickActionDesc: {
    fontSize: 12,
    color: colors['text-tertiary'],
    marginTop: 2,
  },
  tipsContainer: {
    gap: spacing.sm,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff0f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  tipText: {
    fontSize: 14,
    color: colors['text-secondary'],
    marginTop: 2,
  },
  lastSection: {
    marginBottom: spacing.xxl * 2,
  },
  recommendCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  recommendImage: {
    height: 160,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  recommendName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  recommendDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  recommendFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  recommendTags: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recommendTag: {
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  recommendTagBlue: {
    backgroundColor: colors.info + '15',
  },
  recommendTagText: {
    color: colors.success,
    fontSize: 12,
  },
  recommendTagTextBlue: {
    color: colors.info,
  },
  recommendLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
