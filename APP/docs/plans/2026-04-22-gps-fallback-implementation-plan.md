# GPS Fallback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 当 GPS 获取失败时，使用默认地址（贵州省都匀市旗山大道北段8号）的坐标作为 fallback，保证天气功能可用

**Architecture:** 在 `fetchWeatherTip` 函数中添加 GPS fallback 逻辑，当权限拒绝或获取失败时使用预设的默认坐标继续获取天气

**Tech Stack:** Expo + expo-location + React Native

---

## Task 1: 添加默认坐标常量

**Files:**
- Modify: `src/screens/IdentifyScreen.tsx`

**Step 1: 添加默认坐标常量**

在文件顶部（import 语句之后，其他常量之前）添加：

```typescript
// 默认位置坐标（贵州省都匀市旗山大道北段8号）
const DEFAULT_LATITUDE = 26.26;
const DEFAULT_LONGITUDE = 107.52;
```

**Step 2: 验证常量添加正确**

Run: `grep -n "DEFAULT_LATITUDE" src/screens/IdentifyScreen.tsx`
Expected: 找到 DEFAULT_LATITUDE 和 DEFAULT_LONGITUDE 两个定义

---

## Task 2: 修改权限拒绝处理逻辑

**Files:**
- Modify: `src/screens/IdentifyScreen.tsx:138-145`

**Step 1: 修改权限拒绝分支**

找到当前代码（约在 138-145 行）：
```typescript
if (status !== 'granted') {
  console.log('[Weather] 定位权限被拒绝');
  setWeatherLoading(false);
  return;  // <- 删除这行，改为使用默认坐标
}
```

改为：
```typescript
if (status !== 'granted') {
  console.log('[Weather] 定位权限被拒绝，使用默认位置');
  // 使用默认坐标继续获取天气
  fetchWeatherWithCoords(DEFAULT_LATITUDE, DEFAULT_LONGITUDE);
  return;
}
```

**Step 2: 验证修改**

Run: `grep -A3 "status !== 'granted'" src/screens/IdentifyScreen.tsx`
Expected: 看到 "使用默认位置" 和 fetchWeatherWithCoords 调用

---

## Task 3: 添加 fetchWeatherWithCoords 辅助函数

**Files:**
- Modify: `src/screens/IdentifyScreen.tsx`

**Step 1: 在 fetchWeatherTip 函数之前添加辅助函数**

在 `fetchWeatherTip` 函数定义之前（约 135 行）添加：

```typescript
// 使用指定坐标获取天气（抽取公共逻辑）
const fetchWeatherWithCoords = async (latitude: number, longitude: number) => {
  try {
    console.log('GPS坐标:', latitude, longitude);

    const data = await getWeatherTips(latitude, longitude);
    setWeatherData(data.weather);
    setWeatherTip(data.tip);
    // 保存天气数据到缓存
    await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
      weather: data.weather,
      tip: data.tip,
      timestamp: Date.now()
    }));
    console.log('[Weather] 天气数据已缓存');
  } catch (err) {
    console.error('获取天气失败', err);
  } finally {
    setWeatherLoading(false);
  }
};
```

**Step 2: 验证函数添加**

Run: `grep -n "fetchWeatherWithCoords" src/screens/IdentifyScreen.tsx`
Expected: 找到函数定义

---

## Task 4: 修改 getCurrentPositionAsync 失败处理

**Files:**
- Modify: `src/screens/IdentifyScreen.tsx:209-213`

**Step 1: 修改 locationError catch 块**

找到当前代码（约 209-213 行）：
```typescript
} catch (locationError: any) {
  // 定位失败（可能是设备定位服务关闭）
  console.warn('[Weather] 定位失败:', locationError?.message);
  setWeatherLoading(false);
}
```

改为：
```typescript
} catch (locationError: any) {
  // 定位失败，使用默认位置
  console.warn('[Weather] 定位失败，使用默认位置:', locationError?.message);
  fetchWeatherWithCoords(DEFAULT_LATITUDE, DEFAULT_LONGITUDE);
}
```

**Step 2: 验证修改**

Run: `grep -A3 "定位失败" src/screens/IdentifyScreen.tsx`
Expected: 看到 "使用默认位置" 和 fetchWeatherWithCoords 调用

---

## Task 5: 重构原有 getWeatherTips 调用为使用 fetchWeatherWithCoords

**Files:**
- Modify: `src/screens/IdentifyScreen.tsx:189-208`

**Step 1: 找到 getWeatherTips 调用代码并替换**

找到（约 189-208 行）：
```typescript
console.log('GPS坐标:', latitude, longitude);

getWeatherTips(latitude, longitude)
  .then(async (data) => {
    setWeatherData(data.weather);
    setWeatherTip(data.tip);
    // 保存天气数据到缓存
    await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
      weather: data.weather,
      tip: data.tip,
      timestamp: Date.now()
    }));
    console.log('[Weather] 天气数据已缓存');
  })
  .catch((err) => {
    console.error('获取天气失败', err);
  })
  .finally(() => {
    setWeatherLoading(false);
  });
```

改为：
```typescript
fetchWeatherWithCoords(latitude, longitude);
```

**Step 2: 验证修改**

Run: `grep -A5 "GPS坐标" src/screens/IdentifyScreen.tsx`
Expected: 看到 fetchWeatherWithCoords 调用而不是原来的 .then/.catch 链

---

## Task 6: 验证整体修改

**Step 1: 检查 TypeScript 编译**

Run: `npx tsc --noEmit`
Expected: 无编译错误

**Step 2: 检查逻辑完整性**

验证以下场景都有正确处理：
1. 权限拒绝 → 使用默认坐标
2. getCurrentPositionAsync 超时/错误 → 使用默认坐标
3. getCurrentPositionAsync 成功 → 使用真实坐标

---

## Task 7: 提交代码

**Step 1: 提交**

```bash
git add src/screens/IdentifyScreen.tsx
git commit -m "feat: 添加 GPS fallback 逻辑，默认使用贵州省都匀市坐标

- 添加 DEFAULT_LATITUDE 和 DEFAULT_LONGITUDE 常量
- 权限拒绝时使用默认坐标继续获取天气
- GPS 获取失败时使用默认坐标作为 fallback
- 抽取 fetchWeatherWithCoords 辅助函数复用逻辑"
```

---

## 验证清单

- [ ] DEFAULT_LATITUDE 和 DEFAULT_LONGITUDE 已定义
- [ ] 权限拒绝时调用 fetchWeatherWithCoords
- [ ] locationError catch 中调用 fetchWeatherWithCoords
- [ ] 正常流程调用 fetchWeatherWithCoords(latitude, longitude)
- [ ] TypeScript 编译通过
- [ ] 代码已提交