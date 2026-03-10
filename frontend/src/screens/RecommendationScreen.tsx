// 新手推荐页面 - 场景问答推荐系统 - UI Kitten 组件
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Button,
  Card,
  Text,
  Radio,
  RadioGroup,
  ProgressBar,
  TopNavigation,
  Layout,
  useTheme,
} from '@ui-kitten/components';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

// 问答步骤
interface QuestionStep {
  id: number;
  question: string;
  options: {
    label: string;
    value: string;
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
      { label: '光线充足', value: 'full-sun' },
      { label: '一般光线', value: 'partial-sun' },
      { label: '光线较弱', value: 'low-light' },
    ],
  },
  {
    id: 2,
    question: '你经常出差吗？',
    options: [
      { label: '经常出差', value: 'often' },
      { label: '偶尔出差', value: 'sometimes' },
      { label: '不出差', value: 'never' },
    ],
  },
  {
    id: 3,
    question: '家里有宠物或小孩吗？',
    options: [
      { label: '有猫/狗', value: 'pet' },
      { label: '有小孩', value: 'child' },
      { label: '都没有', value: 'none' },
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
  const theme = useTheme();
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
        <ProgressBar
          progress={((currentStep + 1) / questions.length)}
          size="medium"
          status="primary"
        />
        <Text appearance="hint" category="c1" style={styles.progressText}>
          {currentStep + 1} / {questions.length}
        </Text>
      </View>

      <Text category="h6" style={styles.questionText}>
        {questions[currentStep].question}
      </Text>

      <RadioGroup
        selectedIndex={questions[currentStep].options.findIndex((_, i) => answers[currentStep] === questions[currentStep].options[i].value)}
        onChange={(index) => handleAnswer(questions[currentStep].options[index].value)}
      >
        {questions[currentStep].options.map((option, index) => (
          <Radio
            key={index}
            status="basic"
            style={styles.optionRadio}
          >
            {option.label}
          </Radio>
        ))}
      </RadioGroup>
    </View>
  );

  const renderResults = () => (
    <View style={styles.resultsContainer}>
      <Layout style={styles.resultsHeader} level="1">
        <Icons.Flower2 size={48} />
        <Text category="h4">推荐结果</Text>
        <Text appearance="hint">基于你的情况，为你推荐以下植物</Text>
      </Layout>

      {recommendations.map((plant, index) => (
        <Card key={plant.id} style={styles.recommendCard}>
          <View style={styles.recommendHeader}>
            <View style={styles.recommendRank}>
              <Text category="s1" style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={styles.recommendInfo}>
              <Text category="h6">{plant.name}</Text>
              <View style={styles.survivalRate}>
                <Icons.Star size={14} />
                <Text status="warning" category="c1">
                  成活率 {plant.survivalRate}%
                </Text>
              </View>
            </View>
            <View style={styles.careLevel}>
              <Text appearance="hint" category="c1">难度</Text>
              <View style={styles.careStars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.careStar,
                      i < plant.careLevel ? styles.careStarActive : null,
                    ]}
                  >
                    ★
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <Text>{plant.reason}</Text>

          <View style={styles.featuresContainer}>
            {plant.features.map((feature, idx) => (
              <View key={idx} style={styles.featureTag}>
                <Icons.Check size={12} />
                <Text category="c1">{feature}</Text>
              </View>
            ))}
          </View>

          <Button
            style={styles.addRecommendButton}
            appearance="filled"
            status="primary"
          >
            添加到花园
          </Button>
        </Card>
      ))}

      <Button
        style={styles.restartButton}
        appearance="outline"
        status="primary"
        onPress={handleRestart}
      >
        重新测试
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopNavigation
        title="新手推荐"
        alignment="center"
        accessoryLeft={() => (
          <Button
            appearance="ghost"
            status="basic"
            accessoryLeft={(props) => <Icons.ArrowLeft {...props} size={24} />}
            onPress={() => navigation.goBack()}
          />
        )}
      />

      {showResults ? renderResults() : renderQuestions()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  questionContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressText: {
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  questionText: {
    marginBottom: spacing.xl,
  },
  optionRadio: {
    marginVertical: spacing.md,
  },
  resultsContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  recommendCard: {
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
    color: colors.white,
    fontWeight: 'bold',
  },
  recommendInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  survivalRate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  careLevel: {
    alignItems: 'flex-end',
  },
  careStars: {
    flexDirection: 'row',
  },
  careStar: {
    fontSize: 12,
  },
  careStarActive: {
    color: colors.warning,
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
  addRecommendButton: {
    marginTop: spacing.md,
  },
  restartButton: {
    marginTop: spacing.md,
  },
});
