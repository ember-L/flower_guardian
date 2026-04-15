import request from './request'

export interface SmartReminder {
  id: number
  user_id: number
  user_plant_id: number
  plant_id?: number
  type: string
  interval_days: number
  base_interval?: number
  weather_factor?: number
  season_factor?: number
  calculated_interval?: number
  location?: string
  notify_time?: string
  enabled: boolean
  last_done?: string
  next_due?: string
  created_at: string
  plant_name?: string
  weather_tip?: string
}

export interface WeatherInfo {
  temperature: number
  humidity: number
  precipitation: number
  location: string
  source?: string
}

// 获取智能提醒列表
export const getSmartReminders = async (): Promise<SmartReminder[]> => {
  return request<SmartReminder[]>({ url: '/api/reminders/smart' })
}

// 获取提醒列表
export const getReminders = async (): Promise<any[]> => {
  return request<any[]>({ url: '/api/reminders' })
}

// 创建智能提醒
export const createSmartReminder = async (data: {
  user_plant_id: number
  plant_id?: number
  type: string
  interval_days?: number
  location?: string
  notify_time?: string
}): Promise<SmartReminder> => {
  return request<SmartReminder>({ url: '/api/reminders/smart', method: 'POST', data })
}

// 创建提醒
export const createReminder = async (data: {
  user_plant_id: number
  type: string
  interval_days: number
  enabled?: boolean
}): Promise<any> => {
  return request({ url: '/api/reminders', method: 'POST', data })
}

// 完成提醒
export const completeReminder = async (id: number): Promise<SmartReminder> => {
  return request<SmartReminder>({ url: `/api/reminders/${id}/complete`, method: 'PUT' })
}

// 获取天气建议
export const getWeatherAdvice = async (location: string): Promise<{
  weather: WeatherInfo
  advice: string
}> => {
  return request({ url: '/api/reminders/weather', data: { location } })
}

// 切换提醒开关
export const toggleReminder = async (id: number, enabled: boolean): Promise<SmartReminder> => {
  return request<SmartReminder>({ url: `/api/reminders/${id}`, method: 'PUT', data: { enabled } })
}

// 更新提醒
export const updateReminder = async (id: number, data: any): Promise<SmartReminder> => {
  return request<SmartReminder>({ url: `/api/reminders/${id}`, method: 'PUT', data })
}

// 删除提醒
export const deleteReminder = async (id: number): Promise<void> => {
  return request({ url: `/api/reminders/${id}`, method: 'DELETE' })
}
