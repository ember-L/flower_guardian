# Taro 微信小程序移植设计方案

## 项目概述

将护花使者 React Native (Expo) 项目移植到 Taro 框架，重点实现核心功能，保持花瓣网粉色主题一致。

## 技术栈

| 技术 | 选择 | 说明 |
|------|------|------|
| 框架 | Taro 4.x | 跨平台框架，专注微信小程序 |
| UI 库 | Taro UI | 官方组件库 |
| 状态管理 | Pinia | 轻量级状态管理 |
| 样式 | SCSS | 使用 Taro UI 主题定制能力 |
| 后端接口 | 复用现有 API | `http://124.223.106.111:8000` |

## 主题色板 (花瓣粉)

```scss
// 主色调
$primary: #f46;           // 花瓣粉 - 主色调
$primary-light: #ff6b88;  // 花瓣粉浅色
$primary-dark: #e6335c;   // 花瓣粉深色

// 辅助色
$secondary: #52c41a;      // 清新绿
$secondary-light: #7bc98a;
$accent: #faad14;        // 暖黄色
$accentLight: #ffe58f;

// 背景与文字
$background: #fafafa;
$surface: #ffffff;
$text: #333333;
$text-secondary: #666666;
$text-tertiary: #999999;

// 状态色
$success: #52c41a;
$warning: #faad14;
$error: #ff4d4f;
$info: #007aff;
```

## 页面结构

### TabBar 页面 (底部导航)

| 页面 | 路径 | 功能描述 |
|------|------|----------|
| 首页 | `/pages/index/index` | 拍照识别、热门植物、快捷入口 |
| 花园 | `/pages/garden/index` | 我的植物列表、添加/编辑/删除 |
| 百科 | `/pages/encyclopedia/index` | 植物百科、分类浏览 |
| 商城 | `/pages/store/index` | 商品列表、分类 |
| 我的 | `/pages/profile/index` | 用户中心、订单、设置 |

### 子页面

| 页面 | 路径 | 功能描述 |
|------|------|----------|
| 登录 | `/pages-sub/login/index` | 手机号登录 |
| 注册 | `/pages-sub/register/index` | 用户注册 |
| 植物详情 | `/pages-sub/plant-detail/index` | 植物详情、养护建议 |
| 商品详情 | `/pages-sub/store-detail/index` | 商品详情、购买 |
| 购物车 | `/pages-sub/cart/index` | 购物车管理 |
| 订单列表 | `/pages-sub/orders/index` | 我的订单 |
| 订单详情 | `/pages-sub/order-detail/index` | 订单详情 |
| 地址管理 | `/pages-sub/address/index` | 收货地址 |
| 地址编辑 | `/pages-sub/address-edit/index` | 新增/编辑地址 |
| 提醒 | `/pages-sub/reminder/index` | 养护提醒 |
| 日记 | `/pages-sub/diary/index` | 养花日记 |
| 写日记 | `/pages-sub/write-diary/index` | 编写日记 |
| 咨询 | `/pages-sub/consultation/index` | AI 植物医生 |
| 诊断 | `/pages-sub/diagnosis/index` | 病虫害诊断 |
| 结算 | `/pages-sub/checkout/index` | 订单结算 |
| 忘记密码 | `/pages-sub/forgot-password/index` | 密码重置 |
| 生长曲线 | `/pages-sub/growth-curve/index` | 植物生长记录 |
| 通知 | `/pages-sub/notification/index` | 系统通知 |

## 优先级规划

### P0 - 核心功能 (MVP)
- [ ] 首页识别 (拍照/相册 → API 识别)
- [ ] 用户登录/注册
- [ ] 花园管理 (添加/查看/删除植物)

### P1 - 重要功能
- [ ] 植物详情页
- [ ] 百科浏览
- [ ] 商城商品列表
- [ ] 商品详情
- [ ] 购物车
- [ ] 订单管理
- [ ] 地址管理
- [ ] 养护提醒
- [ ] 养花日记

