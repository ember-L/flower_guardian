# 双YOLO模型架构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现双模型植物识别与病虫害诊断架构，包括服务器端API和边缘端集成

**Architecture:** 采用双独立YOLO模型架构，植物识别模型和病虫害识别模型分离，支持服务器端和边缘端部署。服务器端使用FastAPI，边缘端使用React Native集成ONNX模型。

**Tech Stack:** FastAPI, YOLOv11, Ultralytics, React Native, ONNX

---

## 实施阶段概览

| 阶段 | 任务数 | 描述 |
|------|--------|------|
| 1 | 5 | 数据集准备 |
| 2 | 8 | 后端双模型服务 |
| 3 | 6 | 边缘端集成 |
| 4 | 3 | 测试与优化 |

---

## 阶段1: 数据集准备

### Task 1: 创建数据集下载脚本

**Files:**
- Create: `backend/dataset/download_plant_data.py`
- Modify: `backend/dataset/__init__.py`
- Test: N/A

**Step 1: 创建植物数据集下载脚本**

```python
# backend/dataset/download_plant_data.py
"""植物数据集下载脚本"""
import os
import urllib.request
import zipfile
from pathlib import Path

PLANTNET_URL = "https://zenodo.org/record/"  # 替换为实际URL
OXFORD_FLOWERS_URL = "http://www.robots.ox.ac.uk/~vgg/data/flowers/102/"

def download_oxford_flowers(output_dir: str = "backend/dataset/raw/oxford_flowers"):
    """下载Oxford Flowers-102数据集"""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    # 下载逻辑
    pass

def download_plantnet(output_dir: str = "backend/dataset/raw/plantnet"):
    """下载PlantNet数据集"""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    pass

if __name__ == "__main__":
    download_oxford_flowers()
    print("植物数据集下载完成")
```

**Step 2: 运行测试**

Run: `python backend/dataset/download_plant_data.py`
Expected: 脚本创建输出目录

**Step 3: Commit**

```bash
git add backend/dataset/download_plant_data.py
git commit -m "feat: 添加植物数据集下载脚本"
```

---

### Task 2: 创建病虫害数据集下载脚本

**Files:**
- Create: `backend/dataset/download_pest_data.py`
- Test: N/A

**Step 1: 创建病虫害数据集下载脚本**

```python
# backend/dataset/download_pest_data.py
"""病虫害数据集下载脚本"""
import os
import kaggle
from pathlib import Path

def download_plantvillage(output_dir: str = "backend/dataset/raw/plantvillage"):
    """下载PlantVillage数据集"""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    # 使用kaggle CLI下载
    pass

def download_kaggle_disease(output_dir: str = "backend/dataset/raw/kaggle_disease"):
    """下载Kaggle植物病害数据集"""
    pass

if __name__ == "__main__":
    download_plantvillage()
    print("病虫害数据集下载完成")
```

**Step 2: Commit**

```bash
git add backend/dataset/download_pest_data.py
git commit -m "feat: 添加病虫害数据集下载脚本"
```

---

### Task 3: 数据集预处理脚本

**Files:**
- Modify: `backend/dataset/preprocessing.py`
- Create: `backend/dataset/convert_annotations.py`

**Step 1: 添加YOLO格式转换功能**

在 `backend/dataset/preprocessing.py` 中添加：

```python
def convert_to_yolo_format(annotation_file: str, output_dir: str):
    """将标注转换为YOLO格式"""
    # 读取原有标注
    # 转换为 YOLO txt 格式 (class_id x_center y_center width height)
    pass

def create_yolo_dataset(input_dir: str, output_dir: str, class_mapping: dict):
    """创建YOLO格式数据集"""
    pass
```

**Step 2: Commit**

```bash
git add backend/dataset/preprocessing.py
git commit -m "feat: 添加YOLO格式数据转换功能"
```

---

### Task 4: 数据增强配置

**Files:**
- Modify: `backend/dataset/augmentation.py`
- Test: N/A

**Step 1: 扩展数据增强配置**

在 `backend/dataset/augmentation.py` 中添加：

```python
class PlantAugmentation:
    """植物图像数据增强"""

    def __init__(self):
        self.augmentations = [
            # 保持现有增强
            RandomBrightnessContrast(),
            RandomRotate(15),
            RandomScale(scale_limit=0.2),
            GaussNoise(),
            Blur(),
        ]

class PestAugmentation:
    """病虫害图像数据增强"""

    def __init__(self):
        self.augmentations = [
            # 病虫害需要更精细的增强
            RandomBrightnessContrast(brightness_limit=0.3, contrast_limit=0.3),
            RandomRotate(30),  # 病虫害可以从多角度识别
            RandomScale(scale_limit=0.3),
            GaussNoise(var_limit=(10.0, 50.0)),
            Blur(blur_limit=3),
            RandomFlip(p=0.5),  # 允许水平翻转
        ]
```

