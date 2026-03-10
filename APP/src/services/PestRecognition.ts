// 病虫害识别服务（边缘端+服务器端）
import NetInfo from '@react-native-community/netinfo';

// API基础URL
const API_BASE_URL = 'http://localhost:8000';

// 病虫害识别结果类型
export interface PestResult {
  id: string;
  name: string;
  confidence: number;
  type: 'insect' | 'disease' | 'physiological' | 'unknown';
  treatment: string;
  severity: 'low' | 'medium' | 'high';
}

// 诊断建议
export interface DiagnosisRecommendation {
  immediate: string;
  prevention: string;
  severity_level: string;
}

// 完整诊断结果
export interface DiagnosisResult {
  diagnosis: PestResult;
  recommendations: DiagnosisRecommendation;
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
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// 服务器端诊断
const diagnoseFromServer = async (imageUri: string): Promise<DiagnosisResult> => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  const response = await fetch(`${API_BASE_URL}/api/diagnosis/full`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`诊断失败: ${response.status}`);
  }

  return await response.json();
};

// 病虫害识别服务类
class PestRecognitionService {
  private model: any = null;
  private isLoaded: boolean = false;

  // 加载本地模型（边缘部署时使用）
  async loadModel(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // TODO: 使用 onnxruntime-react-native 加载模型
      console.log('病虫害模型加载完成（占位符）');
      this.isLoaded = true;
    } catch (error) {
      console.error('加载病虫害模型失败:', error);
      this.isLoaded = false;
    }
  }

  // 识别病虫害
  async recognize(imageUri: string): Promise<PestResult> {
    const online = await isOnline();

    if (online) {
      return this.recognizeFromServer(imageUri);
    } else {
      return this.recognizeLocal(imageUri);
    }
  }

  // 服务器端识别
  private async recognizeFromServer(imageUri: string): Promise<PestResult> {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/diagnosis/pest`, {
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
      type: data.type || 'unknown',
      treatment: data.treatment || '',
      severity: data.severity || 'low'
    };
  }

  // 本地识别（边缘端）
  private async recognizeLocal(imageUri: string): Promise<PestResult> {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    // TODO: 实现ONNX推理
    return {
      id: '0',
      name: '蚜虫',
      confidence: 0.88,
      type: 'insect',
      treatment: '使用吡虫啉喷洒',
      severity: 'medium'
    };
  }

  // 完整诊断（识别+建议）
  async diagnose(imageUri: string): Promise<DiagnosisResult> {
    const online = await isOnline();

    if (online) {
      return diagnoseFromServer(imageUri);
    } else {
      // 离线模式：使用本地模型
      const pestResult = await this.recognizeLocal(imageUri);
      return {
        diagnosis: pestResult,
        recommendations: {
          immediate: pestResult.treatment,
          prevention: '保持良好的养护习惯',
          severity_level: pestResult.severity
        }
      };
    }
  }

  // 获取严重程度颜色
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'high': return '#e94b52';
      case 'medium': return '#f5a623';
      case 'low': return '#7ed321';
      default: return '#999';
    }
  }
}

export const pestService = new PestRecognitionService();
