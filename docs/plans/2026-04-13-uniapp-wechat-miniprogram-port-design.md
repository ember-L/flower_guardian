# UniApp 微信小程序移植设计文档

**项目**：护花使者 (Flower Guardian)
**日期**：2026-04-13
**目标**：将现有 React Native App 完整移植到 UniApp 微信小程序

---

## 1. 项目概述

### 1.1 背景
现有护花使者 App 基于 React Native (Expo) 开发，现需要使用 UniApp 框架开发微信小程序版本，实现跨平台复用。

### 1.2 目标
- 使用 Vue 3 + TypeScript + UniApp 开发微信小程序
- 保持与 RN 版本完全一致的 UI 设计和配色
- 复用相同的 API 后端接口

### 1.3 项目位置
```
Flower_Guardian/
├── APP/           # 现有 React Native 项目
└── uniapp/        # 新建 UniApp 小程序项目
```

---

## 2. 技术栈

| 类别 | 技术选型 |
|------|----------|
| 框架 | UniApp + Vue 3 |
| 语言 | TypeScript |
| 状态管理 | Pinia |
| 样式 | SCSS + CSS Variables |
| 请求 | uni.request (封装) |
| 导航 | uni.navigateTo / redirectTo / switchTab |

---

## 3. 主题设计

### 3.1 配色方案（与 RN 版完全一致）

```typescript
// styles/theme.ts
export const colors = {
  // 主色调 - 花瓣网粉色主题
  primary: '#f46',              // 主色调 - 花瓣粉
  primaryLight: '#ff6b88',      // 主色调浅色
  primaryDark: '#e6335c',       // 主色调深色

  // 辅助色
  secondary: '#52c41a',         // 清新绿
  secondaryLight: '#7bc98a',    // 清新绿浅色
  accent: '#faad14',            // 暖黄色
  accentLight: '#ffe58f',       // 暖黄色浅色

  // 背景与表面
  background: '#fafafa',        // 背景色
  surface: '#ffffff',           // 卡片/表面色
  surfaceElevated: '#fffbf5',   // 浮起表面

  // 文字
  text: '#333333',              // 主要文字
  'text-secondary': '#666666',  // 次要文字
  'text-tertiary': '#999999',  // 辅助文字
  'text-light': '#b3b3b3',     // 弱化文字

  // 状态色
  error: '#ff4d4f',
  success: '#52c41a',
  warning: '#faad14',
  info: '#007aff',

  // 边框与分割线
  border: '#eeeeee',
  divider: '#f5f5f5',
}
```

### 3.2 间距与圆角
```typescript
export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48
}

export const borderRadius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, full: 9999
}
```

---

## 4. 页面结构

### 4.1 TabBar 导航（5个标签页）

| Tab | 名称 | 图标 | 路径 |
|-----|------|------|------|
| 1 | 花园 | Flower2 | /pages/garden/index |
| 2 | 百科 | BookOpen | /pages/encyclopedia/index |
| 3 | 首页 | Home | /pages/home/index |
| 4 | 商城 | Leaf | /pages/store/index |
| 5 | 我的 | User | /pages/user/index |

**首页样式**：首页 Tab 图标居中凸起，圆形粉色背景（与 RN 版一致）

### 4.2 页面清单（28个页面）

#### 认证模块（4页）
- `/pages/auth/login` - 登录
- `/pages/auth/register` - 注册
- `/pages/auth/forgot-password` - 忘记密码
- `/pages/auth/email-verify` - 邮箱验证

#### 首页/识别模块（4页）
- `/pages/home/index` - 首页（拍照识别入口）
- `/pages/home/diagnosis` - 病虫害诊断
- `/pages/home/diagnosis-history` - 诊断历史
- `/pages/home/diagnosis-detail` - 诊断详情

#### 花园模块（4页）
- `/pages/garden/index` - 我的植物列表
- `/pages/garden/plant-detail` - 植物详情
- `/pages/garden/growth-curve` - 生长曲线
- `/pages/garden/write-diary` - 写日记

#### 百科模块（4页）
- `/pages/encyclopedia/index` - 百科首页
- `/pages/encyclopedia/detail` - 百科详情
- `/pages/encyclopedia/knowledge` - 知识文章列表
- `/pages/encyclopedia/knowledge-detail` - 知识文章详情

#### 商城模块（4页）
- `/pages/store/index` - 商品列表
- `/pages/store/detail` - 商品详情
- `/pages/store/cart` - 购物车
- `/pages/store/orders` - 订单列表
- `/pages/store/order-detail` - 订单详情

#### 用户中心（4页）
- `/pages/user/index` - 用户中心
- `/pages/user/address` - 地址管理
- `/pages/user/address-edit` - 地址编辑
- `/pages/user/notification` - 通知

