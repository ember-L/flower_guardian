# 植物识别优化设计方案

## 概述

优化首页植物识别功能：
1. 调用后端API进行真实识别（未登录时使用公开接口）
2. 识别结果页面显示用户上传的照片缩略图

## 现状分析

- `recognitionService.ts` 中的 `recognizePlant` 函数是模拟的，仅返回假数据
- 识别结果页面只显示植物图标，没有显示用户拍摄的照片
- 后端识别API需要JWT认证（`/api/recognition/plant`）

## 设计方案

### 1. 后端：添加公开识别接口

新增无需认证的识别接口：

```
POST /api/recognition/public/plant
Content-Type: multipart/form-data

请求参数：
- file: 图片文件

响应：
{
  "id": "0",
  "name": "绿萝",
  "scientific_name": "Epipremnum aureum",
  "confidence": 0.95,
  "description": "...",
  "care_level": 1,
  "light_requirement": "喜散射光",
  "water_requirement": "见干见湿",
  "similar_species": []
}
```

实现方式：复制现有识别逻辑，移除 `get_current_user` 依赖

### 2. APP端：调用后端API

修改 `recognitionService.ts`：

```typescript
// 新增：调用后端API进行植物识别
export const recognizePlant = async (imageUri: string): Promise<RecognitionResult> => {
  // 将URI转换为FormData
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'plant.jpg',
  } as any);

  const response = await apiClient.post('/recognition/public/plant', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return transformBackendResponse(response.data);
};
```

### 3. APP端：显示上传照片

修改 `IdentifyScreen.tsx` 识别结果区域：

- 保留用户上传照片的URI
- 在结果卡片中显示照片缩略图（约64x64）
- 显示位置：植物名称旁边或作为卡片背景

```tsx
// 状态存储
const [capturedImageUri, setCapturedImageUri] = useState<string>('');

// 识别时保存照片URI
const handleIdentify = async (source: 'camera' | 'gallery') => {
  // ...
  const imageUri = response.assets[0].uri;
  setCapturedImageUri(imageUri);  // 保存照片
  // ...
};

// 结果展示
<View style={styles.resultCard}>
  {capturedImageUri ? (
    <Image source={{ uri: capturedImageUri }} style={styles.resultImage} />
  ) : (
    <View style={styles.resultPlantIcon}>
      <Icons.Flower2 size={32} color={colors.primary} />
    </View>
  )}
  {/* ... */}
</View>
```

## 数据流

```
用户拍照/选择图片
    ↓
保存imageUri到state
    ↓
调用后端 /api/recognition/public/plant (multipart/form-data)
    ↓
返回识别结果
    ↓
显示结果卡片（包含照片缩略图）
```

## 错误处理

- 网络错误：显示"识别失败，请重试"提示
- 服务器错误：fallback到模拟数据或显示友好错误
- 图片格式不支持：前端校验或后端返回错误

## 兼容性

- 保持现有登录用户的认证识别接口不变
- 公开接口与原有接口返回格式一致
- 离线时保留降级处理（显示错误或使用模拟数据）
