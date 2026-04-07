// 新手推荐页面 - 使用纯 StyleSheet
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { getRecommendations, PlantRecommendation, RecommendRequest } from '../services/recommendService';
import { addToMyGarden } from '../services/plantService';

interface RecommendationScreenProps extends Partial<NavigationProps> {}

// 扩展到5个问题
const questions = [
  { id: 1, question: '你家的光照条件怎么样？', options: [{ label: '光线充足', value: 'full', icon: Icons.Sun }, { label: '一般光线', value: 'partial', icon: Icons.Cloud }, { label: '光线较弱', value: 'low', icon: Icons.Moon }] },
  { id: 2, question: '你多久浇一次水？', options: [{ label: '经常忘记', value: 'monthly', icon: Icons.Clock }, { label: '一周一次', value: 'weekly', icon: Icons.Calendar }, { label: '想起来就浇', value: 'frequent', icon: Icons.Droplets }] },
  { id: 3, question: '你养植物的目的是？', options: [{ label: '净化空气', value: 'air-purify', icon: Icons.Wind }, { label: '装饰美观', value: 'decoration', icon: Icons.Flower2 }, { label: '兴趣爱好', value: 'hobby', icon: Icons.Heart }] },
  { id: 4, question: '你家有小孩或宠物吗？', options: [{ label: '有', value: 'true', icon: Icons.Heart }, { label: '没有', value: 'false', icon: Icons.Check }] },
  { id: 5, question: '你有多少养植物经验？', options: [{ label: '新手', value: 'beginner', icon: Icons.Star }, { label: '养过几盆', value: 'intermediate', icon: Icons.Star }, { label: '老手', value: 'expert', icon: Icons.Star }] },
];

// 用户答案存储
const userAnswers: Record<string, string> = {};

