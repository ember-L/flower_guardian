// 模型管理器 - 用于管理本地模型下载和更新
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const MODEL_VERSION_KEY = 'model_version';
const PLANT_MODEL_KEY = 'plant_model_downloaded';
const PEST_MODEL_KEY = 'pest_model_downloaded';

// API基础URL

export interface ModelInfo {
  name: string;
  version: string;
  size: number;
  downloaded: boolean;
}

export interface ModelStatus {
  plant: ModelInfo;
  pest: ModelInfo;
  lastCheck: string;
}

class ModelManager {
  // 检查服务器端模型版本
  async checkForUpdates(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/models/status`);
      if (!response.ok) return false;

      const serverStatus = await response.json();
      const currentVersion = await AsyncStorage.getItem(MODEL_VERSION_KEY);

      // 如果服务器版本与本地版本不同，则需要更新
      return serverStatus.plant?.version !== currentVersion;
    } catch (error) {
      console.error('检查模型更新失败:', error);
      return false;
    }
  }

  // 获取模型信息
  async getModelInfo(): Promise<ModelStatus> {
    const plantDownloaded = await AsyncStorage.getItem(PLANT_MODEL_KEY);
    const pestDownloaded = await AsyncStorage.getItem(PEST_MODEL_KEY);
    const version = await AsyncStorage.getItem(MODEL_VERSION_KEY);

    return {
      plant: {
        name: 'plant_yolo11n.onnx',
        version: version || '1.0.0',
        size: 0, // TODO: 获取实际文件大小
        downloaded: plantDownloaded === 'true'
      },
      pest: {
        name: 'pest_yolo11n.onnx',
        version: version || '1.0.0',
        size: 0,
        downloaded: pestDownloaded === 'true'
      },
      lastCheck: new Date().toISOString()
    };
  }

  // 下载模型
  async downloadModels(onProgress?: (progress: number) => void): Promise<boolean> {
    try {
      // TODO: 实现模型下载逻辑
      // 这里应该从服务器下载ONNX模型文件

      console.log('开始下载模型...');

      // 模拟下载进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        onProgress?.(i);
      }

      // 标记下载完成
      await AsyncStorage.setItem(PLANT_MODEL_KEY, 'true');
      await AsyncStorage.setItem(PEST_MODEL_KEY, 'true');
      await AsyncStorage.setItem(MODEL_VERSION_KEY, '1.0.0');

      console.log('模型下载完成');
      return true;
    } catch (error) {
      console.error('模型下载失败:', error);
      return false;
    }
  }

  // 删除本地模型
  async deleteModels(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(PLANT_MODEL_KEY);
      await AsyncStorage.removeItem(PEST_MODEL_KEY);
      await AsyncStorage.removeItem(MODEL_VERSION_KEY);

      console.log('本地模型已删除');
      return true;
    } catch (error) {
      console.error('删除模型失败:', error);
      return false;
    }
  }

  // 获取模型存储大小
  async getModelStorageSize(): Promise<number> {
    // TODO: 实现获取实际存储大小
    return 0;
  }

  // 检查模型是否需要更新
  async needsUpdate(): Promise<{ needsUpdate: boolean; reason?: string }> {
    const plantDownloaded = await AsyncStorage.getItem(PLANT_MODEL_KEY);
    const pestDownloaded = await AsyncStorage.getItem(PEST_MODEL_KEY);

    if (plantDownloaded !== 'true' || pestDownloaded !== 'true') {
      return {
        needsUpdate: true,
        reason: '模型未下载'
      };
    }

    const hasUpdate = await this.checkForUpdates();
    if (hasUpdate) {
      return {
        needsUpdate: true,
        reason: '有新版本可用'
      };
    }

    return { needsUpdate: false };
  }
}

export const modelManager = new ModelManager();
