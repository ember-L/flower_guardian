// 新手推荐页面 - 使用纯 StyleSheet
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface RecommendationScreenProps extends Partial<NavigationProps> {}

const questions = [
  { id: 1, question: '你家的光照条件怎么样？', options: [{ label: '光线充足', value: 'full-sun', icon: Icons.Sun }, { label: '一般光线', value: 'partial-sun', icon: Icons.Cloud }, { label: '光线较弱', value: 'low-light', icon: Icons.Moon }] },
  { id: 2, question: '你多久浇一次水？', options: [{ label: '经常忘记', value: 'forgetful', icon: Icons.Clock }, { label: '一周一次', value: 'weekly', icon: Icons.Calendar }, { label: '想起来就浇', value: 'occasional', icon: Icons.Droplets }] },
  { id: 3, question: '你养植物的目的是？', options: [{ label: '净化空气', value: 'air-purify', icon: Icons.Wind }, { label: '装饰美观', value: 'decoration', icon: Icons.Flower2 }, { label: '兴趣爱好', value: 'hobby', icon: Icons.Heart }] },
];

const recommendations = [
  { id: '1', name: '绿萝', reason: '非常适合新手，光线弱也能存活，浇水一周一次即可', survivalRate: 98, features: ['净化空气', '耐阴', '易养护'], icon: Icons.Leaf },
  { id: '2', name: '虎皮兰', reason: '几乎不用管，一个月浇一次水都行，特别适合忙碌的人', survivalRate: 95, features: ['耐旱', '净化空气', '美观'], icon: Icons.Flower2 },
  { id: '3', name: '吊兰', reason: '生命力顽强，繁殖容易，还能吸收甲醛', survivalRate: 92, features: ['空气净化', '易繁殖', '垂吊美'], icon: Icons.Sprout },
];

export function RecommendationScreen({ onGoBack }: RecommendationScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = () => {
    if (selectedOption !== null) {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
      } else {
        setShowResults(true);
      }
    }
  };

  const handleRestart = () => { setCurrentQuestion(0); setSelectedOption(null); setShowResults(false); };

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
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
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
              disabled={selectedOption === null}
              style={[
                styles.continueButton,
                selectedOption === null && styles.continueButtonDisabled
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {currentQuestion < questions.length - 1 ? '下一题' : '查看结果'}
              </Text>
              <Icons.ArrowRight size={20} color="#fff" />
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
            {recommendations.map((plant) => (
              <View key={plant.id} style={styles.recommendCard}>
                <View style={styles.recommendRow}>
                  <View style={styles.recommendIcon}>
                    <plant.icon size={32} color={colors.success} />
                  </View>
                  <View style={styles.recommendInfo}>
                    <View style={styles.recommendTop}>
                      <Text style={styles.recommendName}>{plant.name}</Text>
                      <View style={styles.survivalBadge}>
                        <Icons.Star size={12} color={colors.warning} />
                        <Text style={styles.survivalText}>存活率 {plant.survivalRate}%</Text>
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
                </View>
                <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
                  <Icons.Plus size={18} color="#fff" />
                  <Text style={styles.addButtonText}>添加到花园</Text>
                </TouchableOpacity>
              </View>
            ))}

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
