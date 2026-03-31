// 植物 API 服务
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

// 植物类型
export interface Plant {
  id: number;
  name: string;
  scientific_name?: string;
  category?: string;
  image_url?: string;
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

// 养护记录
export interface CareRecord {
  id: number;
  user_plant_id: number;
  care_type: 'watering' | 'fertilizing' | 'repotting' | 'pruning' | 'pest_control';
  notes?: string;
  created_at: string;
}

// 生长记录
export interface GrowthRecord {
  id: number;
  user_plant_id: number;
  record_date: string;
  height?: number;
  leaf_count?: number;
  flower_count?: number;
  description?: string;
  image_url?: string;
  created_at: string;
}

// 健康记录
export interface HealthRecord {
  id: number;
  user_plant_id: number;
  health_status: 'good' | 'fair' | 'sick' | 'critical';
  pest_info?: string;
  treatment?: string;
  created_at: string;
}

// 更新用户植物
export interface UpdateUserPlant {
  plant_name?: string;
  plant_type?: string;
  nickname?: string;
  image_url?: string;
  location?: string;
  notes?: string;
}

// 获取单个用户植物
export const getUserPlant = async (plantId: number): Promise<UserPlant> => {
  const response = await api.get(`/api/plants/my/${plantId}`);
  return response.data;
};

// 更新用户植物
export const updateUserPlant = async (plantId: number, data: UpdateUserPlant): Promise<UserPlant> => {
  const response = await api.put(`/api/plants/my/${plantId}`, data);
  return response.data;
};

// 获取养护记录
export const getCareRecords = async (plantId: number): Promise<CareRecord[]> => {
  const response = await api.get(`/api/plants/my/${plantId}/care-records`);
  return response.data;
};

// 添加养护记录
export const addCareRecord = async (plantId: number, data: {
  care_type: string;
  notes?: string;
}): Promise<CareRecord> => {
  const response = await api.post(`/api/plants/my/${plantId}/care-records`, data);
  return response.data;
};

// 获取生长记录
export const getGrowthRecords = async (plantId: number): Promise<GrowthRecord[]> => {
  const response = await api.get(`/api/plants/my/${plantId}/growth-records`);
  return response.data;
};

// 添加生长记录
export const addGrowthRecord = async (plantId: number, data: {
  height?: number;
  leaf_count?: number;
  flower_count?: number;
  description?: string;
  image_url?: string;
}): Promise<GrowthRecord> => {
  const response = await api.post(`/api/plants/my/${plantId}/growth-records`, data);
  return response.data;
};

// 获取健康记录
export const getHealthRecords = async (plantId: number): Promise<HealthRecord[]> => {
  const response = await api.get(`/api/plants/my/${plantId}/health-records`);
  return response.data;
};

// 添加健康记录
export const addHealthRecord = async (plantId: number, data: {
  health_status: string;
  pest_info?: string;
  treatment?: string;
}): Promise<HealthRecord> => {
  const response = await api.post(`/api/plants/my/${plantId}/health-records`, data);
  return response.data;
};

// 植物照片
export interface PlantPhoto {
  id: number;
  user_plant_id: number;
  photo_url: string;
  photo_type: 'cover' | 'growth' | 'care';
  description?: string;
  created_at: string;
}

// 花园统计
export interface GardenStats {
  total_plants: number;
  this_month_cares: number;
  health_distribution: {
    good: number;
    fair: number;
    sick: number;
  };
  location_distribution: Record<string, number>;
}

// 日历数据
export interface CalendarData {
  year: number;
  month: number;
  days: Record<number, Array<{
    id: number;
    care_type: string;
    notes?: string;
  }>>;
}

// 提醒设置
export interface PlantReminder {
  id: number;
  user_plant_id: number;
  type: string;
  interval_days: number;
  enabled: boolean;
  last_done?: string;
  next_due?: string;
}

// 获取花园统计
export const getGardenStats = async (): Promise<GardenStats> => {
  const response = await api.get('/api/plants/my/stats');
  return response.data;
};

// 获取养护日历
export const getCareCalendar = async (year?: number, month?: number): Promise<CalendarData> => {
  const response = await api.get('/api/plants/my/calendar', { params: { year, month } });
  return response.data;
};

// 上传植物照片
export const uploadPlantPhoto = async (plantId: number, file: any, photoType: string = 'growth'): Promise<PlantPhoto> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/api/plants/my/${plantId}/photo?photo_type=${photoType}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// 获取植物照片
export const getPlantPhotos = async (plantId: number): Promise<PlantPhoto[]> => {
  const response = await api.get(`/api/plants/my/${plantId}/photos`);
  return response.data;
};

// 获取植物提醒
export const getPlantReminders = async (plantId: number): Promise<PlantReminder[]> => {
  const response = await api.get(`/api/plants/my/${plantId}/reminders`);
  return response.data;
};

// 更新植物提醒
export const updatePlantReminder = async (plantId: number, data: Partial<PlantReminder>): Promise<PlantReminder> => {
  const response = await api.put(`/api/plants/my/${plantId}/reminders`, data);
  return response.data;
};

// 智能提醒类型
export interface ReminderSuggestion {
  interval_days: number;
  reason: string;
}

export interface ReminderCalculationResult {
  plant_name: string;
  suggestions: Record<string, ReminderSuggestion>;
  recent_records: Array<{
    type: string;
    date: string;
  }>;
}

export interface AutoSetupResult {
  message: string;
  reminders: Array<{
    type: string;
    interval_days: number;
  }>;
}

export interface UpcomingReminder {
  id: number;
  user_plant_id: number;
  plant_name: string;
  type: string;
  next_due?: string;
  interval_days: number;
  enabled: boolean;
}

// 根据养护记录计算下次提醒时间
export const calculateReminder = async (plantId: number): Promise<ReminderCalculationResult> => {
  const response = await api.post(`/api/plants/my/${plantId}/reminders/calculate`);
  return response.data;
};

// 自动设置提醒
export const autoSetupReminders = async (plantId: number): Promise<AutoSetupResult> => {
  const response = await api.post(`/api/plants/my/${plantId}/reminders/auto-setup`);
  return response.data;
};

// 获取即将到期的提醒
export const getUpcomingReminders = async (days: number = 7): Promise<{ reminders: UpcomingReminder[] }> => {
  const response = await api.get('/api/plants/my/reminders/upcoming', { params: { days } });
  return response.data;
};
