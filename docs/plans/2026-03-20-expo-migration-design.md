# React Native CLI 迁移到 Expo 设计文档

> **Date:** 2026-03-20

**Goal:** 将 React Native CLI 项目渐进式迁移到 Expo，实现 GPS 定位功能

**Architecture:**
- 在 APP/ 下创建 expo/ 子项目
- 使用 expo-location 实现 GPS 定位
- 渐进式迁移，从首页开始
- 保留 ONNX 本地推理能力

---

## 设计概述

### 项目结构

```
Flower_Guardian/
├── APP/                    # 现有 React Native CLI 项目
│   └── expo/              # 新建 Expo 项目
│       ├── src/
│       │   ├── screens/   # 屏幕组件
│       │   ├── services/  # API 服务
│       │   └── ...
│       ├── app.json
│       └── package.json
└── backend/               # 现有后端（不变）
```

### 迁移策略

1. **渐进式迁移** - 从首页开始，逐步复制功能
2. **保留原有项目** - APP/ 目录保持不变
3. **使用 Expo 定位** - expo-location 实现 GPS

### 关键技术

- **expo-location** - GPS 定位（替代 react-native-geolocation-service）
- **expo-image-picker** - 图片选择
- **axios** - HTTP 请求（保持与原项目一致）

---

## 实施计划

1. 创建 Expo 项目
2. 安装 Expo 依赖
3. 迁移首页代码
4. 集成 GPS 定位
5. 测试验证
