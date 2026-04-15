import request, { uploadFile, getFullImageUrl } from './request'

export interface Diary {
  id: number
  user_id: number
  user_plant_id: number
  content: string
  images: string[]
  height?: number
  leaf_count?: number
  created_at: string
  plant_name?: string
}

export interface DiaryCreate {
  user_plant_id: number
  content: string
  images?: string[]
  height?: number
  leaf_count?: number
}

export interface Plant {
  id: number
  name: string
  image?: string
}

// 处理日记数据中的图片 URL
const processDiaryImages = (diary: any): any => {
  if (diary.images && Array.isArray(diary.images)) {
    diary.images = diary.images.map((img: string) => getFullImageUrl(img))
  }
  return diary
}

// 获取日记列表
export const getDiaries = async (plantId?: number): Promise<Diary[]> => {
  try {
    const url = plantId ? `/api/diaries?plant_id=${plantId}` : '/api/diaries'
    const data = await request<Diary[]>({ url })
    return data.map(processDiaryImages)
  } catch (error: any) {
    if (error.message?.includes('登录') || error.message?.includes('401')) {
      return []
    }
    throw error
  }
}

// 创建日记
export const createDiary = async (diary: DiaryCreate): Promise<Diary> => {
  return request<Diary>({ url: '/api/diaries', method: 'POST', data: diary })
}

// 获取日记详情
export const getDiary = async (id: number): Promise<Diary> => {
  const data = await request<Diary>({ url: `/api/diaries/${id}` })
  return processDiaryImages(data)
}

// 更新日记
export const updateDiary = async (id: number, diary: Partial<DiaryCreate>): Promise<Diary> => {
  return request<Diary>({ url: `/api/diaries/${id}`, method: 'PUT', data: diary })
}

// 删除日记
export const deleteDiary = async (id: number): Promise<void> => {
  return request({ url: `/api/diaries/${id}`, method: 'DELETE' })
}

// 获取用户植物列表
export const getMyPlants = async (): Promise<Plant[]> => {
  try {
    return await request<Plant[]>({ url: '/api/plants/my' })
  } catch {
    return []
  }
}

// 上传单张日记图片到服务器
export const uploadDiaryImage = async (filePath: string): Promise<string> => {
  const data = await uploadFile('/api/diagnosis/upload-image', filePath)
  if (data.success && data.image_url) {
    return data.image_url
  }
  throw new Error('图片上传失败')
}

// 批量上传日记图片
export const uploadDiaryImages = async (filePaths: string[]): Promise<string[]> => {
  if (filePaths.length === 0) return []
  const results = await Promise.all(
    filePaths.map(async (path) => {
      try {
        return await uploadDiaryImage(path)
      } catch {
        return ''
      }
    })
  )
  return results.filter((url) => url && url.length > 0)
}
