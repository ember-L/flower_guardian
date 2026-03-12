// 统一API配置

// ============================================
// ⚠️ 请修改为你的电脑IP地址！
// ============================================
// iOS 模拟器无法使用 localhost，必须用电脑的实际 IP
// 查看IP: 在终端运行 `ifconfig` 或 `ipconfig`
// 示例: 'http://192.168.1.100:8000'
// ============================================

export const API_BASE_URL = 'http://172.20.10.3:8000';

// API端点配置
export const API_ENDPOINTS = {
  // 认证
  LOGIN: '/api/users/login',
  REGISTER: '/api/users/register',
  PROFILE: '/api/users/profile',

  // 植物
  PLANTS: '/api/plants',
  PLANT_DETAIL: (id: number) => `/api/plants/${id}`,
  MY_PLANTS: '/api/plants/my',
  DELETE_MY_PLANT: (id: number) => `/api/plants/my/${id}`,

  // 推荐
  RECOMMEND: '/api/recommend',

  // 识别
  RECOGNITION_PLANT: '/api/recognition/plant',
  RECOGNITION_PUBLIC_PLANT: '/api/recognition/public/plant',
  RECOGNITION_FULL: '/api/recognition/full',
  DIAGNOSIS_PEST: '/api/diagnosis/pest',
  DIAGNOSIS_FULL: '/api/diagnosis/full',

  // 日记
  DIARIES: '/api/diaries',
  DIARY_DETAIL: (id: number) => `/api/diaries/${id}`,

  // 提醒
  REMINDERS: '/api/reminders',
  REMINDER_DETAIL: (id: number) => `/api/reminders/${id}`,

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
};

export default API_BASE_URL;
