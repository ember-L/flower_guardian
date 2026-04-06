# 图片上传与识别流程优化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 合并上传和识别为单次请求，通过内存处理消除临时文件和重复转换，提升 60-80% 性能。

**Architecture:** 新增 `/api/diagnosis/upload-and-recognize` 接口，移动端一次上传即完成识别和存储。

**Tech Stack:** Python/FastAPI (后端), TypeScript/React Native (移动端), Pillow (图片处理), YOLO (病虫害识别)

---

## 实施顺序

1. **后端**：先实现服务层改动，再新增 API 接口
2. **移动端**：新增方法 → 修改调用处
3. **测试**：手动验证流程

---

## Task 1: PestRecognitionService 新增 recognize_from_bytes 方法

**Files:**
- Modify: `backend/app/services/pest_recognition.py`

**Step 1: 查看现有 recognize 方法结构**

读取 `backend/app/services/pest_recognition.py` 第 110-175 行，理解现有 `recognize` 方法如何处理图片路径。

**Step 2: 在 PestRecognitionService 类中添加新方法**

在 `_ensure_valid_image` 方法后添加：

```python
def recognize_from_bytes(self, content: bytes) -> dict:
    """从字节数据识别病虫害（不依赖文件路径）"""
    import io
    from PIL import Image
    import tempfile

    print(f"[PestRecognition] 开始从字节数据识别，长度: {len(content)} bytes")

    if not self.model:
        print(f"[PestRecognition] 模型未加载，返回模拟结果")
        return {
            "id": "0",
            "name": "蚜虫",
            "confidence": 0.88,
            "type": "insect",
            "treatment": "使用吡虫啉喷洒",
            "severity": "medium"
        }

    try:
        # 注册 HEIF 格式支持
        try:
            import pillow_heif
            pillow_heif.register_heif_opener()
        except ImportError:
            pass

        # 使用 BytesIO 打开图片
        image = Image.open(io.BytesIO(content))

        # 强制转换为 RGB
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            if image.mode == 'RGBA':
                background.paste(image, mask=image.split()[-1])
            else:
                background.paste(image)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')

        # 保存为临时 JPEG 文件供 YOLO 使用
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            image.save(tmp.name, format='JPEG', quality=95)
            tmp_path = tmp.name

        print(f"[PestRecognition] 临时文件: {tmp_path}")

        try:
            # 调用现有的 recognize 方法
            result = self._recognize_internal(tmp_path)
            return result
        finally:
            # 清理临时文件
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    except Exception as e:
        print(f"[PestRecognition] 字节识别出错: {e}")
        return {"id": "-1", "name": "未识别", "confidence": 0.0, "type": "unknown"}
```

**Step 3: 添加 _recognize_internal 辅助方法**

在 `recognize` 方法前添加（将现有 recognize 中的 YOLO 调用提取出来）：

```python
def _recognize_internal(self, image_path: str) -> dict:
    """内部方法：执行 YOLO 识别（不处理文件转换）"""
    try:
        results = self.model(image_path)
        result = results[0]

        if result.boxes:
            best_idx = result.boxes.conf.argmax()
            box = result.boxes[best_idx]
            confidence = float(box.conf[0])
            class_id = str(int(box.cls[0]))

            print(f"[PestRecognition] 检测到目标 - Class ID: {class_id}, 置信度: {confidence:.2%}")

            if confidence < self.CONFIDENCE_THRESHOLD:
                return {
                    "id": "-1",
                    "name": "未识别",
                    "confidence": confidence,
                    "type": "unknown",
                    "treatment": "置信度较低，请拍摄更清晰的照片",
                    "severity": "low"
                }

            class_info = self.classes.get(class_id, {})
            pest_type = class_info.get("type", "unknown")
            pest_name = class_info.get("name", "未知")

            return {
                "id": class_id,
                "name": pest_name,
                "confidence": confidence,
                "type": pest_type,
                "treatment": class_info.get("treatment", ""),
                "severity": class_info.get("severity", "low")
            }
        else:
            print(f"[PestRecognition] 未检测到目标框")
    except Exception as e:
        print(f"[PestRecognition] 识别出错: {e}")

    return {"id": "-1", "name": "未识别", "confidence": 0.0, "type": "unknown"}
```

