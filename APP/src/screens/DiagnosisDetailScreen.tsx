// 诊断详情页面 - Neumorphism 风格美化
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDiagnosis, toggleFavorite, rediagnose, DiagnosisRecord } from '../services/diagnosisService';
import { createConversationToBackend, linkDiagnosisToConversation, sendMessageToBackend, callAIChat } from '../services/consultationService';
import { API_BASE_URL } from '../services/config';
import { colors, spacing, borderRadius, shadows, duration, fontSize, fontWeight, touchTarget } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { Icon } from '../components/Icon';

interface DiagnosisDetailScreenProps extends NavigationProps {}

// 获取完整的图片URL
const getFullImageUrl = (url: string | undefined): string | undefined => {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (trimmed.length === 0) return undefined;

  // 已经是完整的URL（包括 http, https, file, ph 等）
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') ||
      trimmed.startsWith('file://') || trimmed.startsWith('ph://') ||
      trimmed.startsWith('asset-library://')) {
    return trimmed;
  }

  // 已经是完整的图片服务器URL
  if (trimmed.includes(API_BASE_URL)) {
    return trimmed;
  }

  // 相对路径，拼接API地址
  // 确保路径以 / 开头
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_BASE_URL}${cleanPath}`;
};

// 置信度阈值配置
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
};

const getConfidenceConfig = (confidence: number) => {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
    return { label: '高置信度', color: colors.success, bgColor: colors.successLight, icon: 'shield-check' };
  }
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    return { label: '中等置信度', color: colors.warning, bgColor: colors.warningLight, icon: 'alert-triangle' };
  }
  return { label: '低置信度', color: colors.error, bgColor: colors.errorLight, icon: 'alert-circle' };
};

export function DiagnosisDetailScreen({ route, onNavigate, onGoBack }: DiagnosisDetailScreenProps) {
  const { diagnosisId } = route?.params || {};
  const [record, setRecord] = useState<DiagnosisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleGoBack = () => {
    // 重置诊断页面状态后返回
    onGoBack?.();
  };

  useEffect(() => {
    console.log('[DiagnosisDetail] useEffect triggered, diagnosisId:', diagnosisId);
    if (diagnosisId) {
      loadRecord();
    }
  }, [diagnosisId]);

  // 页面进入动画
  useEffect(() => {
    if (!loading && record) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [loading, record, fadeAnim]);

  const loadRecord = async () => {
    try {
      console.log('[DiagnosisDetail] diagnosisId:', diagnosisId, 'type:', typeof diagnosisId);
      const id = typeof diagnosisId === 'string' ? parseInt(diagnosisId, 10) : diagnosisId;
      console.log('[DiagnosisDetail] parsed id:', id);
      const data = await getDiagnosis(id);
      console.log('[DiagnosisDetail] Loaded data:', JSON.stringify(data));
      setRecord(data);
    } catch (error: any) {
      console.error('[DiagnosisDetail] Failed to load diagnosis:', error?.response?.data || error);
      console.error('Failed to load diagnosis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const id = typeof diagnosisId === 'string' ? parseInt(diagnosisId, 10) : diagnosisId;
      const result = await toggleFavorite(id);
      setRecord(prev => prev ? { ...prev, is_favorite: result.is_favorite } : null);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleRediagnose = async () => {
    try {
      const id = typeof diagnosisId === 'string' ? parseInt(diagnosisId, 10) : diagnosisId;
      const newRecord = await rediagnose(id);
      onNavigate?.('DiagnosisDetail', { diagnosisId: newRecord.id });
    } catch (error) {
      console.error('Failed to rediagnose:', error);
    }
  };

  const handleAIConsult = async () => {
    try {
      console.log('[DiagnosisDetail] handleAIConsult called, record:', record);
      const id = typeof diagnosisId === 'string' ? parseInt(diagnosisId, 10) : diagnosisId;

      // 构建诊断上下文
      const diagnosisContext = {
        currentDiagnosis: record ? {
          name: record.disease_name,
          type: 'disease',
          severity: record.confidence >= 0.8 ? 'high' : record.confidence >= 0.5 ? 'medium' : 'low',
          confidence: record.confidence,
        } : undefined,
        plantType: undefined,
      };

      // 检查是否已有关联的对话
      if (record?.conversation_id) {
        // 已有对话，直接跳转到该对话
        onNavigate?.('Consultation', { conversationId: record.conversation_id, diagnosisContext });
        return;
      }

      // 创建新对话，传递诊断上下文作为标题的一部分
      const title = `诊断咨询: ${record?.disease_name || '植物问题'}`;
      const conversationId = await createConversationToBackend(title, diagnosisContext);

      // 关联诊断记录与对话
      await linkDiagnosisToConversation(id, conversationId);

      // 构建初始诊断消息
      const diagnosisText = `用户刚刚完成了病害诊断，结果如下：
- 病害名称：${record?.disease_name || '未知'}
- 置信度：${((record?.confidence || 0) * 100).toFixed(0)}%
- 描述：${record?.description || '无'}
- 治疗建议：${record?.treatment || '无'}
- 预防措施：${record?.prevention || '无'}

