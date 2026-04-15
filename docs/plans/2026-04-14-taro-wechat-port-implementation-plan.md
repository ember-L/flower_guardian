# Taro 微信小程序移植实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将护花使者 React Native 项目移植到 Taro 微信小程序，实现核心功能（P0），保持花瓣网粉色主题一致。

**Architecture:** 使用 Taro 4.x + Taro UI + Pinia，通过微信小程序承载核心功能（首页识别、花园管理、登录注册），复用现有后端 API。

**Tech Stack:** Taro 4.x, Taro UI, Pinia, SCSS, 微信小程序

---

## Phase 1: 项目初始化

### Task 1: 创建 Taro 项目

**Files:**
- Create: `taro/package.json`
- Create: `taro/config/index.ts`
- Create: `taro/tsconfig.json`
- Create: `taro/project.config.json`
- Create: `taro/.gitignore`

**Step 1: 创建项目目录和基础配置**

```bash
mkdir -p taro
cd taro
npm init -y
```

**Step 2: 创建 package.json**

```json
{
  "name": "flower-guardian-taro",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev:mp-weixin": "taro build --type weapp --watch",
    "build:mp-weixin": "taro build --type weapp",
    "dev:h5": "taro build --type h5 --watch",
    "build:h5": "taro build --type h5"
  },
  "dependencies": {
    "@taroify/core": "^1.0.0",
    "@tarojs/plugin-framework-vue3": "^4.0.0",
    "@tarojs/plugin-platform-weapp": "^4.0.0",
    "@tarojs/runtime": "^4.0.0",
    "@tarojs/taro": "^4.0.0",
    "@tarojs/webpack5-runner": "^4.0.0",
    "pinia": "^2.1.7",
    "vue": "^3.4.21"
  },
  "devDependencies": {
    "@tarojs/cli": "^4.0.0",
    "@types/node": "^20.10.0",
    "@vue/compiler-sfc": "^3.4.21",
    "sass": "^1.69.0",
    "typescript": "^5.3.0",
    "vue-loader": "^17.4.0",
    "webpack": "^5.89.0"
  }
}
```

**Step 3: 创建 Taro 配置**

```typescript
// config/index.ts
import type { IConfig } from '@tarojs/taro'

const config: IConfig = {
  projectName: 'flower-guardian',
  date: '2026-04-14',
  designWidth: 375,
  deviceRatio: {
    375: 1,
    375: 1
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  framework: 'vue3',
  compiler: 'webpack5',
  cache: {
    enable: false
  },
  mini: {
    hot: true,
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      url: {
        enable: true,
        limit: 10240
      },
      cssModules: {
        enable: true,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
        config: {}
      }
    }
  }
}

export default config
```

**Step 4: 创建 project.config.json**

```json
{
  "description": "护花使者 Taro 微信小程序",
  "packNpmManually": {
    "enable": true,
    "packageJsonPath": "./package.json"
  },
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": true,
    "coverView": true,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "transformPortUsingComments": true,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "bundle": false,
    "useIsolateData": true,
    "userOptimizedProject": true
  },
  "appid": "wxxxxxxxxxxx",
  "projectname": "flower-guardian"
}
```

---

### Task 2: 创建主题样式文件

**Files:**
- Create: `taro/src/styles/theme.scss`
- Create: `taro/src/styles/common.scss`
- Create: `taro/src/styles/variables.scss`

**Step 1: 创建主题变量**

```scss
// src/styles/variables.scss

// 花瓣网粉色主题
$primary: #f46;
$primary-light: #ff6b88;
$primary-dark: #e6335c;
$secondary: #52c41a;
$secondary-light: #7bc98a;
$accent: #faad14;
$accent-light: #ffe58f;

// 背景色
$background: #fafafa;
$surface: #ffffff;
$surface-elevated: #fffbf5;

// 文字色
$text: #333333;
$text-secondary: #666666;
$text-tertiary: #999999;
$text-light: #b3b3b3;

// 状态色
$success: #52c41a;
$success-light: #f6ffed;
$warning: #faad14;
$warning-light: #fffbe6;
$error: #ff4d4f;
$error-light: #ffccc7;
$info: #007aff;
$info-light: #e6f2ff;

// 边框和分割线
$border: #eeeeee;
$divider: #f5f5f5;

// 阴影色
$shadow: rgba(244, 68, 102, 0.08);
$shadow-dark: rgba(244, 68, 102, 0.15);

// 间距
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 20px;
$spacing-xl: 24px;
$spacing-xxl: 32px;
$spacing-xxxl: 48px;

// 圆角
$border-radius-sm: 8px;
$border-radius-md: 12px;
$border-radius-lg: 16px;
$border-radius-xl: 20px;
$border-radius-xxl: 24px;
$border-radius-xxxl: 32px;
$border-radius-full: 9999px;

// 字体大小
$font-size-xs: 11px;
$font-size-sm: 13px;
$font-size-md: 15px;
$font-size-lg: 17px;
$font-size-xl: 20px;
$font-size-xxl: 24px;
$font-size-xxxl: 32px;
$font-size-display: 40px;

// 字重
$font-weight-regular: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;
```

**Step 2: 创建公共样式**

```scss
// src/styles/common.scss
@import './variables.scss';

page {
  background-color: $background;
  font-size: $font-size-md;
  color: $text;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  min-height: 100vh;
  background-color: $background;
  padding-bottom: 120px;
}

.card {
  background-color: $surface;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  box-shadow: 0 4px 20px $shadow;
}

.btn-primary {
  background-color: $primary;
  color: #fff;
  border: none;
  border-radius: $border-radius-lg;
  padding: $spacing-md $spacing-lg;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  text-align: center;
}

.btn-outline {
  background-color: transparent;
  color: $primary;
  border: 1px solid $primary;
  border-radius: $border-radius-lg;
  padding: $spacing-md $spacing-lg;
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  text-align: center;
}

.input {
  background-color: $background;
  border: 1px solid $border;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  font-size: $font-size-md;
  color: $text;
}

.input::placeholder {
  color: $text-tertiary;
}
```

---

### Task 3: 创建应用入口和配置

**Files:**
- Create: `taro/src/app.ts`
- Create: `taro/src/app.config.ts`
- Create: `taro/src/main.ts`

**Step 1: 创建 app.ts**

```typescript
// src/app.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Taro from '@tarojs/taro'
import 'taro-ui/dist/style/index.scss'
import './styles/common.scss'

import App from './App.vue'

const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.mount('#app')

export default app
```

**Step 2: 创建 app.config.ts (TabBar 配置)**

