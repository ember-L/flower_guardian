// 新手推荐页面 - 场景问答推荐系统
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Sun, CloudRain, Home, Plane, Cat, Check, Flower2, Star, Shield } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

// 问答步骤
interface QuestionStep {
  id: number;
  question: string;
  options: {
    label: string;
    value: string;
    icon?: React.ReactNode;
  }[];
}

// 推荐植物
interface PlantRecommendation {
  id: string;
  name: string;
  reason: string;
  survivalRate: number;
  careLevel: number;
  features: string[];
}

const questions: QuestionStep[] = [
  {
    id: 1,
    question: '你家的光照条件怎么样？',
    options: [
      { label: '光线充足', value: 'full-sun', icon: <Sun size={24} color={colors.warning} /> },
      { label: '一般光线', value: 'partial-sun', icon: <Sun size={24} color={colors.warning} /> },
      { label: '光线较弱', value: 'low-light', icon: <Sun size={24} color={colors['text-light']} /> },
    ],
  },
  {
    id: 2,
    question: '你经常出差吗？',
    options: [
      { label: '经常出差', value: 'often', icon: <Plane size={24} color={colors.primary} /> },
      { label: '偶尔出差', value: 'sometimes', icon: <Plane size={24} color={colors.warning} /> },
      { label: '不出差', value: 'never', icon: <Home size={24} color={colors.secondary} /> },
    ],
  },
  {
    id: 3,
    question: '家里有宠物或小孩吗？',
    options: [
      { label: '有猫/狗', value: 'pet', icon: <Cat size={24} color={colors.warning} /> },
      { label: '有小孩', value: 'child', icon: <Cat size={24} color={colors.warning} /> },
      { label: '都没有', value: 'none', icon: <Shield size={24} color={colors.secondary} /> },
    ],
  },
];

// 模拟推荐结果
const recommendations: PlantRecommendation[] = [
  {
    id: '1',
    name: '绿萝',
    reason: '耐阴性强，浇水频率低，非常适合经常出差或光线不好的环境',
    survivalRate: 98,
    careLevel: 1,
    features: ['耐阴', '净化空气', '易繁殖'],
  },
  {
    id: '2',
    name: '虎皮兰',
    reason: '极其耐旱，半个月不浇水也没问题，对光照要求不高',
    survivalRate: 95,
    careLevel: 1,
    features: ['耐旱', '净化空气', '夜间放氧'],
  },
  {
    id: '3',
    name: '龟背竹',
    reason: '颜值高又好养，但对光照有一定要求，适合光线一般的环境',
    survivalRate: 90,
    careLevel: 2,
    features: ['ins风', '净化空气', '耐阴'],
  },
];

export function RecommendationScreen() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (value: string) => {
    const step = questions[currentStep];
    setAnswers(prev => ({ ...prev, [step.id]: value }));

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
  };

  const renderQuestions = () => (
    <View style={styles.questionContainer}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} / {questions.length}
        </Text>
      </View>

      <Text style={styles.questionText}>
        {questions[currentStep].question}
      </Text>

      <View style={styles.optionsContainer}>
        {questions[currentStep].options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionCard}
            onPress={() => handleAnswer(option.value)}
          >
            <View style={styles.optionIcon}>{option.icon}</View>
            <Text style={styles.optionLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderResults = () => (
    <View style={styles.resultsContainer}>
      <View style={styles.resultsHeader}>
        <Flower2 size={48} color={colors.secondary} />
        <Text style={styles.resultsTitle}>推荐结果</Text>
        <Text style={styles.resultsSubtitle}>基于你的情况，为你推荐以下植物</Text>
      </View>

      {recommendations.map((plant, index) => (
        <View key={plant.id} style={styles.recommendCard}>
          <View style={styles.recommendHeader}>
            <View style={styles.recommendRank}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={styles.recommendInfo}>
              <Text style={styles.recommendName}>{plant.name}</Text>
              <View style={styles.survivalRate}>
                <Star size={14} color={colors.warning} fill={colors.warning} />
                <Text style={styles.survivalRateText}>
                  成活率 {plant.survivalRate}%
                </Text>
              </View>
            </View>
            <View style={styles.careLevel}>
              <Text style={styles.careLevelText}>难度</Text>
              <View style={styles.careStars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.careStar,
                      { color: i < plant.careLevel ? colors.warning : colors['text-light'] },
                    ]}
                  >
                    ★
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.reasonText}>{plant.reason}</Text>

          <View style={styles.featuresContainer}>
            {plant.features.map((feature, idx) => (
              <View key={idx} style={styles.featureTag}>
                <Check size={12} color={colors.secondary} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.addRecommendButton}>
            <Text style={styles.addRecommendText}>添加到花园</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
        <Text style={styles.restartButtonText}>重新测试</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>新手推荐</Text>
        <View style={{ width: 40 }} />
      </View>

      {showResults ? renderResults() : renderQuestions()}
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
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  questionContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    textAlign: 'right',
  },
  questionText: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  resultsContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resultsTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
  },
  resultsSubtitle: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
  recommendCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.white,
  },
  recommendInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  recommendName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  survivalRate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  survivalRateText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: '500',
  },
  careLevel: {
    alignItems: 'flex-end',
  },
  careLevelText: {
    fontSize: fontSize.xs,
    color: colors['text-secondary'],
  },
  careStars: {
    flexDirection: 'row',
  },
  careStar: {
    fontSize: 12,
  },
  reasonText: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    lineHeight: 20,
    marginTop: spacing.md,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  featureText: {
    fontSize: fontSize.xs,
    color: colors.secondary,
  },
  addRecommendButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addRecommendText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  restartButton: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  restartButtonText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.primary,
  },
});