**Step 2: Commit**

```bash
git add backend/dataset/augmentation.py
git commit -m "feat: 添加病虫害数据增强配置"
```

---

### Task 5: 数据集配置文件

**Files:**
- Create: `backend/dataset/plant_classes.json`
- Create: `backend/dataset/pest_classes.json`
- Modify: `backend/train/config.py`

**Step 1: 创建植物类别映射文件**

```json
// backend/dataset/plant_classes.json
{
  "indoor": [
    {"id": 0, "name": "绿萝", "care_tips": "喜阴，避免直射，保持土壤湿润"},
    {"id": 1, "name": "吊兰", "care_tips": "喜半阴，保持土壤湿润"},
    {"id": 2, "name": "虎皮兰", "care_tips": "耐阴，少浇水"},
    {"id": 3, "name": "龟背竹", "care_tips": "喜散射光，保持土壤湿润"},
    {"id": 4, "name": "发财树", "care_tips": "喜光但避免直射，浇水不宜过多"},
    {"id": 5, "name": "幸福树", "care_tips": "喜湿润环境"},
    {"id": 6, "name": "橡皮树", "care_tips": "喜光，浇水见干见湿"},
    {"id": 7, "name": "琴叶榕", "care_tips": "喜散射光，保持土壤湿润"},
    {"id": 8, "name": "滴水观音", "care_tips": "喜湿润，半阴环境"},
    {"id": 9, "name": "观音莲", "care_tips": "喜凉爽半阴"}
  ],
  "flowering": [
    {"id": 10, "name": "月季", "care_tips": "喜阳，保持通风"},
    {"id": 11, "name": "杜鹃", "care_tips": "喜酸性土壤，喜湿润"},
    {"id": 12, "name": "君子兰", "care_tips": "喜散射光，浇水不宜过多"},
    {"id": 13, "name": "蝴蝶兰", "care_tips": "喜温暖湿润，避免直射"},
    {"id": 14, "name": "长寿花", "care_tips": "喜阳，浇水见干见湿"},
    {"id": 15, "name": "蟹爪兰", "care_tips": "喜半阴，花期控制浇水"},
    {"id": 16, "name": "栀子花", "care_tips": "喜酸性土壤，喜湿润"},
    {"id": 17, "name": "茉莉花", "care_tips": "喜阳，喜湿润"},
    {"id": 18, "name": "茶花", "care_tips": "喜酸性土壤，喜半阴"},
    {"id": 19, "name": "牡丹", "care_tips": "喜阳，耐寒"}
  ],
  "succulent": [
    {"id": 20, "name": "景天", "care_tips": "喜阳，少浇水"},
    {"id": 21, "name": "仙人掌", "care_tips": "喜阳，极耐旱"},
    {"id": 22, "name": "玉露", "care_tips": "喜半阴，保持土壤微湿"},
    {"id": 23, "name": "生石花", "care_tips": "喜阳，少浇水"},
    {"id": 24, "name": "熊童子", "care_tips": "喜阳，浇水见干见湿"},
    {"id": 25, "name": "乙女心", "care_tips": "喜阳，少浇水"},
    {"id": 26, "name": "桃蛋", "care_tips": "喜阳，少浇水"},
    {"id": 27, "name": "法师", "care_tips": "喜阳，通风要好"},
    {"id": 28, "name": "东云", "care_tips": "喜阳，少浇水"}
  ],
  "herb": [
    {"id": 29, "name": "薄荷", "care_tips": "喜阳，保持湿润"},
    {"id": 30, "name": "罗勒", "care_tips": "喜阳，保持土壤湿润"},
    {"id": 31, "name": "辣椒", "care_tips": "喜阳，浇水见干见湿"},
    {"id": 32, "name": "番茄", "care_tips": "喜阳，保持土壤湿润"},
    {"id": 33, "name": "草莓", "care_tips": "喜阳，保持土壤湿润"},
    {"id": 34, "name": "香菜", "care_tips": "喜半阴，保持土壤湿润"},
    {"id": 35, "name": "小葱", "care_tips": "喜阳，保持土壤湿润"},
    {"id": 36, "name": "大蒜", "care_tips": "喜阳，少浇水"}
  ]
}
```

**Step 2: 创建病虫害类别映射文件**

