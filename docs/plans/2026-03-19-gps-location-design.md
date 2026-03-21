# 今日小贴士GPS定位功能设计

> **Date:** 2026-03-19

**Goal:** 实现首页天气小贴士的GPS自动定位功能

**Architecture:**
- 使用 react-native-geolocation-service 获取GPS坐标
- 开发环境检测：模拟器运行时使用测试坐标(上海)
- 状态管理：loading → locationObtained / locationFailed

**Tech Stack:** React Native, react-native-geolocation-service

---

## 设计概述

用户点击"获取今日小贴士"时，应用请求GPS定位权限并获取用户当前位置的天气数据和AI养护建议。

### 流程图

```
用户点击"获取今日小贴士"
       ↓
  请求GPS定位权限
       ↓
[允许] → 获取GPS坐标 → 调用天气API → 显示天气+AI建议
       ↓
[拒绝/失败] → 显示错误提示（可重试）
       ↓
[模拟器/开发模式] → 使用测试坐标(上海: 31.2304, 121.4737)
```

### 关键决策

1. **仅使用GPS定位** - 不提供城市选择器作为备选
2. **开发环境处理** - 检测到模拟器时自动使用测试坐标
3. **权限拒绝处理** - 显示友好提示，引导用户去iOS设置开启权限

### 错误处理

| 场景 | 处理 |
|------|------|
| 权限被拒绝 | 显示提示，引导用户去iOS设置开启 |
| GPS无法获取 | 显示"无法获取位置"提示，提供重试按钮 |
| 网络错误 | 显示"网络错误"提示 |
| 模拟器运行 | 自动使用测试坐标(上海) |

---

## 技术实现

### 依赖包

- react-native-geolocation-service: GPS定位

### iOS配置

Info.plist 中已配置定位权限:
- NSLocationWhenInUseUsageDescription: "需要获取您的位置来提供当地天气信息和植物养护建议"

### 文件变更

- Modify: `APP/package.json` - 添加依赖
- Modify: `APP/src/screens/IdentifyScreen.tsx` - 集成定位功能