请基于以上诊断结果，提供专业的治疗建议和后续养护指导。`;

      // 保存初始诊断消息到后端，并获取AI回复
      try {
        await sendMessageToBackend(conversationId, 'user', diagnosisText);

        // 调用AI获取回复
        const aiResponse = await callAIChat([
          { id: '1', role: 'user', content: diagnosisText, timestamp: Date.now() }
        ], diagnosisContext);

        // 保存AI回复到后端
        await sendMessageToBackend(conversationId, 'assistant', aiResponse);
      } catch (msgError) {
        console.error('Failed to save initial message:', msgError);
      }

      // 跳转到AI问诊页面，传递对话ID和诊断上下文
      onNavigate?.('Consultation', { conversationId, diagnosisContext });
    } catch (error) {
      console.error('Failed to start AI consultation:', error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCircle}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const confidenceConfig = getConfidenceConfig(record.confidence);

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          activeOpacity={duration.pressed}
        >
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>诊断详情</Text>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={styles.favoriteButton}
          activeOpacity={duration.pressed}
        >
          <Icon
            name="star"
            size={24}
            color={record.is_favorite ? colors.accent : colors['text-secondary']}
            fill={record.is_favorite ? colors.accent : 'none'}
          />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 主图区域 */}
        <View style={styles.imageContainer}>
          {record.image_url && typeof record.image_url === 'string' && record.image_url.trim().length > 0 && (
            <Image
              source={{ uri: getFullImageUrl(record.image_url) }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
          {/* 渐变遮罩 */}
          <View style={styles.imageGradient} />

          {/* 置信度徽章 */}
          <View style={[styles.confidenceBadge, { backgroundColor: confidenceConfig.bgColor }]}>
            <Icon name={confidenceConfig.icon} size={18} color={confidenceConfig.color} />
            <Text style={[styles.confidenceText, { color: confidenceConfig.color }]}>
              {confidenceConfig.label} · {(record.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* 诊断结果 */}
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.diseaseName}>{record.disease_name}</Text>
            <View style={styles.dateRow}>
              <Icon name="clock" size={14} color={colors['text-tertiary']} />
              <Text style={styles.dateText}>{formatDate(record.created_at)}</Text>
            </View>
          </View>

          {/* 病因描述 */}
          {record.disease_name === '未知' || !record.description ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.warningLight }]}>
                  <Icon name="alert-circle" size={18} color={colors.warning} />
                </View>
                <Text style={styles.sectionTitle}>诊断说明</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>
                  {record.disease_name === '未知'
                    ? '很抱歉，未能识别出植物病害。建议您：\n1. 拍摄更清晰的照片\n2. 确保光线充足\n3. 拍摄植物的患病部位特写'
                    : record.description || '暂无描述'}
                </Text>
              </View>
            </View>
          ) : record.description && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.warningLight }]}>
                  <Icon name="alert-circle" size={18} color={colors.warning} />
                </View>
                <Text style={styles.sectionTitle}>病因描述</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>{record.description}</Text>
              </View>
            </View>
          )}

          {/* 治疗建议 */}
          {(record.treatment || record.disease_name === '未知') && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.successLight }]}>
                  <Icon name="stethoscope" size={18} color={colors.success} />
                </View>
                <Text style={styles.sectionTitle}>治疗建议</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>
                  {record.disease_name === '未知'
                    ? '请尝试重新识别，建议拍摄：\n1. 患处清晰特写\nn2. 整体植株照片\n3. 不同角度的照片'
                    : record.treatment || '暂无建议'}
                </Text>
              </View>
            </View>
          )}

          {/* 预防措施 */}
          {(record.prevention || record.disease_name === '未知') && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.primaryLight + '20' }]}>
                  <Icon name="shield-check" size={18} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>预防措施</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>
                  {record.disease_name === '未知'
                    ? '保持植物健康，定期检查叶片和茎干，及时发现并处理异常情况。'
                    : record.prevention || '暂无预防措施'}
                </Text>
              </View>
            </View>
          )}

          {/* 推荐产品 */}
          {record.recommended_products && record.recommended_products !== '[]' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.infoLight }]}>
                  <Icon name="shopping-bag" size={18} color={colors.info} />
                </View>
                <Text style={styles.sectionTitle}>推荐产品</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>{record.recommended_products}</Text>
              </View>
            </View>
          )}

          {/* AI 问诊按钮 */}
          <TouchableOpacity
            style={styles.aiConsultCard}
            onPress={handleAIConsult}
            activeOpacity={duration.pressed}
          >
            <View style={styles.aiConsultLeft}>
              <View style={[styles.aiConsultIcon, { backgroundColor: colors.primaryLight + '20' }]}>
                <Icon name="message-circle" size={24} color={colors.primary} />
              </View>
              <View style={styles.aiConsultText}>
                <Text style={styles.aiConsultTitle}>AI 智能问诊</Text>
                <Text style={styles.aiConsultDesc}>基于诊断结果获取专业治疗建议</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color={colors['text-tertiary']} />
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* 底部操作栏 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleFavorite}
          activeOpacity={duration.pressed}
        >
          <Icon
            name="star"
            size={22}
            color={record.is_favorite ? colors.accent : colors['text-secondary']}
            fill={record.is_favorite ? colors.accent : 'none'}
          />
          <Text style={[styles.actionButtonText, record.is_favorite && styles.actionButtonTextActive]}>
            {record.is_favorite ? '已收藏' : '收藏'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRediagnose}
          activeOpacity={duration.pressed}
        >
          <Icon name="camera" size={22} color={colors.white} />
          <Text style={styles.primaryButtonText}>再次诊断</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  favoriteButton: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  // 图片区域
  imageContainer: {
    position: 'relative',
    height: 280,
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))',
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  confidenceText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // 内容区域
  content: {
    padding: spacing.lg,
  },
  titleSection: {
    marginBottom: spacing.xl,
  },
  diseaseName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors['text-tertiary'],
  },

  // 详情卡片
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  sectionContent: {
    paddingLeft: 48,
  },
  sectionText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    lineHeight: 26,
  },

  // AI 问诊卡片
  aiConsultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  aiConsultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiConsultIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  aiConsultText: {
    flex: 1,
  },
  aiConsultTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  aiConsultDesc: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
  },

  // 底部操作栏
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors['text-secondary'],
  },
  actionButtonTextActive: {
    color: colors.accent,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
