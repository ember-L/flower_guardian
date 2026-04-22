# GPS Fallback 设计方案

**日期**: 2026-04-22
**问题**: Android 真机和模拟器无法使用 GPS 服务，导致天气功能不可用
**解决方案**: 当 GPS 获取失败时，使用默认地址作为 fallback

## 背景

- APP 使用 `expo-location` 获取 GPS 坐标
- Android 真机/模拟器 GPS 获取失败时，没有任何 fallback
- 当前失败处理：只是打印警告 `console.warn('[Weather] 定位失败:', locationError?.message)`，然后静默退出
- 用户完全无法获得天气信息

## 默认地址

**地址**: 贵州省都匀市旗山大道北段8号

**GPS 坐标**:
- 经度: 107.52° E
- 纬度: 26.26° N

（匀市位于贵州省南部，城区中心坐标）

## 设计方案

### 流程图

```
开始
  ↓
请求定位权限 (requestForegroundPermissionsAsync)
  ↓
权限被拒绝? → 是 → 使用默认坐标 (107.52, 26.26)
  ↓否
getCurrentPositionAsync
  ↓
获取成功? → 是 → 使用真实坐标
  ↓否
超时/错误 → 使用默认坐标 (107.52, 26.26)
  ↓
调用 getWeatherTips(latitude, longitude)
  ↓
显示天气信息
```

### 实现细节

**修改文件**: `src/screens/IdentifyScreen.tsx`

**新增常量**:
```typescript
// 默认位置坐标（贵州省都匀市旗山大道北段8号）
const DEFAULT_LATITUDE = 26.26;
const DEFAULT_LONGITUDE = 107.52;
```

**修改 `fetchWeatherTip` 函数**:
1. 权限拒绝时，使用默认坐标继续
2. `getCurrentPositionAsync` 超时或错误时，使用默认坐标继续
3. 不再静默退出，保证天气功能可用

### UI 提示（可选）

如需提示用户当前使用的是默认位置，可在天气卡片添加标签：
- "默认位置" 标签（当使用 fallback 坐标时显示）

此为可选增强，MVP 版本可先不实现。

## 改动范围

- 仅修改 `src/screens/IdentifyScreen.tsx` 的 `fetchWeatherTip` 函数
- 不新增依赖
- 不修改 API 接口

## 测试场景

1. GPS 权限被拒绝 → 应使用默认坐标获取天气
2. GPS 获取超时 → 应使用默认坐标获取天气
3. GPS 获取错误 → 应使用默认坐标获取天气
4. GPS 正常 → 应使用真实坐标获取天气（回归测试）

## 风险评估

- **低风险**: 仅添加 fallback 逻辑，不影响现有正常流程
- **坐标精度**: 默认坐标为城市级别，与真实位置可能有误差，但对天气预报影响可接受