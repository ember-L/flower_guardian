// 病症诊断页面 - UI Kitten 组件
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Text,
  Spinner,
  TopNavigation,
  Layout,
  useTheme,
} from '@ui-kitten/components';
import { Icons } from '../components/Icon';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { colors, spacing, borderRadius, fontSize, shadows, touchTarget } from '../constants/theme';

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
  const theme = useTheme();
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
      await new Promise<void>(resolve => setTimeout(resolve, 2000));
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
        <Layout style={styles.headerIcon} level="1">
          <Icons.AlertCircle size={24} />
          <Text category="h2">病症诊断</Text>
          <Text appearance="hint">AI智能预诊，告别植物杀手</Text>
        </Layout>

        {/* 诊断区域 */}
        {!diagnosisResult && !isLoading && (
          <Layout style={styles.diagnoseSection} level="1">
            <View style={styles.diagnoseButtons}>
              <Button
                style={styles.diagnoseButton}
                appearance="filled"
                status="primary"
                size="large"
                accessoryLeft={<Icons.Camera size={24} />}
                onPress={() => handleDiagnose('camera')}
              >
                拍照诊断
              </Button>
              <Button
                style={styles.diagnoseButton}
                appearance="outline"
                status="primary"
                size="large"
                accessoryLeft={<Icons.Image size={24} />}
                onPress={() => handleDiagnose('gallery')}
              >
                相册选择
              </Button>
            </View>

            <Card style={styles.tipsCard}>
              <Text category="s1">拍摄建议</Text>
              <View style={styles.tipsList}>
                <Text appearance="hint">• 拍摄清晰的照片</Text>
                <Text appearance="hint">• 包含整体植株和病害部位</Text>
                <Text appearance="hint">• 最好在自然光下拍摄</Text>
              </View>
            </Card>
          </Layout>
        )}

        {/* 加载中 */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCircle}>
              <Spinner size="large" status="primary" />
            </View>
            <Text category="h6" status="primary">AI正在分析中...</Text>
            <Text appearance="hint">请稍候，正在识别病虫害特征</Text>
          </View>
        )}

        {/* 诊断结果 */}
        {diagnosisResult && (
          <Layout style={styles.resultSection} level="1">
            <View style={styles.resultHeader}>
              <Text category="h3">诊断结果</Text>
              <Text
                category="c1"
                status={diagnosisResult.severity === 'high' ? 'danger' : diagnosisResult.severity === 'medium' ? 'warning' : 'success'}
              >
                {getSeverityText(diagnosisResult.severity)}
              </Text>
            </View>

            <Card style={styles.resultCard}>
              <Text appearance="hint" category="c1">症状</Text>
              <Text category="h5">{diagnosisResult.symptom}</Text>

              <Text appearance="hint" category="c1" style={styles.labelMargin}>可能原因</Text>
              <View style={styles.causesList}>
                {diagnosisResult.possibleCauses.map((cause, index) => (
                  <View key={index} style={styles.causeItem}>
                    <View style={styles.causeDot} />
                    <Text>{cause}</Text>
                  </View>
                ))}
              </View>

              <Text appearance="hint" category="c1" style={styles.labelMargin}>治疗建议</Text>
              <Text>{diagnosisResult.treatment}</Text>

              <Text appearance="hint" category="c1" style={styles.labelMargin}>预防措施</Text>
              <Text>{diagnosisResult.prevention}</Text>
            </Card>

            {/* 再次诊断 */}
            <Button
              style={styles.retryButton}
              appearance="outline"
              status="primary"
              accessoryLeft={<Icons.Camera size={18} />}
              onPress={() => setDiagnosisResult(null)}
            >
              再次诊断
            </Button>

            {/* 社区求助 */}
            <Button
              style={styles.communityButton}
              appearance="filled"
              status="success"
              accessoryLeft={<Icons.MessageCircle size={18} />}
              accessoryRight={<Icons.ChevronRight size={18} />}
            >
              发布到社区急诊室
            </Button>
          </Layout>
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
  headerIcon: {
    padding: spacing.xl,
    alignItems: 'center',
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
  },
  tipsCard: {
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  tipsList: {
    gap: spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  loadingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
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
  resultCard: {
    ...shadows.sm,
  },
  labelMargin: {
    marginTop: spacing.lg,
  },
  causesList: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  causeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  causeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  retryButton: {
    marginTop: spacing.lg,
  },
  communityButton: {
    marginTop: spacing.md,
  },
});
