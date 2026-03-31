// 商城 API 服务
import axios from 'axios';
import { API_BASE_URL } from './config';
import { getToken } from './auth';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 添加认证拦截器
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 商品类型
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: string;
  stock: number;
  image_url?: string;
  status: string;
  plant_id?: number;
  created_at: string;
}

// 订单项类型
export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

// 订单类型
export interface Order {
  id: number;
  order_no: string;
  user_id: number;
  total_amount: string;
  status: string;
  delivery_type: 'express' | 'pickup';
  delivery_address?: string;
  contact_name: string;
  contact_phone: string;
  remark?: string;
  created_at: string;
  items: OrderItem[];
}

// 购物车类型
export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  price: string;
  quantity: number;
  stock: number;
  subtotal: string;
}

export interface Cart {
  items: CartItem[];
  total_amount: string;
  item_count: number;
}

// 获取商品列表
export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get('/api/products');
  return response.data.items;
};

// 获取商品详情
export const getProductDetail = async (id: number): Promise<Product> => {
  const response = await api.get(`/api/products/${id}`);
  return response.data;
};

// ===== 购物车 API =====

// 获取购物车
export const getCart = async (): Promise<Cart> => {
  const response = await api.get('/api/cart');
  return response.data;
};

// 添加到购物车
export const addToCart = async (productId: number, quantity: number = 1): Promise<CartItem> => {
  const response = await api.post('/api/cart/items', { product_id: productId, quantity });
  return response.data;
};

// 更新购物车数量
export const updateCartItem = async (itemId: number, quantity: number): Promise<CartItem> => {
  const response = await api.put(`/api/cart/items/${itemId}`, { quantity });
  return response.data;
};

// 删除购物车项
export const deleteCartItem = async (itemId: number): Promise<void> => {
  await api.delete(`/api/cart/items/${itemId}`);
};

// 清空购物车
export const clearCart = async (): Promise<void> => {
  await api.delete('/api/cart/clear');
};

// ===== 订单 API =====

// 创建订单
export const createOrder = async (orderData: {
  items: { product_id: number; quantity: number }[];
  delivery_type: string;
  delivery_address?: string;
  contact_name: string;
  contact_phone: string;
  remark?: string;
}): Promise<Order> => {
  const response = await api.post('/api/orders', orderData);
  return response.data;
};

// 获取我的订单列表
export const getMyOrders = async (): Promise<Order[]> => {
  const response = await api.get('/api/orders');
  return response.data.items;
};

// 筛选订单
export const getOrdersByStatus = async (status: string): Promise<Order[]> => {
  const response = await api.get('/api/orders', { params: { status } });
  return response.data.items;
};

// 获取订单详情
export const getOrderDetail = async (id: number): Promise<Order> => {
  const response = await api.get(`/api/orders/${id}`);
  return response.data;
};

// 取消订单
export const cancelOrder = async (orderId: number): Promise<void> => {
  await api.post(`/api/orders/${orderId}/cancel`);
};

// 再次购买
export const reorder = async (orderId: number): Promise<void> => {
  await api.post(`/api/orders/${orderId}/reorder`);
};

// ===== 支付 API =====

// 支付类型
export interface Payment {
  id: number;
  order_id: number;
  amount: string;
  payment_method: string;
  status: string;
  transaction_id?: string;
  paid_at?: string;
  created_at: string;
}

// 创建支付
export const createPayment = async (orderId: number, paymentMethod: string = 'offline'): Promise<Payment> => {
  const response = await api.post('/api/payments', { order_id: orderId, payment_method: paymentMethod });
  return response.data;
};

// 获取支付状态
export const getPayment = async (paymentId: number): Promise<Payment> => {
  const response = await api.get(`/api/payments/${paymentId}`);
  return response.data;
};