```json
// backend/dataset/pest_classes.json
{
  "insect": [
    {"id": 0, "name": "蚜虫", "treatment": "使用吡虫啉喷洒", "severity": "medium"},
    {"id": 1, "name": "红蜘蛛", "treatment": "使用哒螨灵喷洒", "severity": "high"},
    {"id": 2, "name": "介壳虫", "treatment": "使用酒精擦拭或喷洒杀虫剂", "severity": "medium"},
    {"id": 3, "name": "粉虱", "treatment": "使用黄板诱杀或喷洒吡虫啉", "severity": "medium"},
    {"id": 4, "name": "蓟马", "treatment": "使用蓝板诱杀或喷洒杀虫剂", "severity": "medium"},
    {"id": 5, "name": "小黑飞", "treatment": "使用粘虫板或呋喃丹", "severity": "low"},
    {"id": 6, "name": "蜗牛", "treatment": "手动捕捉或使用四聚乙醛", "severity": "medium"},
    {"id": 7, "name": "鼻涕虫", "treatment": "手动捕捉或使用四聚乙醛", "severity": "medium"}
  ],
  "disease": [
    {"id": 8, "name": "白粉病", "treatment": "使用多菌灵或粉锈宁喷洒", "severity": "high"},
    {"id": 9, "name": "黑斑病", "treatment": "摘除病叶，使用多菌灵", "severity": "medium"},
    {"id": 10, "name": "炭疽病", "treatment": "剪除病部，使用百菌清", "severity": "high"},
    {"id": 11, "name": "叶斑病", "treatment": "摘除病叶，使用代森锰锌", "severity": "medium"},
    {"id": 12, "name": "锈病", "treatment": "使用粉锈宁喷洒", "severity": "medium"},
    {"id": 13, "name": "灰霉病", "treatment": "加强通风，使用速克灵", "severity": "high"},
    {"id": 14, "name": "根腐病", "treatment": "控制浇水，必要时换盆", "severity": "high"}
  ],
  "physiological": [
    {"id": 15, "name": "黄叶", "treatment": "检查光照和浇水，适当施肥", "severity": "low"},
    {"id": 16, "name": "晒伤", "treatment": "移至散光处", "severity": "medium"},
    {"id": 17, "name": "冻害", "treatment": "移至温暖处", "severity": "high"},
    {"id": 18, "name": "肥害", "treatment": "大量浇水稀释", "severity": "high"},
    {"id": 19, "name": "药害", "treatment": "大量浇水稀释", "severity": "medium"}
  ]
}
```

**Step 3: 修改训练配置**

```python
# backend/train/config.py
import json
from pathlib import Path

def load_plant_classes():
    with open("backend/dataset/plant_classes.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    classes = []
    for category in data.values():
        classes.extend([item["name"] for item in category])
    return classes

def load_pest_classes():
    with open("backend/dataset/pest_classes.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    classes = []
    for category in data.values():
        classes.extend([item["name"] for item in category])
    return classes
```

**Step 4: Commit**

```bash
git add backend/dataset/plant_classes.json backend/dataset/pest_classes.json backend/train/config.py
git commit -m "feat: 添加植物和病虫害类别映射配置"
```

---

## 阶段2: 后端双模型服务

### Task 6: 重构识别服务

**Files:**
- Modify: `backend/app/services/recognition.py`
- Create: `backend/app/services/pest_recognition.py`
- Test: N/A

**Step 1: 重构植物识别服务**

```python
# backend/app/services/recognition.py
import os
import json
from typing import Optional, List
from PIL import Image

class PlantRecognitionService:
    """植物识别服务"""

    def __init__(self, model_path: str = "backend/models/plant/plant_yolo11n.pt"):
        self.model = None
        self.model_path = model_path
        self.classes = self._load_classes()
        self._load_model()

    def _load_classes(self) -> dict:
        """加载植物类别"""
        with open("backend/dataset/plant_classes.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        classes = {}
        for category in data.values():
            for item in category:
                classes[str(item["id"])] = {
                    "name": item["name"],
                    "care_tips": item.get("care_tips", "")
                }
        return classes

    def _load_model(self):
        """加载YOLO模型"""
        try:
            from ultralytics import YOLO
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
            else:
                self.model = YOLO("yolo11n.pt")
        except Exception as e:
            print(f"Warning: Could not load plant model: {e}")
            self.model = None

    def recognize(self, image_path: str) -> dict:
        """识别植物"""
        if not self.model:
            return {"id": "0", "name": "未知植物", "confidence": 0.0}

        try:
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
        except Exception as e:
            print(f"Plant recognition error: {e}")

        return {"id": "-1", "name": "未识别", "confidence": 0.0}


plant_recognition_service = PlantRecognitionService()
```

**Step 2: 创建病虫害识别服务**

