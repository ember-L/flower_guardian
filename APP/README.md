# 护花使者 APP - React Native 移动端

护花使者移动端应用，采用 React Native + Expo 开发，支持 iOS 和 Android 双平台。

## 技术栈

| 技术 | 用途 |
|------|------|
| React Native 0.74 | 跨平台框架 |
| Expo SDK 51 | 开发工具链 |
| TypeScript | 类型安全 |
| Axios | HTTP 请求 |
| React Navigation | 导航 |
| expo-notifications | 推送通知 |
| jpush-react-native | 极光推送 |

## 项目结构

```
APP/
├── src/
│   ├── components/        # 可复用组件
│   │   └── Icon.tsx      # 图标组件
│   ├── screens/          # 页面组件
│   │   ├── HomeScreen.tsx      # 首页
│   │   ├── IdentifyScreen.tsx  # 植物识别
│   │   ├── DiagnosisScreen.tsx # 病虫害诊断
│   │   ├── GardenScreen.tsx    # 我的花园
│   │   ├── DiaryScreen.tsx     # 植物日记
│   │   ├── StoreScreen.tsx     # 商城
│   │   ├── ProfileScreen.tsx   # 个人中心
│   │   └── ...
│   ├── navigation/        # 导航配置
│   │   └── AppNavigator.tsx
│   ├── services/          # API 服务
│   │   ├── config.ts           # API 配置
│   │   ├── auth.ts             # 认证服务
│   │   ├── plantService.ts     # 植物 API
│   │   └── ...
│   ├── constants/          # 常量配置
│   │   └── theme.ts        # 主题颜色
│   └── types/              # 类型定义
├── ios/                   # iOS 原生配置
├── android/               # Android 原生配置
├── assets/                # 静态资源
│   ├── images/            # 图片资源
│   └── icons/             # 图标资源
└── package.json
```

## 环境要求

- Node.js 18+
- Xcode (iOS 开发调试)
- Android Studio (Android 开发调试)
- Apple 开发者账号 (iOS 真机调试/发布)
- Expo CLI (`npx expo`)

## 快速开始

### 安装依赖

```bash
cd APP

# 安装项目依赖
npm install

# 或使用 yarn
yarn install
```

### 开发调试

本项目支持两种开发模式：

#### 方式一：Expo Go（推荐，最快速）

```bash
cd APP

# 启动 Expo 开发服务器
npm start
# 或
npx expo start

# 在终端中选择：
# - i: 打开 iOS 模拟器
# - a: 打开 Android 模拟器
# - q: 显示二维码，手机扫码
```

**优点**：
- 无需等待原生构建
- 支持热重载 (Hot Reloading)
- 快速迭代开发
- iOS/Android 真机扫码即可调试

**手机扫码调试**：
1. 手机安装 Expo Go (App Store / 应用市场)
2. 确保手机和电脑在同一网络
3. 运行 `npm start` 后扫码

#### 方式二：React Native CLI + Metro

```bash
cd APP

# 启动 Metro bundler
npm start
# 或
npx react-native start

# 清除缓存后启动
npx react-native start --reset-cache
```

**运行 APP**：

```bash
# iOS 模拟器（需要 Xcode 配置）
npx react-native run-ios

# 指定模拟器
npx react-native run-ios --simulator="iPhone 16"

# Android 模拟器
npx react-native run-android
```

**查看可用模拟器**：
```bash
xcrun simctl list devices available
```

### iOS 真机调试

iOS 真机调试需要 Apple 开发者账号：

```bash
# 方式一：Xcode 打开项目
open ios/app.xcworkspace

# 方式二：命令行（需先在 Xcode 配置签名）
npx react-native run-ios --device --allowProvisioningUpdates
```

**Xcode 配置签名**：
1. 打开 `ios/app.xcworkspace`
2. 选择项目 `app` → Signing & Capabilities
3. 勾选 "Automatically manage signing"
4. 选择 Team（个人或公司开发者账号）
5. Bundle Identifier: `com.flowerguardian.app`

**注意**：个人免费 Apple ID 不支持 Push Notifications 功能

### Android 真机调试

```bash
# 方式一：Expo
npx expo run-android

# 方式二：React Native CLI
npx react-native run-android
```

**真机配置**：
1. 开启手机开发者模式
2. 启用 USB 调试
3. 用 USB 连接电脑
4. 手机弹出"允许 USB 调试"确认

**无线调试**：
```bash
# 连接后执行
adb tcpip 5555

# 断开 USB，然后
adb connect <手机IP>:5555

# 查看手机 IP：设置 → 关于手机 → 状态
```

## 配置说明

### API 地址配置

修改 `src/services/config.ts`：

```typescript
// 开发环境（使用电脑 IP）
export const API_BASE_URL = 'http://192.168.1.100:8000';

// 生产环境
export const API_BASE_URL = 'https://your-domain.com';
```

