import Taro from '@tarojs/taro'
import { API_BASE_URL } from './config'
import { uploadFile, getFullImageUrl } from './request'

// 识别结果类型
export interface RecognitionResult {
  id: string
  name: string
  scientificName: string
  confidence: number
  description: string
  careLevel: number
  lightRequirement: string
  waterRequirement: string
  imageUrl: string
  similarSpecies?: SimilarSpecies[]
}

export interface SimilarSpecies {
  id: string
  name: string
  imageUrl: string
  difference: string
  careLevel: number
  tips: string
}

// 拍照识别
export const takePhoto = async (): Promise<string | null> => {
  try {
    const res = await Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      sizeType: ['compressed'],
    })
    if (res.tempFiles && res.tempFiles.length > 0) {
      return res.tempFiles[0].tempFilePath
    }
    return null
  } catch {
    return null
  }
}

// 相册选择
export const selectFromGallery = async (): Promise<string | null> => {
  try {
    const res = await Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      sizeType: ['compressed'],
    })
    if (res.tempFiles && res.tempFiles.length > 0) {
      return res.tempFiles[0].tempFilePath
    }
    return null
  } catch {
    return null
  }
}

// 调用后端API进行植物识别
export const recognizePlant = async (filePath: string): Promise<RecognitionResult> => {
  const data = await uploadFile('/api/recognition/public/plant', filePath)

  return {
    id: data.id || '1',
    name: data.name || '未知植物',
    scientificName: data.scientific_name || '',
    confidence: data.confidence || 0,
    description: data.description || '',
    careLevel: data.care_level || 1,
    lightRequirement: data.light_requirement || '散光',
    waterRequirement: data.water_requirement || '见干见湿',
    imageUrl: data.image_url ? getFullImageUrl(data.image_url) : '',
    similarSpecies: data.similar_species || [],
  }
}

// 病虫害诊断 - 与RN端保持一致，调用 /api/diagnosis/full
export const diagnosePest = async (filePath: string): Promise<any> => {
  const data = await uploadFile('/api/diagnosis/full', filePath)
  return data
}

// 默认导出
const recognitionService = {
  takePhoto,
  selectFromGallery,
  recognizePlant,
  diagnosePest,
}
export { recognitionService }
export default recognitionService
