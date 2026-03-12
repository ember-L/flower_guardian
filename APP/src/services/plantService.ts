// 植物 API 服务
import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 植物类型
export interface Plant {
  id: number;
  name: string;
  scientific_name?: string;
  category?: string;
  care_level: number;
  beginner_friendly?: number;
  light_requirement?: string;
  water_requirement?: string;
  watering_tip?: string;
  temperature_range?: string;
  humidity_range?: string;
  is_toxic?: boolean;
  description?: string;
  care_tips?: string;
  tips?: string;
  features?: string[];
  survival_rate?: number;
  common_mistakes?: string;
}

// 植物列表响应
export interface PlantListResponse {
  total: number;
  items: Plant[];
}

// 用户植物类型
export interface UserPlant {
  id: number;
  user_id: number;
  plant_id?: number;
  plant_name?: string;
  plant_type?: string;
  nickname?: string;
  image_url?: string;
  location?: string;
  acquired_from?: string;
  notes?: string;
  created_at: string;
}

// 获取植物列表
export const getPlants = async (params?: {
  category?: string;
  care_level?: number;
  beginner_friendly?: number;
  light?: string;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<PlantListResponse> => {
  const response = await api.get('/api/plants', { params });
  return response.data;
};

// 获取植物详情
export const getPlantDetail = async (plantId: number): Promise<Plant> => {
  const response = await api.get(`/api/plants/${plantId}`);
  return response.data;
};

// 添加到我的花园
export const addToMyGarden = async (data: {
  plant_id?: number;
  plant_name?: string;
  nickname?: string;
  location?: string;
  acquired_from?: string;
}): Promise<UserPlant> => {
  const response = await api.post('/api/plants/my', data);
  return response.data;
};

// 获取我的花园植物列表
export const getMyPlants = async (): Promise<UserPlant[]> => {
  const response = await api.get('/api/plants/my');
  return response.data;
};

// 删除花园植物
export const deleteMyPlant = async (plantId: number): Promise<void> => {
  await api.delete(`/api/plants/my/${plantId}`);
};

// 分类类型
export interface PlantCategory {
  value: string;
  name: string;
  icon: string;
  count: number;
}

// 获取植物分类列表
export const getPlantCategories = async (): Promise<{ categories: PlantCategory[] }> => {
  const response = await api.get('/api/plants/categories');
  return response.data;
};

// 获取热门植物
export const getPopularPlants = async (limit = 10): Promise<PlantListResponse> => {
  const response = await api.get('/api/plants/popular', { params: { limit } });
  return response.data;
};

// 获取相关植物
export const getRelatedPlants = async (plantId: number, limit = 5): Promise<PlantListResponse> => {
  const response = await api.get(`/api/plants/${plantId}/related`, { params: { limit } });
  return response.data;
};
