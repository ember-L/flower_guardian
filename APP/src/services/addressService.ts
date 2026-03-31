// 地址 API 服务
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

// 地址类型
export interface Address {
  id: number;
  name: string;
  phone: string;
  province?: string;
  city?: string;
  district?: string;
  detail_address: string;
  is_default: boolean;
  created_at: string;
}

// 获取地址列表
export const getAddresses = async (): Promise<Address[]> => {
  const response = await api.get('/api/addresses');
  return response.data;
};

// 创建地址
export const createAddress = async (data: Omit<Address, 'id' | 'created_at'>): Promise<Address> => {
  const response = await api.post('/api/addresses', data);
  return response.data;
};

// 更新地址
export const updateAddress = async (id: number, data: Partial<Address>): Promise<Address> => {
  const response = await api.put(`/api/addresses/${id}`, data);
  return response.data;
};

// 删除地址
export const deleteAddress = async (id: number): Promise<void> => {
  await api.delete(`/api/addresses/${id}`);
};

// 设置默认地址
export const setDefaultAddress = async (id: number): Promise<Address> => {
  const response = await api.put(`/api/addresses/${id}/set-default`);
  return response.data;
};