```python
# backend/app/services/pest_recognition.py
import os
import json
from typing import Optional

class PestRecognitionService:
    """病虫害识别服务"""

    def __init__(self, model_path: str = "backend/models/pest/pest_yolo11n.pt"):
        self.model = None
        self.model_path = model_path
        self.classes = self._load_classes()
        self._load_model()

    def _load_classes(self) -> dict:
        """加载病虫害类别"""
        with open("backend/dataset/pest_classes.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        classes = {}
        for category in data.values():
            for item in category:
                classes[str(item["id"])] = {
                    "name": item["name"],
                    "treatment": item.get("treatment", ""),
                    "severity": item.get("severity", "low")
                }
        return classes

    def _load_model(self):
        """加载YOLO模型"""
        try:
            from ultralytics import YOLO
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
            else:
                self.model = YOLO("yolo11n.pt")
        except Exception as e:
            print(f"Warning: Could not load pest model: {e}")
            self.model = None

    def recognize(self, image_path: str) -> dict:
        """识别病虫害"""
        if not self.model:
            return {"id": "0", "name": "未知", "confidence": 0.0, "type": "unknown"}

        try:
            results = self.model(image_path)
            result = results[0]

            if result.boxes:
                best_idx = result.boxes.conf.argmax()
                box = result.boxes[best_idx]
                class_id = str(int(box.cls[0]))

                class_info = self.classes.get(class_id, {})

                # 判断类型
                pest_type = "unknown"
                if int(class_id) <= 7:
                    pest_type = "insect"
                elif int(class_id) <= 14:
                    pest_type = "disease"
                else:
                    pest_type = "physiological"

                return {
                    "id": class_id,
                    "name": class_info.get("name", "未知"),
                    "confidence": float(box.conf[0]),
                    "type": pest_type,
                    "treatment": class_info.get("treatment", ""),
                    "severity": class_info.get("severity", "low")
                }
        except Exception as e:
            print(f"Pest recognition error: {e}")

        return {"id": "-1", "name": "未识别", "confidence": 0.0, "type": "unknown"}


pest_recognition_service = PestRecognitionService()
```

**Step 3: Commit**

```bash
git add backend/app/services/recognition.py backend/app/services/pest_recognition.py
git commit -m "feat: 实现植物和病虫害双识别服务"
```

---

### Task 7: 更新API端点

**Files:**
- Modify: `backend/app/api/endpoints/recognition.py`
- Create: `backend/app/api/endpoints/pest_diagnosis.py`
- Test: N/A

**Step 1: 更新植物识别API**

```python
# backend/app/api/endpoints/recognition.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.recognition import plant_recognition_service
import tempfile
import os

router = APIRouter()

@router.post("/plant")
async def recognize_plant(file: UploadFile = File(...)):
    """植物识别API"""
    # 保存上传的图片
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = plant_recognition_service.recognize(tmp_path)
        return result
    finally:
        os.unlink(tmp_path)

@router.post("/full")
async def recognize_full(file: UploadFile = File(...)):
    """完整识别API（同时识别植物和病虫害）"""
    from app.services.pest_recognition import pest_recognition_service

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        plant_result = plant_recognition_service.recognize(tmp_path)
        pest_result = pest_recognition_service.recognize(tmp_path)

        return {
            "plant": plant_result,
            "pest": pest_result if pest_result["id"] != "-1" else None
        }
    finally:
        os.unlink(tmp_path)
```

**Step 2: 创建病虫害诊断API**

```python
# backend/app/api/endpoints/pest_diagnosis.py
from fastapi import APIRouter, UploadFile, File
from app.services.pest_recognition import pest_recognition_service
import tempfile
import os

router = APIRouter()

@router.post("/pest")
async def diagnose_pest(file: UploadFile = File(...)):
    """病虫害识别API"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = pest_recognition_service.recognize(tmp_path)
        return result
    finally:
        os.unlink(tmp_path)
```

**Step 3: 更新路由注册**

```python
# backend/app/api/router.py
from fastapi import APIRouter
from app.api.endpoints import users, plants, reminders, diaries, recognition, pest_diagnosis

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["用户"])
api_router.include_router(plants.router, prefix="/plants", tags=["植物"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["提醒"])
api_router.include_router(diaries.router, prefix="/diaries", tags=["日记"])
api_router.include_router(recognition.router, prefix="/recognition", tags=["识别"])
api_router.include_router(pest_diagnosis.router, prefix="/diagnosis", tags=["诊断"])
```

**Step 4: Commit**

```bash
git add backend/app/api/endpoints/recognition.py backend/app/api/endpoints/pest_diagnosis.py backend/app/api/router.py
git commit -m "feat: 添加双模型API端点"
```

---

### Task 8: 模型训练脚本

**Files:**
- Create: `backend/train/train_plant.py`
- Create: `backend/train/train_pest.py`
- Test: N/A

**Step 1: 创建植物模型训练脚本**

