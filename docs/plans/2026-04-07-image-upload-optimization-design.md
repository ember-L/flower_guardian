# 图片上传与识别流程优化方案

## 1. 背景与目标

### 当前问题

从日志分析发现现有流程存在以下性能问题：

| 问题 | 影响 |
|------|------|
| 同一图片上传两次 | 浪费带宽，延迟加倍 |
| 服务器端 WebP 转换耗时 ~2.4秒 | 主要瓶颈 |
| 识别时重复创建临时文件 | 额外 I/O 开销 |
| WebP 存储后又转回 JPEG 给 YOLO | 重复转换 |

**当前流程耗时：约 3-5 秒（两次上传 + 转换 + 识别）**

### 优化目标

- **首要目标**：加快响应速度
- **预期效果**：减少 50-70% 延迟，目标 1-2 秒完成

## 2. 优化方案：单次上传 + 内存处理

### 核心思路

合并上传和识别为一个请求，服务器直接从内存处理图片，消除临时文件，不重复转换。

### 优化后流程

```
移动端                          服务器
   │                              │
   │──── 拍照 (HEIC/JPEG) ──────►│
   │                              │ ← 内存中格式验证
   │                              │ ← Pillow 处理 HEIC/JPEG
   │                              │ ← YOLO 识别
   │                              │ ← 异步保存到磁盘
   │◄─── 识别结果 + 存储 URL ─────│
```

**预期耗时：约 1-2 秒**

## 3. 架构设计

### 数据流

```
1. client.uploadAndRecognize(imageUri)
      │
2. fetch('/api/diagnosis/upload-and-recognize', { body: formData })
      │
3. server:
      ├── receive image bytes from request
      ├── validate and convert format using Pillow (in memory)
      ├── YOLO recognition (in memory)
      ├── async save to storage (non-blocking)
      └── return { diagnosis, image_url }
      │
4. client.display(result)
```

### 关键改动

| 组件 | 改动内容 |
|------|----------|
| **移动端** | 新增 `uploadAndRecognize()` 方法，替代原来的 upload + recognize 两次调用 |
| **服务端** | 新增 `/api/diagnosis/upload-and-recognize` 接口，内存中完成识别 |

## 4. 服务端改动

### 4.1 新增接口

**端点**: `POST /api/diagnosis/upload-and-recognize`

**请求**: `multipart/form-data`
- `file`: 图片文件

**响应**:
```json
{
  "success": true,
  "diagnosis": {
    "id": "7",
    "name": "番茄斑枯病",
    "confidence": 0.75,
    "type": "disease",
    "treatment": "...",
    "severity": "medium"
  },
  "recommendations": {
    "immediate": "...",
    "prevention": "...",
    "severity_level": "medium"
  },
  "image_url": "/api/diagnosis/images/2/img_20260407_xxxxxx.webp"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "不支持的图片格式",
  "diagnosis": { ... }  // 可能返回模拟结果
}
```

### 4.2 PestRecognitionService 新增方法

```python
def recognize_from_bytes(self, content: bytes) -> dict:
    """从字节数据识别病虫害（不依赖文件路径）"""
    # 使用 BytesIO 替代文件路径
    image = Image.open(io.BytesIO(content))
    # ... 处理逻辑
```

### 4.3 异步存储

存储操作使用后台任务执行，不阻塞识别结果返回：

```python
async def save_file_async(content: bytes, file_path: str) -> None:
    # 现有方法，保持不变
    pass
```

## 5. 移动端改动

### 5.1 新增方法

**pestRecognitionService.ts**:
```typescript
async uploadAndRecognize(imageUri: string): Promise<DiagnosisResult> {
  // 将图片转为 FormData
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  // 单次请求
  const response = await fetch(`${API_BASE_URL}/api/diagnosis/upload-and-recognize`, {
    method: 'POST',
    body: formData,
    headers: { ... }
  });

  // 处理响应...
}
```

### 5.2 DiagnosisScreen 改动

**旧逻辑**:
```typescript
const serverImageUrl = await pestRecognitionService.uploadImage(tempImageUri);
const diagnosisResult = await pestRecognitionService.recognize(tempImageUri);
```

**新逻辑**:
```typescript
const result = await pestRecognitionService.uploadAndRecognize(tempImageUri);
// result.imageUrl 可用于保存诊断记录
```

## 6. 错误处理

| 场景 | 处理方式 |
|------|----------|
| 图片格式不支持 | 返回 400，提示支持的格式 |
| 识别模型出错 | 记录日志，返回模拟结果（向后兼容） |
| 识别置信度低 | 返回 id: -1 的"未识别"结果 |
| 存储失败 | 记录日志，但识别结果正常返回 |

## 7. 性能对比

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| HTTP 请求次数 | 2 | 1 | 50% |
| 图片传输量 | ~5MB (2次) | ~2.5MB (1次) | 50% |
| 格式转换次数 | 2 (WebP→JPEG) | 0-1 | 50-100% |
| 临时文件 I/O | 2 次写入 | 0 | 100% |
| 预计总延迟 | 3-5 秒 | 1-2 秒 | 60-80% |

## 8. 兼容性考虑

- 保留现有 `/api/diagnosis/upload-image` 和 `/api/diagnosis/full` 接口
- 新接口失败时可降级到旧逻辑（但暂不在本次实现）
- YOLO 模型未加载时返回模拟结果（现有逻辑）

## 9. 实施步骤

1. **服务端**：
   - 在 `PestRecognitionService` 新增 `recognize_from_bytes()` 方法
   - 新增 `/api/diagnosis/upload-and-recognize` 接口

2. **移动端**：
   - 在 `pestRecognitionService.ts` 新增 `uploadAndRecognize()` 方法
   - 修改 `DiagnosisScreen.tsx` 使用新方法

3. **测试验证**：
   - 单元测试：格式转换、识别逻辑
   - 集成测试：完整流程
   - 性能测试：对比优化前后延迟

## 10. 文件清单

### 服务端
- `backend/app/api/endpoints/diagnosis.py` - 新增接口
- `backend/app/services/pest_recognition.py` - 新增方法

### 移动端
- `APP/src/services/pestRecognitionService.ts` - 新增方法
- `APP/src/screens/DiagnosisScreen.tsx` - 使用新方法
