// 诊断记录 API 服务
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

// 诊断记录类型
export interface DiagnosisRecord {
  id: number;
  image_url: string;
  disease_name: string;
  confidence: number;
  description: string;
  treatment: string;
  prevention: string;
  recommended_products: string;
  is_favorite: boolean;
  created_at: string;
}

export interface DiagnosisListResponse {
  total: number;
  items: DiagnosisRecord[];
}

// 获取诊断历史列表
export const getDiagnoses = async (favorite?: boolean): Promise<DiagnosisListResponse> => {
  const params = favorite !== undefined ? { favorite } : {};
  const response = await api.get('/api/diagnoses', { params });
  return response.data;
};

// 获取诊断详情
export const getDiagnosis = async (id: number): Promise<DiagnosisRecord> => {
  const response = await api.get(`/api/diagnoses/${id}`);
  return response.data;
};

// 收藏/取消收藏
export const toggleFavorite = async (id: number): Promise<{ is_favorite: boolean }> => {
  const response = await api.post(`/api/diagnoses/${id}/favorite`);
  return response.data;
};

// 再次诊断
export const rediagnose = async (id: number): Promise<DiagnosisRecord> => {
  const response = await api.post(`/api/diagnoses/${id}/rediagnose`);
  return response.data;
};
