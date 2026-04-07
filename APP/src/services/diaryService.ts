// 日记服务 - API 通信层
import axios from 'axios';
import { getToken } from './auth';
import { API_BASE_URL } from './config';
import * as ImageManipulator from 'expo-image-manipulator';

const API_BASE = API_BASE_URL + '/api';
const DIAGNOSIS_API_BASE = API_BASE_URL + '/api/diagnosis';

// 拼接完整图片 URL（相对路径 -> 完整 URL）
const getFullImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return API_BASE_URL + url;
};

// 处理日记数据中的图片 URL
const processDiaryImages = (diary: any): any => {
  if (diary.images && Array.isArray(diary.images)) {
    diary.images = diary.images.map((img: string) => getFullImageUrl(img));
  }
  return diary;
};

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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// 获取日记列表
export const getDiaries = async (plantId?: number): Promise<Diary[]> => {
  const headers = await getHeaders();
  try {
    const response = await axios.get(`${API_BASE}/diaries${plantId ? `?plant_id=${plantId}` : ''}`, { headers });
    // 处理图片 URL，转换为完整路径
    return (response.data as Diary[]).map((diary: Diary) => processDiaryImages(diary));
  } catch (error: any) {
    // 401/422 未授权时返回空数组而不是抛出错误
    if (error?.response?.status === 401 || error?.response?.status === 422) {
      console.log('[DiaryService] 未登录或token无效，返回空日记列表');
      return [];
    }
    console.error('Failed to get diaries:', error);
    throw error;
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
  // 处理图片 URL，转换为完整路径
  return processDiaryImages(response.data);
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

// 上传单张日记图片到服务器
const uploadDiaryImage = async (localUri: string): Promise<string> => {
  const token = await getToken();

  // 压缩图片（宽度 800px，质量 70%）
  let manipulatedUri = localUri;
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    manipulatedUri = manipResult.uri;
    console.log('[DiaryService] 图片压缩完成:', localUri, '->', manipulatedUri);
  } catch (error) {
    console.warn('[DiaryService] 图片压缩失败，使用原图:', error);
  }

  const formData = new FormData();
  formData.append('file', {
    uri: manipulatedUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  const response = await axios.post(`${DIAGNOSIS_API_BASE}/upload-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });

  if (response.data.success && response.data.image_url) {
    return response.data.image_url;
  }

  throw new Error('图片上传失败');
};

// 批量上传日记图片
export const uploadDiaryImages = async (localUris: string[]): Promise<string[]> => {
  if (localUris.length === 0) return [];

  console.log('[DiaryService] 开始上传', localUris.length, '张图片');

  // 并行上传所有图片
  const uploadPromises = localUris.map(async (uri, index) => {
    try {
      const serverUrl = await uploadDiaryImage(uri);
      console.log(`[DiaryService] 图片${index + 1}/${localUris.length} 上传成功:`, serverUrl);
      return serverUrl;
    } catch (error) {
      console.error(`[DiaryService] 图片${index + 1} 上传失败:`, error);
      // 单张失败不影响其他图片，返回空字符串
      return '';
    }
  });

  const results = await Promise.all(uploadPromises);
  // 过滤掉上传失败的图片
  const successUrls = results.filter(url => url && url.length > 0);
  console.log('[DiaryService] 图片上传完成，成功', successUrls.length, '/', localUris.length);

  return successUrls;
};