```typescript
// src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/garden/index',
    'pages/encyclopedia/index',
    'pages/store/index',
    'pages/profile/index',
  ],
  subPackages: [
    {
      root: 'pages-sub',
      pages: [
        'login/index',
        'register/index',
        'plant-detail/index',
        'store-detail/index',
        'cart/index',
        'orders/index',
        'order-detail/index',
        'address/index',
        'address-edit/index',
        'reminder/index',
        'diary/index',
        'write-diary/index',
        'consultation/index',
        'diagnosis/index',
        'checkout/index',
        'forgot-password/index',
        'growth-curve/index',
        'notification/index',
      ]
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#f46',
    navigationBarTitleText: '护花使者',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#f46',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'static/tab-home.png',
        selectedIconPath: 'static/tab-home-active.png'
      },
      {
        pagePath: 'pages/garden/index',
        text: '花园',
        iconPath: 'static/tab-garden.png',
        selectedIconPath: 'static/tab-garden-active.png'
      },
      {
        pagePath: 'pages/encyclopedia/index',
        text: '百科',
        iconPath: 'static/tab-encyclopedia.png',
        selectedIconPath: 'static/tab-encyclopedia-active.png'
      },
      {
        pagePath: 'pages/store/index',
        text: '商城',
        iconPath: 'static/tab-store.png',
        selectedIconPath: 'static/tab-store-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'static/tab-profile.png',
        selectedIconPath: 'static/tab-profile-active.png'
      }
    ]
  },
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于获取天气和养护建议'
    }
  }
})
```

---

## Phase 2: 基础设施

### Task 4: 创建 API 服务层

**Files:**
- Create: `taro/src/services/api.ts`
- Create: `taro/src/services/auth.ts`
- Create: `taro/src/services/plant.ts`
- Create: `taro/src/services/recognition.ts`

**Step 1: 创建基础 API 封装**

```typescript
// src/services/api.ts
const API_BASE_URL = 'http://124.223.106.111:8000'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export async function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header = {} } = options

  // 添加 Token
  const token = Taro.getStorageSync('token')
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  header['Content-Type'] = header['Content-Type'] || 'application/json'

  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header,
    })

    const result = response.data as ApiResponse<T>

    if (result.code !== 0 && result.code !== 200) {
      if (result.code === 401) {
        Taro.removeStorageSync('token')
        Taro.navigateTo({ url: '/pages-sub/login/index' })
      }
      throw new Error(result.msg || '请求失败')
    }

    return result.data
  } catch (error: any) {
    console.error('API Error:', error)
    throw error
  }
}

export function getToken(): string {
  return Taro.getStorageSync('token') || ''
}

export function setToken(token: string): void {
  Taro.setStorageSync('token', token)
}

export function removeToken(): void {
  Taro.removeStorageSync('token')
}

export default {
  request,
  getToken,
  setToken,
  removeToken,
  API_BASE_URL,
}
```

**Step 2: 创建认证服务**

```typescript
// src/services/auth.ts
import { request, setToken, removeToken, getToken } from './api'

export interface LoginParams {
  email: string
  password: string
}

export interface RegisterParams {
  email: string
  password: string
  nickname?: string
}

export interface UserInfo {
  id: number
  email: string
  nickname: string
  avatar?: string
  role: string
}

export async function login(params: LoginParams): Promise<{ token: string; user: UserInfo }> {
  const data = await request<{ access_token: string; user: UserInfo }>({
    url: '/api/users/login',
    method: 'POST',
    data: params,
  })
  setToken(data.access_token)
  return { token: data.access_token, user: data.user }
}

export async function register(params: RegisterParams): Promise<void> {
  await request({
    url: '/api/users/register',
    method: 'POST',
    data: params,
  })
}

export async function getProfile(): Promise<UserInfo> {
  return request<UserInfo>({
    url: '/api/users/profile',
    method: 'GET',
  })
}

export function logout(): void {
  removeToken()
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

export default {
  login,
  register,
  getProfile,
  logout,
  isLoggedIn,
}
```

**Step 3: 创建植物服务**

```typescript
// src/services/plant.ts
import { request } from './api'

export interface UserPlant {
  id: number
  plant_name: string
  nickname?: string
  location?: string
  image_url?: string
  health_status?: string
  created_at: string
}

export interface GardenStats {
  total_plants: number
  this_month_cares: number
  health_distribution: {
    good: number
    warning: number
    critical: number
  }
}

export async function getMyPlants(): Promise<UserPlant[]> {
  return request<UserPlant[]>({
    url: '/api/plants/my',
    method: 'GET',
  })
}

export async function addPlant(params: {
  plant_name: string
  nickname?: string
  location?: string
}): Promise<UserPlant> {
  return request<UserPlant>({
    url: '/api/plants',
    method: 'POST',
    data: params,
  })
}

export async function updatePlant(id: number, params: Partial<UserPlant>): Promise<void> {
  await request({
    url: `/api/plants/${id}`,
    method: 'PUT',
    data: params,
  })
}

export async function deletePlant(id: number): Promise<void> {
  await request({
    url: `/api/plants/${id}`,
    method: 'DELETE',
  })
}

export async function getGardenStats(): Promise<GardenStats> {
  return request<GardenStats>({
    url: '/api/plants/stats',
    method: 'GET',
  })
}

export async function getPopularPlants(): Promise<Array<{ id: number; name: string; emoji?: string }>> {
  return request({
    url: '/api/recommend',
    method: 'GET',
  })
}

export default {
  getMyPlants,
  addPlant,
  updatePlant,
  deletePlant,
  getGardenStats,
  getPopularPlants,
}
```

**Step 4: 创建识别服务**

```typescript
// src/services/recognition.ts
import { request } from './api'
import Taro from '@tarojs/taro'

export interface RecognitionResult {
  id?: number
  name: string
  confidence: number
  description?: string
  emoji?: string
  care_tips?: string[]
}

export async function recognizePlant(imagePath: string): Promise<RecognitionResult> {
  // 上传图片并识别
  const uploadRes = await Taro.uploadFile({
    url: `${process.env.API_BASE_URL}/api/recognition/plant`,
    filePath: imagePath,
    name: 'image',
    header: {
      Authorization: `Bearer ${Taro.getStorageSync('token')}`,
    },
  })

  const result = JSON.parse(uploadRes.data)
  return result.data
}

export async function diagnosePest(imagePath: string): Promise<RecognitionResult> {
  const uploadRes = await Taro.uploadFile({
    url: `${process.env.API_BASE_URL}/api/diagnosis/pest`,
    filePath: imagePath,
    name: 'image',
    header: {
      Authorization: `Bearer ${Taro.getStorageSync('token')}`,
    },
  })

  const result = JSON.parse(uploadRes.data)
  return result.data
}

export default {
  recognizePlant,
  diagnosePest,
}
```

