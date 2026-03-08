// 智能提醒管理页面
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Bell, Droplets, Scissors, Flower2, Clock, Sun, Settings } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

// 模拟提醒数据
const mockReminders = [
  { id: '1', plantName: '绿萝', type: 'water', title: '浇水', interval: 7, enabled: true, lastDone: '2024-01-15' },
  { id: '2', plantName: '绿萝', type: 'fertilize', title: '施肥', interval: 30, enabled: true, lastDone: '2024-01-10' },
  { id: '3', plantName: '虎皮兰', type: 'water', title: '浇水', interval: 14, enabled: true, lastDone: '2024-01-12' },
  { id: '4', plantName: '吊兰', type: 'prune', title: '修剪', interval: 90, enabled: false, lastDone: '2024-01-01' },
];

type RootStackParamList = {
  Reminder: { plantId?: string };
};

const reminderTypeIcons = {
  water: Droplets,
  fertilize: Flower2,
  prune: Scissors,
  repot: Flower2,
};

const reminderTypeColors = {
  water: colors.primary,
  fertilize: colors.secondary,
  prune: colors.warning,
  repot: '#8B4513',
};

export function ReminderScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Reminder'>>();
  const [reminders, setReminders] = useState(mockReminders);

  const toggleReminder = (id: string) => {
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    );
  };

  const handleSnooze = (reminder: typeof mockReminders[0]) => {
    Alert.alert(
      '延期提醒',
      `将${reminder.title}延期多久？`,
      [
        { text: '1天后', onPress: () => console.log('延期1天') },
        { text: '3天后', onPress: () => console.log('延期3天') },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const getNextDate = (reminder: typeof mockReminders[0]) => {
    const lastDate = new Date(reminder.lastDone);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + reminder.interval);
    const today = new Date();
    const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays}天后` : '今天';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>智能提醒</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 环境设置提示 */}
        <View style={styles.envCard}>
          <View style={styles.envHeader}>
            <Sun size={24} color={colors.warning} />
            <Text style={styles.envTitle}>环境校准</Text>
          </View>
          <Text style={styles.envDesc}>
            当前环境：南向阳台 | 系统已自动调整浇水频率
          </Text>
          <TouchableOpacity style={styles.envButton}>
            <Text style={styles.envButtonText}>调整环境</Text>
          </TouchableOpacity>
        </View>

        {/* 懒人模式 */}
        <View style={styles.lazyModeCard}>
          <View style={styles.lazyModeHeader}>
            <Clock size={24} color={colors.secondary} />
            <Text style={styles.lazyModeTitle}>懒人模式</Text>
          </View>
          <View style={styles.lazyModeContent}>
            <Text style={styles.lazyModeDesc}>开启后，系统会学习你的习惯自动调整提醒时间</Text>
            <Switch
              value={true}
              trackColor={{ false: colors['text-light'], true: colors.secondary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* 提醒列表 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>提醒列表</Text>
          {reminders.map((reminder) => {
            const IconComponent = reminderTypeIcons[reminder.type as keyof typeof reminderTypeIcons] || Droplets;
            const iconColor = reminderTypeColors[reminder.type as keyof typeof reminderTypeColors] || colors.primary;

            return (
              <View key={reminder.id} style={styles.reminderCard}>
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                  <IconComponent size={24} color={iconColor} />
                </View>
                <View style={styles.reminderInfo}>
                  <Text style={styles.plantName}>{reminder.plantName}</Text>
                  <Text style={styles.reminderTitle}>{reminder.title} · 每{reminder.interval}天</Text>
                  <Text style={styles.nextDate}>下次：{getNextDate(reminder)}</Text>
                </View>
                <View style={styles.reminderActions}>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={() => toggleReminder(reminder.id)}
                    trackColor={{ false: colors['text-light'], true: colors.primary }}
                    thumbColor={colors.white}
                  />
                  <TouchableOpacity
                    style={styles.snoozeButton}
                    onPress={() => handleSnooze(reminder)}
                  >
                    <Clock size={16} color={colors['text-secondary']} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* 添加提醒 */}
        <TouchableOpacity style={styles.addButton}>
          <Bell size={20} color={colors.white} />
          <Text style={styles.addButtonText}>添加新提醒</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  settingsButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  envCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  envHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  envTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  envDesc: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
  },
  envButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  envButtonText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: '500',
  },
  lazyModeCard: {
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  lazyModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  lazyModeTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  lazyModeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lazyModeDesc: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginRight: spacing.md,
  },
  section: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  plantName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  reminderTitle: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginTop: 2,
  },
  nextDate: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: 2,
  },
  reminderActions: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  snoozeButton: {
    padding: spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  addButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
});
