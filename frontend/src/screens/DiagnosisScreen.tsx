// 病症诊断页面
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Image, Loader2, MessageCircle, ChevronRight } from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

// 诊断结果类型
interface DiagnosisResult {
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

export function DiagnosisScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);

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

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      setDiagnosisResult(mockDiagnosis);
    } catch (error) {
      Alert.alert('诊断失败', '请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      default: return colors.secondary;
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high': return '严重';
      case 'medium': return '中等';
      default: return '轻微';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 头部 */}
        <View style={styles.header}>
          <Text style={styles.title}>病症诊断</Text>
          <Text style={styles.subtitle}>AI智能预诊，告别植物杀手</Text>
        </View>

        {/* 诊断区域 */}
        {!diagnosisResult && !isLoading && (
          <View style={styles.diagnoseSection}>
            <View style={styles.diagnoseButtons}>
              <TouchableOpacity
                style={styles.diagnoseButton}
                onPress={() => handleDiagnose('camera')}
              >
                <Camera size={32} color={colors.white} />
                <Text style={styles.diagnoseButtonText}>拍照诊断</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.diagnoseButton, styles.galleryButton]}
                onPress={() => handleDiagnose('gallery')}
              >
                <Image size={32} color={colors.primary} />
                <Text style={[styles.diagnoseButtonText, styles.galleryButtonText]}>相册选择</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tips}>
              <Text style={styles.tipsTitle}>拍摄建议</Text>
              <Text style={styles.tipsText}>• 拍摄清晰的照片</Text>
              <Text style={styles.tipsText}>• 包含整体植株和病害部位</Text>
              <Text style={styles.tipsText}>• 最好在自然光下拍摄</Text>
            </View>
          </View>
        )}

        {/* 加载中 */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>AI正在分析中...</Text>
            <Text style={styles.loadingSubtext}>请稍候，正在识别病虫害特征</Text>
          </View>
        )}

        {/* 诊断结果 */}
        {diagnosisResult && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>诊断结果</Text>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(diagnosisResult.severity) + '20' }]}>
                <Text style={[styles.severityText, { color: getSeverityColor(diagnosisResult.severity) }]}>
                  {getSeverityText(diagnosisResult.severity)}
                </Text>
              </View>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.symptomLabel}>症状</Text>
              <Text style={styles.symptomText}>{diagnosisResult.symptom}</Text>

              <Text style={styles.causeLabel}>可能原因</Text>
              <View style={styles.causesList}>
                {diagnosisResult.possibleCauses.map((cause, index) => (
                  <View key={index} style={styles.causeItem}>
                    <Text style={styles.causeText}>• {cause}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.treatmentLabel}>治疗建议</Text>
              <Text style={styles.treatmentText}>{diagnosisResult.treatment}</Text>

              <Text style={styles.preventionLabel}>预防措施</Text>
              <Text style={styles.preventionText}>{diagnosisResult.prevention}</Text>
            </View>

            {/* 再次诊断 */}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setDiagnosisResult(null)}
            >
              <Camera size={20} color={colors.primary} />
              <Text style={styles.retryButtonText}>再次诊断</Text>
            </TouchableOpacity>

            {/* 社区求助 */}
            <TouchableOpacity style={styles.communityButton}>
              <MessageCircle size={20} color={colors.white} />
              <Text style={styles.communityButtonText}>发布到社区急诊室</Text>
              <ChevronRight size={20} color={colors.white} />
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
  content: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
  diagnoseSection: {
    padding: spacing.lg,
  },
  diagnoseButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  diagnoseButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  galleryButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  diagnoseButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  galleryButtonText: {
    color: colors.primary,
  },
  tips: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  tipsTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tipsText: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xl * 2,
  },
  loadingText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.lg,
  },
  loadingSubtext: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
  resultSection: {
    padding: spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  severityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  severityText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  symptomLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors['text-secondary'],
  },
  symptomText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  causeLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors['text-secondary'],
    marginBottom: spacing.xs,
  },
  causesList: {
    marginBottom: spacing.md,
  },
  causeItem: {
    marginBottom: spacing.xs,
  },
  causeText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  treatmentLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors['text-secondary'],
    marginBottom: spacing.xs,
  },
  treatmentText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  preventionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors['text-secondary'],
    marginBottom: spacing.xs,
  },
  preventionText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  retryButtonText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.primary,
  },
  communityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  communityButtonText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
});