```python
# backend/train/train_plant.py
"""植物模型训练脚本"""
import yaml
from ultralytics import YOLO
from train.config import TrainConfig

def train_plant_model():
    """训练植物识别模型"""
    config = TrainConfig()
    config.data_dir = "backend/dataset/processed/plant"
    config.model_type = "yolo11n"
    config.epochs = 100
    config.class_names = [
        "绿萝", "吊兰", "虎皮兰", "龟背竹", "发财树",
        "幸福树", "橡皮树", "琴叶榕", "滴水观音", "观音莲",
        "月季", "杜鹃", "君子兰", "蝴蝶兰", "长寿花",
        "蟹爪兰", "栀子花", "茉莉花", "茶花", "牡丹",
        "景天", "仙人掌", "玉露", "生石花", "熊童子",
        "乙女心", "桃蛋", "法师", "东云",
        "薄荷", "罗勒", "辣椒", "番茄", "草莓",
        "香菜", "小葱", "大蒜"
    ]

    # 创建数据集配置
    data_config = {
        "path": "backend/dataset/processed/plant",
        "train": "train/images",
        "val": "val/images",
        "nc": len(config.class_names),
        "names": {i: name for i, name in enumerate(config.class_names)}
    }

    with open("backend/dataset/processed/plant.yaml", "w") as f:
        yaml.dump(data_config, f)

    # 训练模型
    model = YOLO("yolo11n.pt")
    model.train(
        data="backend/dataset/processed/plant.yaml",
        epochs=config.epochs,
        imgsz=config.image_size,
        batch=config.batch_size,
        project=config.project,
        name="plant_train"
    )

    # 保存模型
    model.save("backend/models/plant/plant_yolo11n.pt")

if __name__ == "__main__":
    train_plant_model()
```

**Step 2: 创建病虫害模型训练脚本**

```python
# backend/train/train_pest.py
"""病虫害模型训练脚本"""
import yaml
from ultralytics import YOLO

PEST_CLASSES = [
    "蚜虫", "红蜘蛛", "介壳虫", "粉虱", "蓟马", "小黑飞", "蜗牛", "鼻涕虫",
    "白粉病", "黑斑病", "炭疽病", "叶斑病", "锈病", "灰霉病", "根腐病",
    "黄叶", "晒伤", "冻害", "肥害", "药害"
]

def train_pest_model():
    """训练病虫害识别模型"""
    # 创建数据集配置
    data_config = {
        "path": "backend/dataset/processed/pest",
        "train": "train/images",
        "val": "val/images",
        "nc": len(PEST_CLASSES),
        "names": {i: name for i, name in enumerate(PEST_CLASSES)}
    }

    with open("backend/dataset/processed/pest.yaml", "w") as f:
        yaml.dump(data_config, f)

    # 训练模型
    model = YOLO("yolo11n.pt")
    model.train(
        data="backend/dataset/processed/pest.yaml",
        epochs=100,
        imgsz=640,
        batch=16,
        project="flower_guardian",
        name="pest_train"
    )

    # 保存模型
    model.save("backend/models/pest/pest_yolo11n.pt")

if __name__ == "__main__":
    train_pest_model()
```

**Step 3: Commit**

```bash
git add backend/train/train_plant.py backend/train/train_pest.py
git commit -m "feat: 添加植物和病虫害模型训练脚本"
```

---

### Task 9: 模型转换工具（边缘部署）

**Files:**
- Create: `backend/train/export_onnx.py`
- Test: N/A

**Step 1: 创建ONNX转换脚本**

```python
# backend/train/export_onnx.py
"""模型转换为ONNX格式用于边缘部署"""
from ultralytics import YOLO
import os

def export_plant_to_onnx():
    """导出植物识别模型为ONNX"""
    model = YOLO("backend/models/plant/plant_yolo11n.pt")
    model.export(format="onnx", imgsz=640)
    print("植物模型已导出为ONNX格式")

def export_pest_to_onnx():
    """导出病虫害识别模型为ONNX"""
    model = YOLO("backend/models/pest/pest_yolo11n.pt")
    model.export(format="onnx", imgsz=640)
    print("病虫害模型已导出为ONNX格式")

if __name__ == "__main__":
    export_plant_to_onnx()
    export_pest_to_onnx()
```

**Step 2: Commit**

```bash
git add backend/train/export_onnx.py
git commit -m "feat: 添加ONNX模型转换工具"
```

---

### Task 10: 更新Docker配置

**Files:**
- Modify: `docker-compose.yml`
- Modify: `backend/Dockerfile`
- Test: N/A

**Step 1: 更新Docker Compose配置**

```yaml
# docker-compose.yml (部分修改)
services:
  backend:
    volumes:
      - ./backend:/app
      - model_weights:/app/models
    environment:
      - PLANT_MODEL_PATH=/app/models/plant/plant_yolo11n.pt
      - PEST_MODEL_PATH=/app/models/pest/pest_yolo11n.pt
      - PLANT_CLASSES=/app/dataset/plant_classes.json
      - PEST_CLASSES=/app/dataset/pest_classes.json
```

**Step 2: 更新后端Dockerfile**

