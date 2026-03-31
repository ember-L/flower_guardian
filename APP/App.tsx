/**
 * 护花使者 - Flower Guardian
 * 你的掌上植物管家，让养花不再凭感觉
 */
import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/constants/theme';
import { notificationService } from './src/services/notificationService';
import { jpushService } from './src/services/jpushService';
import { reminderNotificationService } from './src/services/reminderNotificationService';

function App() {
  useEffect(() => {
    console.log('[App] App 启动，开始初始化推送服务');

    // 初始化本地通知服务（离线模式）
    reminderNotificationService.init();

    // 初始化 JPush（极光推送）
    jpushService.init();

    // 初始化 Expo 通知服务
    notificationService.init().then(result => {
      console.log('[App] 通知服务初始化结果:', result);
    });

    // 监听通知
    const unsubscribe = notificationService.addNotificationReceivedListener((notification) => {
      console.log('[App] 收到通知:', notification.title, notification.data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

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
