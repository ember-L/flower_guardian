import request, { uploadFile, getFullImageUrl } from './request'

// 植物类型
export interface Plant {
  id: number
  name: string
  scientific_name?: string
  category?: string
  image_url?: string
  care_level: number
  beginner_friendly?: number
  light_requirement?: string
  water_requirement?: string
  watering_tip?: string
  temperature_range?: string
  humidity_range?: string
  is_toxic?: boolean
  description?: string
  care_tips?: string
  tips?: string
  features?: string[]
  survival_rate?: number
  common_mistakes?: string
}

export interface PlantListResponse {
  total: number
  items: Plant[]
}

export interface UserPlant {
  id: number
  user_id: number
  plant_id?: number
  plant_name?: string
  plant_type?: string
  nickname?: string
  image_url?: string
  location?: string
  acquired_from?: string
  notes?: string
  created_at: string
}

export interface PlantCategory {
  value: string
  name: string
  icon: string
  count: number
}

export interface CareRecord {
  id: number
  user_plant_id: number
  care_type: string
  notes?: string
  created_at: string
}

export interface GrowthRecord {
  id: number
  user_plant_id: number
  record_date: string
  height?: number
  leaf_count?: number
  flower_count?: number
  description?: string
  image_url?: string
  created_at: string
}

export interface HealthRecord {
  id: number
  user_plant_id: number
  health_status: string
  pest_info?: string
  treatment?: string
  created_at: string
}

export interface GardenStats {
  total_plants: number
  this_month_cares: number
  health_distribution: { good: number; fair: number; sick: number }
  location_distribution: Record<string, number>
}

// 获取植物列表
export const getPlants = async (params?: any): Promise<PlantListResponse> => {
  return request<PlantListResponse>({ url: '/api/plants', method: 'GET', data: params })
}

// 获取植物详情
export const getPlantDetail = async (plantId: number): Promise<Plant> => {
  return request<Plant>({ url: `/api/plants/${plantId}` })
}

// 添加到我的花园
export const addToMyGarden = async (data: any): Promise<UserPlant> => {
  return request<UserPlant>({ url: '/api/plants/my', method: 'POST', data })
}

// 获取我的花园植物列表
export const getMyPlants = async (): Promise<UserPlant[]> => {
  return request<UserPlant[]>({ url: '/api/plants/my' })
}

// 删除花园植物
export const deleteMyPlant = async (plantId: number): Promise<void> => {
  return request({ url: `/api/plants/my/${plantId}`, method: 'DELETE' })
}

// 获取植物分类列表
export const getPlantCategories = async (): Promise<{ categories: PlantCategory[] }> => {
  return request({ url: '/api/plants/categories' })
}

// 获取热门植物
export const getPopularPlants = async (limit = 10): Promise<PlantListResponse> => {
  return request({ url: '/api/plants/popular', data: { limit } })
}

// 获取相关植物
export const getRelatedPlants = async (plantId: number, limit = 5): Promise<PlantListResponse> => {
  return request({ url: `/api/plants/${plantId}/related`, data: { limit } })
}

// 获取单个用户植物
export const getUserPlant = async (plantId: number): Promise<UserPlant> => {
  return request({ url: `/api/plants/my/${plantId}` })
}

// 更新用户植物
export const updateUserPlant = async (plantId: number, data: any): Promise<UserPlant> => {
  return request({ url: `/api/plants/my/${plantId}`, method: 'PUT', data })
}

// 获取养护记录
export const getCareRecords = async (plantId: number): Promise<CareRecord[]> => {
  return request({ url: `/api/plants/my/${plantId}/care-records` })
}

// 添加养护记录
export const addCareRecord = async (plantId: number, data: any): Promise<CareRecord> => {
  return request({ url: `/api/plants/my/${plantId}/care-records`, method: 'POST', data })
}

// 获取生长记录
export const getGrowthRecords = async (plantId: number): Promise<GrowthRecord[]> => {
  return request({ url: `/api/plants/my/${plantId}/growth-records` })
}

// 添加生长记录
export const addGrowthRecord = async (plantId: number, data: any): Promise<GrowthRecord> => {
  return request({ url: `/api/plants/my/${plantId}/growth-records`, method: 'POST', data })
}

// 获取健康记录
export const getHealthRecords = async (plantId: number): Promise<HealthRecord[]> => {
  return request({ url: `/api/plants/my/${plantId}/health-records` })
}

// 添加健康记录
export const addHealthRecord = async (plantId: number, data: any): Promise<HealthRecord> => {
  return request({ url: `/api/plants/my/${plantId}/health-records`, method: 'POST', data })
}

// 获取花园统计
export const getGardenStats = async (): Promise<GardenStats> => {
  return request({ url: '/api/plants/my/stats' })
}

// 上传植物照片
export const uploadPlantPhoto = async (plantId: number, filePath: string, photoType = 'growth') => {
  return uploadFile(`/api/plants/my/${plantId}/photo?photo_type=${photoType}`, filePath)
}

// 获取植物照片
export const getPlantPhotos = async (plantId: number) => {
  return request({ url: `/api/plants/my/${plantId}/photos` })
}

// 根据养护记录计算下次提醒时间
export const calculateReminder = async (plantId: number) => {
  return request({ url: `/api/plants/my/${plantId}/reminders/calculate`, method: 'POST' })
}

// 自动设置提醒
export const autoSetupReminders = async (plantId: number) => {
  return request({ url: `/api/plants/my/${plantId}/reminders/auto-setup`, method: 'POST' })
}

// 获取即将到期的提醒
export const getUpcomingReminders = async (days = 7) => {
  return request({ url: '/api/plants/my/reminders/upcoming', data: { days } })
}
