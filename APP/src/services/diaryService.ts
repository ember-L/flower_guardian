// 日记服务 - API 通信层
import axios from 'axios';
import { getToken } from './auth';
import { API_BASE_URL } from './config';

const API_BASE = API_BASE_URL + '/api';

export interface Diary {
  id: number;
  user_id: number;
  user_plant_id: number;
  content: string;
  images: string[];
  height?: number;
  leaf_count?: number;
  created_at: string;
  plant_name?: string;
}

export interface DiaryCreate {
  user_plant_id: number;
  content: string;
  images?: string[];
  height?: number;
  leaf_count?: number;
}

export interface Plant {
  id: number;
  name: string;
  image?: string;
}

const getHeaders = async () => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// 获取日记列表
export const getDiaries = async (plantId?: number): Promise<Diary[]> => {
  const headers = await getHeaders();
  const params = plantId ? `?plant_id=${plantId}` : '';
  try {
    const response = await axios.get(`${API_BASE}/diaries${params}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Failed to get diaries:', error);
    return [];
  }
};

// 创建日记
export const createDiary = async (diary: DiaryCreate): Promise<Diary> => {
  const headers = await getHeaders();
  const response = await axios.post(`${API_BASE}/diaries`, diary, { headers });
  return response.data;
};

// 获取日记详情
export const getDiary = async (id: number): Promise<Diary> => {
  const headers = await getHeaders();
  const response = await axios.get(`${API_BASE}/diaries/${id}`, { headers });
  return response.data;
};

// 更新日记
export const updateDiary = async (id: number, diary: Partial<DiaryCreate>): Promise<Diary> => {
  const headers = await getHeaders();
  const response = await axios.put(`${API_BASE}/diaries/${id}`, diary, { headers });
  return response.data;
};

// 删除日记
export const deleteDiary = async (id: number): Promise<void> => {
  const headers = await getHeaders();
  await axios.delete(`${API_BASE}/diaries/${id}`, { headers });
};

// 获取用户植物列表
export const getMyPlants = async (): Promise<Plant[]> => {
  const headers = await getHeaders();
  try {
    const response = await axios.get(`${API_BASE}/plants/my`, { headers });
    return response.data;
  } catch (error) {
    console.error('Failed to get plants:', error);
    return [];
  }
};
