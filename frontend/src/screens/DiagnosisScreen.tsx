// 病症诊断页面 - 使用纯 StyleSheet
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';

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
      case 'high': return { label: '严重', color: colors.error, bgColor: colors.error + '15' };
      case 'medium': return { label: '中等', color: colors.warning, bgColor: colors.warning + '15' };
      default: return { label: '轻微', color: colors.success, bgColor: colors.success + '15' };
    }
  };

  const severityConfig = diagnosisResult ? getSeverityConfig(diagnosisResult.severity) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}><Icons.AlertCircle size={24} color={colors.warning} /></View>
          <Text style={styles.headerTitle}>病症诊断</Text>
          <Text style={styles.headerSubtitle}>AI智能预诊，告别植物杀手</Text>
        </View>

        {!diagnosisResult && !isLoading && (
          <View style={styles.content}>
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => handleDiagnose('camera')} style={styles.mainButton} activeOpacity={0.7}>
                <Icons.Camera size={24} color="#fff" />
                <Text style={styles.mainButtonText}>拍照诊断</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDiagnose('gallery')} style={styles.secondaryButton} activeOpacity={0.7}>
                <Icons.Image size={24} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>相册选择</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>拍摄建议</Text>
              <Text style={styles.tipsText}>• 拍摄清晰的照片</Text>
              <Text style={styles.tipsText}>• 包含整体植株和病害部位</Text>
              <Text style={styles.tipsText}>• 最好在自然光下拍摄</Text>
            </View>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCircle}><ActivityIndicator size="large" color={colors.primary} /></View>
            <Text style={styles.loadingText}>AI正在分析中...</Text>
            <Text style={styles.loadingSubtext}>请稍候，正在识别病虫害特征</Text>
          </View>
        )}

        {diagnosisResult && (
          <View style={styles.resultContent}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>诊断结果</Text>
              {severityConfig && <View style={[styles.severityBadge, { backgroundColor: severityConfig.bgColor }]}><Text style={[styles.severityText, { color: severityConfig.color }]}>{severityConfig.label}</Text></View>}
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>症状</Text>
              <Text style={styles.resultValue}>{diagnosisResult.symptom}</Text>
              <Text style={styles.resultLabel}>可能原因</Text>
              <View style={styles.causesList}>
                {diagnosisResult.possibleCauses.map((cause, index) => (
                  <View key={index} style={styles.causeItem}><View style={styles.causeDot} /><Text style={styles.causeText}>{cause}</Text></View>
                ))}
              </View>
              <Text style={styles.resultLabel}>治疗建议</Text>
              <Text style={styles.resultText}>{diagnosisResult.treatment}</Text>
              <Text style={styles.resultLabel}>预防措施</Text>
              <Text style={styles.resultText}>{diagnosisResult.prevention}</Text>
            </View>
            <TouchableOpacity onPress={() => setDiagnosisResult(null)} style={styles.retryButton} activeOpacity={0.7}>
              <Icons.Camera size={18} color={colors.primary} />
              <Text style={styles.retryButtonText}>再次诊断</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.communityButton} activeOpacity={0.7}>
              <Icons.MessageCircle size={18} color="#fff" />
              <Text style={styles.communityButtonText}>发布到社区急诊室</Text>
              <Icons.ChevronRight size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  headerIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.warning + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
  content: { paddingHorizontal: spacing.lg },
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  mainButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: 12 },
  mainButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.primary, paddingVertical: spacing.lg, borderRadius: 12 },
  secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  tipsCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  tipsTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  tipsText: { fontSize: 14, color: colors['text-secondary'], lineHeight: 22 },
  loadingContainer: { alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  loadingCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 6 },
  loadingText: { fontSize: 18, fontWeight: '600', color: colors.primary, marginTop: spacing.lg },
  loadingSubtext: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
  resultContent: { paddingHorizontal: spacing.lg },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  severityBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 12 },
  severityText: { fontSize: 14, fontWeight: '500' },
  resultCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  resultLabel: { fontSize: 13, color: colors['text-tertiary'], marginTop: spacing.md, marginBottom: spacing.xs },
  resultValue: { fontSize: 18, fontWeight: '600', color: colors.text },
  resultText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  causesList: { marginBottom: spacing.md },
  causeItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  causeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning, marginRight: spacing.sm },
  causeText: { fontSize: 14, color: colors['text-secondary'] },
  retryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.primary, paddingVertical: spacing.md, borderRadius: 12, marginBottom: spacing.sm },
  retryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  communityButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.success, paddingVertical: spacing.md, borderRadius: 12 },
  communityButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
