# 植物识别模型集成设计方案

## 项目概述

将训练好的 YOLOv11 植物识别模型集成到Flower Guardian应用中，实现：
- 在线模式：调用后端 API
- 离线模式：使用 ONNX 模型在前端进行识别

## 技术规格

| 项目 | 内容 |
|------|------|
| 模型架构 | YOLOv11 |
| 植物类别 | 47种 |
| PyTorch 模型 | `backend/models/plant.pt` |
| ONNX 模型 | `APP/assets/models/plant.onnx` |

### 47种植物类别

```python
0: '非洲紫罗兰', 1: '芦荟', 2: '红掌', 3: '散尾葵', 4: '文竹',
5: '秋海棠', 6: '天堂鸟', 7: '鸟巢蕨', 8: '波士顿蕨', 9: '竹芋',
10: '一叶兰', 11: '金钱草', 12: '万年青', 13: '蟹爪兰', 14: '菊花',
15: '浪星竹芋', 16: '水仙', 17: '龙血树', 18: '黛粉叶', 19: '海芋',
20: '常春藤', 21: '风信子', 22: '铁十字秋海棠', 23: '玉树', 24: '长寿花',
25: '萱草', 26: '铃兰', 27: '发财树', 28: '龟背竹', 29: '兰花',
30: '棕竹', 31: '白掌', 32: '一品红', 33: '红斑竹叶', 34: '酒瓶兰',
35: '绿萝', 36: '竹节秋海棠', 37: '响尾蛇竹芋', 38: '橡皮树', 39: '苏铁',
40: '鹅掌柴', 41: '虎皮兰', 42: '紫露草', 43: '郁金香', 44: '捕蝇草',
45: '丝兰', 46: '金钱树'
```

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    APP 前端                          │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────┐ │
│  │ NetworkMonitor  │───▶│ HybridRecognitionService │ │
│  │  (网络状态检测)  │    │   (混合识别服务)          │ │
│  └─────────────────┘    └───────────┬─────────────┘ │
│                                     │               │
│                    ┌────────────────┼────────────────┐
│                    ▼                                 ▼
│         ┌──────────────────┐            ┌──────────────────┐
│         │  Backend API     │            │  ONNX Runtime   │
│         │  /api/recognition│            │  (离线模式)     │
│         └──────────────────┘            └──────────────────┘
```

## 模块设计

### 1. NetworkMonitor (网络状态监测)

```typescript
// APP/src/utils/networkMonitor.ts
- watchNetworkState(): Observable<boolean>
- isConnected(): Promise<boolean>
- 监听网络变化，自动触发识别策略切换
```

### 2. OnnxPlantRecognizer (ONNX离线识别)

```typescript
// APP/src/services/onnxPlantRecognizer.ts
- loadModel(): Promise<void>
- recognize(imageUri: string): Promise<RecognitionResult>
- 加载 ONNX 模型，执行推理
- 使用 @aspect/onnxruntime-react-native
```

### 3. HybridRecognitionService (混合识别服务)

```typescript
// APP/src/services/hybridRecognition.ts
- recognize(imageUri: string): Promise<RecognitionResult>
- 自动检测网络状态
- 在线：调用后端 API
- 离线：使用 ONNX 模型
```

### 4. 植物类别数据

```typescript
// APP/src/data/plantClasses.ts
export const PLANT_CLASSES: Record<number, PlantInfo> = {
  0: { name: '非洲紫罗兰', careTips: '...' },
  // ... 47种植物
}
```

## 数据流

### 在线识别流程

```
用户拍照 → HybridRecognitionService → 检测在线
    ↓
后端 API (/api/recognition/plant)
    ↓
返回识别结果
```

### 离线识别流程

```
用户拍照 → HybridRecognitionService → 检测离线
    ↓
加载 ONNX 模型 (首次加载后缓存)
    ↓
图像预处理 → 推理 → 后处理
    ↓
返回识别结果
```

## API 接口

### 后端 API (在线)

```
POST /api/recognition/plant
Content-Type: multipart/form-data
Authorization: Bearer <token>

Response:
{
  "id": "35",
  "name": "绿萝",
  "confidence": 0.95,
  "care_tips": "喜阴，避免直射"
}
```

### 前端接口 (统一)

```typescript
interface RecognitionResult {
  id: string;
  name: string;
  confidence: number;
  careTips: string;
}
```

## 文件结构

```
APP/
├── assets/
│   └── models/
│       └── plant.onnx          # ONNX 模型文件
├── src/
│   ├── data/
│   │   └── plantClasses.ts     # 47种植物类别
│   ├── services/
│   │   ├── recognitionService.ts  # 现有API服务
│   │   ├── onnxPlantRecognizer.ts  # ONNX离线识别
│   │   └── hybridRecognition.ts    # 混合识别服务
│   └── utils/
│       └── networkMonitor.ts   # 网络状态监测
```

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| 网络超时 | 自动切换到离线模式 |
| ONNX 加载失败 | 提示用户，当前仅支持在线 |
| 识别失败 | 返回 "未识别"，显示重试按钮 |
| 模型文件缺失 | 跳过离线功能，仅使用在线 |

## 实施步骤

1. 导出 ONNX 模型文件
2. 更新后端模型路径
3. 创建网络监测工具
4. 实现 ONNX 识别器
5. 实现混合识别服务
6. 创建植物类别数据
7. 集成到现有识别页面

## 验收标准

- [ ] 在线模式正常工作
- [ ] 离线模式正常工作
- [ ] 网络状态变化时自动切换
- [ ] 47种植物类别正确显示
- [ ] 识别结果包含置信度和养护提示
