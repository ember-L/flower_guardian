// 智能提醒管理页面 - 使用纯 StyleSheet
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface ReminderScreenProps extends Partial<NavigationProps> {}

const mockReminders = [
  { id: '1', plantName: '绿萝', type: 'water', title: '浇水', interval: 7, enabled: true, nextDate: '明天' },
  { id: '2', plantName: '绿萝', type: 'fertilize', title: '施肥', interval: 30, enabled: true, nextDate: '3天后' },
  { id: '3', plantName: '虎皮兰', type: 'water', title: '浇水', interval: 14, enabled: true, nextDate: '5天后' },
  { id: '4', plantName: '吊兰', type: 'prune', title: '修剪', interval: 90, enabled: false, nextDate: '已关闭' },
];

const reminderTypeIcons: Record<string, any> = { water: Icons.Droplets, fertilize: Icons.Flower2, prune: Icons.Scissors };
const reminderTypeColors: Record<string, string> = { water: '#0891B2', fertilize: '#059669', prune: '#F59E0B' };

export function ReminderScreen({ onGoBack }: ReminderScreenProps) {
  const [reminders, setReminders] = useState(mockReminders);
  const toggleReminder = (id: string) => setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const handleSnooze = () => Alert.alert('延迟提醒', '选择延迟时间', [{ text: '1天后', onPress: () => {} }, { text: '3天后', onPress: () => {} }, { text: '取消', style: 'cancel' }]);

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
              <Icons.Bell size={32} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>智能提醒</Text>
            <Text style={styles.headerSubtitle}>管理你的植物养护提醒</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* 统计卡片 */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{reminders.filter(r => r.enabled).length}</Text>
              <Text style={styles.statLabel}>活跃提醒</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{reminders.length}</Text>
              <Text style={styles.statLabel}>总提醒数</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.warning }]}>2</Text>
              <Text style={styles.statLabel}>今日待办</Text>
            </View>
          </View>

          {/* 提醒列表标题 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>提醒列表</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{reminders.filter(r => r.enabled).length} 个</Text>
            </View>
          </View>

          {/* 提醒卡片 */}
          {reminders.map((reminder) => {
            const Icon = reminderTypeIcons[reminder.type] || Icons.Bell;
            const typeColor = reminderTypeColors[reminder.type] || colors.primary;
            return (
              <View key={reminder.id} style={[styles.reminderCard, !reminder.enabled && styles.reminderDisabled]}>
                <View style={styles.reminderRow}>
                  <View style={[styles.reminderIcon, { backgroundColor: typeColor + '15' }]}>
                    <Icon size={26} color={typeColor} />
                  </View>
                  <View style={styles.reminderInfo}>
                    <Text style={styles.reminderTitle}>{reminder.plantName} - {reminder.title}</Text>
                    <View style={styles.reminderMeta}>
                      <Text style={styles.reminderInterval}>每 {reminder.interval} 天</Text>
                      <View style={[styles.nextDateBadge, { backgroundColor: reminder.enabled ? typeColor + '15' : colors.border }]}>
                        <Icons.Clock size={12} color={reminder.enabled ? typeColor : colors['text-tertiary']} />
                        <Text style={[styles.nextDateText, { color: reminder.enabled ? typeColor : colors['text-tertiary'] }]}>{reminder.nextDate}</Text>
                      </View>
                    </View>
                  </View>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={() => toggleReminder(reminder.id)}
                    trackColor={{ false: colors.border, true: typeColor + '50' }}
                    thumbColor={reminder.enabled ? typeColor : colors['text-tertiary']}
                  />
                </View>
                {reminder.enabled && (
                  <View style={styles.reminderActions}>
                    <TouchableOpacity onPress={handleSnooze} style={styles.actionButton} activeOpacity={0.7}>
                      <Icons.Clock size={16} color={colors['text-secondary']} />
                      <Text style={styles.actionButtonText}>延迟</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Alert.alert('完成', `${reminder.title}已记录`)} style={[styles.actionButton, styles.actionButtonPrimary]} activeOpacity={0.7}>
                      <Icons.Check size={16} color="#fff" />
                      <Text style={[styles.actionButtonText, { color: '#fff' }]}>完成</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          {/* 养护小贴士 */}
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <View style={styles.tipIcon}>
                <Icons.Lightbulb size={20} color={colors.warning} />
              </View>
              <Text style={styles.tipTitle}>养护小贴士</Text>
            </View>
            <Text style={styles.tipText}>不同季节浇水频率不同，夏季适当增加，冬季适当减少。观察土壤干湿情况最可靠。</Text>
          </View>
        </View>
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
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
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

  // 统计卡片
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 12, color: colors['text-tertiary'], marginTop: spacing.xs },
  statDivider: { width: 1, backgroundColor: colors.border },

  // 列表标题
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  sectionBadge: { backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 10 },
  sectionBadgeText: { fontSize: 12, color: colors.primary, fontWeight: '600' },

  // 提醒卡片
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderDisabled: { opacity: 0.6 },
  reminderRow: { flexDirection: 'row', alignItems: 'center' },
  reminderIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderInfo: { flex: 1, marginLeft: spacing.sm },
  reminderTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  reminderMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  reminderInterval: { fontSize: 13, color: colors['text-tertiary'] },
  nextDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  nextDateText: { fontSize: 12, fontWeight: '500' },

  // 操作按钮
  reminderActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionButtonText: { fontSize: 14, color: colors['text-secondary'], fontWeight: '500' },

  // 提示卡片
  tipCard: {
    backgroundColor: colors.warning + '10',
    borderRadius: 20,
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl * 2,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: { fontSize: 16, fontWeight: '600', color: colors.warning },
  tipText: { fontSize: 14, color: colors['text-secondary'], lineHeight: 22 },
});
