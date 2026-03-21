// 植物识别服务（边缘端+服务器端）
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from './config';

// API基础URL

// 植物识别结果类型
export interface PlantResult {
  id: string;
  name: string;
  confidence: number;
  care_tips: string;
}

// 病虫害识别结果类型
export interface PestResult {
  id: string;
  name: string;
  confidence: number;
  type: 'insect' | 'disease' | 'physiological' | 'unknown';
  treatment: string;
  severity: 'low' | 'medium' | 'high';
}

// 完整识别结果
export interface FullRecognitionResult {
  plant: PlantResult | null;
  pest: PestResult | null;
}

// 检查网络状态
export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

// 将图片转换为Base64
const uriToBase64 = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // 去掉 data:image/jpeg;base64, 前缀
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// 服务器端识别
const recognizeFromServer = async (imageUri: string): Promise<FullRecognitionResult> => {
  const base64 = await uriToBase64(imageUri);

  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  const response = await fetch(`${API_BASE_URL}/api/recognition/full`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    throw new Error(`识别失败: ${response.status}`);
  }

  return await response.json();
};

// 植物识别服务类
class PlantRecognitionService {
  private model: any = null;
  private isLoaded: boolean = false;

  // 加载本地模型（边缘部署时使用）
  async loadModel(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // TODO: 使用 onnxruntime-react-native 加载模型
      // const session = await InferenceSession.create(modelPath);
      console.log('本地模型加载完成（占位符）');
      this.isLoaded = true;
    } catch (error) {
      console.error('加载本地模型失败:', error);
      this.isLoaded = false;
    }
  }

  // 识别植物
  async recognize(imageUri: string): Promise<PlantResult> {
    const online = await isOnline();

    if (online) {
      // 使用服务器端API
      return this.recognizeFromServer(imageUri);
    } else {
      // 使用本地模型
      return this.recognizeLocal(imageUri);
    }
  }

  // 服务器端识别
  private async recognizeFromServer(imageUri: string): Promise<PlantResult> {
    const base64 = await uriToBase64(imageUri);

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/recognition/plant`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`识别失败: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: data.id || '0',
      name: data.name || '未知',
      confidence: data.confidence || 0,
      care_tips: data.care_tips || ''
    };
  }

  // 本地识别（边缘端）
  private async recognizeLocal(imageUri: string): Promise<PlantResult> {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    // TODO: 实现ONNX推理
    // 这里返回模拟结果，实际需要调用ONNX模型
    return {
      id: '0',
      name: '绿萝',
      confidence: 0.95,
      care_tips: '喜阴，避免直射'
    };
  }

  // 完整识别（植物+病虫害）
  async recognizeFull(imageUri: string): Promise<FullRecognitionResult> {
    const online = await isOnline();

    if (online) {
      return recognizeFromServer(imageUri);
    } else {
      // 离线模式：使用本地模型
      const plantResult = await this.recognizeLocal(imageUri);
      return {
        plant: plantResult,
        pest: null // 离线模式暂不支持病虫害识别
      };
    }
  }
}

export const plantService = new PlantRecognitionService();
