// 病症诊断页面 - 使用纯 StyleSheet
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface DiagnosisScreenProps extends Partial<NavigationProps> {}

interface DiagnosisResult {
  id: string;
  symptom: string;
  possibleCauses: string[];
  severity: 'low' | 'medium' | 'high';
  treatment: string;
  prevention: string;
}

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
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);

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
      await new Promise<void>(resolve => setTimeout(resolve, 2000));
      setDiagnosisResult(mockDiagnosis);
    } catch (error) {
      Alert.alert('诊断失败', '请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'high': return { label: '严重', color: colors.error, bgColor: colors.error + '15', icon: Icons.AlertCircle };
      case 'medium': return { label: '中等', color: colors.warning, bgColor: colors.warning + '15', icon: Icons.AlertTriangle };
      default: return { label: '轻微', color: colors.success, bgColor: colors.success + '15', icon: Icons.Check };
    }
  };

  const severityConfig = diagnosisResult ? getSeverityConfig(diagnosisResult.severity) : null;
  const SeverityIcon = severityConfig?.icon;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 头部区域 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icons.ChevronLeft size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}><Icons.AlertCircle size={32} color={colors.warning} /></View>
            <Text style={styles.headerTitle}>病症诊断</Text>
            <Text style={styles.headerSubtitle}>AI智能预诊，告别植物杀手</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* 初始状态 */}
        {!diagnosisResult && !isLoading && (
          <View style={styles.content}>
            {/* 操作按钮 */}
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => handleDiagnose('camera')} style={styles.mainButton} activeOpacity={0.8}>
                <Icons.Camera size={24} color="#fff" />
                <Text style={styles.mainButtonText}>拍照诊断</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDiagnose('gallery')} style={styles.secondaryButton} activeOpacity={0.8}>
                <Icons.Image size={24} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>相册选择</Text>
              </TouchableOpacity>
            </View>

            {/* 拍摄建议卡片 */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsTitleRow}>
                <Icons.Camera size={18} color={colors.primary} />
                <Text style={styles.tipsTitle}>拍摄建议</Text>
              </View>
              <View style={styles.tipsList}>
                <Text style={styles.tipsText}>• 拍摄清晰的照片，避免模糊</Text>
                <Text style={styles.tipsText}>• 包含整体植株和病害部位特写</Text>
                <Text style={styles.tipsText}>• 最好在自然光下拍摄，避免逆光</Text>
                <Text style={styles.tipsText}>• 确保对焦准确，病斑清晰可见</Text>
              </View>
            </View>
          </View>
        )}

        {/* 加载中状态 */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCircle}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={styles.loadingText}>AI正在分析中...</Text>
            <Text style={styles.loadingSubtext}>请稍候，正在识别病虫害特征{"\n"}通过深度学习模型分析植物健康状况</Text>
          </View>
        )}

        {/* 诊断结果 */}
        {diagnosisResult && severityConfig && (
          <View style={styles.resultContent}>
            {/* 结果头部 */}
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>诊断结果</Text>
              <View style={[styles.severityBadge, { backgroundColor: severityConfig.bgColor }]}>
                {SeverityIcon && <SeverityIcon size={16} color={severityConfig.color} />}
                <Text style={[styles.severityText, { color: severityConfig.color }]}>{severityConfig.label}</Text>
              </View>
            </View>

            {/* 结果详情卡片 */}
            <View style={styles.resultCard}>
              <View style={styles.resultSection}>
                <View style={styles.resultSectionHeader}>
                  <Icons.AlertCircle size={18} color={colors.warning} />
                  <Text style={styles.resultLabel}>症状</Text>
                </View>
                <Text style={styles.resultValue}>{diagnosisResult.symptom}</Text>
              </View>

              <View style={styles.resultSection}>
                <View style={styles.resultSectionHeader}>
                  <Icons.Search size={18} color={colors.info} />
                  <Text style={styles.resultLabel}>可能原因</Text>
                </View>
                <View style={styles.causesList}>
                  {diagnosisResult.possibleCauses.map((cause, index) => (
                    <View key={index} style={styles.causeItem}>
                      <View style={styles.causeDot} />
                      <Text style={styles.causeText}>{cause}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.resultSection}>
                <View style={styles.resultSectionHeader}>
                  <Icons.Stethoscope size={18} color={colors.success} />
                  <Text style={styles.resultLabel}>治疗建议</Text>
                </View>
                <Text style={styles.resultText}>{diagnosisResult.treatment}</Text>
              </View>

              <View style={styles.resultSection}>
                <View style={styles.resultSectionHeader}>
                  <Icons.ShieldCheck size={18} color={colors.primary} />
                  <Text style={styles.resultLabel}>预防措施</Text>
                </View>
                <Text style={styles.resultText}>{diagnosisResult.prevention}</Text>
              </View>
            </View>

            {/* 操作按钮 */}
            <TouchableOpacity onPress={() => setDiagnosisResult(null)} style={styles.retryButton} activeOpacity={0.8}>
              <Icons.Camera size={20} color={colors.primary} />
              <Text style={styles.retryButtonText}>再次诊断</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.communityButton} activeOpacity={0.8}>
              <Icons.MessageCircle size={20} color="#fff" />
              <Text style={styles.communityButtonText}>发布到社区急诊室</Text>
              <Icons.ChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // 头部样式
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingTop: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 140,
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  placeholder: { width: 36 },
  headerContent: { flex: 1, alignItems: 'center' },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },

  // 内容区域
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  // 按钮区域
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  mainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  mainButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600' },

  // 拍摄建议卡片
  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  tipsTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  tipsList: { gap: spacing.xs },
  tipsText: { fontSize: 14, color: colors['text-secondary'], lineHeight: 22, marginLeft: spacing.lg },

  // 加载状态
  loadingContainer: { alignItems: 'center', paddingVertical: spacing.xxl * 2, paddingTop: spacing.xxl },
  loadingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 3,
    borderColor: colors.primary + '30',
  },
  loadingText: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginTop: spacing.lg },
  loadingSubtext: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs, textAlign: 'center', lineHeight: 22 },

  // 结果展示
  resultContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  severityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  severityText: { fontSize: 14, fontWeight: '600' },

  // 结果卡片
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultSection: { marginBottom: spacing.md },
  resultSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  resultLabel: { fontSize: 14, color: colors['text-tertiary'], fontWeight: '600' },
  resultValue: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  resultText: { fontSize: 15, color: colors.text, lineHeight: 24 },
  causesList: { gap: spacing.sm },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: 10,
  },
  causeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning, marginRight: spacing.sm },
  causeText: { fontSize: 14, color: colors['text-secondary'], flex: 1 },

  // 操作按钮
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  retryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  communityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: 14,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing.xxl * 2,
  },
  communityButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
