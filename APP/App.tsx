/**
 * 护花使者 - Flower Guardian
 * 你的掌上植物管家，让养花不再凭感觉
 */
import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/constants/theme';
import { notificationService } from './src/services/notificationService';
import { reminderNotificationService } from './src/services/reminderNotificationService';
import { webSocketService } from './src/services/webSocketService';
import { getToken } from './src/services/auth';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    console.log('[App] App 启动，开始初始化推送服务');

    // 初始化本地通知服务（离线模式）
    reminderNotificationService.init();

    // 初始化 Expo 通知服务
    notificationService.init().then(result => {
      console.log('[App] 通知服务初始化结果:', result);
    });

    // 监听通知
    const unsubscribe = notificationService.addNotificationReceivedListener((notification) => {
      console.log('[App] 收到通知:', notification.title, notification.data);
    });

    // 检查登录状态并连接 WebSocket
    checkLoginAndConnectWS();

    return () => {
      unsubscribe();
      webSocketService.disconnectPush();
    };
  }, []);

  // 监听应用前后台切换，重新连接 WebSocket
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[App] 应用进入前台，检查 WebSocket 连接...');
        if (!webSocketService.isPushConnected()) {
          checkLoginAndConnectWS();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 检查登录状态并连接 WebSocket 推送通道
  const checkLoginAndConnectWS = async () => {
    try {
      const token = await getToken();
      if (token) {
        setIsLoggedIn(true);
        console.log('[App] 用户已登录，连接 WebSocket 推送通道...');
        // 连接 WebSocket 推送服务
        webSocketService.connectPush({
          onPush: (data) => {
            console.log('[App] 收到推送:', data);
            // 显示本地通知
            if (data.title && data.body) {
              notificationService.triggerNotification(data.title, data.body, {
                type: data.reminder_type || 'push',
                reminder_id: data.id
              });
            }
          },
          onConnected: () => {
            console.log('[App] WebSocket 推送已连接');
          },
          onDisconnected: () => {
            console.log('[App] WebSocket 推送已断开');
          },
          onError: (error) => {
            console.error('[App] WebSocket 推送错误:', error);
          }
        });
      } else {
        console.log('[App] 用户未登录，断开 WebSocket');
        webSocketService.disconnectPush();
      }
    } catch (error) {
      console.error('[App] 检查登录状态失败:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          <AppNavigator />
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
