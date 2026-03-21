# GPS定位功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现首页天气小贴士的GPS自动定位功能，仅使用GPS定位，模拟器使用测试坐标

**Architecture:**
- 使用 react-native-geolocation-service 获取GPS坐标
- 开发环境检测：模拟器运行时自动使用测试坐标(上海)
- 权限拒绝时显示错误提示和重试按钮

**Tech Stack:** React Native, react-native-geolocation-service

---

### Task 1: 安装GPS定位依赖包

**Files:**
- Modify: `APP/package.json`
- Modify: `APP/ios/Podfile`

**Step 1: 安装依赖**

```bash
cd APP && npm install react-native-geolocation-service
```

**Step 2: 验证安装**

Run: `cat package.json | grep geolocation`
Expected: 应该看到 "react-native-geolocation-service"

**Step 3: 运行 pod install**

```bash
cd APP/ios && pod install
```

Expected: 安装成功，无错误

---

### Task 2: 更新IdentifyScreen集成GPS定位

**Files:**
- Modify: `APP/src/screens/IdentifyScreen.tsx` (约54-77行)

**Step 1: 添加import**

在文件顶部添加（约第22行后）:

```typescript
import Geolocation from 'react-native-geolocation-service';
import { Platform } from 'react-native';
```

**Step 2: 添加开发环境检测函数**

在 fetchWeatherTip 函数前添加（约第52行）:

```typescript
// 检测是否为模拟器
const isSimulator = Platform.OS === 'ios' && !Platform.isPad;
```

**Step 3: 更新fetchWeatherTip函数**

替换现有的 fetchWeatherTip 函数（约54-77行）:

```typescript
// 获取天气和AI小贴士
const fetchWeatherTip = async () => {
  setWeatherLoading(true);
  try {
    // 开发模式/模拟器使用测试坐标
    if (__DEV__ && isSimulator) {
      console.log('开发模式：使用测试坐标(上海)');
      const latitude = 31.2304;
      const longitude = 121.4737;
      getWeatherTips(latitude, longitude)
        .then((data) => {
          setWeatherData(data.weather);
          setWeatherTip(data.tip);
        })
        .catch((err) => {
          console.error('获取天气失败', err);
        })
        .finally(() => {
          setWeatherLoading(false);
        });
      return;
    }

    // 生产环境：请求GPS定位
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        getWeatherTips(latitude, longitude)
          .then((data) => {
            setWeatherData(data.weather);
            setWeatherTip(data.tip);
          })
          .catch((err) => {
            console.error('获取天气失败', err);
          })
          .finally(() => {
            setWeatherLoading(false);
          });
      },
      (error) => {
        console.error('定位失败', error);
        Alert.alert(
          '无法获取位置',
          '请确保已开启定位服务权限',
          [{ text: '确定' }]
        );
        setWeatherLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  } catch (error) {
    console.error('获取天气失败', error);
    setWeatherLoading(false);
  }
};
```

**Step 4: 验证代码**

Run: `npx tsc --noEmit src/screens/IdentifyScreen.tsx 2>&1 | grep -E "error TS" | head -5`
Expected: 无与定位相关的TypeScript错误

---

### Task 3: 测试完整流程

**Step 1: 启动Metro**

```bash
cd APP && npx react-native start
```

**Step 2: 启动iOS模拟器**

```bash
cd APP/ios && xcrun simctl boot "iPhone 16"
```

**Step 3: 运行APP**

```bash
cd APP && npx react-native run-ios
```

**Step 4: 验证场景**

1. 首次进入APP → 开发模式显示"开发模式：使用测试坐标(上海)"日志
2. 显示上海天气数据
3. 刷新按钮可重新获取天气

---

### Task 4: 生产环境测试（如有真机）

**Step 1: 在真机上运行**

```bash
npx react-native run-ios --device
```

**Step 2: 验证场景**

1. 点击"获取今日小贴士" → 请求定位权限
2. 允许 → 显示当前位置天气
3. 拒绝 → 显示"无法获取位置"提示

---

**Plan complete and saved to `docs/plans/2026-03-19-gps-location-implementation.md`**

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
