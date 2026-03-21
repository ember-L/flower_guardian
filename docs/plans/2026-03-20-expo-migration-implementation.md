# Expo 迁移实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 APP/expo/ 创建 Expo 项目并实现首页 GPS 定位功能

**Architecture:**
- 在 APP/ 下创建 expo/ 子项目
- 使用 expo-location 实现 GPS 定位
- 渐进式迁移，从首页开始

**Tech Stack:** Expo SDK 52, expo-location, expo-image-picker, axios

---

### Task 1: 创建 Expo 项目

**Files:**
- Create: `APP/expo/package.json`
- Create: `APP/expo/app.json`
- Create: `APP/expo/App.tsx`

**Step 1: 创建项目目录**

```bash
cd /Users/ember/Flower_Guardian/APP
npx create-expo-app@latest expo --template blank-typescript
```

Expected: 项目创建成功

**Step 2: 进入项目目录**

```bash
cd /Users/ember/Flower_Guardian/APP/expo
```

---

### Task 2: 安装 Expo 依赖

**Files:**
- Modify: `APP/expo/package.json`

**Step 1: 安装定位和图片选择依赖**

```bash
cd /Users/ember/Flower_Guardian/APP/expo
npx expo install expo-location expo-image-picker axios
```

Expected: 安装成功

**Step 2: 安装导航依赖**

```bash
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

---

### Task 3: 配置 app.json

**Files:**
- Modify: `APP/expo/app.json`

**Step 1: 配置应用信息**

```json
{
  "expo": {
    "name": "护花使者",
    "slug": "flower-guardian",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#f46"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.flowerguardian.app",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "需要获取您的位置来提供当地天气信息和植物养护建议"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#f46"
      },
      "permissions": ["ACCESS_FINE_LOCATION"]
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "需要获取您的位置来提供当地天气信息和植物养护建议"
        }
      ]
    ]
  }
}
```

---

### Task 4: 创建服务层

**Files:**
- Create: `APP/expo/src/services/config.ts`
- Create: `APP/expo/src/services/weatherService.ts`
- Create: `APP/expo/src/services/api.ts`

**Step 1: 创建 config.ts**

```typescript
// API 配置
const API_IP = '172.20.10.3'; // 电脑IP
export const API_BASE_URL = `http://${API_IP}:8000`;

export interface WeatherData {
  temp: number;
  tempMax: number;
  tempMin: number;
  humidity: number;
  condition: string;
  conditionIcon: string;
  airQuality: string;
  uvIndex: number;
  windSpeed: string;
  location: string;
}

export interface WeatherTipResponse {
  weather: WeatherData;
  tip: string;
}
```

**Step 2: 创建 weatherService.ts**

```typescript
import { API_BASE_URL, WeatherTipResponse } from './config';

export const getWeatherTips = async (latitude: number, longitude: number): Promise<WeatherTipResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/weather/tips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
  });

  if (!response.ok) {
    throw new Error('获取天气失败');
  }

  return response.json();
};
```

---

### Task 5: 创建首页屏幕

**Files:**
- Create: `APP/expo/src/screens/HomeScreen.tsx`

**Step 1: 创建首页**

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { getWeatherTips, WeatherData } from '../services/weatherService';

export default function HomeScreen() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherTip, setWeatherTip] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWeatherTip = async () => {
    setLoading(true);
    try {
      // 请求定位权限
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限被拒绝', '需要定位权限来获取天气');
        setLoading(false);
        return;
      }

      // 获取当前位置
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      console.log('GPS坐标:', latitude, longitude);

      // 获取天气
      const data = await getWeatherTips(latitude, longitude);
      setWeatherData(data.weather);
      setWeatherTip(data.tip);
    } catch (error) {
      console.error('获取天气失败:', error);
      Alert.alert('错误', '获取天气失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherTip();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>护花使者</Text>
      <Text style={styles.subtitle}>你的掌上植物管家</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#f46" />
      ) : weatherData ? (
        <View style={styles.weatherCard}>
          <Text style={styles.temp}>{weatherData.temp}°</Text>
          <Text style={styles.condition}>{weatherData.condition}</Text>
          <Text style={styles.location}>{weatherData.location}</Text>
          <Text style={styles.tip}>{weatherTip}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={fetchWeatherTip}>
          <Text style={styles.buttonText}>获取天气</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f46',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
  },
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  temp: {
    fontSize: 64,
    fontWeight: '200',
    color: '#333',
  },
  condition: {
    fontSize: 20,
    color: '#666',
  },
  location: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  tip: {
    fontSize: 14,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#f46',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

### Task 6: 更新 App.tsx

**Files:**
- Modify: `APP/expo/App.tsx`

**Step 1: 更新 App.tsx**

```typescript
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  return <HomeScreen />;
}
```

---

### Task 7: 测试 GPS 定位

**Step 1: 启动 Expo**

```bash
cd /Users/ember/Flower_Guardian/APP/expo
npx expo start
```

**Step 2: 在真机上测试**

1. 使用 Expo Go 扫描二维码
2. 点击获取天气
3. 允许定位权限
4. 应该显示 GPS 坐标和天气信息

---

**Plan complete and saved to `docs/plans/2026-03-20-expo-migration-implementation.md`**

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
