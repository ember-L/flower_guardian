import axios, { AxiosError } from 'axios';
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

// 添加响应拦截器处理401错误
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.log('[ReminderService] Unauthorized, redirecting to login');
      // 可以在这里触发全局登出或事件
    }
    return Promise.reject(error);
  }
);

export interface SmartReminder {
  id: number;
  user_id: number;
  user_plant_id: number;
  plant_id?: number;
  type: string;
  interval_days: number;
  base_interval?: number;
  weather_factor?: number;
  season_factor?: number;
  calculated_interval?: number;
  location?: string;
  notify_time?: string;
  enabled: boolean;
  last_done?: string;
  next_due?: string;
  created_at: string;
  plant_name?: string;
  weather_tip?: string;
}

export interface WeatherInfo {
  temperature: number;
  humidity: number;
  precipitation: number;
  location: string;
  source?: string;
}

export const reminderService = {
  getSmartReminders: async (): Promise<SmartReminder[]> => {
    const response = await api.get('/api/reminders/smart');
    return response.data;
  },

  getReminders: async (): Promise<any[]> => {
    const response = await api.get('/api/reminders');
    return response.data;
  },

  createSmartReminder: async (data: {
    user_plant_id: number;
    plant_id?: number;
    type: string;
    interval_days?: number;
    location?: string;
    notify_time?: string;
  }): Promise<SmartReminder> => {
    const response = await api.post('/api/reminders/smart', data);
    return response.data;
  },

  createReminder: async (data: {
    user_plant_id: number;
    type: string;
    interval_days: number;
    enabled?: boolean;
  }): Promise<any> => {
    const response = await api.post('/api/reminders', data);
    return response.data;
  },

  completeReminder: async (id: number): Promise<SmartReminder> => {
    const response = await api.put(`/api/reminders/${id}/complete`);
    return response.data;
  },

  getWeatherAdvice: async (location: string): Promise<{
    weather: WeatherInfo;
    advice: string;
  }> => {
    const response = await api.get('/api/reminders/weather', {
      params: { location }
    });
    return response.data;
  },

  toggleReminder: async (id: number, enabled: boolean): Promise<SmartReminder> => {
    const response = await api.put(`/api/reminders/${id}`, { enabled });
    return response.data;
  },

  updateReminder: async (id: number, data: {
    type?: string;
    interval_days?: number;
    enabled?: boolean;
    last_done?: string;
  }): Promise<SmartReminder> => {
    const response = await api.put(`/api/reminders/${id}`, data);
    return response.data;
  },

  deleteReminder: async (id: number): Promise<void> => {
    await api.delete(`/api/reminders/${id}`);
  }
};