---

### Task 5: 创建 Pinia Store

**Files:**
- Create: `taro/src/stores/auth.ts`
- Create: `taro/src/stores/plant.ts`

**Step 1: 创建认证 Store**

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, getProfile, logout as logoutApi, isLoggedIn as checkLogin } from '@/services/auth'
import type { UserInfo, LoginParams, RegisterParams } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  function init() {
    token.value = Taro.getStorageSync('token') || ''
    if (token.value) {
      loadUserInfo()
    }
  }

  async function loadUserInfo() {
    try {
      const info = await getProfile()
      userInfo.value = info
    } catch (e) {
      logout()
    }
  }

  async function login(params: LoginParams) {
    loading.value = true
    try {
      const result = await loginApi(params)
      token.value = result.token
      userInfo.value = result.user
      Taro.setStorageSync('token', result.token)
      return result
    } finally {
      loading.value = false
    }
  }

  async function register(params: RegisterParams) {
    loading.value = true
    try {
      await registerApi(params)
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    Taro.removeStorageSync('token')
  }

  return {
    token,
    userInfo,
    loading,
    isLoggedIn,
    init,
    loadUserInfo,
    login,
    register,
    logout,
  }
})
```

**Step 2: 创建植物 Store**

```typescript
// src/stores/plant.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMyPlants, addPlant, deletePlant, updatePlant, getGardenStats } from '@/services/plant'
import type { UserPlant, GardenStats } from '@/services/plant'

