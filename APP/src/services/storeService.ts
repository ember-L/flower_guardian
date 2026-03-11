// 商城 API 服务
import axios from 'axios';

// 注意：在 iOS 模拟器中需要使用实际 IP 地址，不能用 localhost
// 如果在本机运行后端，改为: http://192.168.x.x:8000 (你的局域网 IP)
const API_URL = 'http://192.168.1.100:8000';

const api = axios.create({
  baseURL: API_URL,
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

// 获取订单详情
export const getOrderDetail = async (id: number): Promise<Order> => {
  const response = await api.get(`/api/orders/${id}`);
  return response.data;
};
