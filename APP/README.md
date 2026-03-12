# 🌿 APP - React Native 移动端

护花使者移动端应用，采用 React Native 开发，支持 iOS 和 Android 双平台。

[![React Native](https://img.shields.io/badge/React%20Native-0.84-blue)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org)
[![iOS](https://img.shields.io/badge/iOS-Supported-green)](https://apple.com)
[![Android](https://img.shields.io/badge/Android-Supported-green)](https://android.com)

## 🚀 快速开始

### 环境要求

- Node.js 18+
- React Native CLI
- Xcode (iOS 开发)
- Android Studio (Android 开发)

### 安装依赖

```bash
cd APP

# 安装项目依赖
npm install

# 或使用 yarn
yarn install
```

### 运行开发服务器

```bash
# 启动 Metro bundler
npm start

# 或后台运行
npm start &
```

### 运行 APP

```bash
# iOS 模拟器
npm run ios

# iOS 真机
npx react-native run-ios --device

# Android 模拟器
npm run android

# Android 真机
npx react-native run-android
```

## 📁 项目结构

```
APP/
├── src/
│   ├── components/        # 可复用组件
│   │   └── Icon.tsx      # 图标组件
│   ├── screens/          # 页面组件
│   │   ├── IdentifyScreen.tsx     # 🌸 植物识别
│   │   ├── DiagnosisScreen.tsx    # 🦟 病虫害诊断
│   │   ├── GardenScreen.tsx        # 🌿 我的花园
│   │   ├── DiaryScreen.tsx        # 📖 植物日记
│   │   ├── StoreScreen.tsx        # 🛒 商城
│   │   ├── ProfileScreen.tsx       # 👤 个人中心
│   │   ├── RecommendationScreen.tsx # ⭐ 新手推荐
│   │   └── ...
│   ├── navigation/        # 导航配置
│   │   └── AppNavigator.tsx
│   ├── services/         # API 服务
│   │   ├── config.ts           # ⚙️ API 配置
│   │   ├── plantService.ts     # 🌱 植物 API
│   │   ├── recommendService.ts # ✨ 推荐 API
│   │   ├── storeService.ts     # 🛍️ 商城 API
│   │   └── ...
│   ├── constants/        # 常量配置
│   │   └── theme.ts       # 🎨 主题颜色
│   └── types/             # 📝 类型定义
├── ios/                   # 🍎 iOS 原生配置
├── android/               # 🤖 Android 原生配置
└── package.json
```

## 🔧 配置说明

### API 地址配置

修改 `src/services/config.ts` 中的 API 地址：

```typescript
// 开发环境
export const API_BASE_URL = 'http://192.168.1.100:8000';

// 生产环境
export const API_BASE_URL = 'https://your-domain.com';
```

### iOS 真机调试

1. 连接 iPhone 到 Mac
2. 运行 `npx react-native run-ios --device`
3. 首次需要配置 Apple Developer 签名

### Android 真机调试

1. 开启手机开发者模式
2. 启用 USB 调试
3. 运行 `npx react-native run-android`

## 📦 打包发布

### iOS 打包

```bash
# Xcode 打开项目
open ios/FlowerGuardian.xcworkspace

# 或命令行打包
xcodebuild -workspace ios/FlowerGuardian.xcworkspace \
  -scheme FlowerGuardian \
  -configuration Release \
  archive
```

### Android 打包

```bash
# 调试 APK
cd android && ./gradlew assembleDebug

# 发布 APK
cd android && ./gradlew assembleRelease

# AAB (Google Play)
cd android && ./gradlew bundleRelease
```

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| ⚛️ React Native 0.84 | 跨平台框架 |
| 📘 TypeScript | 类型安全 |
| 💨 NativeWind | CSS 样式 |
| 🌐 Axios | HTTP 请求 |
| 🧭 React Navigation | 导航 |
| 🎨 Lucide Icons | 图标库 |

## 📱 主要功能页面

| 页面 | 功能描述 |
|------|----------|
| 🌸 首页/识别 | AI 植物识别、病虫害诊断 |
| 🌿 花园 | 管理我的植物 |
| 📖 百科 | 植物知识库 |
| 🛒 商城 | 商品浏览购买 |
| 👤 我的 | 个人中心 |

## 🎯 核心特性

- ✅ **AI 识别**: 双 YOLO 模型，精准识别 47+ 植物种类
- ✅ **病虫害诊断**: 快速诊断植物健康问题
- ✅ **智能推荐**: 根据环境推荐适合的植物
- ✅ **花园管理**: 记录植物生长状态
- ✅ **养护提醒**: 科学的浇水施肥提醒
- ✅ **植物日记**: 记录植物成长瞬间

## 📄 许可证

MIT License

---

<p align="center">
  🌻 护花使者 - 你的掌上植物管家 🌻
</p>
