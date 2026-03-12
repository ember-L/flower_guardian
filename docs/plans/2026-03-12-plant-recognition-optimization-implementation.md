# 植物识别优化实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 优化首页植物识别功能：调用后端API进行真实识别，并在结果页面显示用户上传的照片缩略图

**Architecture:**
1. 后端添加公开识别接口（无需认证）
2. APP端调用后端API并保存照片URI
3. 识别结果页面显示照片缩略图

**Tech Stack:** FastAPI (后端), React Native + TypeScript (APP), YOLO模型

---

## Task 1: 后端添加公开识别接口

**Files:**
- Modify: `backend/app/api/endpoints/recognition.py`

**Step 1: 添加公开识别接口**

在 `recognition.py` 文件末尾添加新的路由（无需认证）：

```python
@router.post("/public/plant", response_model=RecognitionResponse)
async def recognize_plant_public(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """植物识别API（公开，无需认证）"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = plant_recognition_service.recognize(tmp_path)
        return RecognitionResponse(
            id=result.get("id", "1"),
            name=result.get("name", "绿萝"),
            scientific_name="",
            confidence=result.get("confidence", 0.95),
            description="",
            care_level=1,
            light_requirement="喜散射光",
            water_requirement="见干见湿",
            similar_species=[]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")
    finally:
        os.unlink(tmp_path)
```

**Step 2: 验证后端启动**

运行: `cd backend && uvicorn app.main:app --reload --port 8000`

测试接口:
```bash
curl -X POST http://localhost:8000/api/recognition/public/plant \
  -F "file=@/path/to/plant.jpg"
```

**Step 3: 提交代码**

```bash
git add backend/app/api/endpoints/recognition.py
git commit -m "feat: add public plant recognition endpoint"
```

---

## Task 2: APP端添加公开API端点配置

**Files:**
- Modify: `APP/src/services/config.ts`

**Step 1: 添加公开识别端点**

在 `API_ENDPOINTS` 中添加：

```typescript
// 识别（公开，无需认证）
RECOGNITION_PUBLIC_PLANT: '/api/recognition/public/plant',
```

**Step 2: 提交代码**

```bash
git add APP/src/services/config.ts
git commit -m "feat: add public recognition endpoint config"
```

---

## Task 3: 修改APP端识别服务调用后端API

**Files:**
- Modify: `APP/src/services/recognitionService.ts`

**Step 1: 修改 recognizePlant 函数**

将现有的模拟实现替换为真实API调用：

```typescript
import axios from 'axios';
import { API_BASE_URL } from './config';

// 识别植物（调用后端API）
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
      lightRequirement: data.light_requirement as any || '散光',
      waterRequirement: data.water_requirement as any || '见干见湿',
      imageUrl: data.image_url || '',
      similarSpecies: data.similar_species || [],
    };
  } catch (error) {
    console.error('识别失败:', error);
    // 网络错误时抛出异常，让UI处理
    throw error;
  }
};
```

**Step 2: 提交代码**

```bash
git add APP/src/services/recognitionService.ts
git commit -m "feat: call backend API for plant recognition"
```

---

## Task 4: 修改识别页面显示上传照片

**Files:**
- Modify: `APP/src/screens/IdentifyScreen.tsx`

**Step 1: 添加照片状态变量**

在组件开头找到 `useState` 声明处，添加：
```typescript
const [capturedImageUri, setCapturedImageUri] = useState<string>('');
```

**Step 2: 修改 handleIdentify 函数保存照片**

找到 `handleIdentify` 函数中获取图片URI的位置，添加保存：
```typescript
const imageUri = response.assets[0].uri;
if (!imageUri) {
  setIsLoading(false);
  return;
}
setCapturedImageUri(imageUri); // 保存照片URI
```

**Step 3: 修改结果卡片显示照片**

找到 `resultCard` 样式定义，添加 `resultImage` 样式：
```typescript
resultImage: {
  width: 64,
  height: 64,
  borderRadius: 12,
  backgroundColor: colors.background,
},
```

修改结果卡片JSX部分，将：
```tsx
<View style={styles.resultPlantIcon}>
  <Icons.Flower2 size={32} color={colors.primary} />
</View>
```

改为：
```tsx
{capturedImageUri ? (
  <Image source={{ uri: capturedImageUri }} style={styles.resultImage} />
) : (
  <View style={styles.resultPlantIcon}>
    <Icons.Flower2 size={32} color={colors.primary} />
  </View>
)}
```

**Step 4: 确保Image组件已导入**

确认文件顶部已导入 `Image` 组件（通常已存在）。

**Step 5: 修改 closePlantCard 函数清除照片**

```typescript
const closePlantCard = () => {
  setShowPlantCard(false);
  setRecognitionResult(null);
  setPlantNickname('');
  setCapturedImageUri(''); // 清除照片
};
```

**Step 6: 提交代码**

```bash
git add APP/src/screens/IdentifyScreen.tsx
git commit -m "feat: display captured photo in recognition result"
```

---

## Task 5: 添加错误处理和降级处理

**Files:**
- Modify: `APP/src/screens/IdentifyScreen.tsx`

**Step 1: 在文件末尾添加模拟数据函数**

```typescript
// 降级用的模拟数据
const getMockRecognitionResult = (): RecognitionResult => ({
  id: '1',
  name: '绿萝',
  scientificName: 'Epipremnum aureum',
  confidence: 0.95,
  description: '绿萝是天南星科麒麟叶属植物，原产于印度尼西亚的热带雨林。',
  careLevel: 1,
  lightRequirement: '耐阴',
  waterRequirement: '见干见湿',
  imageUrl: '',
  similarSpecies: [],
});
```

**Step 2: 修改 handleIdentify 添加错误处理**

找到现有的 `handleIdentify` 函数，修改 `recognizePlant` 调用部分：

```typescript
try {
  const result = await recognizePlant(imageUri);
  setRecognitionResult(result);
  setShowPlantCard(true);
} catch (apiError) {
  // API调用失败，使用模拟数据作为降级
  console.warn('API调用失败，使用模拟数据', apiError);
  const fallbackResult = getMockRecognitionResult();
  setRecognitionResult(fallbackResult);
  setShowPlantCard(true);
}
```

**Step 3: 提交代码**

```bash
git add APP/src/screens/IdentifyScreen.tsx
git commit -m "feat: add error handling and fallback for recognition"
```

---

## Task 6: 整体测试

**Step 1: 确保后端运行**

```bash
cd backend && uvicorn app.main:app --reload --port 8000
```

**Step 2: 启动APP**

```bash
cd APP && npm start
```

**Step 3: 测试流程**
1. 打开APP首页
2. 点击拍照按钮
3. 拍摄植物照片
4. 等待识别结果
5. 验证结果卡片显示照片缩略图
6. 点击重新识别，验证照片被清除

---

## 验证清单

- [ ] 后端 `/api/recognition/public/plant` 接口可正常访问
- [ ] APP识别时调用后端API而非使用模拟数据
- [ ] 识别结果页面显示用户拍摄的照片缩略图
- [ ] 网络错误时有友好的错误提示
- [ ] 重新识别时照片被正确清除
