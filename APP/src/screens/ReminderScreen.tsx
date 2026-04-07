// 智能提醒管理页面 - 使用纯 StyleSheet
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Switch, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Icons } from '../components/Icon';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { reminderService, SmartReminder } from '../services/reminderService';
import { getMyPlants } from '../services/plantService';
import { notificationService } from '../services/notificationService';
import { reminderNotificationService } from '../services/reminderNotificationService';

interface UserPlant {
  id: number;
  plant_name: string;
  nickname: string;
  plant_id?: number;
}

interface ReminderScreenProps extends Partial<NavigationProps> {}

const reminderTypeIcons: Record<string, any> = {
  water: Icons.Droplets,
  fertilize: Icons.Flower2,
  prune: Icons.Scissors
};
const reminderTypeColors: Record<string, string> = {
  water: '#0891B2',
  fertilize: '#059669',
  prune: '#F59E0B'
};

const getTypeName = (type: string) => {
  switch (type) {
    case 'water': return '浇水';
    case 'fertilize': return '施肥';
    case 'prune': return '修剪';
    default: return type;
  }
};

export function ReminderScreen({ onGoBack, isLoggedIn, onRequireLogin }: ReminderScreenProps) {
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<'water' | 'fertilize' | 'prune'>('water');
  const [intervalDays, setIntervalDays] = useState(7);

  // 使用 useFocusEffect 每次页面获得焦点时检查登录状态
  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn && onRequireLogin) {
        onRequireLogin();
      }
    }, [isLoggedIn, onRequireLogin])
  );

  const loadReminders = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      setReminders([]);
      return;
    }
    setLoading(true);
    try {
      // 同时加载提醒和用户的植物
      const [remindersData, plantsData] = await Promise.all([
        reminderService.getSmartReminders(),
        getMyPlants()
      ]);
      setReminders(remindersData);
      setUserPlants(plantsData || []);

      // 调度本地通知
      if (remindersData && remindersData.length > 0) {
        reminderNotificationService.scheduleAllReminders(remindersData);
      }
    } catch (error: any) {
      console.error('Failed to load reminders:', error);
      // 检查是否是认证错误或服务器错误
      const status = error.response?.status;
      if (status === 401) {
        if (onRequireLogin) {
          onRequireLogin();
          return;
        }
      }
      // 服务器错误或其他错误，设置空数组显示空状态
      if (status === 500 || status === 0 || !status) {
        console.log('Server error, showing empty state');
        setReminders([]);
        setUserPlants([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, onRequireLogin]);

  // 添加提醒
  const handleAddReminder = async () => {
    if (!selectedPlantId) {
      Alert.alert('提示', '请选择植物');
      return;
    }
    try {
      const plant = userPlants.find(p => p.id === selectedPlantId);
      const newReminder = await reminderService.createSmartReminder({
        user_plant_id: selectedPlantId,
        plant_id: plant?.plant_id,
        type: selectedType,
        interval_days: intervalDays,
      });
      Alert.alert('成功', '提醒创建成功');
      setShowAddModal(false);

      // 调度本地通知
      if (newReminder) {
        await reminderNotificationService.scheduleReminder(newReminder);
      }

      loadReminders();
    } catch (error: any) {
      console.error('Failed to create reminder:', error);
      Alert.alert('错误', '创建提醒失败');
    }
  };

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const toggleReminder = async (id: number) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    try {
      const newEnabled = !reminder.enabled;
      await reminderService.toggleReminder(id, newEnabled);

      const updatedReminder = { ...reminder, enabled: newEnabled };

      setReminders(prev =>
        prev.map(r => r.id === id ? updatedReminder : r)
      );

      // 更新本地通知
      if (newEnabled) {
        await reminderNotificationService.scheduleReminder(updatedReminder);
      } else {
        await reminderNotificationService.cancelReminder(id);
      }
    } catch (error) {
      Alert.alert('错误', '更新提醒失败');
    }
  };

  const handleComplete = async (id: number, title: string) => {
    Alert.alert(
      '确认完成',
      `确定已完成 ${title} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            try {
              const updated = await reminderService.completeReminder(id);
              setReminders(prev =>
                prev.map(r => r.id === id ? { ...r, ...updated } : r)
              );

              // 重新调度下次通知
              await reminderNotificationService.scheduleReminder(updated);

              Alert.alert('成功', '已记录完成，下次提醒已更新');
            } catch (error) {
              Alert.alert('错误', '操作失败');
            }
          }
        }
      ]
    );
  };

  const handleSnooze = (id: number) => {
    Alert.alert('延迟提醒', '选择延迟时间', [
      { text: '1天后', onPress: () => {} },
      { text: '3天后', onPress: () => {} },
      { text: '取消', style: 'cancel' }
    ]);
  };

  const handleDelete = (id: number, plantName: string, type: string) => {
    Alert.alert(
      '删除提醒',
      `确定删除 "${plantName} - ${getTypeName(type)}" 提醒吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await reminderService.deleteReminder(id);
              setReminders(prev => prev.filter(r => r.id !== id));
              // 取消本地通知
              await reminderNotificationService.cancelReminder(id);
              Alert.alert('成功', '提醒已删除');
            } catch (error) {
              Alert.alert('错误', '删除提醒失败');
            }
          }
        }
      ]
    );
  };

  const formatNextDue = (nextDue?: string) => {
    if (!nextDue) return '未知';
    const date = new Date(nextDue);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return '已到期';
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    return `${diff}天后`;
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  const handleTestNotification = () => {
    reminderNotificationService.testNotification();
    Alert.alert('测试通知', '已发送测试通知，请在通知栏查看');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
              <Icons.Bell size={32} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>智能提醒</Text>
            <Text style={styles.headerSubtitle}>根据天气智能调整浇水间隔</Text>
          </View>
          <TouchableOpacity onPress={handleTestNotification} style={styles.testButton}>
            <Icons.BellOff size={20} color={colors.primary} />
          </TouchableOpacity>
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
              <Text style={[styles.statNumber, { color: colors.warning }]}>
                {reminders.filter(r => {
                  if (!r.next_due) return false;
                  const diff = Math.ceil((new Date(r.next_due).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return diff <= 0;
                }).length}
              </Text>
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
            const intervalText = reminder.calculated_interval && reminder.calculated_interval !== reminder.interval_days
              ? `每 ${reminder.calculated_interval} 天（智能）`
              : `每 ${reminder.interval_days} 天`;
            const titleText = reminder.plant_name
              ? `${reminder.plant_name} - ${getTypeName(reminder.type)}`
              : getTypeName(reminder.type);

            return (
              <View key={reminder.id.toString()} style={[styles.reminderCard, !reminder.enabled && styles.reminderDisabled]}>
                <View style={styles.reminderRow}>
                  <View style={[styles.reminderIcon, { backgroundColor: typeColor + '15' }]}>
                    <Icon size={26} color={typeColor} />
                  </View>
                  <View style={styles.reminderInfo}>
                    <Text style={styles.reminderTitle}>{titleText}</Text>
                    <View style={styles.reminderMeta}>
                      <Text style={styles.reminderInterval}>{intervalText}</Text>
                    </View>
                    {reminder.weather_tip && reminder.enabled && (
                      <View style={[styles.weatherTipBadge, { backgroundColor: colors.warning + '15' }]}>
                        <Icons.Cloud size={12} color={colors.warning} />
                        <Text style={styles.weatherTipText}>{reminder.weather_tip}</Text>
                      </View>
                    )}
                    <View style={[styles.nextDateBadge, { backgroundColor: reminder.enabled ? typeColor + '15' : colors.border }]}>
                      <Icons.Clock size={12} color={reminder.enabled ? typeColor : colors['text-tertiary']} />
                      <Text style={[styles.nextDateText, { color: reminder.enabled ? typeColor : colors['text-tertiary'] }]}>
                        {formatNextDue(reminder.next_due)}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={() => toggleReminder(reminder.id)}
                    trackColor={{ false: colors.border, true: typeColor + '50' }}
                    thumbColor={reminder.enabled ? typeColor : colors['text-tertiary']}
                  />
                </View>
                <View style={styles.reminderActions}>
                  {reminder.enabled ? (
                    <>
                      <TouchableOpacity onPress={() => handleSnooze(reminder.id)} style={styles.actionButton} activeOpacity={0.7}>
                        <Icons.Clock size={16} color={colors['text-secondary']} />
                        <Text style={styles.actionButtonText}>延迟</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleComplete(reminder.id, getTypeName(reminder.type))} style={[styles.actionButton, styles.actionButtonPrimary]} activeOpacity={0.7}>
                        <Icons.Check size={16} color="#fff" />
                        <Text style={[styles.actionButtonText, { color: '#fff' }]}>完成</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                  <TouchableOpacity onPress={() => handleDelete(reminder.id, reminder.plant_name || getTypeName(reminder.type), reminder.type)} style={[styles.actionButton, styles.actionButtonDanger]} activeOpacity={0.7}>
                    <Icons.Trash2 size={16} color={colors.error} />
                    <Text style={[styles.actionButtonText, { color: colors.error }]}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* 空状态 */}
          {reminders.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Icons.Bell size={48} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>暂无提醒</Text>
              <Text style={styles.emptySubtitle}>
                {userPlants.length > 0
                  ? '点击下方按钮添加提醒'
                  : '在花园中添加植物后，可以创建智能浇水提醒'}
              </Text>
              {userPlants.length > 0 && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Text style={styles.emptyButtonText}>添加提醒</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* 底部添加按钮 */}
          {reminders.length > 0 && userPlants.length > 0 && (
            <TouchableOpacity
              style={styles.fabButton}
              onPress={() => setShowAddModal(true)}
            >
              <Icons.Plus size={24} color={colors.white} />
              <Text style={styles.fabText}>添加提醒</Text>
            </TouchableOpacity>
          )}

          {/* 养护小贴士 */}
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <View style={styles.tipIcon}>
                <Icons.Lightbulb size={20} color={colors.warning} />
              </View>
              <Text style={styles.tipTitle}>智能提醒说明</Text>
            </View>
            <Text style={styles.tipText}>
              智能提醒会根据植物种类、季节和天气自动调整浇水间隔。高温天气会提前提醒，阴雨天气会适当延迟。
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 添加提醒弹窗 */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加提醒</Text>

            {/* 选择植物 */}
            <Text style={styles.modalLabel}>选择植物</Text>
            <View style={styles.plantList}>
              {userPlants.map((plant) => (
                <TouchableOpacity
                  key={plant.id}
                  style={[
                    styles.plantItem,
                    selectedPlantId === plant.id && styles.plantItemSelected
                  ]}
                  onPress={() => setSelectedPlantId(plant.id)}
                >
                  <Text style={[
                    styles.plantItemText,
                    selectedPlantId === plant.id && styles.plantItemTextSelected
                  ]}>
                    {plant.nickname || plant.plant_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 选择类型 */}
            <Text style={styles.modalLabel}>提醒类型</Text>
            <View style={styles.typeList}>
              {[
                { key: 'water', label: '浇水', color: '#0891B2' },
                { key: 'fertilize', label: '施肥', color: '#059669' },
                { key: 'prune', label: '修剪', color: '#F59E0B' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.typeItem,
                    selectedType === item.key && { backgroundColor: item.color + '20', borderColor: item.color }
                  ]}
                  onPress={() => setSelectedType(item.key as any)}
                >
                  <Text style={[
                    styles.typeItemText,
                    selectedType === item.key && { color: item.color }
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 间隔天数 */}
            <Text style={styles.modalLabel}>提醒间隔（天）</Text>
            <View style={styles.intervalRow}>
              {[3, 7, 14, 30].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.intervalItem,
                    intervalDays === days && styles.intervalItemSelected
                  ]}
                  onPress={() => setIntervalDays(days)}
                >
                  <Text style={[
                    styles.intervalItemText,
                    intervalDays === days && styles.intervalItemTextSelected
                  ]}>
                    {days}天
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 按钮 */}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddReminder}>
                <Text style={styles.modalConfirmText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  testButton: {
    position: 'absolute',
    right: spacing.md,
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

  // 天气提示
  weatherTipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  weatherTipText: { fontSize: 11, color: colors.warning },

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
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
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
  actionButtonDanger: { borderColor: colors.error },
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

  // 空状态
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
  },
  headerAddText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
    ...shadows.lg,
  },
  fabText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
  },
  headerAddText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  plantList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  plantItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  plantItemSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  plantItemText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
  },
  plantItemTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  typeList: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeItemText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
  },
  intervalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  intervalItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  intervalItemSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  intervalItemText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
  },
  intervalItemTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    fontWeight: fontWeight.medium,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
});
