// 智能提醒管理页面 - 使用纯 StyleSheet
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';

const mockReminders = [
  { id: '1', plantName: '绿萝', type: 'water', title: '浇水', interval: 7, enabled: true },
  { id: '2', plantName: '绿萝', type: 'fertilize', title: '施肥', interval: 30, enabled: true },
  { id: '3', plantName: '虎皮兰', type: 'water', title: '浇水', interval: 14, enabled: true },
  { id: '4', plantName: '吊兰', type: 'prune', title: '修剪', interval: 90, enabled: false },
];

const reminderTypeIcons: Record<string, any> = { water: Icons.Droplets, fertilize: Icons.Flower2, prune: Icons.Scissors };
const reminderTypeColors: Record<string, string> = { water: colors.primary, fertilize: colors.secondary, prune: colors.warning };

export function ReminderScreen() {
  const [reminders, setReminders] = useState(mockReminders);
  const toggleReminder = (id: string) => setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const handleSnooze = () => Alert.alert('延迟提醒', '选择延迟时间', [{ text: '1天后', onPress: () => {} }, { text: '3天后', onPress: () => {} }, { text: '取消', style: 'cancel' }]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}><Icons.Bell size={24} color={colors.primary} /><Text style={styles.headerTitleText}>智能提醒</Text></View>
        <Text style={styles.headerSubtitle}>管理你的植物养护提醒</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>提醒列表</Text>
          {reminders.map((reminder) => {
            const Icon = reminderTypeIcons[reminder.type] || Icons.Bell;
            const typeColor = reminderTypeColors[reminder.type] || colors.primary;
            return (
              <View key={reminder.id} style={[styles.reminderCard, !reminder.enabled && styles.reminderDisabled]}>
                <View style={styles.reminderRow}>
                  <View style={[styles.reminderIcon, { backgroundColor: typeColor + '15' }]}><Icon size={24} color={typeColor} /></View>
                  <View style={styles.reminderInfo}><Text style={styles.reminderTitle}>{reminder.plantName} - {reminder.title}</Text><Text style={styles.reminderInterval}>每 {reminder.interval} 天一次</Text></View>
                  <Switch value={reminder.enabled} onValueChange={() => toggleReminder(reminder.id)} trackColor={{ false: colors.border, true: colors.primary + '50' }} thumbColor={reminder.enabled ? colors.primary : colors['text-tertiary']} />
                </View>
                {reminder.enabled && (
                  <View style={styles.reminderActions}>
                    <TouchableOpacity onPress={handleSnooze} style={styles.actionButton}><Text style={styles.actionButtonText}>延迟</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => Alert.alert('完成', `${reminder.title}已记录`)} style={[styles.actionButton, styles.actionButtonPrimary]}><Text style={[styles.actionButtonText, { color: '#fff' }]}>完成</Text></TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}><Icons.Lightbulb size={18} color={colors.info} /><Text style={styles.tipTitle}>养护小贴士</Text></View>
            <Text style={styles.tipText}>不同季节浇水频率不同，夏季适当增加，冬季适当减少。观察土壤干湿情况最可靠。</Text>
          </View>
        </View>
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
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  reminderCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  reminderDisabled: { opacity: 0.6 },
  reminderRow: { flexDirection: 'row', alignItems: 'center' },
  reminderIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reminderInfo: { flex: 1, marginLeft: spacing.sm },
  reminderTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  reminderInterval: { fontSize: 13, color: colors['text-tertiary'] },
  reminderActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  actionButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  actionButtonPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionButtonText: { fontSize: 14, color: colors['text-secondary'] },
  tipCard: { backgroundColor: colors.info + '15', borderRadius: 16, padding: spacing.md, marginTop: spacing.lg },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  tipTitle: { fontSize: 15, fontWeight: '600', color: colors.info },
  tipText: { fontSize: 14, color: colors['text-secondary'], lineHeight: 20 },
});