### P2 - 扩展功能
- [ ] AI 咨询
- [ ] 病虫害诊断
- [ ] 生长曲线
- [ ] 通知中心

## 项目结构

```
taro/
├── src/
│   ├── pages/
│   │   ├── index/              # 首页
│   │   │   └── index.tsx
│   │   ├── garden/             # 花园
│   │   │   └── index.tsx
│   │   ├── encyclopedia/       # 百科
│   │   │   └── index.tsx
│   │   ├── store/              # 商城
│   │   │   └── index.tsx
│   │   ├── profile/            # 我的
│   │   │   └── index.tsx
│   │   └── pages-sub/          # 子页面
│   │       ├── login/
│   │       ├── register/
│   │       ├── plant-detail/
│   │       ├── store-detail/
│   │       ├── cart/
│   │       ├── orders/
│   │       ├── order-detail/
│   │       ├── address/
│   │       ├── address-edit/
│   │       ├── reminder/
│   │       ├── diary/
│   │       ├── write-diary/
│   │       ├── consultation/
│   │       ├── diagnosis/
│   │       ├── checkout/
│   │       ├── forgot-password/
│   │       ├── growth-curve/
│   │       └── notification/
│   ├── components/             # 公共组件
│   │   ├── PlantCard/
│   │   ├── ProductCard/
│   │   └── TabBar/
│   ├── services/               # API 服务
│   │   ├── api.ts              # 基础请求封装
│   │   ├── auth.ts             # 认证服务
│   │   ├── plant.ts             # 植物服务
│   │   ├── recognition.ts       # 识别服务
│   │   ├── store.ts             # 商城服务
│   │   ├── diary.ts             # 日记服务
│   │   ├── reminder.ts           # 提醒服务
│   │   └── diagnosis.ts         # 诊断服务
│   ├── stores/                 # Pinia 状态
│   │   ├── auth.ts              # 认证状态
│   │   ├── cart.ts              # 购物车状态
│   │   └── plant.ts             # 植物状态
│   ├── styles/                 # 样式文件
│   │   ├── theme.scss           # 主题变量
│   │   └── common.scss          # 公共样式
│   ├── utils/                  # 工具函数
│   │   └── storage.ts           # 本地存储
│   ├── app.ts                  # 应用入口
│   └── app.config.ts           # 应用配置
├── package.json
├── config/index.ts             # Taro 配置
└── project.config.json         # 项目配置
```

## API 复用

直接复用现有 RN 项目的 API 端点配置：

```typescript
// API_BASE_URL
const API_BASE_URL = 'http://124.223.106.111:8000';

// 端点
LOGIN: '/api/users/login'
REGISTER: '/api/users/register'
PLANTS: '/api/plants'
MY_PLANTS: '/api/plants/my'
RECOGNITION_PLANT: '/api/recognition/plant'
PRODUCTS: '/api/products'
ORDERS: '/api/orders'
// ... 其他端点
```

## 认证机制

微信小程序使用 `wx.setStorageSync('token', token)` 存储 JWT Token，请求时通过 `header['Authorization']` 发送。

## 实现步骤

1. **项目初始化**
   - 创建 Taro 项目
   - 安装依赖 (Taro UI, Pinia, SCSS)
   - 配置主题色

2. **基础设施**
   - API 请求封装
   - 主题样式配置
   - Pinia Store 模板

3. **页面开发 (P0)**
   - 首页 + 识别功能
   - 登录/注册
   - 花园页面

4. **页面开发 (P1)**
   - 百科、商城、用户中心
   - 购物车、订单
   - 地址、提醒、日记

5. **页面开发 (P2)**
   - AI 咨询、诊断
   - 生长曲线
   - 通知中心

6. **测试与优化**
   - 微信开发者工具调试
   - 样式细节调整
   - 性能优化
