// 推荐 API 服务
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

// 推荐请求
export interface RecommendRequest {
  light: 'full' | 'partial' | 'low';
  watering: 'frequent' | 'weekly' | 'biweekly' | 'monthly';
  purpose: 'air-purify' | 'decoration' | 'hobby';
  has_pets_kids: boolean;
  experience: 'beginner' | 'intermediate' | 'expert';
}

// 推荐结果
export interface PlantRecommendation {
  plant_id: number;
  name: string;
  match_score: number;
  reason: string;
  survival_rate: number;
  features: string[];
  light_requirement: string;
  water_requirement: string;
  care_level: number;
  is_toxic: boolean;
}

// 获取推荐
export const getRecommendations = async (data: RecommendRequest): Promise<PlantRecommendation[]> => {
  const response = await api.post('/api/recommend', data);
  return response.data;
};
