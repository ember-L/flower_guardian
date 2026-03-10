# 护花使者 CV 模型使用技术文档

## 1. 概述

### 1.1 项目背景

护花使者（Flower Guardian）是一款面向植物爱好者的移动应用，提供植物识别、病虫害诊断、智能提醒等功能。核心能力基于计算机视觉技术实现。

### 1.2 模型架构

项目采用**双 YOLO 模型架构**：

- **植物识别模型** (`plant_yolo11n.pt`)
  - 识别常见室内植物、花卉、蔬菜等
  - 支持 30+ 植物类别

- **病虫害识别模型** (`pest_yolo11n.pt`)
  - 识别植物病虫害、生理性病害
  - 支持昆虫、病害、生理障碍三类

### 1.3 技术栈

| 层级 | 技术 |
|------|------|
| 模型训练 | Ultralytics YOLO v11 |
| 模型格式 | PyTorch (.pt) → ONNX (.onnx) |
| 后端服务 | FastAPI + Python |
| 边缘部署 | React Native + ONNX Runtime |
| 数据增强 | Albumentations |

---

## 2. 数据集准备

### 2.1 数据集来源

项目使用以下数据集：

```python
# backend/dataset/
├── PlantVillage/           # 植物病害数据集
├── processed/
│   ├── plant/             # 处理后的植物数据
│   │   ├── train/images/
│   │   ├── train/labels/
│   │   ├── val/images/
│   │   └── val/labels/
│   └── pest/              # 处理后的病虫害数据
└── plant_classes.json     # 植物类别定义
```

### 2.2 数据标注格式

采用 YOLO 标准格式（`.txt` 文件）：

```
# 格式: class_id center_x center_y width height
# 所有值归一化到 0-1

0 0.5 0.5 0.3 0.4    # class_id=0, 中心点(0.5,0.5), 宽0.3高0.4
```

### 2.3 数据增强策略

在 `backend/dataset/augmentation.py` 中实现：

```python
# 常用增强组合
augmentations = [
    HorizontalFlip(p=0.5),           # 水平翻转
    RandomBrightnessContrast(p=0.3),  # 亮度对比度
    RandomRotate90(p=0.3),            # 90度旋转
    GaussianBlur(p=0.1),              # 高斯模糊
    ColorJitter(p=0.2),               # 颜色抖动
]
```

### 2.4 数据集划分

在 `backend/train/config.py` 中配置：

```python
TRAIN_RATIO = 0.8  # 80% 训练集
VAL_RATIO = 0.1    # 10% 验证集
TEST_RATIO = 0.1   # 10% 测试集
```

---

## 3. 模型训练

### 3.1 训练配置

训练参数在 `backend/train/config.py` 中定义：

```python
@dataclass
class TrainConfig:
    # 模型配置
    model_type: str = "yolo11n"  # 可选: yolo11n/s/m/l/x

    # 训练参数
    epochs: int = 100
    batch_size: int = 16
    image_size: int = 640
    patience: int = 50           # 早停耐心值
    save_period: int = 10        # 每10轮保存

    # 优化器参数
    lr0: float = 0.01           # 初始学习率
    lrf: float = 0.01            # 最终学习率
    momentum: float = 0.937
    weight_decay: float = 0.0005
```

### 3.2 模型选择指南

| 模型 | 参数量 | mAP@50 | 推理速度 | 适用场景 |
|------|--------|--------|----------|----------|
| yolo11n | 2.6M | 39.5 |最快 | 移动端/边缘 |
| yolo11s | 9.4M | 47.8 | 快 | 服务器 |
| yolo11m | 25.4M | 52.5 | 中 | 精度优先 |

**推荐**：边缘部署使用 `yolo11n`，服务器部署可考虑 `yolo11s`。

### 3.3 训练脚本使用

```bash
# 训练植物识别模型
python backend/train/train_plant.py

# 训练病虫害识别模型
python backend/train/train_pest.py

# 自定义参数训练
python -c "
from train.train_plant import train_plant_model
from train.config import TrainConfig

config = TrainConfig()
config.epochs = 50
config.model_type = 'yolo11s'
config.batch_size = 8
train_plant_model()
"
```

### 3.4 训练监控

训练过程中会生成以下文件：

```
flower_guardian/
├── plant_train/
│   ├── weights/
│   │   ├── best.pt      # 最佳模型
│   │   └── last.pt      # 最新模型
│   ├── results.csv      # 训练指标
│   └── confusion_matrix.png
```

使用 TensorBoard 查看训练曲线：

```bash
tensorboard --logdir flower_guardian/plant_train
```

### 3.5 断点续训

```python
from ultralytics import YOLO

# 从断点继续训练
model = YOLO("flower_guardian/plant_train/weights/last.pt")
model.train(resume=True)
```

---

