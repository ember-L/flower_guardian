import request from './request'

// 诊断记录类型
export interface DiagnosisRecord {
  id: number
  image_url: string
  disease_name: string
  confidence: number
  description: string
  treatment: string
  prevention: string
  recommended_products: string
  is_favorite: boolean
  conversation_id?: number
  created_at: string
}

export interface DiagnosisListResponse {
  total: number
  items: DiagnosisRecord[]
}

// 获取诊断历史列表
export const getDiagnoses = async (favorite?: boolean): Promise<DiagnosisListResponse> => {
  const params = favorite !== undefined ? { favorite } : {}
  return request<DiagnosisListResponse>({ url: '/api/diagnoses', data: params })
}

// 获取诊断详情
export const getDiagnosis = async (id: number): Promise<DiagnosisRecord> => {
  return request<DiagnosisRecord>({ url: `/api/diagnoses/${id}` })
}

// 收藏/取消收藏
export const toggleFavorite = async (id: number): Promise<{ is_favorite: boolean }> => {
  return request({ url: `/api/diagnoses/${id}/favorite`, method: 'POST' })
}

// 再次诊断
export const rediagnose = async (id: number): Promise<DiagnosisRecord> => {
  return request<DiagnosisRecord>({ url: `/api/diagnoses/${id}/rediagnose`, method: 'POST' })
}

// 创建诊断记录
export const createDiagnosis = async (data: {
  image_url: string
  disease_name: string
  confidence: number
  description?: string
  treatment?: string
  prevention?: string
  recommended_products?: string
}): Promise<DiagnosisRecord> => {
  return request<DiagnosisRecord>({ url: '/api/diagnoses', method: 'POST', data })
}

// 删除诊断记录
export const deleteDiagnosis = async (id: number): Promise<void> => {
  return request({ url: `/api/diagnoses/${id}`, method: 'DELETE' })
}

// 别名方法（兼容页面调用方式）
export const getHistory = getDiagnoses
export const getDetail = getDiagnosis

// 默认导出
const diagnosisService = {
  getDiagnoses,
  getDiagnosis,
  getHistory,
  getDetail,
  toggleFavorite,
  rediagnose,
  createDiagnosis,
  deleteDiagnosis,
}
export { diagnosisService }
export default diagnosisService
