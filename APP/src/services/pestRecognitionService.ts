// 病害识别服务 - 在线/离线混合模式
import { isNetworkConnected } from '../utils/networkMonitor';
import { getToken } from './auth';
import { API_BASE_URL } from './config';

// 获取认证头
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export interface PestResult {
  id: string;
  name: string;
  confidence: number;
  type: 'insect' | 'disease' | 'physiological' | 'unknown';
  treatment: string;
  prevention: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DiagnosisResult extends PestResult {
  recommendations: {
    immediate: string;
    prevention: string;
    severity_level: string;
  };
  imageUrl?: string;
}

// 将图片转换为Base64
const uriToBase64 = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// 在线识别 - 调用后端API
const recognizeOnline = async (imageUri: string): Promise<DiagnosisResult> => {
  // ImagePicker 已压缩 (quality: 0.8)，直接上传
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/diagnosis/full`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...authHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(`诊断失败: ${response.status}`);
  }

  const data = await response.json();

  // 兼容不同返回格式
  if (data.diagnosis) {
    return {
      id: data.diagnosis.id || '0',
      name: data.diagnosis.name || '未知',
      confidence: data.diagnosis.confidence || 0,
      type: data.diagnosis.type || 'unknown',
      treatment: data.diagnosis.treatment || '',
      prevention: data.diagnosis.prevention || '',
      severity: data.diagnosis.severity || 'low',
      recommendations: data.recommendations,
      imageUrl: imageUri,
    };
  }

  return {
    id: data.id || '0',
    name: data.name || '未知',
    confidence: data.confidence || 0,
    type: data.type || 'unknown',
    treatment: data.treatment || '',
    prevention: data.prevention || '',
    severity: data.severity || 'low',
    recommendations: {
      immediate: data.treatment || '',
      prevention: data.prevention || '',
      severity_level: data.severity || 'low',
    },
    imageUrl: imageUri,
  };
};

// 离线识别 - 使用本地模拟数据
const recognizeOffline = async (imageUri: string): Promise<DiagnosisResult> => {
  // 模拟本地ONNX模型识别结果
  // 实际项目中需要实现真正的ONNX推理
  return {
    id: '0',
    name: '叶斑病',
    confidence: 0.85,
    type: 'disease',
    treatment: '1. 及时清除病叶并销毁\n2. 喷洒多菌灵或百菌清\n3. 保持植株通风良好\n4. 避免叶面喷水',
    prevention: '1. 保持通风，避免过度潮湿\n2. 定期喷洒预防性杀菌剂\n3. 及时清除病叶\n4. 合理施肥增强抗病力',
    severity: 'medium',
    recommendations: {
      immediate: '喷洒多菌灵500倍液，每7天一次，连续3次',
      prevention: '加强通风透光，控制浇水湿度',
      severity_level: 'medium',
    },
    imageUrl: imageUri,
  };
};

// 上传图片到服务器
export const uploadImageToServer = async (imageUri: string): Promise<string> => {
  try {
    // ImagePicker 已压缩 (quality: 0.8)，直接上传
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    const authHeaders = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/diagnosis/upload-image`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`上传失败: ${response.status}`);
    }

    const data = await response.json();
    console.log('[PestRecognition] Image uploaded:', data.image_url);
    return data.image_url;
  } catch (error) {
    console.error('[PestRecognition] Upload failed:', error);
    // 如果上传失败，返回原 URI 作为备选
    return imageUri;
  }
};

export const pestRecognitionService = {
  // 上传图片到服务器
  uploadImage: uploadImageToServer,

  // 执行识别 - 自动选择在线/离线模式
  async recognize(imageUri: string): Promise<DiagnosisResult> {
    const connected = await isNetworkConnected();

    if (connected) {
      console.log('[PestRecognition] Using ONLINE mode');
      try {
        return await recognizeOnline(imageUri);
      } catch (error) {
        console.error('[PestRecognition] Online failed, falling back to offline:', error);
        return await recognizeOffline(imageUri);
      }
    } else {
      console.log('[PestRecognition] Using OFFLINE mode');
      return await recognizeOffline(imageUri);
    }
  },

  // 仅在线识别
  async recognizeOnlineOnly(imageUri: string): Promise<DiagnosisResult> {
    return await recognizeOnline(imageUri);
  },

  // 仅离线识别
  async recognizeOfflineOnly(imageUri: string): Promise<DiagnosisResult> {
    return await recognizeOffline(imageUri);
  },

  // 检查离线模式是否可用
  async isOfflineAvailable(): Promise<boolean> {
    return true; // 离线模式总是可用（使用模拟数据）
  },

  // 获取当前网络状态
  async checkOnline(): Promise<boolean> {
    return await isNetworkConnected();
  },
};

export default pestRecognitionService;