## 4. 模型导出与优化

### 4.1 PT → ONNX 转换

使用 `backend/train/export_onnx.py`：

```bash
# 导出植物模型
python backend/train/export_onnx.py --type plant

# 导出病虫害模型
python backend/train/export_onnx.py --type pest

# 导出全部模型
python backend/train/export_onnx.py --type all

# 导出量化模型（更小体积）
python backend/train/export_onnx.py --type quantized
```

### 4.2 量化模型

量化可显著减少模型体积和推理时间：

| 格式 | 植物模型大小 | 病虫害模型大小 |
|------|-------------|---------------|
| FP32) | ~6MB (pt | ~6MB |
| FP16 (onnx) | ~3MB | ~3MB |
| INT8 (onnx) | ~1.5MB | ~1.5MB |

```python
# 量化导出示例
model.export(format="onnx", imgsz=640, int8=True)
```

### 4.3 模型版本管理

模型文件存放目录：

```
backend/models/
├── plant/
│   ├── plant_yolo11n.pt      # PyTorch格式
│   ├── plant_yolo11n.onnx    # ONNX格式
│   └── plant_yolo11n_int8.onnx  # 量化格式
└── pest/
    ├── pest_yolo11n.pt
    ├── pest_yolo11n.onnx
    └── pest_yolo11n_int8.onnx
```

---

## 5. 后端服务集成

### 5.1 服务架构

FastAPI 后端采用以下架构：

```
API 请求
    │
    ▼
┌─────────────────────┐
│  FastAPI Endpoints  │
│  /api/recognition   │
│  /api/diagnosis     │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│   RecognitionService│
│   - load_model()    │
│   - recognize()     │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│   YOLO Model        │
│   (ultralytics)    │
└─────────────────────┘
```

### 5.2 服务实现

植物识别服务 (`backend/app/services/recognition.py`)：

```python
class PlantRecognitionService:
    def __init__(self, model_path: str = "backend/models/plant/plant_yolo11n.pt"):
        self.model = None
        self.model_path = model_path
        self.classes = self._load_classes()
        self._load_model()

    def _load_model(self):
        from ultralytics import YOLO
        if os.path.exists(self.model_path):
            self.model = YOLO(self.model_path)
        else:
            # 降级：使用基础模型
            self.model = YOLO("yolo11n.pt")

    def recognize(self, image_path: str) -> dict:
        results = self.model(image_path)
        result = results[0]

        if result.boxes:
            best_idx = result.boxes.conf.argmax()
            box = result.boxes[best_idx]
            class_id = str(int(box.cls[0]))

            return {
                "id": class_id,
                "name": self.classes.get(class_id, {}).get("name", "未知"),
                "confidence": float(box.conf[0]),
                "care_tips": self.classes.get(class_id, {}).get("care_tips", "")
            }
        return {"id": "-1", "name": "未识别", "confidence": 0.0}
```

### 5.3 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/recognition/plant` | POST | 植物识别 |
| `/api/recognition/full` | POST | 完整识别（植物+病虫害） |
| `/api/diagnosis/pest` | POST | 病虫害识别 |
| `/api/diagnosis/full` | POST | 完整诊断 |

### 5.4 错误处理和降级策略

```python
def _load_model(self):
    try:
        from ultralytics import YOLO
        if os.path.exists(self.model_path):
            self.model = YOLO(self.model_path)
        else:
            # 降级：使用预训练基础模型
            self.model = YOLO("yolo11n.pt")
    except Exception as e:
        print(f"Warning: Could not load model: {e}")
        self.model = None  # 标记为不可用

def recognize(self, image_path: str) -> dict:
    if not self.model:
        # 返回模拟结果（服务降级）
        return {"id": "0", "name": "绿萝", "confidence": 0.95}
    # 正常推理...
```

---

## 6. 边缘设备部署

### 6.1 架构设计

React Native 边缘部署采用**离线优先**架构：

```
┌─────────────────────────────────────────┐
│           React Native App              │
├─────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────────┐ │
│  │ ModelManager│   │ RecognitionService│ │
│  │ - 下载模型  │   │ - 加载ONNX       │ │
│  │ - 版本管理  │   │ - 本地推理       │ │
│  └─────────────┘   └─────────────────┘ │
│          │                  │           │
│          ▼                  ▼           │
│  ┌─────────────────────────────────────┐│
│  │      ONNX Runtime (本地推理)       ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
           │                    │
           ▼                    ▼
    ┌──────────┐         ┌──────────┐
    │ 有网络    │         │ 无网络    │
    │ 服务器API │         │ 本地推理  │
    └──────────┘         └──────────┘
```

### 6.2 模型下载和更新

`frontend/src/services/ModelManager.ts`：

```typescript
class ModelManager {
  // 检查服务器端模型版本
  async checkForUpdates(): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/models/status`);
    const serverStatus = await response.json();
    const currentVersion = await AsyncStorage.getItem('model_version');
    return serverStatus.plant?.version !== currentVersion;
  }

  // 下载模型
  async downloadModels(onProgress?: (progress: number) => void): Promise<boolean> {
    // 从服务器下载 ONNX 模型文件
    const plantModel = await fetch(`${API_BASE_URL}/models/download/plant`);
    const pestModel = await fetch(`${API_BASE_URL}/models/download/pest`);

    // 保存到本地存储
    // ...

    await AsyncStorage.setItem('plant_model_downloaded', 'true');
    return true;
  }
}
```

### 6.3 离线/在线自适应

`frontend/src/services/recognitionService.ts`：

```typescript
import NetInfo from '@react-native-community/netinfo';

