import request from './request'

// 推荐请求
export interface RecommendRequest {
  light: 'full' | 'partial' | 'low'
  watering: 'frequent' | 'weekly' | 'biweekly' | 'monthly'
  purpose: 'air-purify' | 'decoration' | 'hobby'
  has_pets_kids: boolean
  experience: 'beginner' | 'intermediate' | 'expert'
}

// 推荐结果
export interface PlantRecommendation {
  plant_id: number
  name: string
  match_score: number
  reason: string
  survival_rate: number
  features: string[]
  light_requirement: string
  water_requirement: string
  care_level: number
  is_toxic: boolean
}

// 获取推荐
export const getRecommendations = async (data: RecommendRequest): Promise<PlantRecommendation[]> => {
  return request<PlantRecommendation[]>({ url: '/api/recommend', method: 'POST', data })
}

// 默认导出（兼容页面中的 recommendationService 调用）
const recommendationService = {
  getRecommendations,
}
export { recommendationService }
export default recommendationService
