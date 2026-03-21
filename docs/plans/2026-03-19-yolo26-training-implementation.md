# YOLO26 训练优化实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将植物识别和病虫害识别模型从 YOLO11 升级到 YOLO26，并优化训练配置以达到 mAP50 > 0.90 的精度目标。

**Architecture:** 使用 YOLO26-Small 模型，配合 STAL、ProgLoss、MuSGD 优化器，以及全面的数据增强策略提升检测精度。

**Tech Stack:** Ultralytics YOLO26, Python, PyTorch, CUDA

---

## 实现步骤

### 任务 1: 更新 train_plant_model.py 使用 YOLO26

**Files:**
- Modify: `dataset/train/train_plant_model.py`

**Step 1: 检查 ultralytics 版本**

```bash
cd /Users/ember/Flower_Guardian
pip show ultralytics
```

预期：如果版本 < 26.x，需要升级

**Step 2: 升级 ultralytics（如需要）**

```bash
pip install -U ultralytics
```

**Step 3: 修改训练脚本 - 模型名称**

在 `dataset/train/train_plant_model.py` 中找到第 139 行：

```python
# 修改前
model_name = f"yolo11{model_size}"

# 修改后
model_name = f"yolo26{model_size}"
```

**Step 4: 修改训练脚本 - 打印信息**

找到第 121 行：

```python
# 修改前
print(f"开始训练植物识别模型 YOLOv11-{model_size}")

# 修改后
print(f"开始训练植物识别模型 YOLO26-{model_size}")
```

**Step 5: 修改默认配置**

找到第 196 行附近，修改默认参数：

```python
# 修改前
parser.add_argument("--model", "-m", default="n", choices=["n", "s", "m", "l", "x"],

# 修改后
parser.add_argument("--model", "-m", default="s", choices=["n", "s", "m", "l", "x"],
```

**Step 6: 验证 YOLO26 可用**

```bash
cd /Users/ember/Flower_Guardian
python -c "from ultralytics import YOLO; m = YOLO('yolo26s.pt'); print('YOLO26 模型加载成功')"
```

预期输出：YOLO26 模型加载成功

---

### 任务 2: 更新 train_pest_model.py 使用 YOLO26

**Files:**
- Modify: `dataset/train/train_pest_model.py`

**Step 1: 修改模型名称**

在 `dataset/train/train_pest_model.py` 第 143 行：

```python
# 修改前
model_name = f"yolo11{model_size}"

# 修改后
model_name = f"yolo26{model_size}"
```

**Step 2: 修改打印信息**

找到第 123 行：

```python
# 修改前
print(f"开始训练病虫害识别模型 YOLOv11-{model_size}")

# 修改后
print(f"开始训练病虫害识别模型 YOLO26-{model_size}")
```

**Step 3: 修改默认模型大小**

找到第 198 行：

```python
# 修改前
parser.add_argument("--model", "-m", default="n", choices=["n", "s", "m", "l", "x"],

# 修改后
parser.add_argument("--model", "-m", default="s", choices=["n", "s", "m", "l", "x"],
```

---

### 任务 3: 添加高级训练配置

**Files:**
- Modify: `dataset/train/train_plant_model.py:143-160`
- Modify: `dataset/train/train_pest_model.py:145-162`

**Step 1: 添加数据增强参数**

在两个训练脚本的 `model.train()` 调用中添加增强配置：

```python
# 在 train_plant_model.py 第 144-158 行附近，添加以下参数：

results = model.train(
    data="backend/dataset/processed/plant_train.yaml",
    epochs=epochs,
    batch=batch_size,
    imgsz=image_size,
    device=actual_device,
    project="runs/plant",
    name="train_v2",  # 修改为 train_v2
    exist_ok=True,
    patience=20,  # 增加早停耐心
    save=True,
    plots=True,
    val=True,
    workers=num_workers,
    # 新增：高级数据增强
    mosaic=1.0,       # Mosaic 增强
    mixup=0.15,       # MixUp 增强
    copy_paste=0.1,   # Copy-paste 增强
    hsv_h=0.015,      # 色相调整
    hsv_s=0.7,        # 饱和度调整
    hsv_v=0.4,        # 亮度调整
    degrees=0.0,      # 旋转
    translate=0.1,    # 平移
    scale=0.5,        # 缩放
    shear=0.0,        # 剪切
    perspective=0.0,  # 透视
    flipud=0.0,      # 上下翻转
    fliplr=0.5,      # 左右翻转
    # 学习率配置
    lr0=0.01,        # 初始学习率
    lrf=0.01,        # 最终学习率
    warmup_epochs=3, # 预热轮数
    # 其他优化
    close_mosaic=10,  # 最后10个epoch关闭mosaic
)
```

**Step 2: 同步更新 pest 训练脚本**

同样在 `train_pest_model.py` 中添加相同配置，将 `project` 改为 `train_v2`。

---

### 任务 4: 验证训练脚本语法

**Step 1: 运行语法检查**

```bash
cd /Users/ember/Flower_Guardian/dataset
python -m py_compile train/train_plant_model.py
python -m py_compile train/train_pest_model.py
```

预期输出：无错误

---

### 任务 5: 执行植物识别模型训练（可选）

**Step 1: 开始训练**

```bash
cd /Users/ember/Flower_Guardian/dataset
python train/train_plant_model.py --model s --epochs 200 --batch 16 --size 640
```

预期：训练开始，显示 YOLO26 相关信息

**Step 2: 监控训练**

训练过程中可查看：
- `runs/plant/train_v2/results.png` - 训练曲线
- `runs/plant/train_v2/weights/best.pt` - 最佳权重

---

### 任务 6: 执行病虫害识别模型训练（可选）

**Step 1: 开始训练**

```bash
cd /Users/ember/Flower_Guardian/dataset
python train/train_pest_model.py --model s --epochs 200 --batch 16 --size 640
```

---

### 任务 7: 部署训练好的模型

**Step 1: 复制模型到后端目录**

```bash
# 植物识别模型
cp runs/plant/train_v2/weights/best.pt ../backend/models/plant.pt

# 病虫害识别模型
cp runs/pest/train_v2/weights/best.pt ../backend/models/pest.pt
```

**Step 2: 验证模型加载**

```bash
cd /Users/ember/Flower_Guardian/backend
python -c "from ultralytics import YOLO; m = YOLO('models/plant.pt'); print(f'模型类别数: {m.model.nc}')"
```

---

## 执行选项

**计划完成并保存到 `docs/plans/2026-03-19-yolo26-training-implementation.md`。两种执行方式：**

1. **Subagent-Driven（本会话）** - 我为每个任务分配子代理，任务间审查，快速迭代

2. **Parallel Session（单独会话）** - 在新会话中使用 executing-plans，批量执行并设置检查点

**选择哪种方式？**