export function RecommendationScreen({ onGoBack }: RecommendationScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState<PlantRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = async () => {
    if (selectedOption !== null) {
      // 保存答案
      const question = questions[currentQuestion];
      const option = question.options[selectedOption];
      userAnswers[question.id.toString()] = option.value;

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
      } else {
        // 所有问题回答完毕，获取推荐
        setLoading(true);
        try {
          const request: RecommendRequest = {
            light: (userAnswers['1'] || 'partial') as RecommendRequest['light'],
            watering: (userAnswers['2'] || 'weekly') as RecommendRequest['watering'],
            purpose: (userAnswers['3'] || 'decoration') as RecommendRequest['purpose'],
            has_pets_kids: userAnswers['4'] === 'true',
            experience: (userAnswers['5'] || 'beginner') as RecommendRequest['experience'],
          };
          const result = await getRecommendations(request);
          setRecommendations(result);
          setShowResults(true);
        } catch (error) {
          console.error('获取推荐失败', error);
          Alert.alert('提示', '获取推荐失败，请稍后重试');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleAddToGarden = async (plant: PlantRecommendation) => {
    try {
      await addToMyGarden({
        plant_id: plant.plant_id,
        nickname: plant.name,
        acquired_from: 'recommendation',
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

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setShowResults(false);
    setRecommendations([]);
    Object.keys(userAnswers).forEach(key => delete userAnswers[key]);
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrapper}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Icons.ChevronLeft size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Icons.Sparkles size={32} color={colors.warning} />
            </View>
            <Text style={styles.headerTitle}>新手推荐</Text>
            <Text style={styles.headerSubtitle}>回答几个问题，帮你找到适合的植物</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!showResults ? (
          <View style={styles.content}>
            {/* 进度条 */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>问题 {currentQuestion + 1}/{questions.length}</Text>
                <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>

            {/* 问题卡片 */}
            <View style={styles.questionCard}>
              <View style={styles.questionIcon}>
                <Icons.HelpCircle size={24} color={colors.primary} />
              </View>
              <Text style={styles.questionText}>{questions[currentQuestion].question}</Text>
              <View style={styles.optionsList}>
                {questions[currentQuestion].options.map((option, index) => {
                  const OptionIcon = option.icon || Icons.Check;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedOption(index)}
                      style={[
                        styles.optionButton,
                        selectedOption === index && styles.optionButtonSelected
                      ]}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.optionIcon, selectedOption === index && styles.optionIconSelected]}>
                        <OptionIcon size={20} color={selectedOption === index ? '#fff' : colors.primary} />
                      </View>
                      <Text style={[
                        styles.optionText,
                        selectedOption === index && styles.optionTextSelected
                      ]}>{option.label}</Text>
                      {selectedOption === index && (
                        <Icons.Check size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 继续按钮 */}
            <TouchableOpacity
              onPress={handleAnswer}
              disabled={selectedOption === null || loading}
              style={[
                styles.continueButton,
                (selectedOption === null || loading) && styles.continueButtonDisabled
              ]}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.continueButtonText}>
                    {currentQuestion < questions.length - 1 ? '下一题' : '查看结果'}
                  </Text>
                  <Icons.ArrowRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {/* 结果头部 */}
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}>
                <Icons.Check size={36} color={colors.success} />
              </View>
              <Text style={styles.resultTitle}>为你推荐</Text>
              <Text style={styles.resultSubtitle}>根据你的情况，这些植物很适合</Text>
            </View>

            {/* 推荐列表 */}
            {recommendations.length > 0 ? (
              recommendations.map((plant, index) => (
                <View key={index} style={styles.recommendCard}>
                  <View style={styles.recommendRow}>
                    <View style={styles.recommendIcon}>
                      <Icons.Leaf size={32} color={colors.success} />
                    </View>
                    <View style={styles.recommendInfo}>
                      <View style={styles.recommendTop}>
                        <Text style={styles.recommendName}>{plant.name}</Text>
                        <View style={styles.survivalBadge}>
                          <Icons.Star size={12} color={colors.warning} />
                          <Text style={styles.survivalText}>匹配度 {plant.match_score}%</Text>
                        </View>
                      </View>
                      <Text style={styles.recommendReason}>{plant.reason}</Text>
                    </View>
                  </View>
                  <View style={styles.featureRow}>
                    {plant.features.map((feature, i) => (
                      <View key={i} style={styles.featureTag}>
                        <Icons.Check size={12} color={colors.success} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                    {plant.is_toxic && (
                      <View style={[styles.featureTag, { backgroundColor: colors.error + '15' }]}>
                        <Icons.AlertCircle size={12} color={colors.error} />
                        <Text style={[styles.featureText, { color: colors.error }]}>有毒</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    activeOpacity={0.8}
                    onPress={() => handleAddToGarden(plant)}
                  >
                    <Icons.Plus size={18} color="#fff" />
                    <Text style={styles.addButtonText}>添加到花园</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyResult}>
                <Icons.Search size={48} color={colors['text-tertiary']} />
                <Text style={styles.emptyText}>暂无推荐，请尝试其他条件</Text>
              </View>
            )}

            {/* 重新测试 */}
            <TouchableOpacity onPress={handleRestart} style={styles.restartButton} activeOpacity={0.8}>
              <Icons.RefreshCw size={18} color={colors.primary} />
              <Text style={styles.restartButtonText}>重新测试</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // 头部包装器
  headerWrapper: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
  },
  // 头部
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
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
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },

  // 内容
  content: { padding: spacing.lg },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl * 2 },

  // 进度
  progressContainer: { marginBottom: spacing.lg },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressLabel: { fontSize: 14, color: colors['text-secondary'] },
  progressPercent: { fontSize: 14, fontWeight: '600', color: colors.primary },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },

  // 问题卡片
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  questionText: { fontSize: 20, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  optionsList: { gap: spacing.sm },
  optionButton: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  optionText: { fontSize: 16, fontWeight: '500', color: colors.text, flex: 1 },
  optionTextSelected: { color: '#fff' },

  // 继续按钮
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonDisabled: { backgroundColor: colors.border, shadowOpacity: 0 },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // 结果
  resultHeader: { alignItems: 'center', marginBottom: spacing.xl },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  resultTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  resultSubtitle: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },

  // 推荐卡片
  recommendCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recommendRow: { flexDirection: 'row' },
  recommendIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendInfo: { flex: 1, marginLeft: spacing.sm },
  recommendTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recommendName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  survivalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  survivalText: { color: colors.warning, fontSize: 12, fontWeight: '600' },
  recommendReason: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs, lineHeight: 20 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 10,
  },
  featureText: { color: colors.success, fontSize: 12 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // 空结果
  emptyResult: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors['text-tertiary'],
    marginTop: spacing.md,
  },

  // 重新测试
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 14,
    marginTop: spacing.md,
    marginBottom: spacing.xxl * 2,
  },
  restartButtonText: { fontSize: 15, fontWeight: '600', color: colors.primary },
});