**Step 4: 验证文件语法**

Run: `cd backend && python -m py_compile app/services/pest_recognition.py`
Expected: 无输出（语法正确）

**Step 5: 提交**

```bash
git add backend/app/services/pest_recognition.py
git commit -m "feat: 添加 recognize_from_bytes 方法支持内存识别"
```

---

## Task 2: 新增 /api/diagnosis/upload-and-recognize 接口

**Files:**
- Modify: `backend/app/api/endpoints/diagnosis.py`

**Step 1: 在 pest_diagnosis.py 中添加新接口**

在 `pest_diagnosis.py` 文件末尾添加：

```python
@router.post("/upload-and-recognize")
async def upload_and_recognize(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    合并上传和识别接口

    - 接收图片并直接识别
    - 识别完成后异步保存到存储
    - 返回识别结果和图片 URL
    """
    import logging
    from PIL import Image
    import io
    logger = logging.getLogger(__name__)

    # 验证文件
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")

    try:
        # 读取图片内容
        content = await file.read()
        logger.info(f"[UploadAndRecognize] 收到图片，大小: {len(content)} bytes")

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="图片内容不能为空")

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"图片大小不能超过 {MAX_FILE_SIZE // 1024 // 1024}MB")

        # 执行识别
        result = pest_recognition_service.recognize_from_bytes(content)
        logger.info(f"[UploadAndRecognize] 识别结果: {result}")

        # 如果用户已登录，异步保存图片
        image_url = None
        if current_user:
            try:
                # 转换并保存图片
                loop = asyncio.get_event_loop()
                image_content, filename = await loop.run_in_executor(
                    executor,
                    _convert_and_generate_filename,
                    content,
                    file.filename
                )

                user_dir = ensure_user_directory(current_user.id)
                file_path = os.path.join(user_dir, filename)

                await save_file_async(image_content, file_path)
                image_url = f"/api/diagnosis/images/{current_user.id}/{filename}"
                logger.info(f"[UploadAndRecognize] 图片已保存: {file_path}")
            except Exception as e:
                logger.error(f"[UploadAndRecognize] 保存图片失败: {e}")
                # 识别成功但保存失败，不阻塞返回

        # 返回结果
        if result.get("id", "-1") != "-1":
            return {
                "success": True,
                "diagnosis": result,
                "recommendations": {
                    "immediate": result.get("treatment", ""),
                    "prevention": _get_prevention_tips(result.get("type", "")),
                    "severity_level": result.get("severity", "low")
                },
                "image_url": image_url
            }
        else:
            return {
                "success": True,
                "diagnosis": result,
                "recommendations": {
                    "immediate": "建议咨询专业人士或上传更清晰的照片",
                    "prevention": "保持良好的养护习惯",
                    "severity_level": "unknown"
                },
                "image_url": image_url
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UploadAndRecognize] 失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")


def _convert_and_generate_filename(content: bytes, original_filename: str) -> tuple:
    """转换图片并生成文件名（在线程池中执行）"""
    # 注册 HEIF 支持
    try:
        import pillow_heif
        pillow_heif.register_heif_opener()
    except ImportError:
        pass

    from PIL import Image

    image = Image.open(io.BytesIO(content))

    # 转换为 RGB
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        if image.mode == 'RGBA':
            background.paste(image, mask=image.split()[-1])
        else:
            background.paste(image)
        image = background
    elif image.mode != 'RGB':
        image = image.convert('RGB')

    # 保存为 WebP
    output = io.BytesIO()
    image.save(output, format='WEBP', quality=85)
    webp_content = output.getvalue()

    # 生成文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    filename = f"img_{timestamp}_{unique_id}.webp"

    return webp_content, filename
```

**Step 2: 添加缺失的 import**

在 `pest_diagnosis.py` 顶部添加：

```python
import uuid
from datetime import datetime
import asyncio
from concurrent.futures import ThreadPoolExecutor
```

**Step 3: 验证语法**

Run: `cd backend && python -m py_compile app/api/endpoints/pest_diagnosis.py`
Expected: 无输出

**Step 4: 提交**

