# YOLO26 模型训练优化设计方案

## 项目概述

为 Flower Guardian 应用优化植物识别和病虫害识别模型，使用最新的 YOLO26 架构，旨在提升检测精度至 mAP50 > 0.90。

## 训练目标

| 模型 | 类别数 | 训练集 | 验证集 | 目标精度 |
|------|--------|--------|--------|----------|
| 植物识别 | 47 类 | 42,535 | 4,469 | mAP50 > 0.90 |
| 病虫害识别 | 12 类 | 27,816 | 3,541 | mAP50 > 0.90 |

## YOLO26 关键特性

1. **STAL (Small Target Aware Label Assignment)** - 提升小目标检测能力
2. **ProgLoss (Progressive Loss Balance)** - 稳定训练过程，提升检测精度
3. **MuSGD 优化器** - 更稳定的收敛
4. **移除 DFL** - 简化边界框预测，提升边缘部署兼容性
5. **端到端 NMS-free 推理** - 降低推理延迟

## 训练配置

### 方案 A：YOLO26-Small 平衡训练（推荐）

```python
# 模型配置
model_name = "yolo26s"  # Small 版本
epochs = 200
image_size = 640
batch_size = 16  # 根据 GPU 显存调整

# 数据增强（全部启用）
augmentation = {
    'mosaic': 1.0,      # Mosaic 增强
    'mixup': 0.15,      # MixUp 增强
    'copy_paste': 0.1,  # Copy-paste 增强
    'hsv_h': 0.015,    # 色相调整
    'hsv_s': 0.7,      # 饱和度调整
    'hsv_v': 0.4,      # 亮度调整
    'degrees': 0.0,    # 旋转
    'translate': 0.1,  # 平移
    'scale': 0.5,     # 缩放
    'shear': 0.0,      # 剪切
    'perspective': 0.0, # 透视
    'flipud': 0.0,     # 上下翻转
    'fliplr': 0.5,     # 左右翻转
}

# 学习率调度（两阶段）
lr0 = 0.01      # 初始学习率
lrf = 0.01      # 最终学习率（相对于 lr0）

# 第一阶段：100 epochs - 高学习率
# 第二阶段：100 epochs - 低学习率 (余弦退火)

# 其他优化
optimizer = "MuSGD"      # YOLO26 新优化器
patience = 20             # 早停耐心
warmup_epochs = 3        # 预热轮数
close_mosaic = 10         # 最后10个epoch关闭mosaic
```

## 训练命令

### 植物识别模型
```bash
cd dataset
python train/train_plant_model.py \
  --model s \
  --epochs 200 \
  --batch 16 \
  --size 640 \
  --device auto
```

### 病虫害识别模型
```bash
cd dataset
python train/train_pest_model.py \
  --model s \
  --epochs 200 \
  --batch 16 \
  --size 640 \
  --device auto
```

## 精度提升技巧

### 1. 数据增强策略
- **Mosaic**: 将4张图片合并为1张，增加上下文信息
- **MixUp**: 两张图片混合，增加泛化能力
- **Copy-paste**: 复制粘贴目标，增加小目标样本

### 2. 学习率调度
- 预热阶段 (warmup_epochs): 3 epochs
- 第一阶段: 100 epochs, lr=0.01
- 第二阶段: 100 epochs, lr 降至 0.001 (余弦退火)

### 3. 训练技巧
- `close_mosaic=10`: 最后10个epoch关闭Mosaic，提升最终精度
- `patience=20`: 早停机制，防止过拟合
- `val=True`: 每 epoch 验证，监控精度变化

### 4. 推理优化（TTA）
训练完成后可使用 Test Time Augmentation 进一步提升精度：
```python
# 推理时使用 TTA
model = YOLO("runs/plant/train_v2/weights/best.pt")
results = model.predict(image, augment=True)  # 启用 TTA
```

## 模型输出

| 模型 | 路径 | 格式 |
|------|------|------|
| 植物识别 | `runs/plant/train_v2/weights/best.pt` | PyTorch |
| 病虫害识别 | `runs/pest/train_v2/weights/best.pt` | PyTorch |

## 预期结果

- **植物识别**: mAP50 > 0.90
- **病虫害识别**: mAP50 > 0.90
- **训练时间**: 4-8 小时（取决于 GPU）
- **CPU 推理提升**: 相比 YOLO11 提升 43%

## 注意事项

1. 确保安装最新版本 ultralytics: `pip install -U ultralytics`
2. 确保 CUDA 可用以加速训练
3. 训练过程中可查看 `runs/plant/train_v2/results.png` 监控训练曲线
4. 训练完成后将 `best.pt` 复制到 `backend/models/` 替换现有模型
