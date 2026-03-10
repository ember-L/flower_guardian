// 新手推荐页面 - 使用纯 StyleSheet
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';

const questions = [
  { id: 1, question: '你家的光照条件怎么样？', options: [{ label: '光线充足', value: 'full-sun' }, { label: '一般光线', value: 'partial-sun' }, { label: '光线较弱', value: 'low-light' }] },
  { id: 2, question: '你多久浇一次水？', options: [{ label: '每天想不起来', value: 'forgetful' }, { label: '一周一次', value: 'weekly' }, { label: '想起来就浇', value: 'occasional' }] },
  { id: 3, question: '你养植物的目的是？', options: [{ label: '净化空气', value: 'air-purify' }, { label: '装饰美观', value: 'decoration' }, { label: '兴趣爱好', value: 'hobby' }] },
];

const recommendations = [
  { id: '1', name: '绿萝', reason: '非常适合新手，光线弱也能存活，浇水一周一次即可', survivalRate: 98, features: ['净化空气', '耐阴', '易养护'] },
  { id: '2', name: '虎皮兰', reason: '几乎不用管，一个月浇一次水都行，特别适合忙碌的人', survivalRate: 95, features: ['耐旱', '净化空气', '美观'] },
  { id: '3', name: '吊兰', reason: '生命力顽强，繁殖容易，还能吸收甲醛', survivalRate: 92, features: ['空气净化', '易繁殖', '垂吊美'] },
];

export function RecommendationScreen() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => { setCurrentQuestion(0); setShowResults(false); };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}><Icons.Sparkles size={24} color={colors.warning} /><Text style={styles.headerTitleText}>新手推荐</Text></View>
        <Text style={styles.headerSubtitle}>回答几个问题，帮你找到适合的植物</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {!showResults ? (
          <View style={styles.content}>
            <View style={styles.progressContainer}>
              <View style={styles.progressRow}><Text style={styles.progressLabel}>问题 {currentQuestion + 1}/{questions.length}</Text><Text style={styles.progressLabel}>{Math.round(progress)}%</Text></View>
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
            </View>
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{questions[currentQuestion].question}</Text>
              <View style={styles.optionsList}>
                {questions[currentQuestion].options.map((option, index) => (
                  <TouchableOpacity key={index} onPress={handleAnswer} style={styles.optionButton} activeOpacity={0.7}>
                    <Text style={styles.optionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}><Icons.Check size={32} color={colors.warning} /></View>
              <Text style={styles.resultTitle}>为你推荐</Text>
              <Text style={styles.resultSubtitle}>根据你的情况，这些植物很适合</Text>
            </View>
            {recommendations.map((plant) => (
              <View key={plant.id} style={styles.recommendCard}>
                <View style={styles.recommendRow}>
                  <View style={styles.recommendIcon}><Icons.Flower2 size={28} color={colors.success} /></View>
                  <View style={styles.recommendInfo}>
                    <View style={styles.recommendTop}><Text style={styles.recommendName}>{plant.name}</Text><View style={styles.survivalBadge}><Text style={styles.survivalText}>存活率 {plant.survivalRate}%</Text></View></View>
                    <Text style={styles.recommendReason}>{plant.reason}</Text>
                  </View>
                </View>
                <View style={styles.featureRow}>{plant.features.map((feature, i) => <View key={i} style={styles.featureTag}><Text style={styles.featureText}>{feature}</Text></View>)}</View>
                <TouchableOpacity style={styles.addButton}><Text style={styles.addButtonText}>添加到花园</Text></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={handleRestart} style={styles.restartButton}><Text style={styles.restartButtonText}>重新测试</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: spacing.xl * 1.5, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitleText: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
  content: { padding: spacing.lg },
  progressContainer: { marginBottom: spacing.lg },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressLabel: { fontSize: 14, color: colors['text-secondary'] },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  questionCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  questionText: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.lg },
  optionsList: { gap: spacing.sm },
  optionButton: { width: '100%', paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center' },
  optionText: { fontSize: 15, fontWeight: '500', color: colors.text },
  resultHeader: { alignItems: 'center', marginBottom: spacing.xl },
  resultIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.warning + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  resultTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  resultSubtitle: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
  recommendCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  recommendRow: { flexDirection: 'row' },
  recommendIcon: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.success + '15', alignItems: 'center', justifyContent: 'center' },
  recommendInfo: { flex: 1, marginLeft: spacing.sm },
  recommendTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recommendName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  survivalBadge: { backgroundColor: colors.success + '15', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10 },
  survivalText: { color: colors.success, fontSize: 12 },
  recommendReason: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
  featureRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  featureTag: { backgroundColor: colors.background, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 10 },
  featureText: { color: colors['text-tertiary'], fontSize: 12 },
  addButton: { width: '100%', backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center', marginTop: spacing.md },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  restartButton: { paddingVertical: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', marginTop: spacing.md },
  restartButtonText: { fontSize: 15, fontWeight: '500', color: colors['text-secondary'] },
});
