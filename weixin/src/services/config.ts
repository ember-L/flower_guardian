// 统一API配置
export const API_BASE_URL = 'http://172.20.10.3:8000'

// API端点配置
export const API_ENDPOINTS = {
  // 认证
  LOGIN: '/api/users/login',
  REGISTER: '/api/users/register',
  PROFILE: '/api/users/profile',
  ME: '/api/users/me',
  REFRESH_TOKEN: '/api/users/refresh-token',
  PUSH_TOKEN: '/api/users/push-token',

  // 植物
  PLANTS: '/api/plants',
  PLANT_DETAIL: (id: number) => `/api/plants/${id}`,
  MY_PLANTS: '/api/plants/my',
  DELETE_MY_PLANT: (id: number) => `/api/plants/my/${id}`,
  PLANT_CATEGORIES: '/api/plants/categories',
  POPULAR_PLANTS: '/api/plants/popular',
  RELATED_PLANTS: (id: number) => `/api/plants/${id}/related`,

  // 推荐
  RECOMMEND: '/api/recommend',

  // 识别
  RECOGNITION_PLANT: '/api/recognition/plant',
  RECOGNITION_PUBLIC_PLANT: '/api/recognition/public/plant',
  RECOGNITION_FULL: '/api/recognition/full',
  DIAGNOSIS_PEST: '/api/diagnosis/pest',
  DIAGNOSIS_FULL: '/api/diagnosis/full',
  DIAGNOSIS_UPLOAD_IMAGE: '/api/diagnosis/upload-image',

  // 日记
  DIARIES: '/api/diaries',
  DIARY_DETAIL: (id: number) => `/api/diaries/${id}`,

  // 提醒
  REMINDERS: '/api/reminders',
  REMINDER_DETAIL: (id: number) => `/api/reminders/${id}`,
  SMART_REMINDERS: '/api/reminders/smart',
  REMINDER_WEATHER: '/api/reminders/weather',

  // 商城
  PRODUCTS: '/api/products',
  PRODUCT_DETAIL: (id: number) => `/api/products/${id}`,

  // 购物车
  CART: '/api/cart',
  CART_ITEMS: '/api/cart/items',
  CART_ITEM: (id: number) => `/api/cart/items/${id}`,
  CART_CLEAR: '/api/cart/clear',

  // 订单
  ORDERS: '/api/orders',
  ORDER_DETAIL: (id: number) => `/api/orders/${id}`,
  ORDER_CANCEL: (id: number) => `/api/orders/${id}/cancel`,
  ORDER_REORDER: (id: number) => `/api/orders/${id}/reorder`,

  // 支付
  PAYMENTS: '/api/payments',
  PAYMENT_DETAIL: (id: number) => `/api/payments/${id}`,

  // 诊断记录
  DIAGNOSES: '/api/diagnoses',
  DIAGNOSIS_DETAIL: (id: number) => `/api/diagnoses/${id}`,

  // AI聊天
  AI_CHAT: '/api/ai/chat',
  CHAT_CONVERSATIONS: '/api/chat/conversations',

  // 天气
  WEATHER_TIPS: '/api/weather/tips',

  // 地址
  ADDRESSES: '/api/addresses',
}

export default API_BASE_URL
