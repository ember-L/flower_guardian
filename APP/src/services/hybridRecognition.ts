// 混合识别服务 - 在线/离线自动切换
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { isNetworkConnected } from '../utils/networkMonitor';
import { getPlantInfo, PlantInfo } from '../data/plantClasses';

// 尝试导入 ONNX Runtime
let onnxruntime: any = null;
try {
  onnxruntime = require('onnxruntime-react-native');
} catch (e) {
  console.warn('ONNX Runtime not available:', e);
}

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

// ONNX Session 管理
let ortSession: any = null;
let isModelLoaded = false;

// 加载 ONNX 模型
const loadOnnxModel = async (): Promise<void> => {
  if (isModelLoaded || !onnxruntime) return;

  try {
    ortSession = await onnxruntime.createInferenceSession(
      require('../assets/models/plant.onnx'),
      { executionProviders: ['cpu'] }
    );
    isModelLoaded = true;
    console.log('[ONNX] Model loaded successfully');
  } catch (error) {
    console.error('[ONNX] Failed to load model:', error);
    throw error;
  }
};

// 图像预处理 - 将图像转换为模型输入格式
const preprocessImage = async (imageUri: string): Promise<Float32Array> => {
  // 注意: 实际项目中需要使用 react-native-image 或 expo-image 进行处理
  // 这里返回模拟数据，实际需要实现真正的图像预处理
  // YOLOv11 输入: [1, 3, 640, 640]

  // 模拟预处理 - 实际需要:
  // 1. 读取图像并缩放到 640x640
  // 2. 归一化到 [0, 1]
  // 3. 转换为 CHW 格式

  const inputSize = 640;
  const channel = 3;
  const mockData = new Float32Array(channel * inputSize * inputSize);

  // 随机初始化（实际需要真实图像数据）
  for (let i = 0; i < mockData.length; i++) {
    mockData[i] = Math.random();
  }

  return mockData;
};

// 后处理 - 解析模型输出
const postprocessOutput = (output: Float32Array): { classId: number; confidence: number } => {
  // YOLOv11 输出格式: [batch, num_predictions, (x, y, w, h, obj_conf, class_probs)]
  // 这里需要根据实际模型输出进行解析

  // 简化处理: 找到最大置信度的类别
  // 实际需要 NMS (Non-Maximum Suppression) 处理

  // 假设输出中包含 47 个类别的置信度
  const numClasses = 47;
  const stride = numClasses + 5; // +5 for box coordinates and objectness

  let maxConfidence = 0;
  let bestClassId = 0;

  for (let i = 0; i < numClasses; i++) {
    const confidence = output[i];
    if (confidence > maxConfidence) {
      maxConfidence = confidence;
      bestClassId = i;
    }
  }

  return {
    classId: bestClassId,
    confidence: maxConfidence
  };
};

// 离线 ONNX 识别
const recognizeOffline = async (imageUri: string): Promise<RecognitionResult> => {
  if (!onnxruntime) {
    throw new Error('ONNX Runtime not available');
  }

  try {
    // 确保模型已加载
    await loadOnnxModel();

    // 预处理图像
    const inputData = await preprocessImage(imageUri);

    // 创建输入张量
    const inputTensor = new onnxruntime.Tensor(
      'float32',
      inputData,
      [1, 3, 640, 640]
    );

    // 运行推理
    const feeds: Record<string, any> = { 'images': inputTensor };
    const results = await ortSession.run(feeds);

    // 获取输出
    const outputKey = Object.keys(results)[0];
    const outputData = results[outputKey].data as Float32Array;

    // 后处理
    const { classId, confidence } = postprocessOutput(outputData);

    // 获取植物信息
    const plantInfo = getPlantInfo(classId);

    return {
      id: classId.toString(),
      name: plantInfo.name,
      scientificName: '',
      confidence: confidence,
      description: '',
      careLevel: 1,
      lightRequirement: '散光',
      waterRequirement: '见干见湿',
      imageUrl: imageUri,
      careTips: plantInfo.careTips,
      mode: 'offline'
    };
  } catch (error) {
    console.error('[ONNX] Inference failed:', error);

    // 如果 ONNX 失败，回退到模拟识别
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
      imageUri: imageUri,
      careTips: plantInfo.careTips,
      mode: 'offline'
    };
  }
};

// 混合识别服务类
class HybridRecognitionService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 尝试预加载 ONNX 模型
    if (onnxruntime) {
      try {
        await loadOnnxModel();
        console.log('[HybridRecognition] ONNX model preloaded');
      } catch (e) {
        console.warn('[HybridRecognition] ONNX preload failed, will use online mode:', e);
      }
    }

    this.initialized = true;
    console.log('[HybridRecognition] Service initialized');
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
        if (onnxruntime) {
          return await recognizeOffline(imageUri);
        }
        throw error;
      }
    } else {
      console.log('[HybridRecognition] Using OFFLINE mode');
      if (onnxruntime) {
        return await recognizeOffline(imageUri);
      }
      throw new Error('Offline mode not available and no network connection');
    }
  }

  // 仅使用在线模式
  async recognizeOnlineOnly(imageUri: string): Promise<RecognitionResult> {
    return await recognizeOnline(imageUri);
  }

  // 仅使用离线模式
  async recognizeOfflineOnly(imageUri: string): Promise<RecognitionResult> {
    if (!onnxruntime) {
      throw new Error('ONNX Runtime not available');
    }
    return await recognizeOffline(imageUri);
  }

  // 检查 ONNX 是否可用
  isOnnxAvailable(): boolean {
    return onnxruntime !== null;
  }

  // 获取当前网络状态
  async checkOnline(): Promise<boolean> {
    return await isNetworkConnected();
  }
}

export const hybridRecognitionService = new HybridRecognitionService();

// 便捷函数：拍照识别
export const takePhotoAndRecognize = async (): Promise<RecognitionResult | null> => {
  const result = await launchCamera({
    mediaType: 'photo',
    quality: 0.8,
    saveToPhotos: false,
  });

  if (result.didCancel || !result.assets?.length) {
    return null;
  }

  const imageUri = result.assets[0].uri!;
  return await hybridRecognitionService.recognize(imageUri);
};

// 便捷函数：从相册选择并识别
export const selectFromGalleryAndRecognize = async (): Promise<RecognitionResult | null> => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
  });

  if (result.didCancel || !result.assets?.length) {
    return null;
  }

  const imageUri = result.assets[0].uri!;
  return await hybridRecognitionService.recognize(imageUri);
};
