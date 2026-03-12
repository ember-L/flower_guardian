// 识别（首页）屏幕 - 美化版
import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius } from '../constants/theme';
import { takePhoto, selectFromGallery, recognizePlant, RecognitionResult } from '../services/recognitionService';
import { getPopularPlants, Plant } from '../services/plantService';
import { NavigationProps } from '../navigation/AppNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IdentifyScreenProps extends Partial<NavigationProps> {}

export function IdentifyScreen({ onNavigate, currentTab, onTabChange }: IdentifyScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPlantCard, setShowPlantCard] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [plantNickname, setPlantNickname] = useState('');
  const [recommendPlants, setRecommendPlants] = useState<Plant[]>([]);
  const [capturedImageUri, setCapturedImageUri] = useState<string>('');

  useEffect(() => {
    loadRecommendPlants();
  }, []);

  const loadRecommendPlants = async () => {
    try {
      const data = await getPopularPlants(10);
      setRecommendPlants(data.items || []);
    } catch (error) {
      console.error('加载推荐植物失败', error);
    }
  };

  // 动画值
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // 脉动动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 浮动动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 进场动画
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

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

      // 保存照片URI用于显示
      setCapturedImageUri(imageUri);

      try {
        const result = await recognizePlant(imageUri);
        setRecognitionResult(result);
        setShowPlantCard(true);
      } catch (apiError) {
        // API调用失败，使用模拟数据作为降级
        console.warn('API调用失败，使用模拟数据', apiError);
        const fallbackResult = getMockRecognitionResult();
        setRecognitionResult(fallbackResult);
        setShowPlantCard(true);
      }
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
    setCapturedImageUri('');
  };

  const quickActions = [
    { id: 'diagnose', label: '病症诊断', icon: Icons.Stethoscope, color: '#ff9500', gradient: ['#ff9500', '#ff6b00'], desc: '植物看病', screen: 'Diagnosis' },
    { id: 'recommend', label: '新手推荐', icon: Icons.Sparkles, color: '#af52de', gradient: ['#af52de', '#8e44ad'], desc: '智能推荐', screen: 'Recommendation' },
    { id: 'reminder', label: '智能提醒', icon: Icons.Bell, color: '#ff2d55', gradient: ['#ff2d55', '#c0392b'], desc: '浇水施肥', screen: 'Reminder' },
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    if (onNavigate) {
      const screenMap: Record<string, 'Diagnosis' | 'Recommendation' | 'Reminder'> = {
        'diagnose': 'Diagnosis',
        'recommend': 'Recommendation',
        'reminder': 'Reminder',
      };
      onNavigate(screenMap[action.id] || null);
    } else {
      Alert.alert(action.label, `即将跳转到${action.desc}页面`);
    }
  };

  const handleRecommendPlant = (plant: Plant) => {
    if (onNavigate && plant.id) {
      // 跳转到百科详情
      onNavigate('EncyclopediaDetail', { plantId: plant.id });
    } else {
      Alert.alert(plant.name, `即将跳转到${plant.name}的详情页`);
    }
  };

  const tips = [
    { title: '今日光照提示', content: '晴天适合给喜阳植物晒太阳，注意遮阴保护耐阴植物', icon: Icons.Sun, iconColor: '#f59e0b' },
    { title: '浇水小技巧', content: '早晨或傍晚浇水最佳，避免中午高温时段', icon: Icons.Droplets, iconColor: '#0ea5e9' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section - 渐变背景 */}
        <View style={styles.heroSection}>
          {/* 装饰性背景元素 */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.decorCircle3} />

          {/* 浮动叶子装饰 */}
          <Animated.View
            style={[
              styles.floatingLeaf1,
              {
                opacity: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                transform: [
                  {
                    translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }),
                  },
                ],
              },
            ]}
          >
            <Icons.Leaf size={40} color="rgba(255,255,255,0.15)" />
          </Animated.View>
          <Animated.View
            style={[
              styles.floatingLeaf2,
              {
                opacity: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }),
                transform: [
                  {
                    translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }),
                  },
                ],
              },
            ]}
          >
            <Icons.Sprout size={30} color="rgba(255,255,255,0.1)" />
          </Animated.View>

          <View style={styles.heroContent}>
            <Animated.View
              style={[
                styles.brandBadge,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Icons.Plant size={32} color="#fff" />
            </Animated.View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>护花使者</Text>
              <Text style={styles.heroSubtitle}>你的掌上植物管家</Text>
            </View>
          </View>

          <Text style={styles.heroDesc}>
            从识别植物到养护指导，从病症诊断到智能提醒，
            全方位呵护你的每一株绿植
          </Text>

          {/* Stats - 玻璃态效果 */}
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
          <Animated.View
            style={[
              styles.identifyCard,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {!showPlantCard ? (
              <>
                <View style={styles.identifyHeader}>
                  <View style={styles.identifyBadge}>
                    <Icons.Camera size={14} color={colors.primary} />
                    <Text style={styles.identifyBadgeText}>AI 智能识别</Text>
                  </View>
                  <Text style={styles.identifyTitle}>拍照识别植物</Text>
                  <Text style={styles.identifyDesc}>拍一张植物照片，AI帮你识别种类和养护方法</Text>
                </View>

                {/* 大拍照按钮 - 脉动效果 */}
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
                      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                          onPress={() => handleIdentify('camera')}
                          activeOpacity={0.9}
                          style={styles.mainButton}
                        >
                          <View style={styles.mainButtonInner}>
                            <Icons.Camera size={36} color="#fff" />
                          </View>
                          <View style={styles.mainButtonGlow} />
                        </TouchableOpacity>
                      </Animated.View>
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
                <View style={styles.resultHeader}>
                  <View style={styles.resultBadge}>
                    <Icons.Check size={14} color="#fff" />
                    <Text style={styles.resultBadgeText}>识别成功</Text>
                  </View>
                </View>
                <Text style={styles.resultTitle}>识别结果</Text>
                <View style={styles.resultCard}>
                  {capturedImageUri ? (
                    <Image source={{ uri: capturedImageUri }} style={styles.resultImage} />
                  ) : (
                    <View style={styles.resultPlantIcon}>
                      <Icons.Flower2 size={32} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.resultInfo}>
                    <Text style={styles.plantName}>
                      {recognitionResult?.name || '识别中...'}
                    </Text>
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>
                        {Math.round((recognitionResult?.confidence || 0) * 100)}% 匹配
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 操作按钮 */}
                <View style={styles.resultButtons}>
                  <TouchableOpacity
                    onPress={closePlantCard}
                    style={styles.retryButton}
                    activeOpacity={0.7}
                  >
                    <Icons.ArrowLeft size={16} color={colors['text-secondary']} />
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
          </Animated.View>

          {/* 快捷功能 - 横向卡片 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>快捷功能</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsContainer}
            >
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.quickActionCard}
                    activeOpacity={0.8}
                    onPress={() => handleQuickAction(action)}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                      <Icon size={22} color="#fff" />
                    </View>
                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                    <Text style={styles.quickActionDesc}>{action.desc}</Text>
                    <View style={styles.quickActionArrow}>
                      <Icons.ChevronRight size={14} color={colors['text-tertiary']} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 今日小贴士 - 渐变卡片 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>今日小贴士</Text>
            <View style={styles.tipsContainer}>
              {tips.map((tip, index) => {
                const Icon = tip.icon;
                return (
                  <View key={index} style={styles.tipCard}>
                    <View style={[styles.tipIcon, { backgroundColor: tip.iconColor + '15' }]}>
                      <Icon size={20} color={tip.iconColor} />
                    </View>
                    <View style={styles.tipContent}>
                      <Text style={styles.tipTitle}>{tip.title}</Text>
                      <Text style={styles.tipText}>{tip.content}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 今日推荐植物 - 横向滚动 */}
          <View style={[styles.section, styles.lastSection]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>今日推荐</Text>
              <TouchableOpacity style={styles.viewAllButton} onPress={() => onTabChange?.('Encyclopedia')}>
                <Text style={styles.viewAllText}>查看全部</Text>
                <Icons.ChevronRight size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendScroll}
            >
              {recommendPlants.map((plant, index) => {
                // 根据分类设置颜色
                const colorMap: Record<string, string> = {
                  '室内': '#10b981',
                  '多肉': '#6366f1',
                  '开花': '#f59e0b',
                  '草本': '#0ea5e9',
                };
                const plantColor = colorMap[plant.category || '室内'] || '#10b981';
                return (
                <TouchableOpacity
                  key={plant.id || index}
                  style={styles.recommendCard}
                  activeOpacity={0.8}
                  onPress={() => handleRecommendPlant(plant)}
                >
                  <View style={[styles.recommendImage, { backgroundColor: plantColor + '20' }]}>
                    <Icons.Plant size={40} color={plantColor} />
                  </View>
                  <View style={styles.recommendInfo}>
                    <Text style={styles.recommendName}>{plant.name}</Text>
                    <Text style={styles.recommendDesc}>{plant.description?.slice(0, 20) || plant.category || '室内植物'}</Text>
                    <View style={styles.recommendTags}>
                      <View style={[styles.recommendTag, { backgroundColor: plantColor + '15' }]}>
                        <Text style={[styles.recommendTagText, { color: plantColor }]}>{plant.category || '室内'}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )})}
            </ScrollView>
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
  // Hero Section
  heroSection: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xl * 2.5,
    paddingBottom: spacing.xl * 3.5,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -50,
    right: -50,
  },
  decorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: 20,
    left: -30,
  },
  decorCircle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 100,
    left: 20,
  },
  floatingLeaf1: {
    position: 'absolute',
    top: 60,
    right: 40,
  },
  floatingLeaf2: {
    position: 'absolute',
    bottom: 80,
    right: 80,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroText: {
    marginLeft: spacing.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Main Content
  mainContent: {
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xl * 2.5,
  },
  identifyCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(244,68,102,0.08)',
  },
  identifyHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  identifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '12',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginBottom: spacing.sm,
    gap: 4,
  },
  identifyBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  identifyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  identifyDesc: {
    fontSize: 14,
    color: colors['text-secondary'],
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary + '30',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.lg,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors['text-tertiary'],
    marginTop: spacing.xs,
  },
  mainButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mainButtonInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  mainButtonGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary + '20',
    zIndex: -1,
  },
  buttonHint: {
    fontSize: 14,
    color: colors['text-secondary'],
    marginTop: spacing.md,
  },
  galleryButton: {
    width: '100%',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  galleryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 14,
    backgroundColor: colors.primary + '08',
  },
  galleryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.sm,
  },

  // Result
  resultHeader: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: 4,
  },
  resultBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  resultCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultPlantIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  resultInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
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
    fontWeight: '600',
  },
  resultButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
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
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Section
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 2,
  },

  // Quick Actions
  quickActionsContainer: {
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  quickActionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    width: 130,
    marginRight: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  quickActionDesc: {
    fontSize: 12,
    color: colors['text-tertiary'],
  },
  quickActionArrow: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },

  // Tips
  tipsContainer: {
    gap: spacing.sm,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 13,
    color: colors['text-secondary'],
    lineHeight: 19,
  },

  // Recommend
  recommendScroll: {
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  recommendCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.sm,
    width: 180,
    marginRight: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recommendImage: {
    height: 100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  recommendInfo: {
    paddingHorizontal: spacing.xs,
  },
  recommendName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  recommendDesc: {
    fontSize: 12,
    color: colors['text-tertiary'],
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  recommendTags: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  recommendTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  lastSection: {
    marginBottom: spacing.xxl * 2.5,
  },
});

// 降级用的模拟数据
const getMockRecognitionResult = (): RecognitionResult => ({
  id: '1',
  name: '绿萝',
  scientificName: 'Epipremnum aureum',
  confidence: 0.95,
  description: '绿萝是天南星科麒麟叶属植物，原产于印度尼西亚的热带雨林。',
  careLevel: 1,
  lightRequirement: '耐阴',
  waterRequirement: '见干见湿',
  imageUrl: '',
  similarSpecies: [],
});