| 运行环境 | API 地址 |
|---------|----------|
| iOS 模拟器 | Mac 局域网 IP |
| iOS 真机 | 后端服务器实际 IP 或域名 |
| Android 模拟器 | `10.0.2.2` 访问主机 localhost |
| Android 真机 | 后端服务器实际 IP 或域名 |

### 应用图标配置

替换 `assets/` 目录下的图片文件：

| 文件 | 推荐尺寸 | 用途 |
|------|---------|------|
| `icon.png` | 1024x1024 | 应用图标 |
| `adaptive-icon.png` | 1024x1024 | Android 自适应图标 |
| `favicon.png` | 48x48 | 网页图标 |
| `splash-icon.png` | 1284x2778 | 启动页图标 |

### 启动页配置

编辑 `app.json` 中的 `splash` 配置：

```json
"splash": {
  "image": "./assets/splash-icon.png",
  "resizeMode": "contain",
  "backgroundColor": "#f46"
}
```

修改后重新生成原生项目：
```bash
npx expo prebuild --clean
```

## 打包发布

### Android 打包

#### 调试 APK（无需签名）

```bash
# 方式一：Expo（推荐）
npx expo run:android

# 方式二：Gradle
cd android
./gradlew assembleDebug
```

APK 输出位置：`android/app/build/outputs/apk/debug/app-debug.apk`

#### 发布 APK / AAB

1. 生成签名密钥：
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.jks -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. 在 `android/app/build.gradle` 中配置签名：
```gradle
android {
    signingConfigs {
        release {
            storeFile file("my-release-key.jks")
            storePassword "密码"
            keyAlias "my-key-alias"
            keyPassword "密码"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

3. 打包：
```bash
# APK
npx expo run:android --variant release

# 或
cd android
./gradlew assembleRelease

# AAB (Google Play)
./gradlew bundleRelease
```

APK/AAB 输出位置：`android/app/build/outputs/`

#### 安装 APK 到手机

```bash
# 通过 USB 安装
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 或直接将 APK 文件分享到手机安装
```

### iOS 打包

iOS 打包需要在 Xcode 中操作：

1. 打开项目：
```bash
open ios/app.xcworkspace
```

2. 选择目标设备和签名：
   - Product → Destination → 选择设备
   - Signing & Capabilities → 选择 Team

3. 打包：
   - Product → Archive

4. 导出 IPA：
   - Window → Organizer
   - 选择归档 → Distribute App
   - 选择分发方式（App Store / Ad Hoc / Enterprise）

**命令行打包**：
```bash
# Release 构建
xcodebuild -workspace ios/app.xcworkspace \
  -scheme app \
  -configuration Release \
  -archivePath ./build/app.xcarchive \
  archive

# 导出 IPA
xcodebuild -exportArchive \
  -archivePath ./build/app.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath ./build
```

### Expo EAS Build（云端打包）

无需本地配置，一键云端打包：

```bash
# 登录 Expo
eas login

# 配置 EAS Build
eas build:configure

# iOS
eas build --platform ios --profile preview

# Android
eas build --platform android --profile preview
```

详细文档：https://docs.expo.dev/build/setup/

## 推送通知

### 配置

#### Expo Push（推荐，无需额外配置）

APP 已集成 expo-notifications，服务端可直接发送推送。

#### JPush（极光推送）

1. 在 [极光控制台](https://www.jiguang.cn/) 创建应用
2. 获取 App Key 和 Master Secret
3. 配置到后端 `.env`

### 测试推送

```bash
cd ../backend

# 发送每日提醒
python3 -c "from app.tasks.reminder_tasks import send_daily_reminders; import asyncio; asyncio.run(send_daily_reminders())"

# 发送逾期提醒
python3 -c "from app.tasks.reminder_tasks import send_overdue_reminders; import asyncio; asyncio.run(send_overdue_reminders())"
```

## 常见问题

### Metro 缓存问题

```bash
# 清除缓存
npx react-native start --reset-cache

# 或删除 node_modules 后重新安装
rm -rf node_modules
npm install
```

### iOS 构建失败

```bash
cd ios

# 重新安装 CocoaPods
pod install

# 或完整重装
rm -rf Pods Podfile.lock
pod install
```

### Android 构建失败

```bash
cd android

# 清理并重新构建
./gradlew clean
./gradlew assembleDebug
```

### 网络请求失败

1. 检查 API_BASE_URL 配置是否正确
2. 确保后端服务已启动
3. 检查手机和电脑网络是否互通
4. iOS 真机需要使用 HTTPS 或配置 HTTP 白名单

## 主要功能页面

| 页面 | 功能描述 |
|------|----------|
| 首页 | AI 植物识别、病虫害诊断、天气小贴士 |
| 花园 | 管理我的植物、养护提醒 |
| 百科 | 植物知识库 |
| 商城 | 商品浏览购买 |
| 我的 | 个人中心、设置 |

## 许可证

MIT License

---

*文档最后更新：2026-04-02*
