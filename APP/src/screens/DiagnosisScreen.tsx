// 病症诊断页面 - Neumorphism 风格美化
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator, Alert, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, shadows, duration } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { hybridRecognitionService, RecognitionResult } from '../services/hybridRecognition';
import { networkMonitor } from '../utils/networkMonitor';

interface DiagnosisScreenProps extends Partial<NavigationProps> {}

interface DiagnosisDisplayResult {
  id: string;
  symptom: string;
  possibleCauses: string[];
  severity: 'low' | 'medium' | 'high';
  treatment: string;
  prevention: string;
}

// 模拟诊断结果
const mockDiagnosis: DiagnosisResult = {
  id: '1',
  symptom: '叶片发黄',
  possibleCauses: ['浇水过多', '缺少光照', '缺铁'],
  severity: 'medium',
  treatment: '1. 检查土壤湿度，必要时换土\n2. 移至散光充足处\n3. 施加含铁肥料',
  prevention: '遵循"见干见湿"浇水原则，保持通风',
};

export function DiagnosisScreen({ onGoBack, onNavigate, currentTab, onTabChange }: DiagnosisScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisDisplayResult | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [recognitionMode, setRecognitionMode] = useState<'online' | 'offline'>('online');

  // 初始化混合识别服务和网络监测
  useEffect(() => {
    hybridRecognitionService.initialize();
    networkMonitor.initialize();

    // 订阅网络状态变化
    const unsubscribe = networkMonitor.subscribe((isConnected) => {
      setRecognitionMode(isConnected ? 'online' : 'offline');
    });

    return () => {
      unsubscribe();
      networkMonitor.cleanup();
    };
  }, []);

  // 脉冲动画
  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLoading, pulseAnim]);

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  const handleDiagnose = async (source: 'camera' | 'gallery') => {
    try {
      setIsLoading(true);
      setDiagnosisResult(null);

      const response = source === 'camera'
        ? await launchCamera({ mediaType: 'photo', quality: 0.8 })
        : await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });

      if (response.didCancel || !response.assets?.length) {
        setIsLoading(false);
        return;
      }

      const imageUri = response.assets[0].uri!;

      // 使用混合识别服务（自动在线/离线切换）
      const result: RecognitionResult = await hybridRecognitionService.recognize(imageUri);

      // 将识别结果转换为显示格式
      const displayResult: DiagnosisDisplayResult = {
        id: result.id,
        symptom: result.name, // 显示植物名称作为"症状"
        possibleCauses: result.careTips ? [result.careTips] : [], // 养护提示作为可能原因
        severity: result.confidence > 0.8 ? 'low' : result.confidence > 0.5 ? 'medium' : 'high',
        treatment: result.careTips || result.description || '暂无养护信息',
        prevention: result.careTips || '暂无预防措施',
      };

      setDiagnosisResult(displayResult);
      setRecognitionMode(result.mode);
    } catch (error) {
      Alert.alert('识别失败', '请重试');
      console.error('Recognition error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'high':
        return { label: '严重', color: colors.error, bgColor: colors.errorLight, icon: Icons.AlertCircle };
      case 'medium':
        return { label: '中等', color: colors.warning, bgColor: colors.warningLight, icon: Icons.AlertTriangle };
      default:
        return { label: '轻微', color: colors.success, bgColor: colors.successLight, icon: Icons.Check };
    }
  };

  const severityConfig = diagnosisResult ? getSeverityConfig(diagnosisResult.severity) : null;
  const SeverityIcon = severityConfig?.icon;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 头部区域 - 渐变背景 */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.backButton}
            activeOpacity={duration.pressed}
          >
            <Icons.ChevronLeft size={22} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            {/* 装饰性背景圆 */}
            <View style={styles.headerDecor1} />
            <View style={styles.headerDecor2} />

            <View style={styles.headerIconContainer}>
              <View style={styles.headerIcon}>
                <Icons.AlertCircle size={36} color={colors.white} />
              </View>
            </View>
            <Text style={styles.headerTitle}>病症诊断</Text>
            <Text style={styles.headerSubtitle}>AI智能识别 · 精准诊断</Text>
          </View>
        </View>

        {/* 初始状态 */}
        {!diagnosisResult && !isLoading && (
          <View style={styles.content}>
            {/* 操作按钮 - Neumorphism 风格 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => handleDiagnose('camera')}
                style={({ pressed }) => [
                  styles.mainButton,
                  pressed && styles.mainButtonPressed
                ]}
                activeOpacity={0.9}
              >
                <View style={styles.mainButtonIcon}>
                  <Icons.Camera size={28} color={colors.white} />
                </View>
                <Text style={styles.mainButtonText}>拍照诊断</Text>
                <Text style={styles.mainButtonHint}>拍摄植物病害部位</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDiagnose('gallery')}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed
                ]}
                activeOpacity={0.9}
              >
                <View style={[styles.secondaryButtonIcon, { backgroundColor: colors.primaryLight + '20' }]}>
                  <Icons.Image size={26} color={colors.primary} />
                </View>
                <Text style={styles.secondaryButtonText}>相册选择</Text>
                <Text style={styles.secondaryButtonHint}>从相册选取照片</Text>
              </TouchableOpacity>
            </View>

            {/* 拍摄建议卡片 - Neumorphism 风格 */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <View style={styles.tipsIconContainer}>
                  <Icons.Camera size={20} color={colors.primary} />
                </View>
                <Text style={styles.tipsTitle}>拍摄技巧</Text>
                <View style={styles.tipsBadge}>
                  <Text style={styles.tipsBadgeText}>建议</Text>
                </View>
              </View>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.tipText}>拍摄清晰的照片，避免模糊</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.tipText}>包含整体植株和病害部位特写</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.tipText}>最好在自然光下拍摄，避免逆光</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.tipText}>确保对焦准确，病斑清晰可见</Text>
                </View>
              </View>
            </View>

            {/* 快速入口 */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
                <Icons.History size={22} color={colors.secondary} />
                <Text style={styles.quickActionText}>诊断历史</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
                <Icons.MessageCircle size={22} color={colors.info} />
                <Text style={styles.quickActionText}>急诊室</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 加载中状态 */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Animated.View style={[styles.loadingCircle, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.loadingInner}>
                <Icons.AlertCircle size={48} color={colors.primary} />
              </View>
            </Animated.View>
            <View style={styles.loadingDots}>
              <View style={[styles.loadingDot, styles.loadingDotActive]} />
              <View style={styles.loadingDot} />
              <View style={styles.loadingDot} />
            </View>
            <Text style={styles.loadingText}>AI正在分析中...</Text>
            <Text style={styles.loadingSubtext}>
              正在识别病虫害特征{"\n"}
              通过深度学习模型分析植物健康状况
            </Text>
          </View>
        )}

        {/* 诊断结果 */}
        {diagnosisResult && severityConfig && (
          <View style={styles.resultContent}>
            {/* 结果头部 */}
            <View style={styles.resultHeader}>
              <View style={styles.resultHeaderLeft}>
                <Text style={styles.resultTitle}>诊断结果</Text>
                <Text style={styles.resultSubtitle}>AI智能分析</Text>
              </View>
              <View style={[styles.severityBadge, { backgroundColor: severityConfig.bgColor }]}>
                {SeverityIcon && <SeverityIcon size={18} color={severityConfig.color} />}
                <Text style={[styles.severityText, { color: severityConfig.color }]}>{severityConfig.label}</Text>
              </View>
            </View>

            {/* 结果详情卡片 */}
            <View style={styles.resultCard}>
              {/* 症状 */}
              <View style={styles.resultSection}>
                <View style={styles.resultSectionHeader}>
                  <View style={[styles.resultSectionIcon, { backgroundColor: colors.warningLight }]}>
                    <Icons.AlertCircle size={18} color={colors.warning} />
                  </View>
                  <Text style={styles.resultLabel}>症状描述</Text>
                </View>
                <Text style={styles.resultValue}>{diagnosisResult.symptom}</Text>
              </View>

              {/* 可能原因 */}
              <View style={styles.resultSection}>
                <View style={styles.resultSectionHeader}>
                  <View style={[styles.resultSectionIcon, { backgroundColor: colors.infoLight }]}>
                    <Icons.Search size={18} color={colors.info} />
                  </View>
                  <Text style={styles.resultLabel}>可能原因</Text>
                </View>
                <View style={styles.causesList}>
                  {diagnosisResult.possibleCauses.map((cause, index) => (
                    <View key={index} style={styles.causeItem}>
                      <View style={[styles.causeDot, { backgroundColor: colors.warning }]} />
                      <Text style={styles.causeText}>{cause}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 治疗建议 */}
              <View style={styles.resultSection}>
                <View style={styles.resultSectionHeader}>
                  <View style={[styles.resultSectionIcon, { backgroundColor: colors.successLight }]}>
                    <Icons.Stethoscope size={18} color={colors.success} />
                  </View>
                  <Text style={styles.resultLabel}>治疗建议</Text>
                </View>
                <Text style={styles.resultText}>{diagnosisResult.treatment}</Text>
              </View>

              {/* 预防措施 */}
              <View style={styles.resultSection}>
                <View style={styles.resultSectionHeader}>
                  <View style={[styles.resultSectionIcon, { backgroundColor: colors.primaryLight + '20' }]}>
                    <Icons.ShieldCheck size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.resultLabel}>预防措施</Text>
                </View>
                <Text style={styles.resultText}>{diagnosisResult.prevention}</Text>
              </View>
            </View>

            {/* 操作按钮 */}
            <TouchableOpacity
              onPress={() => setDiagnosisResult(null)}
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
              activeOpacity={0.9}
            >
              <Icons.Camera size={20} color={colors.primary} />
              <Text style={styles.retryButtonText}>再次诊断</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={({ pressed }) => [styles.communityButton, pressed && styles.communityButtonPressed]}
              activeOpacity={0.9}
            >
              <Icons.MessageCircle size={20} color={colors.white} />
              <Text style={styles.communityButtonText}>发布到社区急诊室</Text>
              <Icons.ChevronRight size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // 头部样式 - Neumorphism 渐变风格
  header: {
    position: 'relative',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.primaryLight + '15',
  },
  headerDecor2: {
    position: 'absolute',
    top: 20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondary + '10',
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    top: spacing.lg,
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    borderRadius: touchTarget.minimum / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...shadows.sm,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  headerIconContainer: {
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
  },

  // 内容区域
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },

  // 按钮区域 - Neumorphism 风格
  buttonContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  mainButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainButtonPressed: {
    ...shadows.sm,
    transform: [{ scale: 0.98 }],
  },
  mainButtonIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  mainButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  mainButtonHint: {
    fontSize: fontSize.sm,
    color: colors['text-tertiary'],
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonPressed: {
    ...shadows.sm,
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  secondaryButtonHint: {
    fontSize: fontSize.sm,
    color: colors['text-tertiary'],
  },

  // 拍摄建议卡片
  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tipsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  tipsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  tipsBadge: {
    backgroundColor: colors.secondary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tipsBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.secondary,
  },
  tipsList: {
    gap: spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  tipText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    lineHeight: 22,
  },

  // 快速入口
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },

  // 加载状态
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingTop: spacing.xxl,
  },
  loadingCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xl,
    borderWidth: 3,
    borderColor: colors.primary + '30',
  },
  loadingInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  loadingDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  loadingText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  loadingSubtext: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    textAlign: 'center',
    lineHeight: 24,
  },

  // 结果展示
  resultContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultHeaderLeft: {
    flex: 1,
  },
  resultTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  resultSubtitle: {
    fontSize: fontSize.sm,
    color: colors['text-tertiary'],
    marginTop: spacing.xs,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  severityText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  // 结果卡片
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultSection: {
    marginBottom: spacing.lg,
  },
  resultSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultSectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  resultLabel: {
    fontSize: fontSize.md,
    color: colors['text-tertiary'],
    fontWeight: fontWeight.semibold,
  },
  resultValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginLeft: 44,
  },
  resultText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 26,
    marginLeft: 44,
  },
  causesList: {
    gap: spacing.sm,
    marginLeft: 44,
  },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  causeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  causeText: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },

  // 操作按钮
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  retryButtonPressed: {
    ...shadows.sm,
    transform: [{ scale: 0.98 }],
  },
  retryButtonText: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  communityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    marginBottom: spacing.xxxl,
  },
  communityButtonPressed: {
    ...shadows.sm,
    transform: [{ scale: 0.98 }],
  },
  communityButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});

// 添加缺失的导入
const touchTarget = {
  minimum: 44,
  comfortable: 48,
  large: 56,
};

const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
