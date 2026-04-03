// 病症诊断页面 - 现代简洁移动端设计
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert, Animated, Easing, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, shadows, duration, fontSize, fontWeight, touchTarget } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { pestRecognitionService, DiagnosisResult } from '../services/pestRecognitionService';
import { createDiagnosis } from '../services/diagnosisService';
import { networkMonitor, isNetworkConnected } from '../utils/networkMonitor';

interface DiagnosisScreenProps extends Partial<NavigationProps> {}

export function DiagnosisScreen({ onGoBack, onNavigate, isLoggedIn }: DiagnosisScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [recognitionMode, setRecognitionMode] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    networkMonitor.initialize();
    const unsubscribe = networkMonitor.subscribe((isConnected) => {
      setRecognitionMode(isConnected ? 'online' : 'offline');
    });
    return () => {
      unsubscribe();
      networkMonitor.cleanup();
    };
  }, []);

  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
    setDiagnosisResult(null);
    setCapturedImage(null);
    setIsLoading(false);
    if (onGoBack) {
      onGoBack();
    }
  };

  const handleDiagnose = async (source: 'camera' | 'gallery') => {
    // 检查登录状态
    if (!isLoggedIn) {
      Alert.alert(
        '提示',
        '登录后可保存诊断记录，是否登录？',
        [
          { text: '取消', style: 'cancel' },
          { text: '登录', onPress: () => {
            if (onRequireLogin) onRequireLogin();
          }},
          { text: '继续诊断', onPress: () => proceedWithDiagnosis(source) },
        ]
      );
      return;
    }

    proceedWithDiagnosis(source);
  };

  const proceedWithDiagnosis = async (source: 'camera' | 'gallery') => {
    try {
      setIsLoading(true);
      setDiagnosisResult(null);

      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('权限不足', '需要相机权限');
          setIsLoading(false);
          return;
        }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: 'Images', quality: 0.8 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('权限不足', '需要相册权限');
          setIsLoading(false);
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'Images', quality: 0.8 });
      }

      if (result.canceled || !result.assets?.length) {
        setIsLoading(false);
        return;
      }

      const imageUri = result.assets[0].uri;
      const diagnosisResult: DiagnosisResult = await pestRecognitionService.recognize(imageUri);

      // 保存诊断记录到后端
      try {
        if (isLoggedIn) {
          console.log('[Diagnosis] Saving record, isLoggedIn:', isLoggedIn);
          await createDiagnosis({
            image_url: imageUri,
            disease_name: diagnosisResult.name,
            confidence: diagnosisResult.confidence,
            description: diagnosisResult.treatment, // 使用治疗建议作为描述
            treatment: diagnosisResult.treatment,
            prevention: diagnosisResult.prevention,
            recommended_products: '',
          });
          console.log('[Diagnosis] Record saved successfully');
        } else {
          console.log('[Diagnosis] Not logged in, skipping save');
        }
      } catch (saveError: any) {
        console.error('[Diagnosis] Failed to save record:', saveError?.response?.data || saveError);
      }

      setCapturedImage(imageUri);
      setDiagnosisResult(diagnosisResult);

      const isConnected = await isNetworkConnected();
      setRecognitionMode(isConnected ? 'online' : 'offline');
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
  const confidencePercent = Math.round((diagnosisResult?.confidence || 0) * 100);

  // 重新诊断
  const handleReDiagnose = () => {
    setDiagnosisResult(null);
    setCapturedImage(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 头部 */}
        <View style={styles.header}>
          <View style={styles.headerBg} />
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={duration.pressed}>
            <Icons.ChevronLeft size={22} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.headerTitle}>病症诊断</Text>
            <Text style={styles.headerSubtitle}>AI智能识别病虫害</Text>
          </View>
        </View>

        {/* 初始状态 */}
        {!diagnosisResult && !isLoading && (
          <View style={styles.content}>
            {/* 主操作按钮 */}
            <TouchableOpacity style={styles.primaryBtn} onPress={() => handleDiagnose('camera')} activeOpacity={0.8}>
              <View style={styles.primaryBtnIcon}>
                <Icons.Camera size={28} color={colors.white} />
              </View>
              <View style={styles.primaryBtnText}>
                <Text style={styles.primaryBtnTitle}>拍照诊断</Text>
                <Text style={styles.primaryBtnDesc}>拍摄植物病害部位</Text>
              </View>
              <Icons.ChevronRight size={20} color={colors.white} />
            </TouchableOpacity>

            {/* 次要按钮 */}
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleDiagnose('gallery')} activeOpacity={0.8}>
              <View style={styles.secondaryBtnIcon}>
                <Icons.Image size={24} color={colors.primary} />
              </View>
              <View style={styles.secondaryBtnText}>
                <Text style={styles.secondaryBtnTitle}>相册选择</Text>
                <Text style={styles.secondaryBtnDesc}>从相册选取照片</Text>
              </View>
              <Icons.ChevronRight size={18} color={colors['text-tertiary']} />
            </TouchableOpacity>

            {/* 技巧卡片 */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Icons.Lightbulb size={18} color={colors.warning} />
                <Text style={styles.tipsTitle}>拍摄技巧</Text>
              </View>
              <View style={styles.tipsItems}>
                <Text style={styles.tipItem}>• 拍摄清晰的照片，避免模糊</Text>
                <Text style={styles.tipItem}>• 包含整体植株和病害部位特写</Text>
                <Text style={styles.tipItem}>• 最好在自然光下拍摄</Text>
              </View>
            </View>

            {/* 快捷入口 */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate?.('DiagnosisHistory')}>
                <Icons.History size={20} color={colors.secondary} />
                <Text style={styles.quickActionText}>诊断历史</Text>
                <Icons.ChevronRight size={16} color={colors['text-tertiary']} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate?.('ConsultationList')}>
                <Icons.MessageCircle size={20} color={colors.info} />
                <Text style={styles.quickActionText}>问诊室</Text>
                <Icons.ChevronRight size={16} color={colors['text-tertiary']} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => onNavigate?.('Knowledge')}>
                <Icons.BookOpen size={20} color={colors.primary} />
                <Text style={styles.quickActionText}>养护知识</Text>
                <Icons.ChevronRight size={16} color={colors['text-tertiary']} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 加载状态 */}
        {isLoading && (
          <View style={styles.loadingWrapper}>
            <Animated.View style={[styles.loadingCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Icons.Bug size={40} color={colors.primary} />
            </Animated.View>
            <Text style={styles.loadingTitle}>AI正在分析...</Text>
            <Text style={styles.loadingDesc}>正在识别病虫害特征</Text>
            <View style={styles.loadingSteps}>
              <View style={styles.loadingStep}>
                <Icons.CheckCircle size={14} color={colors.success} />
                <Text style={styles.loadingStepText}>图像上传完成</Text>
              </View>
              <View style={styles.loadingStep}>
                <Icons.Loader size={14} color={colors.primary} />
                <Text style={styles.loadingStepText}>AI模型分析中</Text>
              </View>
            </View>
          </View>
        )}

        {/* 诊断结果 */}
        {diagnosisResult && severityConfig && (
          <View style={styles.resultWrapper}>
            {/* 图片展示 */}
            {capturedImage && typeof capturedImage === 'string' && capturedImage.trim().length > 0 && (
              <View style={styles.imageSection}>
                <Image source={{ uri: capturedImage }} style={styles.resultImage} />
                <View style={styles.imageTags}>
                  <View style={styles.imageTag}>
                    <Icons.Image size={12} color={colors.white} />
                    <Text style={styles.imageTagText}>识别图片</Text>
                  </View>
                  <View style={[styles.modeTag, { backgroundColor: recognitionMode === 'online' ? colors.success : colors.warning }]}>
                    <Icons.Wifi size={10} color={colors.white} />
                    <Text style={styles.modeTagText}>{recognitionMode === 'online' ? '在线' : '离线'}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 置信度 */}
            <View style={styles.confidenceSection}>
              <View style={styles.confidenceHeader}>
                <Text style={styles.confidenceLabel}>置信度</Text>
                <Text style={[styles.confidenceValue, { color: severityConfig.color }]}>{confidencePercent}%</Text>
              </View>
              <View style={styles.confidenceBar}>
                <View style={[styles.confidenceBarFill, { width: `${confidencePercent}%`, backgroundColor: severityConfig.color }]} />
              </View>
            </View>

            {/* 结果卡片 */}
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.resultHeaderLeft}>
                  <Icons.CheckCircle size={20} color={colors.success} />
                  <Text style={styles.resultTitle}>诊断结果</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: severityConfig.bgColor }]}>
                  {SeverityIcon && <SeverityIcon size={14} color={severityConfig.color} />}
                  <Text style={[styles.severityText, { color: severityConfig.color }]}>{severityConfig.label}</Text>
                </View>
              </View>

              {/* 病害名称 */}
              <View style={styles.resultItem}>
                <View style={styles.resultItemHeader}>
                  <View style={[styles.resultItemIcon, { backgroundColor: colors.warningLight }]}>
                    <Icons.AlertCircle size={14} color={colors.warning} />
                  </View>
                  <Text style={styles.resultItemLabel}>病害名称</Text>
                </View>
                <Text style={styles.resultItemValue}>{diagnosisResult.name}</Text>
              </View>

              {/* 病害类型 */}
              <View style={styles.resultItem}>
                <View style={styles.resultItemHeader}>
                  <View style={[styles.resultItemIcon, { backgroundColor: colors.infoLight }]}>
                    <Icons.Search size={14} color={colors.info} />
                  </View>
                  <Text style={styles.resultItemLabel}>病害类型</Text>
                </View>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {diagnosisResult.type === 'disease' ? '真菌性病害' :
                     diagnosisResult.type === 'insect' ? '虫害' :
                     diagnosisResult.type === 'physiological' ? '生理病害' : '未知'}
                  </Text>
                </View>
              </View>

              {/* 治疗建议 */}
              <View style={styles.resultItem}>
                <View style={styles.resultItemHeader}>
                  <View style={[styles.resultItemIcon, { backgroundColor: colors.successLight }]}>
                    <Icons.Stethoscope size={14} color={colors.success} />
                  </View>
                  <Text style={styles.resultItemLabel}>治疗建议</Text>
                </View>
                <Text style={styles.resultItemText}>{diagnosisResult.treatment}</Text>
              </View>

              {/* 预防措施 */}
              <View style={styles.resultItem}>
                <View style={styles.resultItemHeader}>
                  <View style={[styles.resultItemIcon, { backgroundColor: colors.primaryLight + '20' }]}>
                    <Icons.ShieldCheck size={14} color={colors.primary} />
                  </View>
                  <Text style={styles.resultItemLabel}>预防措施</Text>
                </View>
                <Text style={styles.resultItemText}>{diagnosisResult.prevention}</Text>
              </View>

              {/* 紧急处理 */}
              {diagnosisResult.recommendations?.immediate && (
                <View style={styles.resultItem}>
                  <View style={styles.resultItemHeader}>
                    <View style={[styles.resultItemIcon, { backgroundColor: colors.errorLight }]}>
                      <Icons.AlertTriangle size={14} color={colors.error} />
                    </View>
                    <Text style={styles.resultItemLabel}>紧急处理</Text>
                  </View>
                  <Text style={styles.resultItemText}>{diagnosisResult.recommendations.immediate}</Text>
                </View>
              )}
            </View>

            {/* 操作按钮 */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.retryBtn} onPress={handleReDiagnose} activeOpacity={0.7}>
                <Icons.Camera size={16} color={colors.primary} />
                <Text style={styles.retryBtnText}>再次诊断</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.consultBtn} onPress={() => {
                const typeLabel = diagnosisResult.type === 'disease' ? '真菌性病害' :
                  diagnosisResult.type === 'insect' ? '虫害' :
                  diagnosisResult.type === 'physiological' ? '生理病害' : '未知';
                const severityLabel = diagnosisResult.severity === 'high' ? '严重' :
                  diagnosisResult.severity === 'medium' ? '中等' : '轻微';
                onNavigate?.('Consultation', {
                  diagnosisContext: {
                    currentDiagnosis: {
                      name: diagnosisResult.name,
                      type: typeLabel,
                      severity: severityLabel,
                      confidence: Math.round(diagnosisResult.confidence * 100)
                    }
                  }
                });
              }} activeOpacity={0.7}>
                <Icons.MessageCircle size={16} color={colors.white} />
                <Text style={styles.consultBtnText}>咨询医生</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: spacing.xxxl,
  },

  // 头部
  header: {
    position: 'relative',
    backgroundColor: colors.primary,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  headerBg: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.white + '10',
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    borderRadius: touchTarget.minimum / 2,
    backgroundColor: colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.white + '80',
  },

  // 内容
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },

  // 主按钮
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  primaryBtnIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  primaryBtnText: {
    flex: 1,
  },
  primaryBtnTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: 2,
  },
  primaryBtnDesc: {
    fontSize: fontSize.sm,
    color: colors.white + '85',
  },

  // 次要按钮
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  secondaryBtnIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  secondaryBtnText: {
    flex: 1,
  },
  secondaryBtnTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  secondaryBtnDesc: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
  },

  // 技巧卡片
  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  tipsItems: {
    paddingLeft: spacing.xs,
  },
  tipItem: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    lineHeight: 22,
  },

  // 快捷入口
  quickActions: {
    gap: spacing.sm,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginLeft: spacing.md,
  },

  // 加载
  loadingWrapper: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  loadingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
    marginBottom: spacing.xl,
  },
  loadingTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  loadingDesc: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    marginBottom: spacing.xl,
  },
  loadingSteps: {
    gap: spacing.sm,
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingStepText: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
  },

  // 结果
  resultWrapper: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  imageSection: {
    position: 'relative',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  resultImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surface,
  },
  imageTags: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.black + '40',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  imageTagText: {
    fontSize: fontSize.xs,
    color: colors.white,
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  modeTagText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },

  // 置信度
  confidenceSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  confidenceLabel: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    fontWeight: fontWeight.medium,
  },
  confidenceValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // 结果卡片
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: spacing.md,
  },
  resultHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  severityText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  resultItem: {
    marginBottom: spacing.md,
  },
  resultItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  resultItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  resultItemLabel: {
    fontSize: fontSize.sm,
    color: colors['text-tertiary'],
    fontWeight: fontWeight.medium,
  },
  resultItemValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginLeft: 36,
  },
  resultItemText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    marginLeft: 36,
  },
  typeBadge: {
    marginLeft: 36,
  },
  typeBadgeText: {
    fontSize: fontSize.sm,
    color: colors.info,
    fontWeight: fontWeight.medium,
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },

  // 操作按钮
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  retryBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  consultBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  consultBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
