// 养花日记页面 - 使用纯 StyleSheet
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface DiaryScreenProps extends Partial<NavigationProps> {}

const mockDiaries = [
  { id: '1', plantName: '绿萝', date: '2024-01-20', content: '今天给绿萝换了一个大一点的花盆，加了新土，期待它长得更好！', likes: 12, comments: 3, compareWithPrevious: true },
  { id: '2', plantName: '绿萝', date: '2024-01-15', content: '发现一片新叶子冒出来了，开心！', likes: 8, comments: 2 },
  { id: '3', plantName: '虎皮兰', date: '2024-01-10', content: '虎皮兰的纹路越来越清晰了，养护得当果然不一样。', likes: 5, comments: 1 },
];

export function DiaryScreen({ onGoBack }: DiaryScreenProps) {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}><Icons.ChevronLeft size={20} color={colors.primary} /></TouchableOpacity>
          <View style={styles.headerTitle}><Icons.BookOpen size={24} color={colors.secondary} /><Text style={styles.headerTitleText}>养花日记</Text></View>
          <TouchableOpacity style={styles.writeButton}><Text style={styles.writeButtonText}>+ 写日记</Text></TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>记录植物的成长点滴</Text>
      </View>
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setSelectedTab(0)} style={[styles.tab, selectedTab === 0 && styles.tabActive]}><Text style={[styles.tabText, selectedTab === 0 && styles.tabTextActive]}>我的日记</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab(1)} style={[styles.tab, selectedTab === 1 && styles.tabActive]}><Text style={[styles.tabText, selectedTab === 1 && styles.tabTextActive]}>生长记录</Text></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {mockDiaries.map((diary) => (
            <View key={diary.id} style={styles.diaryCard}>
              <View style={styles.diaryHeader}>
                <View style={styles.diaryUser}><View style={styles.diaryAvatar}><Icons.Flower2 size={16} color={colors.secondary} /></View><View><Text style={styles.diaryPlantName}>{diary.plantName}</Text><Text style={styles.diaryDate}>{diary.date}</Text></View></View>
                {diary.compareWithPrevious && <View style={styles.newBadge}><Text style={styles.newBadgeText}>有新变化</Text></View>}
              </View>
              <Text style={styles.diaryContent}>{diary.content}</Text>
              <View style={styles.diaryStats}>
                <TouchableOpacity style={styles.statButton}><Icons.Heart size={16} color={colors.error} /><Text style={styles.statText}>{diary.likes}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.statButton}><Icons.MessageCircle size={16} color={colors.info} /><Text style={styles.statText}>{diary.comments}</Text></TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton}><Icons.Plus size={32} color={colors.primary} /><Text style={styles.addButtonText}>记录今天的变化</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: spacing.xl * 1.5, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitleText: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  writeButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 12 },
  writeButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  headerSubtitle: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
  tabBar: { backgroundColor: colors.surface, flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 15, fontWeight: '500', color: colors['text-secondary'] },
  tabTextActive: { color: '#fff' },
  content: { padding: spacing.lg },
  diaryCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  diaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  diaryUser: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  diaryAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.secondary + '15', alignItems: 'center', justifyContent: 'center' },
  diaryPlantName: { fontSize: 15, fontWeight: '500', color: colors.text },
  diaryDate: { fontSize: 12, color: colors['text-tertiary'] },
  newBadge: { backgroundColor: colors.success + '15', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 10 },
  newBadgeText: { color: colors.success, fontSize: 12 },
  diaryContent: { fontSize: 15, color: colors['text-secondary'], lineHeight: 22, marginBottom: spacing.sm },
  diaryStats: { flexDirection: 'row', gap: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  statButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statText: { fontSize: 14, color: colors['text-tertiary'] },
  addButton: { borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', borderRadius: 16, padding: spacing.xl, alignItems: 'center', marginTop: spacing.sm },
  addButtonText: { color: colors.primary, fontSize: 15, fontWeight: '500', marginTop: spacing.sm },
});