```bash
git add backend/app/api/endpoints/pest_diagnosis.py
git commit -m "feat: 新增 /api/diagnosis/upload-and-recognize 合并接口"
```

---

## Task 3: 移动端新增 uploadAndRecognize 方法

**Files:**
- Modify: `APP/src/services/pestRecognitionService.ts`

**Step 1: 在 pestRecognitionService.ts 中添加新方法**

在 `recognizeOnline` 方法后添加：

```typescript
// 合并上传和识别 - 单次请求完成
const uploadAndRecognize = async (imageUri: string): Promise<DiagnosisResult> => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/diagnosis/upload-and-recognize`, {
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
      imageUrl: data.image_url || imageUri,
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
```

**Step 2: 在 pestRecognitionService 对象中注册新方法**

找到 `pestRecognitionService = {` 对象，添加：

```typescript
export const pestRecognitionService = {
  // 新增：合并上传和识别
  uploadAndRecognize,

  // 现有方法保持不变...
```

**Step 3: 验证 TypeScript 语法**

Run: `cd APP && npx tsc --noEmit src/services/pestRecognitionService.ts`
Expected: 无错误（如果有类型错误请先修复）

**Step 4: 提交**

```bash
git add APP/src/services/pestRecognitionService.ts
git commit -m "feat: 新增 uploadAndRecognize 方法支持单次请求"
```

---

## Task 4: 修改 DiagnosisScreen 使用新方法

**Files:**
- Modify: `APP/src/screens/DiagnosisScreen.tsx`

**Step 1: 找到并修改 proceedWithDiagnosis 函数**

找到第 116-120 行左右的代码：

**旧代码：**
```typescript
// 先上传图片到服务器，获取永久 URL（用于保存到数据库）
const serverImageUrl = await pestRecognitionService.uploadImage(tempImageUri);

// 用本地临时图片进行识别（服务器路径不能作为文件上传）
const diagnosisResult: DiagnosisResult = await pestRecognitionService.recognize(tempImageUri);
```

**替换为：**
```typescript
// 使用合并接口，一次请求完成上传和识别
const result: DiagnosisResult = await pestRecognitionService.uploadAndRecognize(tempImageUri);
const diagnosisResult = result;
const serverImageUrl = result.imageUrl;
```

**Step 2: 验证 TypeScript**

Run: `cd APP && npx tsc --noEmit src/screens/DiagnosisScreen.tsx`
Expected: 无错误

**Step 3: 提交**

```bash
git add APP/src/screens/DiagnosisScreen.tsx
git commit -m "feat: DiagnosisScreen 使用合并上传识别接口"
```

---

## Task 5: 验证流程

**Step 1: 启动后端服务**

Run: `cd backend && uvicorn app.main:app --reload --port 8000`

**Step 2: 测试新接口**

使用 Postman 或 curl 测试：

```bash
curl -X POST "http://localhost:8000/api/diagnosis/upload-and-recognize" \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.jpg"
```

**预期响应：**
```json
{
  "success": true,
  "diagnosis": {
    "id": "7",
    "name": "番茄斑枯病",
    "confidence": 0.75,
    ...
  },
  "recommendations": {...},
  "image_url": "/api/diagnosis/images/2/img_20260407_xxxxxx.webp"
}
```

**Step 3: 移动端测试**

在 iOS 模拟器或真机上运行 app，拍照进行诊断，观察：
- 请求次数（应在 Network 面板看到 1 次请求）
- 响应时间
- 识别结果是否正确显示

---

## 任务完成检查清单

- [ ] Task 1: PestRecognitionService 新增 recognize_from_bytes 方法
- [ ] Task 2: 新增 /api/diagnosis/upload-and-recognize 接口
- [ ] Task 3: 移动端新增 uploadAndRecognize 方法
- [ ] Task 4: DiagnosisScreen 使用新方法
- [ ] Task 5: 验证流程

---

## 回滚计划

如遇问题，可回滚到原有逻辑：

1. **后端**：保留原有 `/api/diagnosis/upload-image` 和 `/api/diagnosis/full` 接口
2. **移动端**：DiagnosisScreen 回滚到原有的 uploadImage + recognize 两次调用
