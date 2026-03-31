// 推送通知服务 - 使用 expo-notifications
// 支持本地通知和服务器推送（通过 Expo Push）

import * as Notifications from 'expo-notifications';
import { Platform, NativeModules } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { getToken } from './auth';

// 立即打印模块加载信息
console.log('[NotificationService] 模块已加载');
console.log('[NotificationService] Platform:', Platform.OS);
console.log('[NotificationService] Notifications:', !!Notifications);

// 配置通知处理行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: string;
  reminder_id?: number;
  plant_id?: number;
  [key: string]: any;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  data: NotificationData;
  timestamp: number;
  read: boolean;
}

// 检查是否为真实设备（不依赖 expo-device）
const isRealDevice = (): boolean => {
  // 在 iOS 模拟器上，Platform.OS === 'ios' 但没有 UIKit 效果
  // 我们简单地假设大多数情况下不是模拟器，或者让 expo-notifications 自己处理
  return Platform.OS !== 'web';
};

class NotificationService {
  private listeners: ((notification: NotificationItem) => void)[] = [];
  private notificationHistory: NotificationItem[] = [];
  private initialized = false;
  private expoPushToken: string | null = null;

  // 初始化
  init = async (): Promise<boolean> => {
    if (this.initialized) return true;

    try {
      if (!isRealDevice()) {
        console.log('[NotificationService] 非真实设备环境');
        this.initialized = true;
        return true;
      }

      // 请求通知权限
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NotificationService] 未获得通知权限');
        this.initialized = true;
        return false;
      }

      // 设置渠道（Android 必需）
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B6B',
        });

        await Notifications.setNotificationChannelAsync('reminders', {
          name: '浇水提醒',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B6B',
        });
      }

      // 获取推送令牌（用于服务器推送）
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        try {
          // 获取 Expo Push Token（需要正确的 projectId）
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: '8dbd1b78-ab76-426f-86c6-351620ef8769',
          });
          this.expoPushToken = tokenData.data;
          console.log('[NotificationService] Expo Push Token:', this.expoPushToken);
          await this.registerPushToken(this.expoPushToken);
        } catch (e) {
          console.log('[NotificationService] Expo Push Token 失败，可能无法使用服务器推送');
          console.log('[NotificationService] 本地通知仍可正常使用');
        }
      }

      // 设置收到通知的处理
      this.setupNotificationHandlers();

      this.initialized = true;
      console.log('[NotificationService] 初始化成功');
      return true;
    } catch (error) {
      console.error('[NotificationService] 初始化失败:', error);
      this.initialized = true;
      return false;
    }
  };

  // 注册推送令牌到后端
  private registerPushToken = async (token: string) => {
    try {
      const authToken = await getToken();
      if (!authToken) {
        console.log('[NotificationService] 未登录，跳过注册 token');
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/users/push-token`,
        { expo_push_token: token },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      console.log('[NotificationService] Push token 已注册到后端');
    } catch (error) {
      console.error('[NotificationService] 注册 push token 失败:', error);
    }
  };

  // 设置通知处理器
  private setupNotificationHandlers = () => {
    // 收到通知时触发
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('[NotificationService] 收到通知:', notification.request.content.title);

      const item: NotificationItem = {
        id: notification.request.identifier,
        title: notification.request.content.title || '',
        body: notification.request.content.body || '',
        data: notification.request.content.data as NotificationData,
        timestamp: Date.now(),
        read: false,
      };

      this.notificationHistory.unshift(item);
      this.listeners.forEach(listener => listener(item));
    });

    // 点击通知时触发
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[NotificationService] 点击通知:', response.notification.request.content.title);
      // 可以在这里处理导航逻辑
    });
  };

  // 获取 Expo Push Token（需要发送到后端）
  getPushToken = async (): Promise<string | null> => {
    if (!this.expoPushToken) {
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: '8dbd1b78-ab76-426f-86c6-351620ef8769',
        });
        this.expoPushToken = tokenData.data;
      } catch (error) {
        console.error('[NotificationService] 获取 Push Token 失败:', error);
        return null;
      }
    }
    return this.expoPushToken;
  };

  // 添加监听器
  addNotificationReceivedListener = (callback: (notification: NotificationItem) => void) => {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  };

  // 发送本地通知
  triggerNotification = async (title: string, body: string, data: NotificationData) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // 立即发送
      });

      // 同时添加到历史记录
      const notification: NotificationItem = {
        id: Date.now().toString(),
        title,
        body,
        data,
        timestamp: Date.now(),
        read: false,
      };

      this.notificationHistory.unshift(notification);
      this.listeners.forEach(listener => listener(notification));
    } catch (error) {
      console.error('[NotificationService] 发送通知失败:', error);
    }
  };

  // 获取通知历史
  getHistory = (): NotificationItem[] => {
    return this.notificationHistory;
  };

  // 标记已读
  markAsRead = (id: string) => {
    const notification = this.notificationHistory.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  };

  // 清空历史
  clearHistory = () => {
    this.notificationHistory = [];
  };
}

export const notificationService = new NotificationService();
export default notificationService;