// 花卉识别服务
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';

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

// 模拟API调用 - 实际需要对接后端Yolov11模型
export const recognizePlant = async (imageUri: string): Promise<RecognitionResult> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 返回模拟结果
  return {
    id: '1',
    name: '绿萝',
    scientificName: 'Epipremnum aureum',
    confidence: 0.95,
    description: '绿萝是天南星科麒麟叶属植物，原产于印度尼西亚所罗门群岛的热带雨林。绿萝生命力顽强，易于养护，是最常见的室内观叶植物之一。',
    careLevel: 1,
    lightRequirement: '耐阴',
    waterRequirement: '见干见湿',
    imageUrl: '',
    similarSpecies: [
      {
        id: '2',
        name: '吊兰',
        imageUrl: '',
        difference: '吊兰叶片更细长，呈条状，而绿萝叶片较宽大呈心形'
      },
      {
        id: '3',
        name: '常春藤',
        imageUrl: '',
        difference: '常春藤叶片为掌状五裂，绿萝叶片为心形'
      }
    ]
  };
};
