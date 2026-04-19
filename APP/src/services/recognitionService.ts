// 花卉识别服务
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { getToken } from './auth';

// 识别结果类型
export interface RecognitionResult {
  id: string;
  name: string;
  scientificName: string;
  confidence: number;
  description: string;
  careLevel: number; // 1-5 难度等级
  lightRequirement: '喜阳' | '耐阴' | '散光';
  waterRequirement: '喜湿' | '耐旱' | '见干见湿';
  imageUrl: string;
  similarSpecies?: SimilarSpecies[];
  // 完整的检测结果（包含 bboxes）
  plant?: {
    id: string;
    name: string;
    confidence: number;
    detections?: Array<{
      id: string;
      name: string;
      confidence: number;
      bbox: number[];
      care_tips?: string;
    }>;
  };
  pest?: {
    id: string;
    name: string;
    confidence: number;
    type: string;
    detections?: Array<{
      id: string;
      name: string;
      confidence: number;
      type: string;
      bbox: number[];
      treatment?: string;
    }>;
  };
}

export interface SimilarSpecies {
  id: string;
  name: string;
  imageUrl: string;
  difference: string;
  careLevel: number;
  tips: string;
}

// 获取认证头
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// 拍照识别
export const takePhoto = async (): Promise<{ assets?: { uri: string }[]; canceled?: boolean }> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permission not granted');
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: false,
  });
  return result;
};

// 相册选择
export const selectFromGallery = async (): Promise<{ assets?: { uri: string }[]; canceled?: boolean }> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Gallery permission not granted');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: false,
  });
  return result;
};

// 调用后端API进行植物识别 - 使用 /api/diagnosis/full 获取完整结果（包含 bboxes）
export const recognizePlant = async (imageUri: string): Promise<RecognitionResult> => {
  try {
    // 将URI转换为FormData
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'plant.jpg',
    } as any);

    const authHeaders = await getAuthHeaders();

    const response = await axios.post(
      `${API_BASE_URL}/api/diagnosis/full`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...authHeaders,
        },
        timeout: 30000, // 30秒超时
      }
    );

    // /api/diagnosis/full 返回格式: { image_url, plant, pest, diagnosis, recommendations }
    const data = response.data;
    console.log('[RecognitionService] recognizePlant response:', data);

    // 提取植物识别结果
    const plantData = data.plant || {};

    // 尝试从 plant.detections[0] 或 plant 获取名称等信息
    const firstDetection = plantData.detections && plantData.detections.length > 0
      ? plantData.detections[0]
      : null;

    return {
      id: plantData.id || '1',
      name: plantData.name || firstDetection?.name || '未知植物',
      scientificName: '', // /api/diagnosis/full 不返回这个字段
      confidence: plantData.confidence || firstDetection?.confidence || 0,
      description: plantData.care_tips || firstDetection?.care_tips || '',
      careLevel: 1, // 默认值
      lightRequirement: '散光', // 默认值
      waterRequirement: '见干见湿', // 默认值
      imageUrl: data.image_url || imageUri,
      similarSpecies: [],
      plant: data.plant,
      pest: data.pest,
    };
  } catch (error) {
    console.error('识别失败:', error);
    // 网络错误时抛出异常，让UI处理
    throw error;
  }
};