class PlantRecognitionService {
  async recognize(imageUri: string): Promise<PlantResult> {
    const online = await this.checkOnline();

    if (online) {
      return this.recognizeFromServer(imageUri);  // 服务器端识别
    } else {
      return this.recognizeLocal(imageUri);       // 本地推理
    }
  }

  private async checkOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }
}
```

### 6.4 存储和内存优化

| 优化策略 | 说明 |
|----------|------|
| INT8 量化 | 模型体积减少 50%+ |
| 按需下载 | 仅下载需要的模型 |
| 模型缓存 | 复用已加载模型 |
| 图像预处理 | 缩放到合适尺寸 (640x640) |

---

## 7. 测试与评估

### 7.1 精度评估指标

```python
# 使用 Ultralytics 内置评估
from ultralytics import YOLO

model = YOLO("backend/models/plant/plant_yolo11n.pt")
metrics = model.val()

print(f"mAP50: {metrics.box.map50}")    # IoU@50
print(f"mAP50-95: {metrics.box.map}")   # IoU@50-95
print(f"Precision: {metrics.box.mp}")   # 精确率
print(f"Recall: {metrics.box.mr}")      # 召回率
```

### 7.2 性能测试

```python
import time
from ultralytics import YOLO

model = YOLO("backend/models/plant/plant_yolo11n.pt")

# 推理速度测试
times = []
for _ in range(100):
    start = time.time()
    model("test.jpg")
    times.append(time.time() - start)

avg_time = sum(times) / len(times)
print(f"平均推理时间: {avg_time*1000:.2f}ms")
```

### 7.3 单元测试

`backend/tests/test_recognition_api.py`：

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_recognition_endpoint():
    with open("test_image.jpg", "rb") as f:
        response = client.post(
            "/api/recognition/plant",
            files={"file": f}
        )
    assert response.status_code == 200
    assert "name" in response.json()
    assert "confidence" in response.json()
```

---

## 8. 部署最佳实践

### 8.1 Docker 部署

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 安装系统依赖（OpenCV需要）
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY . .

# 预热模型（启动时加载）
RUN python -c "from app.services.recognition import plant_recognition_service"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 8.2 模型版本管理

```bash
# 部署新模型
cp new_model.pt backend/models/plant/plant_yolo11n.pt

# 重启服务加载新模型
docker-compose restart backend
```

### 8.3 监控和日志

```python
# 结构化日志
import logging

logger = logging.getLogger("recognition")
logger.info(f"识别请求: image={image_id}, model={model_version}")
logger.info(f"识别结果: name={result['name']}, confidence={result['confidence']}")
```

关键指标监控：
- 推理延迟 (P50/P95/P99)
- 模型加载时间
- 识别成功率
- 置信度分布

---

## 附录

### A. 目录结构

```
Flower_Guardian/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints/
│   │   │       ├── recognition.py
│   │   │       ├── diagnosis.py
│   │   │       └── ...
│   │   ├── services/
│   │   │   ├── recognition.py
│   │   │   └── pest_recognition.py
│   │   └── main.py
│   ├── train/
│   │   ├── train_plant.py
│   │   ├── train_pest.py
│   │   ├── config.py
│   │   └── export_onnx.py
│   ├── models/
│   │   ├── plant/
│   │   └── pest/
│   └── dataset/
├── frontend/
│   └── src/
│       └── services/
│           ├── recognitionService.ts
│           ├── PestRecognition.ts
│           └── ModelManager.ts
└── docs/
    └── plans/
```

### B. 常用命令

```bash
# 启动后端服务
cd backend && uvicorn app.main:app --reload

# 训练模型
python backend/train/train_plant.py

# 导出 ONNX
python backend/train/export_onnx.py --type all

# 运行测试
pytest backend/tests/
```

### C. 参考资料

- [Ultralytics YOLO 文档](https://docs.ultralytics.com/)
- [ONNX Runtime React Native](https://onnxruntime.ai/docs/tutorials/mobile/)
- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
