// 混合识别服务 - 在线模式
// 注: ONNX 离线识别暂时不可用，应用将始终使用在线识别
import * as ImagePicker from 'expo-image-picker';
import { isNetworkConnected } from '../utils/networkMonitor';
import { getPlantInfo, PlantInfo } from '../data/plantClasses';

// 识别结果接口
export interface RecognitionResult {
  id: string;
  name: string;
  scientificName?: string;
  confidence: number;
  description?: string;
  careLevel?: number;
  lightRequirement?: string;
  waterRequirement?: string;
  imageUrl: string;
  careTips: string;
  similarSpecies?: SimilarSpecies[];
  mode: 'online' | 'offline';
}

export interface SimilarSpecies {
  id: string;
  name: string;
  imageUrl: string;
  difference: string;
  careLevel: number;
  tips: string;
}

// 后端 API 识别（在线模式）
const recognizeOnline = async (imageUri: string): Promise<RecognitionResult> => {
  // TODO: 调用实际的后端 API
  // const formData = new FormData();
  // formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'photo.jpg' });
  // const response = await axios.post('/api/recognition/plant', formData);

  // 模拟 API 调用延迟
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 返回模拟结果（实际使用时替换为 API 调用）
  return {
    id: '35',
    name: '绿萝',
    scientificName: 'Epipremnum aureum',
    confidence: 0.95,
    description: '绿萝是天南星科麒麟叶属植物，原产于印度尼西亚的热带雨林。',
    careLevel: 1,
    lightRequirement: '耐阴',
    waterRequirement: '见干见湿',
    imageUrl: imageUri,
    careTips: '喜阴凉湿润，避免直射，保持土壤微湿',
    similarSpecies: [
      {
        id: '4',
        name: '文竹',
        imageUrl: '',
        difference: '叶片更细长，呈条状',
        careLevel: 1,
        tips: '两者都适合新手，但文竹需要更多散光'
      }
    ],
    mode: 'online'
  };
};

// 离线识别 - 使用本地数据
const recognizeOffline = async (imageUri: string): Promise<RecognitionResult> => {
  // 使用模拟数据作为离线模式
  const plantIds = Array.from({ length: 47 }, (_, i) => i);
  const randomId = plantIds[Math.floor(Math.random() * plantIds.length)];
  const plantInfo = getPlantInfo(randomId);

  return {
    id: randomId.toString(),
    name: plantInfo.name,
    scientificName: '',
    confidence: 0.85 + Math.random() * 0.14,
    description: '',
    careLevel: 1,
    lightRequirement: '散光',
    waterRequirement: '见干见湿',
    imageUrl: imageUri,
    careTips: plantInfo.careTips,
    mode: 'offline'
  };
};

// 混合识别服务类
class HybridRecognitionService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    console.log('[HybridRecognition] Service initialized (online mode)');
  }

  // 执行识别 - 自动选择在线/离线模式
  async recognize(imageUri: string): Promise<RecognitionResult> {
    const connected = await isNetworkConnected();

    if (connected) {
      console.log('[HybridRecognition] Using ONLINE mode');
      try {
        return await recognizeOnline(imageUri);
      } catch (error) {
        console.error('[HybridRecognition] Online failed, falling back to offline:', error);
        return await recognizeOffline(imageUri);
      }
    } else {
      console.log('[HybridRecognition] Using OFFLINE mode');
      return await recognizeOffline(imageUri);
    }
  }

  // 仅使用在线模式
  async recognizeOnlineOnly(imageUri: string): Promise<RecognitionResult> {
    return await recognizeOnline(imageUri);
  }

  // 仅使用离线模式
  async recognizeOfflineOnly(imageUri: string): Promise<RecognitionResult> {
    return await recognizeOffline(imageUri);
  }

  // 检查是否支持离线模式
  isOnnxAvailable(): boolean {
    return false; // ONNX 暂时不可用
  }

  // 获取当前网络状态
  async checkOnline(): Promise<boolean> {
    return await isNetworkConnected();
  }
}

export const hybridRecognitionService = new HybridRecognitionService();

// 便捷函数：拍照识别
export const takePhotoAndRecognize = async (): Promise<RecognitionResult | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const imageUri = result.assets[0].uri;
  return await hybridRecognitionService.recognize(imageUri);
};

// 便捷函数：从相册选择并识别
export const selectFromGalleryAndRecognize = async (): Promise<RecognitionResult | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const imageUri = result.assets[0].uri;
  return await hybridRecognitionService.recognize(imageUri);
};