#### 其他功能（4页）
- `/pages/diary/index` - 日记列表
- `/pages/diary/detail` - 日记详情
- `/pages/consultation/list` - 咨询列表
- `/pages/consultation/chat` - 咨询聊天
- `/pages/recommendation` - 推荐页面
- `/pages/reminder` - 提醒页面

---

## 5. 核心组件映射

| RN 组件 | UniApp 组件 |
|---------|-------------|
| View | view |
| Text | text |
| TouchableOpacity | button / navigator |
| TextInput | input |
| Image | image |
| ScrollView | scroll-view |
| SafeAreaView | 各端适配 |
| FlatList | scroll-view + v-for |
| Modal | popup / drawer |
| ActivityIndicator | loading |
| StatusBar | 状态栏各端适配 |

---

## 6. API 层设计

### 6.1 请求封装
```typescript
// utils/request.ts
interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

export const request = (options: RequestOptions) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: API_BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: reject
    })
  })
}
```

### 6.2 API 端点配置（与 RN 版一致）
```typescript
// config/api.ts
export const API_BASE_URL = 'http://124.223.106.111:8000'

export const API_ENDPOINTS = {
  LOGIN: '/api/users/login',
  REGISTER: '/api/users/register',
  PLANTS: '/api/plants',
  PLANT_DETAIL: (id: number) => `/api/plants/${id}`,
  MY_PLANTS: '/api/plants/my',
  RECOGNITION_PLANT: '/api/recognition/plant',
  DIAGNOSIS_FULL: '/api/diagnosis/full',
  DIARIES: '/api/diaries',
  REMINDERS: '/api/reminders',
  PRODUCTS: '/api/products',
  CART: '/api/cart',
  ORDERS: '/api/orders',
  // ...
}
```

---

## 7. 特殊功能适配

### 7.1 图片选择与相机
```typescript
// 拍照
uni.chooseImage({
  source: ['camera'],
  success: (res) => {
    // 上传图片进行识别
  }
})
```

### 7.2 微信小程序登录
```typescript
// 调用微信登录
uni.getUserProfile({
  desc: '获取用户信息',
  success: (res) => {
    // 获取 code 后通过后端登录
  }
})
```

### 7.3 滑动返回（原生支持）
UniApp 微信小程序原生支持边缘滑动返回，无需额外处理。

### 7.4 WebSocket 推送
```typescript
// 消息推送订阅
uni.connectSocket({
  url: `ws://124.223.106.111:8000/ws/push?token=${token}`
})
```

---

## 8. 文件结构

```
uniapp/
├── src/
│   ├── App.vue
│   ├── main.ts
│   ├── pages.json
│   ├── manifest.json
│   ├── components/
│   │   ├── PlantCard.vue
│   │   ├── ProductCard.vue
│   │   └── ...
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.vue
│   │   │   ├── register.vue
│   │   │   └── ...
│   │   ├── home/
│   │   │   ├── index.vue
│   │   │   ├── diagnosis.vue
│   │   │   └── ...
│   │   ├── garden/
│   │   ├── encyclopedia/
│   │   ├── store/
│   │   └── user/
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── plant.ts
│   │   └── ...
│   ├── stores/
│   │   ├── auth.ts
│   │   ├── plant.ts
│   │   └── ...
│   ├── styles/
│   │   ├── theme.scss
│   │   └── common.scss
│   ├── utils/
│   │   ├── request.ts
│   │   ├── storage.ts
│   │   └── ...
│   └── static/
│       └── images/
├── package.json
└── tsconfig.json
```

---

## 9. 实施计划概要

### Phase 1: 项目搭建
1. 初始化 UniApp 项目（Vue 3 + TS）
2. 配置主题样式和全局变量
3. 配置 API 请求封装
4. 配置 TabBar 导航

### Phase 2: 认证模块
1. 登录页面
2. 注册页面
3. 忘记密码/邮箱验证

### Phase 3: 核心功能
1. 首页（拍照识别）
2. 病虫害诊断
3. 花园管理
4. 百科浏览

### Phase 4: 商城与用户
1. 商城功能
2. 购物车/订单
3. 用户中心
4. 地址管理

### Phase 5: 高级功能
1. 咨询聊天
2. 提醒功能
3. WebSocket 推送
4. 微信登录适配

---

## 10. 验收标准

- [ ] 5个 Tab 页面均可正常访问
- [ ] UI 配色与 RN 版本一致
- [ ] 登录注册流程完整
- [ ] 植物识别功能可用
- [ ] 商城购买流程完整
- [ ] 无严重性能和体验问题
