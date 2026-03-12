// 花卉识别服务
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import axios from 'axios';
import { API_BASE_URL } from './config';

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
}

export interface SimilarSpecies {
  id: string;
  name: string;
  imageUrl: string;
  difference: string;
  careLevel: number;
  tips: string;
}

// 拍照识别
export const takePhoto = async (): Promise<ImagePickerResponse> => {
  const result = await launchCamera({
    mediaType: 'photo',
    quality: 0.8,
    saveToPhotos: false,
  });
  return result;
};

// 相册选择
export const selectFromGallery = async (): Promise<ImagePickerResponse> => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
  });
  return result;
};

// 调用后端API进行植物识别
export const recognizePlant = async (imageUri: string): Promise<RecognitionResult> => {
  try {
    // 将URI转换为FormData
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'plant.jpg',
    } as any);

    const response = await axios.post(
      `${API_BASE_URL}/api/recognition/public/plant`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30秒超时
      }
    );

    // 转换后端响应格式
    const data = response.data;
    return {
      id: data.id || '1',
      name: data.name || '未知植物',
      scientificName: data.scientific_name || '',
      confidence: data.confidence || 0,
      description: data.description || '',
      careLevel: data.care_level || 1,
      lightRequirement: data.light_requirement || '散光',
      waterRequirement: data.water_requirement || '见干见湿',
      imageUrl: data.image_url || '',
      similarSpecies: data.similar_species || [],
    };
  } catch (error) {
    console.error('识别失败:', error);
    // 网络错误时抛出异常，让UI处理
    throw error;
  }
};
