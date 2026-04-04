// 提醒本地通知服务
// 当服务器推送不可用时，使用本地通知作为替代方案
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SmartReminder } from './reminderService';

// 通知类型映射
const TYPE_NAMES: Record<string, string> = {
  water: '浇水',
  fertilize: '施肥',
  prune: '修剪',
};

class ReminderNotificationService {
  private scheduledIds: Map<number, string> = new Map(); // reminder_id -> notification_id

  // 初始化服务
  init = async () => {
    // 设置通知渠道（Android）
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: '植物养护提醒',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#f46',
      });
    }

    // 清除所有已调度的通知（启动时清理）
    await this.cancelAllNotifications();
  };

  // 调度提醒通知
  scheduleReminder = async (reminder: SmartReminder): Promise<boolean> => {
    if (!reminder.enabled || !reminder.next_due) {
      return false;
    }

    try {
      // 取消之前的通知
      await this.cancelReminder(reminder.id);

      // 计算触发时间
      const triggerDate = new Date(reminder.next_due);

      // 如果已过期或即将过期，立即通知
      const now = new Date();
      let actualTriggerDate = triggerDate;

      if (triggerDate <= now) {
        // 已到期，延迟 5 秒后通知
        actualTriggerDate = new Date(now.getTime() + 5000);
      } else {
        // 提前 30 分钟通知
        actualTriggerDate = new Date(triggerDate.getTime() - 30 * 60 * 1000);
      }

      const typeName = TYPE_NAMES[reminder.type] || '养护';
      const plantName = reminder.plant_name || '植物';
      const title = '🌱 养护提醒';
      const body = `您的"${plantName}"需要${typeName}啦！`;

      // 调度通知
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'reminder',
            reminder_id: reminder.id,
            reminder_type: reminder.type,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: actualTriggerDate,
        },
      });

      this.scheduledIds.set(reminder.id, notificationId);
      console.log(`[ReminderNotification] 已调度通知: ${reminder.id}, 触发时间: ${actualTriggerDate}`);
      return true;
    } catch (error) {
      console.error('[ReminderNotification] 调度通知失败:', error);
      return false;
    }
  };

  // 取消单个提醒的通知
  cancelReminder = async (reminderId: number): Promise<void> => {
    const notificationId = this.scheduledIds.get(reminderId);
    if (notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        this.scheduledIds.delete(reminderId);
        console.log(`[ReminderNotification] 已取消通知: ${reminderId}`);
      } catch (error) {
        console.error(`[ReminderNotification] 取消通知失败: ${reminderId}`, error);
      }
    }
  };

  // 取消所有通知
  cancelAllNotifications = async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledIds.clear();
      console.log('[ReminderNotification] 已取消所有通知');
    } catch (error) {
      console.error('[ReminderNotification] 取消所有通知失败:', error);
    }
  };

  // 批量调度提醒
  scheduleAllReminders = async (reminders: SmartReminder[]): Promise<void> => {
    console.log(`[ReminderNotification] 开始批量调度 ${reminders.length} 个提醒`);

    // 先取消所有旧的通知
    await this.cancelAllNotifications();

    // 调度所有启用的提醒
    for (const reminder of reminders) {
      if (reminder.enabled) {
        await this.scheduleReminder(reminder);
      }
    }

    console.log(`[ReminderNotification] 批量调度完成`);
  };

  // 测试通知
  testNotification = async (): Promise<void> => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 测试通知',
          body: '这是一条测试通知，推送功能正常！',
          data: { type: 'test' },
        },
        trigger: null, // 立即发送
      });
      console.log('[ReminderNotification] 测试通知已发送');
    } catch (error) {
      console.error('[ReminderNotification] 测试通知失败:', error);
    }
  };
}

export const reminderNotificationService = new ReminderNotificationService();
export default reminderNotificationService;