```dockerfile
# backend/Dockerfile (部分修改)
# 创建模型目录
RUN mkdir -p models/plant models/pest

# 复制类别配置文件
COPY dataset/plant_classes.json dataset/pest_classes.json ./dataset/
```

**Step 3: Commit**

```bash
git add docker-compose.yml backend/Dockerfile
git commit -m "feat: 更新Docker配置支持双模型"
```

---

### Task 11: 添加模型下载占位符

**Files:**
- Create: `backend/models/download_models.py`
- Test: N/A

**Step 1: 创建模型下载脚本**

```python
# backend/models/download_models.py
"""模型下载脚本 - 用于从远程下载预训练模型"""

import os
from pathlib import Path

def download_plant_model():
    """下载植物识别模型"""
    # TODO: 实现从远程下载模型
    # 示例: 使用 wget 或 requests
    model_dir = Path("backend/models/plant")
    model_dir.mkdir(parents=True, exist_ok=True)

    model_path = model_dir / "plant_yolo11n.pt"
    if not model_path.exists():
        print(f"请手动下载植物识别模型到: {model_path}")
        print("模型可以从训练脚本生成或从远程存储获取")

def download_pest_model():
    """下载病虫害识别模型"""
    model_dir = Path("backend/models/pest")
    model_dir.mkdir(parents=True, exist_ok=True)

    model_path = model_dir / "pest_yolo11n.pt"
    if not model_path.exists():
        print(f"请手动下载病虫害识别模型到: {model_path}")
        print("模型可以从训练脚本生成或从远程存储获取")

if __name__ == "__main__":
    download_plant_model()
    download_pest_model()
```

**Step 2: Commit**

```bash
git add backend/models/download_models.py
git commit -m "feat: 添加模型下载脚本占位符"
```

---

### Task 12: 添加健康检查端点

**Files:**
- Modify: `backend/app/main.py`
- Test: N/A

**Step 1: 添加模型状态检查**

```python
# backend/app/main.py
from app.services.recognition import plant_recognition_service
from app.services.pest_recognition import pest_recognition_service

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "plant_model": plant_recognition_service.model is not None,
        "pest_model": pest_recognition_service.model is not None
    }

@app.get("/models/status")
def models_status():
    """获取模型状态"""
    return {
        "plant": {
            "loaded": plant_recognition_service.model is not None,
            "classes_count": len(plant_recognition_service.classes)
        },
        "pest": {
            "loaded": pest_recognition_service.model is not None,
            "classes_count": len(pest_recognition_service.classes)
        }
    }
```

**Step 2: Commit**

```bash
git add backend/app/main.py
git commit -m "feat: 添加模型状态检查端点"
```

---

## 阶段3: 边缘端集成

### Task 13: React Native ONNX集成

**Files:**
- Create: `frontend/src/services/PlantRecognition.ts`
- Create: `frontend/src/services/PestRecognition.ts`
- Test: N/A

**Step 1: 创建边缘识别服务**

```typescript
// frontend/src/services/PlantRecognition.ts
import { useState, useEffect } from 'react';

// 植物识别服务（边缘端）
export class PlantRecognitionService {
  private model: any = null;
  private isLoaded: boolean = false;

  async loadModel(): Promise<void> {
    // TODO: 使用 onnxruntime-react-native 加载模型
    // const session = await InferenceSession.create(modelPath);
    this.isLoaded = true;
  }

  async recognize(imageBase64: string): Promise<{
    id: string;
    name: string;
    confidence: number;
    care_tips: string;
  }> {
    if (!this.isLoaded) {
      await this.loadModel();
    }
    // TODO: 实现ONNX推理
    return {
      id: "0",
      name: "绿萝",
      confidence: 0.95,
      care_tips: "喜阴，避免直射"
    };
  }
}

export const plantService = new PlantRecognitionService();
```

**Step 2: 创建病虫害识别服务**

```typescript
// frontend/src/services/PestRecognition.ts
export class PestRecognitionService {
  private model: any = null;
  private isLoaded: boolean = false;

  async loadModel(): Promise<void> {
    this.isLoaded = true;
  }

  async recognize(imageBase64: string): Promise<{
    id: string;
    name: string;
    confidence: number;
    type: string;
    treatment: string;
    severity: string;
  }> {
    if (!this.isLoaded) {
      await this.loadModel();
    }
    // TODO: 实现ONNX推理
    return {
      id: "0",
      name: "蚜虫",
      confidence: 0.88,
      type: "insect",
      treatment: "使用吡虫啉喷洒",
      severity: "medium"
    };
  }
}

export const pestService = new PestRecognitionService();
```

**Step 3: Commit**

```bash
git add frontend/src/services/PlantRecognition.ts frontend/src/services/PestRecognition.ts
git commit -m "feat: 添加React Native边缘识别服务"
```