export const usePlantStore = defineStore('plant', () => {
  const plants = ref<UserPlant[]>([])
  const stats = ref<GardenStats | null>(null)
  const loading = ref(false)

  async function loadPlants() {
    loading.value = true
    try {
      plants.value = await getMyPlants()
    } catch (e) {
      console.error('Failed to load plants:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadStats() {
    try {
      stats.value = await getGardenStats()
    } catch (e) {
      console.error('Failed to load stats:', e)
    }
  }

  async function addNewPlant(params: { plant_name: string; nickname?: string; location?: string }) {
    const plant = await addPlant(params)
    plants.value.push(plant)
    return plant
  }

  async function removePlant(id: number) {
    await deletePlant(id)
    plants.value = plants.value.filter(p => p.id !== id)
  }

  async function editPlant(id: number, params: Partial<UserPlant>) {
    await updatePlant(id, params)
    const index = plants.value.findIndex(p => p.id === id)
    if (index !== -1) {
      plants.value[index] = { ...plants.value[index], ...params }
    }
  }

  return {
    plants,
    stats,
    loading,
    loadPlants,
    loadStats,
    addNewPlant,
    removePlant,
    editPlant,
  }
})
```

---

## Phase 3: P0 页面开发

### Task 6: 首页 (Identify)

**Files:**
- Create: `taro/src/pages/index/index.tsx`
- Create: `taro/src/pages/index/index.config.ts`

**Step 1: 创建首页配置**

```typescript
// src/pages/index/index.config.ts
export default definePageConfig({
  navigationBarTitleText: '首页',
  enablePullDownRefresh: false,
})
```

**Step 2: 创建首页组件**

```tsx
// src/pages/index/index.tsx
import { defineComponent, ref, onMounted } from 'vue'
import { useDidShow } from '@tarojs/taro'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { Button, Card } from '@taroify/core'
import { useAuthStore } from '@/stores/auth'
import { recognizePlant } from '@/services/recognition'
import { getPopularPlants } from '@/services/plant'
import './index.scss'

export default defineComponent({
  setup() {
    const authStore = useAuthStore()
    const selectedImage = ref('')
    const result = ref<any>(null)
    const loading = ref(false)
    const popularPlants = ref<any[]>([])

    useDidShow(() => {
      authStore.init?.()
      loadPopularPlants()
    })

    const loadPopularPlants = async () => {
      try {
        const plants = await getPopularPlants()
        popularPlants.value = plants || []
      } catch (e) {
        // ignore
      }
    }

    const takePhoto = () => {
      Taro.chooseImage({
        count: 1,
        sourceType: ['camera'],
        success: (res) => {
          selectedImage.value = res.tempFilePaths[0]
          doRecognize(res.tempFilePaths[0])
        },
      })
    }

    const selectFromGallery = () => {
      Taro.chooseImage({
        count: 1,
        sourceType: ['album'],
        success: (res) => {
          selectedImage.value = res.tempFilePaths[0]
          doRecognize(res.tempFilePaths[0])
        },
      })
    }

    const doRecognize = async (filePath: string) => {
      if (!filePath) return
      loading.value = true
      result.value = null
      try {
        const res = await recognizePlant(filePath)
        result.value = res
        Taro.showToast({ title: '识别成功' })
      } catch (e) {
        Taro.showToast({ title: '识别失败', icon: 'none' })
      } finally {
        loading.value = false
      }
    }

    const addToGarden = () => {
      if (!authStore.isLoggedIn) {
        Taro.navigateTo({ url: '/pages-sub/login/index' })
        return
      }
      Taro.showToast({ title: '功能开发中', icon: 'none' })
    }

    const goToDiagnosis = () => {
      if (!authStore.isLoggedIn) {
        Taro.navigateTo({ url: '/pages-sub/login/index' })
        return
      }
      Taro.navigateTo({ url: '/pages-sub/diagnosis/index' })
    }

    const goToConsultation = () => {
      if (!authStore.isLoggedIn) {
        Taro.navigateTo({ url: '/pages-sub/login/index' })
        return
      }
      Taro.navigateTo({ url: '/pages-sub/consultation/index' })
    }

    const goToReminder = () => {
      if (!authStore.isLoggedIn) {
        Taro.navigateTo({ url: '/pages-sub/login/index' })
        return
      }
      Taro.navigateTo({ url: '/pages-sub/reminder/index' })
    }

    const goToDiary = () => {
      if (!authStore.isLoggedIn) {
        Taro.navigateTo({ url: '/pages-sub/login/index' })
        return
      }
      Taro.navigateTo({ url: '/pages-sub/diary/index' })
    }

    return () => (
      <View class="container">
        <View class="header-gradient">
          <View class="header">
            <Text class="header-title">首页</Text>
            <Text class="header-subtitle">护花使者 - 让养花更简单</Text>
          </View>
        </View>

        <View class="identify-section">
          <View class="identify-card" onClick={takePhoto}>
            <Image
              class="identify-image"
              src={selectedImage.value || '/static/placeholder.png'}
              mode="aspectFill"
            />
            <View class="identify-overlay">
              <Text class="identify-icon">📷</Text>
              <Text class="identify-text">点击拍照识别植物</Text>
            </View>
          </View>

          <View class="action-buttons">
            <View class="action-btn primary" onClick={takePhoto}>
              <Text>📸</Text>
              <Text>拍照识别</Text>
            </View>
            <View class="action-btn secondary" onClick={selectFromGallery}>
              <Text>🖼️</Text>
              <Text>相册选择</Text>
            </View>
          </View>
        </View>

        {loading.value && (
          <View class="loading-section">
            <View class="loading-card">
              <View class="loading-spinner"></View>
              <Text class="loading-text">正在识别...</Text>
            </View>
          </View>
        )}

        {result.value && (
          <View class="result-section">
            <View class="result-card">
              <View class="result-header">
                <Text class="result-title">识别结果</Text>
                <Text class="result-confidence">{result.value.confidence || 85}% 置信度</Text>
              </View>
              <View class="result-body">
                <Text class="result-name">{result.value.name}</Text>
                {result.value.description && (
                  <Text class="result-description">{result.value.description}</Text>
                )}
              </View>
              <View class="result-actions">
                <View class="result-action-btn" onClick={addToGarden}>
                  <Text>🌱 添加到花园</Text>
                </View>
                <View class="result-action-btn outline">
                  <Text>查看详情</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View class="quick-entry">
          <View class="quick-item" onClick={goToDiagnosis}>
            <View class="quick-icon" style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)' }}>
              <Text style={{ fontSize: '48rpx' }}>🔬</Text>
            </View>
            <Text class="quick-text">病虫害诊断</Text>
          </View>
          <View class="quick-item" onClick={goToConsultation}>
            <View class="quick-icon" style={{ backgroundColor: 'rgba(82, 196, 26, 0.1)' }}>
              <Text style={{ fontSize: '48rpx' }}>💬</Text>
            </View>
            <Text class="quick-text">AI 咨询</Text>
          </View>
          <View class="quick-item" onClick={goToReminder}>
            <View class="quick-icon" style={{ backgroundColor: 'rgba(250, 173, 20, 0.1)' }}>
              <Text style={{ fontSize: '48rpx' }}>⏰</Text>
            </View>
            <Text class="quick-text">养护提醒</Text>
          </View>
          <View class="quick-item" onClick={goToDiary}>
            <View class="quick-icon" style={{ backgroundColor: 'rgba(244, 102, 102, 0.1)' }}>
              <Text style={{ fontSize: '48rpx' }}>📔</Text>
            </View>
            <Text class="quick-text">养花日记</Text>
          </View>
        </View>

        <View class="recommend-section">
          <View class="section-header">
            <Text class="section-title">热门植物</Text>
            <Text class="section-more" onClick={() => Taro.switchTab({ url: '/pages/encyclopedia/index' })}>更多 ›</Text>
          </View>
          <ScrollView scroll-x class="recommend-scroll">
            {popularPlants.value.map((plant) => (
              <View key={plant.id} class="recommend-card">
                <View class="recommend-image">
                  <Text class="recommend-emoji">{plant.emoji || '🌿'}</Text>
                </View>
                <Text class="recommend-name">{plant.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    )
  },
})
```

**Step 3: 创建首页样式**

```scss
// src/pages/index/index.scss
@import '@/styles/variables.scss';

.container {
  min-height: 100vh;
  background-color: $background;
  padding-bottom: 120px;
}

.header-gradient {
  background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
  border-bottom-left-radius: 48px;
  border-bottom-right-radius: 48px;
}

.header {
  padding: 120px $spacing-lg $spacing-xl;
}

.header-title {
  font-size: 48px;
  font-weight: bold;
  color: #fff;
}

.header-subtitle {
  display: block;
  font-size: 28px;
  color: rgba(255, 255, 255, 0.85);
  margin-top: $spacing-xs;
}

.identify-section {
  margin: -80px $spacing-lg $spacing-lg;
  position: relative;
  z-index: 1;
}

.identify-card {
  height: 400px;
  background-color: $surface;
  border-radius: $border-radius-xxl;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba($primary, 0.2);
  position: relative;
}

.identify-image {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
}

.identify-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%);
}

.identify-icon {
  font-size: 80px;
  margin-bottom: $spacing-sm;
}

.identify-text {
  color: #fff;
  font-size: 32px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: $spacing-md;
  margin-top: $spacing-lg;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-md 0;
  border-radius: $border-radius-lg;
  gap: $spacing-sm;
}

.action-btn.primary {
  background-color: $primary;
}

.action-btn.secondary {
  background-color: $secondary;
}

.action-btn text {
  color: #fff;
  font-size: 28px;
  font-weight: 600;
}

.result-section {
  margin: 0 $spacing-lg $spacing-lg;
}

.result-card {
  background-color: $surface;
  border-radius: $border-radius-xl;
  padding: $spacing-lg;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.result-title {
  font-size: 26px;
  color: #999;
}

.result-confidence {
  font-size: 24px;
  color: $success;
  font-weight: 500;
}

.result-body {
  margin-bottom: $spacing-lg;
}

.result-name {
  display: block;
  font-size: 40px;
  font-weight: bold;
  color: $text;
  margin-bottom: $spacing-sm;
}

.result-description {
  display: block;
  font-size: 28px;
  color: $text-secondary;
  line-height: 1.6;
}

.result-actions {
  display: flex;
  gap: $spacing-md;
}

.result-action-btn {
  flex: 1;
  padding: $spacing-md 0;
  background-color: $primary;
  border-radius: $border-radius-lg;
  text-align: center;
}

.result-action-btn.outline {
  background-color: transparent;
  border: 1px solid $primary;
}

.result-action-btn text {
  color: #fff;
  font-size: 28px;
  font-weight: 500;
}

.result-action-btn.outline text {
  color: $primary;
}

.loading-section {
  margin: 0 $spacing-lg $spacing-lg;
}

.loading-card {
  background-color: $surface;
  border-radius: $border-radius-xl;
  padding: $spacing-xxl;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner {
  width: 64px;
  height: 64px;
  border: 4px solid #f5f5f5;
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: $spacing-md;
  font-size: 28px;
  color: #999;
}

.quick-entry {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  margin: 0 $spacing-lg $spacing-lg;
}

.quick-item {
  width: calc(50% - $spacing-sm);
  background-color: $surface;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quick-icon {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-sm;
}

.quick-text {
  font-size: 26px;
  color: $text;
}

.recommend-section {
  margin: 0 $spacing-lg;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: 34px;
  font-weight: bold;
  color: $text;
}

.section-more {
  font-size: 26px;
  color: #999;
}

.recommend-scroll {
  white-space: nowrap;
}

.recommend-card {
  display: inline-block;
  width: 200px;
  margin-right: $spacing-md;
}

.recommend-image {
  width: 200px;
  height: 200px;
  background-color: $surface;
  border-radius: $border-radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-sm;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.recommend-emoji {
  font-size: 80px;
}

.recommend-name {
  display: block;
  font-size: 26px;
  color: $text;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

---

### Task 7: 登录页面

**Files:**
- Create: `taro/src/pages-sub/login/index.tsx`
- Create: `taro/src/pages-sub/login/index.config.ts`
- Create: `taro/src/pages-sub/login/index.scss`

**Step 1: 创建登录页面**

```tsx
// src/pages-sub/login/index.tsx
import { defineComponent, ref } from 'vue'
import { View, Text, Input, Image } from '@tarojs/components'
import { Button, Field, Form } from '@taroify/core'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores/auth'
import './index.scss'

export default defineComponent({
  setup() {
    const authStore = useAuthStore()
    const email = ref('')
    const password = ref('')
    const loading = ref(false)

    const handleLogin = async () => {
      if (!email.value || !password.value) {
        Taro.showToast({ title: '请填写完整信息', icon: 'none' })
        return
      }

      loading.value = true
      try {
        await authStore.login({
          email: email.value,
          password: password.value,
        })
        Taro.showToast({ title: '登录成功' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1000)
      } catch (e: any) {
        Taro.showToast({ title: e.message || '登录失败', icon: 'none' })
      } finally {
        loading.value = false
      }
    }

    const goToRegister = () => {
      Taro.navigateTo({ url: '/pages-sub/register/index' })
    }

    const goToForgotPassword = () => {
      Taro.navigateTo({ url: '/pages-sub/forgot-password/index' })
    }

    return () => (
      <View class="login-container">
        <View class="login-header">
          <Text class="login-title">登录</Text>
          <Text class="login-subtitle">欢迎回来，养花人</Text>
        </View>

        <View class="login-form">
          <View class="form-item">
            <Text class="form-label">邮箱</Text>
            <Input
              class="form-input"
              type="text"
              placeholder="请输入邮箱"
              value={email.value}
              onInput={(e) => email.value = e.detail.value}
            />
          </View>

          <View class="form-item">
            <Text class="form-label">密码</Text>
            <Input
              class="form-input"
              type="password"
              placeholder="请输入密码"
              value={password.value}
              onInput={(e) => password.value = e.detail.value}
            />
          </View>

          <View class="form-actions">
            <Text class="forgot-password" onClick={goToForgotPassword}>忘记密码？</Text>
          </View>

          <Button
            class="login-btn"
            color="primary"
            loading={loading.value}
            onClick={handleLogin}
          >
            登录
          </Button>

          <View class="register-link">
            <Text>还没有账号？</Text>
            <Text class="link" onClick={goToRegister}>立即注册</Text>
          </View>
        </View>
      </View>
    )
  },
})
```

**Step 2: 创建登录样式**

```scss
// src/pages-sub/login/index.scss
@import '@/styles/variables.scss';

.login-container {
  min-height: 100vh;
  background-color: $background;
  padding: 0 $spacing-lg;
}

.login-header {
  padding: 120px 0 $spacing-xxl;
}

.login-title {
  font-size: 56px;
  font-weight: bold;
  color: $primary;
  display: block;
}

.login-subtitle {
  font-size: 28px;
  color: $text-secondary;
  display: block;
  margin-top: $spacing-sm;
}

.login-form {
  background-color: $surface;
  border-radius: $border-radius-xl;
  padding: $spacing-xl;
  box-shadow: 0 4px 20px rgba($primary, 0.1);
}

.form-item {
  margin-bottom: $spacing-lg;
}

.form-label {
  font-size: 28px;
  color: $text;
  font-weight: 500;
  display: block;
  margin-bottom: $spacing-sm;
}

.form-input {
  background-color: $background;
  border: 1px solid $border;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  font-size: 28px;
  color: $text;
}

.form-input::placeholder {
  color: $text-tertiary;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: $spacing-xl;
}

.forgot-password {
  font-size: 26px;
  color: $primary;
}

.login-btn {
  width: 100%;
  height: 96px;
  font-size: 32px;
  border-radius: $border-radius-lg;
}

.register-link {
  display: flex;
  justify-content: center;
  gap: $spacing-xs;
  margin-top: $spacing-xl;
  font-size: 28px;
  color: $text-secondary;
}

.link {
  color: $primary;
  font-weight: 500;
}
```

---

### Task 8: 注册页面

**Files:**
- Create: `taro/src/pages-sub/register/index.tsx`
- Create: `taro/src/pages-sub/register/index.config.ts`
- Create: `taro/src/pages-sub/register/index.scss`

**Step 1: 创建注册页面**

```tsx
// src/pages-sub/register/index.tsx
import { defineComponent, ref } from 'vue'
import { View, Text, Input } from '@tarojs/components'
import { Button } from '@taroify/core'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores/auth'
import './index.scss'

export default defineComponent({
  setup() {
    const authStore = useAuthStore()
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const nickname = ref('')
    const loading = ref(false)

    const handleRegister = async () => {
      if (!email.value || !password.value || !confirmPassword.value) {
        Taro.showToast({ title: '请填写完整信息', icon: 'none' })
        return
      }

      if (password.value !== confirmPassword.value) {
        Taro.showToast({ title: '两次密码不一致', icon: 'none' })
        return
      }

      loading.value = true
      try {
        await authStore.register({
          email: email.value,
          password: password.value,
          nickname: nickname.value,
        })
        Taro.showToast({ title: '注册成功，请登录' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1000)
      } catch (e: any) {
        Taro.showToast({ title: e.message || '注册失败', icon: 'none' })
      } finally {
        loading.value = false
      }
    }

    const goToLogin = () => {
      Taro.navigateBack()
    }

    return () => (
      <View class="register-container">
        <View class="register-header">
          <Text class="register-title">注册</Text>
          <Text class="register-subtitle">加入护花使者大家庭</Text>
        </View>

        <View class="register-form">
          <View class="form-item">
            <Text class="form-label">昵称（选填）</Text>
            <Input
              class="form-input"
              type="text"
              placeholder="请输入昵称"
              value={nickname.value}
              onInput={(e) => nickname.value = e.detail.value}
            />
          </View>

          <View class="form-item">
            <Text class="form-label">邮箱</Text>
            <Input
              class="form-input"
              type="text"
              placeholder="请输入邮箱"
              value={email.value}
              onInput={(e) => email.value = e.detail.value}
            />
          </View>

          <View class="form-item">
            <Text class="form-label">密码</Text>
            <Input
              class="form-input"
              type="password"
              placeholder="请输入密码"
              value={password.value}
              onInput={(e) => password.value = e.detail.value}
            />
          </View>

          <View class="form-item">
            <Text class="form-label">确认密码</Text>
            <Input
              class="form-input"
              type="password"
              placeholder="请再次输入密码"
              value={confirmPassword.value}
              onInput={(e) => confirmPassword.value = e.detail.value}
            />
          </View>

          <Button
            class="register-btn"
            color="primary"
            loading={loading.value}
            onClick={handleRegister}
          >
            注册
          </Button>

          <View class="login-link">
            <Text>已有账号？</Text>
            <Text class="link" onClick={goToLogin}>立即登录</Text>
          </View>
        </View>
      </View>
    )
  },
})
```

---

### Task 9: 花园页面

**Files:**
- Create: `taro/src/pages/garden/index.tsx`
- Create: `taro/src/pages/garden/index.config.ts`
- Create: `taro/src/pages/garden/index.scss`

**Step 1: 创建花园页面配置**

```typescript
// src/pages/garden/index.config.ts
export default definePageConfig({
  navigationBarTitleText: '我的花园',
  enablePullDownRefresh: true,
})
```

**Step 2: 创建花园页面**

```tsx
// src/pages/garden/index.tsx
import { defineComponent, ref, onMounted } from 'vue'
import { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { Button, Dialog, Empty } from '@taroify/core'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores/auth'
import { usePlantStore } from '@/stores/plant'
import { getMyPlants, addPlant, deletePlant, updatePlant, getGardenStats } from '@/services/plant'
import type { UserPlant } from '@/services/plant'
import './index.scss'

const environmentLabels: Record<string, string> = {
  'south-balcony': '南阳台',
  'north-bedroom': '北卧室',
  'living-room': '客厅',
  'office': '办公室',
  'other': '其他位置',
}

export default defineComponent({
  setup() {
    const authStore = useAuthStore()
    const plantStore = usePlantStore()
    const plants = ref<UserPlant[]>([])
    const stats = ref<any>(null)
    const loading = ref(false)
    const refreshing = ref(false)
    const showAddModal = ref(false)
    const showEditModal = ref(false)
    const editingPlant = ref<UserPlant | null>(null)
    const newPlantName = ref('')
    const newPlantNickname = ref('')
    const newPlantLocation = ref('other')

    useDidShow(() => {
      if (authStore.isLoggedIn) {
        loadPlants()
        loadStats()
      }
    })

    const loadPlants = async () => {
      if (!authStore.isLoggedIn) {
        loading.value = false
        return
      }
      try {
        loading.value = true
        plants.value = await getMyPlants()
      } catch (e) {
        console.error('Failed to load plants:', e)
      } finally {
        loading.value = false
        refreshing.value = false
      }
    }

    const loadStats = async () => {
      try {
        stats.value = await getGardenStats()
      } catch (e) {
        console.error('Failed to load stats:', e)
      }
    }

    const onRefresh = () => {
      refreshing.value = true
      loadPlants()
      loadStats()
    }

    const handleWaterPlant = (plantId: number) => {
      Taro.showToast({ title: '浇水成功', icon: 'success' })
    }

    const handleDeletePlant = (plantId: number) => {
      Dialog.confirm({
        title: '删除植物',
        message: '确定要删除这株植物吗？',
        confirmText: '删除',
        cancelText: '取消',
      }).then(async (result) => {
        if (result === 'confirm') {
          try {
            await deletePlant(plantId)
            plants.value = plants.value.filter(p => p.id !== plantId)
            Taro.showToast({ title: '删除成功' })
          } catch (e) {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      })
    }

    const handleEditPlant = (plant: UserPlant) => {
      editingPlant.value = plant
      newPlantName.value = plant.plant_name || ''
      newPlantNickname.value = plant.nickname || ''
      newPlantLocation.value = plant.location || 'other'
      showEditModal.value = true
    }

    const handleSaveEdit = async () => {
      if (!editingPlant.value || !newPlantName.value) {
        Taro.showToast({ title: '请输入植物名称', icon: 'none' })
        return
      }
      try {
        await updatePlant(editingPlant.value.id, {
          plant_name: newPlantName.value,
          nickname: newPlantNickname.value || newPlantName.value,
          location: newPlantLocation.value,
        })
        plants.value = plants.value.map(p =>
          p.id === editingPlant.value!.id
            ? { ...p, plant_name: newPlantName.value, nickname: newPlantNickname.value || newPlantName.value, location: newPlantLocation.value }
            : p
        )
        showEditModal.value = false
        Taro.showToast({ title: '保存成功' })
      } catch (e) {
        Taro.showToast({ title: '保存失败', icon: 'none' })
      }
    }

    const handleAddPlant = async () => {
      if (!authStore.isLoggedIn) {
        Taro.navigateTo({ url: '/pages-sub/login/index' })
        return
      }
      if (!newPlantName.value) {
        Taro.showToast({ title: '请输入植物名称', icon: 'none' })
        return
      }
      try {
        const newPlant = await addPlant({
          plant_name: newPlantName.value,
          nickname: newPlantNickname.value || newPlantName.value,
          location: newPlantLocation.value,
        })
        plants.value.push(newPlant)
        showAddModal.value = false
        newPlantName.value = ''
        newPlantNickname.value = ''
        newPlantLocation.value = 'other'
        Taro.showToast({ title: '添加成功' })
      } catch (e) {
        Taro.showToast({ title: '添加失败', icon: 'none' })
      }
    }

    const handlePlantPress = (plant: UserPlant) => {
      Taro.navigateTo({ url: `/pages-sub/plant-detail/index?plantId=${plant.id}` })
    }

    const goToLogin = () => {
      Taro.navigateTo({ url: '/pages-sub/login/index' })
    }

    return () => (
      <View class="container">
        <View class="header-gradient">
          <View class="header">
            <View class="header-top">
              <View class="header-title">
                <Text class="header-title-text">🌸 我的花园</Text>
              </View>
              <View class="add-button" onClick={() => {
                if (!authStore.isLoggedIn) {
                  Taro.showModal({
                    title: '提示',
                    content: '登录后可使用花园功能',
                    confirmText: '去登录',
                    cancelText: '取消',
                    success: (res) => {
                      if (res.confirm) goToLogin()
                    }
                  })
                } else {
                  showAddModal.value = true
                }
              }}>
                <Text>+ 添加植物</Text>
              </View>
            </View>
            <Text class="header-subtitle">
              {plants.value.length > 0 ? `已养护 ${plants.value.length} 株植物` : '快来添加你的第一株植物吧'}
            </Text>
          </View>
        </View>

        {authStore.isLoggedIn && stats.value && (
          <View class="stats-container">
            <View class="stat-card">
              <Text class="stat-value">{stats.value.total_plants}</Text>
              <Text class="stat-label">植物总数</Text>
            </View>
            <View class="stat-card">
              <Text class="stat-value">{stats.value.this_month_cares}</Text>
              <Text class="stat-label">本月养护</Text>
            </View>
            <View class="stat-card">
              <Text class="stat-value" style={{ color: $success }}>{stats.value.health_distribution?.good || 0}</Text>
              <Text class="stat-label">健康</Text>
            </View>
          </View>
        )}

        <ScrollView
          class="list"
          scroll-y
          refresher-enabled
          refresher-triggered={refreshing.value}
          onRefresherRefresh={onRefresh}
        >
          {!authStore.isLoggedIn ? (
            <View class="empty-container">
              <View class="empty-icon">🌸</View>
              <Text class="empty-title">登录后使用</Text>
              <Text class="empty-subtitle">登录后可管理你的花园</Text>
              <View class="empty-add-button" onClick={goToLogin}>
                <Text>立即登录</Text>
              </View>
            </View>
          ) : loading.value ? (
            <View class="loading-container">
              <Text>加载中...</Text>
            </View>
          ) : plants.value.length === 0 ? (
            <View class="empty-container">
              <View class="empty-icon">🌸</View>
              <Text class="empty-title">花园空空如也</Text>
              <Text class="empty-subtitle">添加你的第一株植物，开始养护之旅</Text>
              <View class="empty-add-button" onClick={() => showAddModal.value = true}>
                <Text>+ 添加植物</Text>
              </View>
            </View>
          ) : (
            plants.value.map((plant) => (
              <View key={plant.id} class="plant-card" onClick={() => handlePlantPress(plant)}>
                <View class="plant-image">
                  <Text class="plant-emoji">🌿</Text>
                  <View class="delete-button" onClick={(e) => { e.stopPropagation(); handleDeletePlant(plant.id) }}>
                    <Text>×</Text>
                  </View>
                  <View class="plant-image-overlay">
                    <Text class="plant-nickname">{plant.nickname || plant.plant_name}</Text>
                    <Text class="plant-name">{plant.plant_name}</Text>
                    {plant.location && (
                      <View class="plant-env-badge">
                        <Text>{environmentLabels[plant.location] || plant.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View class="plant-info">
                  <View class="plant-stats">
                    <View class="stat-item" onClick={(e) => { e.stopPropagation(); handleWaterPlant(plant.id) }}>
                      <Text>💧</Text>
                      <Text class="stat-text">浇水</Text>
                      <Text class="stat-label">快速操作</Text>
                    </View>
                    <View class="stat-item" onClick={(e) => { e.stopPropagation(); handleEditPlant(plant) }}>
                      <Text>✏️</Text>
                      <Text class="stat-text">编辑</Text>
                      <Text class="stat-label">修改信息</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* 添加植物弹窗 */}
        {showAddModal.value && (
          <View class="modal-overlay" onClick={() => showAddModal.value = false}>
            <View class="modal-content" onClick={(e) => e.stopPropagation()}>
              <View class="modal-header">
                <Text class="modal-title">添加新植物</Text>
                <Text class="modal-close" onClick={() => showAddModal.value = false}>×</Text>
              </View>
              <View class="form-item">
                <Text class="form-label">植物名称</Text>
                <Input
                  class="form-input"
                  placeholder="例如：绿萝、吊兰"
                  value={newPlantName.value}
                  onInput={(e) => newPlantName.value = e.detail.value}
                />
              </View>
              <View class="form-item">
                <Text class="form-label">昵称（选填）</Text>
                <Input
                  class="form-input"
                  placeholder="例如：小绿、花花"
                  value={newPlantNickname.value}
                  onInput={(e) => newPlantNickname.value = e.detail.value}
                />
              </View>
              <View class="form-item">
                <Text class="form-label">位置</Text>
                <View class="location-chips">
                  {Object.entries(environmentLabels).map(([key, label]) => (
                    <View
                      key={key}
                      class={`location-chip ${newPlantLocation.value === key ? 'active' : ''}`}
                      onClick={() => newPlantLocation.value = key}
                    >
                      <Text>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View class="submit-button" onClick={handleAddPlant}>
                <Text>添加到花园</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    )
  },
})
```

---

### Task 10: 其他 P0 页面框架 (百科、商城、我的)

**Files:**
- Create: `taro/src/pages/encyclopedia/index.tsx`
- Create: `taro/src/pages/store/index.tsx`
- Create: `taro/src/pages/profile/index.tsx`

**Step 1: 创建百科页面框架**

```tsx
// src/pages/encyclopedia/index.tsx
import { defineComponent, ref } from 'vue'
import { View, Text } from '@tarojs/components'
import { SearchBar } from '@taroify/core'
import Taro from '@tarojs/taro'
import './index.scss'

export default defineComponent({
  setup() {
    const searchValue = ref('')

    return () => (
      <View class="container">
        <View class="header-gradient">
          <View class="header">
            <Text class="header-title">植物百科</Text>
          </View>
          <SearchBar
            class="search-bar"
            placeholder="搜索植物"
            value={searchValue.value}
            onChange={(v) => searchValue.value = v}
          />
        </View>
        <View class="content">
          <View class="empty-state">
            <Text class="empty-text">百科功能开发中</Text>
          </View>
        </View>
      </View>
    )
  },
})
```

**Step 2: 创建商城页面框架**

```tsx
// src/pages/store/index.tsx
import { defineComponent, ref } from 'vue'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default defineComponent({
  setup() {
    return () => (
      <View class="container">
        <View class="header-gradient">
          <View class="header">
            <Text class="header-title">植物商城</Text>
          </View>
        </View>
        <View class="content">
          <View class="empty-state">
            <Text class="empty-text">商城功能开发中</Text>
          </View>
        </View>
      </View>
    )
  },
})
```

**Step 3: 创建我的页面框架**

```tsx
// src/pages/profile/index.tsx
import { defineComponent } from 'vue'
import { View, Text } from '@tarojs/components'
import { useAuthStore } from '@/stores/auth'
import Taro from '@tarojs/taro'
import './index.scss'

export default defineComponent({
  setup() {
    const authStore = useAuthStore()

    const goToOrders = () => {
      if (!authStore.isLoggedIn) {
        Taro.navigateTo({ url: '/pages-sub/login/index' })
        return
      }
      Taro.navigateTo({ url: '/pages-sub/orders/index' })
    }

    const goToAddress = () => {
      if (!authStore.isLoggedIn) {
        Taro.navigateTo({ url: '/pages-sub/login/index' })
        return
      }
      Taro.navigateTo({ url: '/pages-sub/address/index' })
    }

    const goToLogin = () => {
      Taro.navigateTo({ url: '/pages-sub/login/index' })
    }

    const handleLogout = () => {
      authStore.logout()
      Taro.showToast({ title: '已退出登录' })
    }

    return () => (
      <View class="container">
        <View class="header-gradient">
          <View class="profile-header">
            {authStore.isLoggedIn ? (
              <>
                <View class="avatar">
                  <Text class="avatar-text">{authStore.userInfo?.nickname?.[0] || '👤'}</Text>
                </View>
                <Text class="nickname">{authStore.userInfo?.nickname || '用户'}</Text>
                <Text class="email">{authStore.userInfo?.email}</Text>
              </>
            ) : (
              <>
                <View class="avatar">
                  <Text class="avatar-text">👤</Text>
                </View>
                <Text class="nickname" onClick={goToLogin}>点击登录</Text>
              </>
            )}
          </View>
        </View>

        <View class="menu-list">
          <View class="menu-item" onClick={goToOrders}>
            <Text class="menu-icon">📦</Text>
            <Text class="menu-text">我的订单</Text>
            <Text class="menu-arrow">›</Text>
          </View>
          <View class="menu-item" onClick={goToAddress}>
            <Text class="menu-icon">📍</Text>
            <Text class="menu-text">收货地址</Text>
            <Text class="menu-arrow">›</Text>
          </View>
          <View class="menu-item" onClick={() => Taro.navigateTo({ url: '/pages-sub/reminder/index' })}>
            <Text class="menu-icon">⏰</Text>
            <Text class="menu-text">养护提醒</Text>
            <Text class="menu-arrow">›</Text>
          </View>
          <View class="menu-item" onClick={() => Taro.navigateTo({ url: '/pages-sub/diary/index' })}>
            <Text class="menu-icon">📔</Text>
            <Text class="menu-text">养花日记</Text>
            <Text class="menu-arrow">›</Text>
          </View>
        </View>

        {authStore.isLoggedIn && (
          <View class="logout-button" onClick={handleLogout}>
            <Text>退出登录</Text>
          </View>
        )}
      </View>
    )
  },
})
```

---

## Phase 4: P1 页面 (子页面)

### Task 11: 植物详情页

**Files:**
- Create: `taro/src/pages-sub/plant-detail/index.tsx`
- Create: `taro/src/pages-sub/plant-detail/index.config.ts`

**Step 1: 创建植物详情页**

```tsx
// src/pages-sub/plant-detail/index.tsx
import { defineComponent, ref, onMounted } from 'vue'
import { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default defineComponent({
  setup() {
    const plantId = ref<number>(0)
    const plant = ref<any>(null)
    const loading = ref(false)

    useDidShow(() => {
      const eventChannel = Taro.getCurrentInstance().page?.getOpenerEventChannel()
      if (eventChannel) {
        eventChannel.on('plantData', (data) => {
          plant.value = data
        })
      }

      const pages = Taro.getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const { plantId: id } = (currentPage as any).options || {}
      if (id) {
        plantId.value = Number(id)
        loadPlantDetail(id)
      }
    })

    const loadPlantDetail = async (id: number) => {
      loading.value = true
      try {
        // TODO: 调用 API 获取植物详情
        plant.value = { id, name: '植物详情', description: '植物详情信息' }
      } catch (e) {
        Taro.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        loading.value = false
      }
    }

    return () => (
      <View class="container">
        <View class="plant-header">
          <View class="plant-image">
            <Text class="plant-emoji">🌿</Text>
          </View>
          <View class="plant-info">
            <Text class="plant-name">{plant.value?.nickname || plant.value?.plant_name || '植物名称'}</Text>
            <Text class="plant-species">{plant.value?.plant_name}</Text>
            <View class="plant-tags">
              <Text class="tag">🌱 生长中</Text>
              <Text class="tag">💧 3天前浇水</Text>
            </View>
          </View>
        </View>

        <View class="section">
          <Text class="section-title">养护建议</Text>
          <View class="care-tips">
            <View class="tip-item">
              <Text class="tip-icon">💧</Text>
              <Text class="tip-text">浇水：每3-5天一次</Text>
            </View>
            <View class="tip-item">
              <Text class="tip-icon">☀️</Text>
              <Text class="tip-text">光照：散射光环境</Text>
            </View>
            <View class="tip-item">
              <Text class="tip-icon">🌡️</Text>
              <Text class="tip-text">温度：15-28°C</Text>
            </View>
          </View>
        </View>

        <View class="section">
          <Text class="section-title">生长记录</Text>
          <View class="empty-state">
            <Text>暂无记录</Text>
          </View>
        </View>
      </View>
    )
  },
})
```

---

## Phase 5: 静态资源

### Task 12: 创建 TabBar 图标

**Files:**
- Create: `taro/src/static/tab-home.png` (占位)
- Create: `taro/src/static/tab-home-active.png` (占位)
- Create: `taro/src/static/tab-garden.png` (占位)
- Create: `taro/src/static/tab-garden-active.png` (占位)
- Create: `taro/src/static/tab-encyclopedia.png` (占位)
- Create: `taro/src/static/tab-encyclopedia-active.png` (占位)
- Create: `taro/src/static/tab-store.png` (占位)
- Create: `taro/src/static/tab-store-active.png` (占位)
- Create: `taro/src/static/tab-profile.png` (占位)
- Create: `taro/src/static/tab-profile-active.png` (占位)
- Create: `taro/src/static/placeholder.png` (占位)

**Step 1: 创建占位图标文件**

由于需要实际的图片文件，可以先创建简单的 SVG 或使用 emoji 作为临时图标：
- 在实际开发中需要添加真实的 TabBar 图标
- 图标尺寸建议：81x81 像素
- 可使用 iconfont 或自己设计

---

## 实现顺序

1. **Phase 1**: 项目初始化 → Task 1, 2, 3
2. **Phase 2**: 基础设施 → Task 4, 5
3. **Phase 3**: P0 页面 → Task 6, 7, 8, 9, 10
4. **Phase 4**: P1 页面 → Task 11 (及其他)
5. **Phase 5**: 静态资源 → Task 12

---

## 测试验证

### 本地测试
```bash
cd taro
npm install
npm run dev:mp-weixin
```

### 微信开发者工具
1. 打开微信开发者工具
2. 导入 `taro` 项目
3. 使用小程序 AppID
4. 预览和调试

### 功能验证清单
- [ ] 首页拍照识别功能正常
- [ ] 用户登录/注册流程正常
- [ ] 花园添加/编辑/删除植物正常
- [ ] TabBar 导航正常
- [ ] 主题色 (花瓣粉) 正确显示