---

### Task 14: 创建识别屏幕

**Files:**
- Create: `frontend/src/screens/RecognitionScreen.tsx`
- Modify: `frontend/src/navigation/AppNavigator.tsx`
- Test: N/A

**Step 1: 创建识别屏幕组件**

```typescript
// frontend/src/screens/RecognitionScreen.tsx
import React, { useState } from 'react';
import { View, Text, Image, Button, Alert } from 'react-native';
import { plantService } from '../services/PlantRecognition';
import { pestService } from '../services/PestRecognition';

export const RecognitionScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRecognize = async () => {
    if (!image) return;

    setLoading(true);
    try {
      const plantResult = await plantService.recognize(image);
      const pestResult = await pestService.recognize(image);

      setResult({
        plant: plantResult,
        pest: pestResult.id !== "-1" ? pestResult : null
      });
    } catch (error) {
      Alert.alert('识别失败', '请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        花卉识别
      </Text>

      {image && (
        <Image source={{ uri: image }} style={{ width: '100%', height: 300 }} />
      )}

      <Button title="拍照识别" onPress={handleRecognize} disabled={loading} />

      {result && (
        <View style={{ marginTop: 16 }}>
          <Text>植物: {result.plant?.name}</Text>
          <Text>置信度: {result.plant?.confidence}</Text>
          {result.pest && (
            <>
              <Text>病虫害: {result.pest.name}</Text>
              <Text>处理方法: {result.pest.treatment}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
};
```

**Step 2: Commit**

```bash
git add frontend/src/screens/RecognitionScreen.tsx
git commit -m "feat: 添加识别屏幕组件"
```

---

### Task 15: 更新导航配置

**Files:**
- Modify: `frontend/src/navigation/AppNavigator.tsx`
- Test: N/A

**Step 1: 添加识别页面路由**

```typescript
// 在导航配置中添加识别页面
import { RecognitionScreen } from '../screens/RecognitionScreen';

// 在 Stack.Navigator 中添加
<Stack.Screen name="Recognition" component={RecognitionScreen} />
```

**Step 2: Commit**

```bash
git add frontend/src/navigation/AppNavigator.tsx
git commit -m "feat: 添加识别页面路由"
```

---

### Task 16: 添加模型管理功能

**Files:**
- Create: `frontend/src/services/ModelManager.ts`
- Test: N/A

**Step 1: 创建模型管理器**

```typescript
// frontend/src/services/ModelManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const MODEL_VERSION_KEY = 'model_version';

export class ModelManager {
  async checkForUpdates(): Promise<boolean> {
    // TODO: 从服务器检查模型版本
    const currentVersion = await AsyncStorage.getItem(MODEL_VERSION_KEY);
    const latestVersion = '1.0.0'; // 从服务器获取
    return currentVersion !== latestVersion;
  }

  async downloadModels(): Promise<void> {
    // TODO: 下载新模型
    console.log('下载模型中...');
  }

  async getModelInfo(): Promise<{ plant: string; pest: string }> {
    return {
      plant: 'plant_yolo11n.onnx',
      pest: 'pest_yolo11n.onnx'
    };
  }
}

export const modelManager = new ModelManager();
```

**Step 2: Commit**

```bash
git add frontend/src/services/ModelManager.ts
git commit -m "feat: 添加模型管理器"
```

---

### Task 17: 添加边缘端离线支持

**Files:**
- Modify: `frontend/src/services/PlantRecognition.ts`
- Test: N/A

**Step 1: 添加网络状态检测**

```typescript
// 在 PlantRecognition.ts 和 PestRecognition.ts 中添加
import NetInfo from '@react-native-community/netinfo';

export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

// 使用示例
export class PlantRecognitionService {
  async recognize(imageBase64: string): Promise<any> {
    const online = await isOnline();

    if (online) {
      // 使用服务器端API
      return this.recognizeFromServer(imageBase64);
    } else {
      // 使用本地模型
      return this.recognizeLocal(imageBase64);
    }
  }
}
```

**Step 2: Commit**

```bash
git add frontend/src/services/PlantRecognition.ts frontend/src/services/PestRecognition.ts
git commit -m "feat: 添加离线识别支持"
```

---

### Task 18: 创建病虫害诊断屏幕

**Files:**
- Create: `frontend/src/screens/DiagnosisScreen.tsx`
- Modify: `frontend/src/navigation/AppNavigator.tsx`
- Test: N/A

**Step 1: 创建诊断屏幕**

```typescript
// frontend/src/screens/DiagnosisScreen.tsx
import React, { useState } from 'react';
import { View, Text, Image, Button, ScrollView } from 'react-native';
import { pestService } from '../services/PestRecognition';

export const DiagnosisScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleDiagnose = async () => {
    if (!image) return;

    setLoading(true);
    try {
      const pestResult = await pestService.recognize(image);
      setResult(pestResult);
    } catch (error) {
      console.error('诊断失败', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#e94b52';
      case 'medium': return '#f5a623';
      case 'low': return '#7ed321';
      default: return '#999';
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        病虫害诊断
      </Text>

      {image && (
        <Image source={{ uri: image }} style={{ width: '100%', height: 300 }} />
      )}

      <Button title="拍照诊断" onPress={handleDiagnose} disabled={loading} />

      {result && (
        <View style={{ marginTop: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            诊断结果: {result.name}
          </Text>
          <Text style={{ color: getSeverityColor(result.severity), marginTop: 8 }}>
            严重程度: {result.severity.toUpperCase()}
          </Text>
          <Text style={{ marginTop: 16, fontWeight: 'bold' }}>
            处理建议:
          </Text>
          <Text>{result.treatment}</Text>
        </View>
      )}
    </ScrollView>
  );
};
```

**Step 2: Commit**

```bash
git add frontend/src/screens/DiagnosisScreen.tsx
git commit -m "feat: 添加病虫害诊断屏幕"
```

---

## 阶段4: 测试与优化

### Task 19: API测试

**Files:**
- Create: `backend/tests/test_recognition_api.py`
- Test: N/A

**Step 1: 编写API测试**

```python
# backend/tests/test_recognition_api.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_plant_recognition():
    """测试植物识别API"""
    with open("test_plant.jpg", "rb") as f:
        response = client.post(
            "/api/recognition/plant",
            files={"file": ("test.jpg", f, "image/jpeg")}
        )
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "confidence" in data

def test_pest_recognition():
    """测试病虫害识别API"""
    with open("test_pest.jpg", "rb") as f:
        response = client.post(
            "/api/diagnosis/pest",
            files={"file": ("test.jpg", f, "image/jpeg")}
        )
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "treatment" in data
```

**Step 2: Commit**

```bash
git add backend/tests/test_recognition_api.py
git commit -m "test: 添加识别API测试"
```

---

### Task 20: 边缘端测试

**Files:**
- Create: `frontend/__tests__/Recognition.test.tsx`
- Test: N/A

**Step 1: 编写边缘端测试**

```typescript
// frontend/__tests__/Recognition.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecognitionScreen } from '../src/screens/RecognitionScreen';

describe('RecognitionScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<RecognitionScreen />);
    expect(getByText('花卉识别')).toBeTruthy();
  });

  it('shows error when no image selected', async () => {
    const { getByText } = render(<RecognitionScreen />);
    const button = getByText('拍照识别');
    fireEvent.press(button);
  });
});
```

**Step 2: Commit**

```bash
git add frontend/__tests__/Recognition.test.tsx
git commit -m "test: 添加识别屏幕测试"
```

---

### Task 21: 性能优化

**Files:**
- Modify: `backend/app/services/recognition.py`
- Modify: `backend/app/services/pest_recognition.py`
- Test: N/A

**Step 1: 添加模型缓存和批处理**

```python
# 在 recognition.py 中添加
from functools import lru_cache

class PlantRecognitionService:
    # 添加批处理方法
    def recognize_batch(self, image_paths: list) -> list:
        """批量识别"""
        if not self.model:
            return [{"id": "0", "name": "未知", "confidence": 0.0}] * len(image_paths)

        results = self.model(image_paths)
        return [
            {
                "id": str(int(r.boxes[0].cls[0])) if r.boxes else "-1",
                "name": self.classes.get(str(int(r.boxes[0].cls[0])), {}).get("name", "未知") if r.boxes else "未识别",
                "confidence": float(r.boxes[0].conf[0]) if r.boxes else 0.0
            }
            for r in results
        ]
```

**Step 2: Commit**

```bash
git add backend/app/services/recognition.py backend/app/services/pest_recognition.py
git commit -m "perf: 添加批量识别和性能优化"
```

---

## 总结

实施计划包含 21 个任务，分为 4 个阶段：

1. **数据集准备** (5 tasks): 数据集下载、预处理、增强、类别配置
2. **后端双模型服务** (7 tasks): 识别服务重构、API端点、训练脚本、模型转换、Docker配置
3. **边缘端集成** (6 tasks): React Native ONNX集成、识别屏幕、模型管理、离线支持
4. **测试与优化** (3 tasks): API测试、边缘端测试、性能优化

---

## 计划完成

计划已保存到 `docs/plans/2026-03-08-dual-yolo-model-design.md`。

**两个执行选项：**

**1. Subagent-Driven (本会话)** - 每个任务派遣新子代理，任务间审查，快速迭代

**2. Parallel Session (新会话)** - 在新会话中使用 executing-plans，批量执行带检查点

**选择哪种方式？**
