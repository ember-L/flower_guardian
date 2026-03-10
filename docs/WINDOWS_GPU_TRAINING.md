# Windows GPU 训练环境配置指南

## 环境要求

### 1. 安装 NVIDIA 驱动
- 确保显卡驱动已更新到最新版本
- 检查: `nvidia-smi`

### 2. 安装 CUDA Toolkit
- 下载地址: https://developer.nvidia.com/cuda-downloads
- 选择: Windows -> x86_64 -> 版本
- 推荐 CUDA 12.x

### 3. 安装 cuDNN
- 下载地址: https://developer.nvidia.com/cudnn
- 将 `cudnn-*.dll` 复制到 CUDA `bin` 目录

---

## Python 环境配置

### 推荐: 使用 Conda

```bash
# 创建新环境
conda create -n flower_guardian python=3.10
conda activate flower_guardian

# 安装 PyTorch (CUDA 12.x)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# 安装 Ultralytics
pip install ultralytics

# 安装其他依赖
pip install pillow pyyaml
```

### 或使用 pip

```bash
# 创建虚拟环境
python -m venv venv
venv\Scripts\activate

# 安装 PyTorch (CUDA 版本)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# 安装 Ultralytics
pip install ultralytics
```

---

## 训练命令

### 自动检测 GPU (推荐)
```bash
# 植物模型
python backend/train_plant_model.py --epochs 100 --batch 16

# 病虫害模型
python backend/train_pest_model.py --epochs 100 --batch 16
```

### 手动指定 GPU
```bash
# 指定使用 GPU
python backend/train_plant_model.py --device cuda

# 指定使用 CPU
python backend/train_pest_model.py --device cpu
```

### 完整参数示例
```bash
python backend/train_plant_model.py \
  --model n \
  --epochs 100 \
  --batch 16 \
  --size 640 \
  --device auto
```

---

## 常见问题

### Q: 报错 "CUDA out of memory"
A: 减小 batch size
```bash
python train_plant_model.py --batch 8
```

### Q: 报错 "OSError: [WinError 1455]"
A: 关闭其他占用 GPU 的程序，或重启电脑

### Q: 训练速度很慢
A:
- 确保使用 GPU: 检查输出显示 "device: cuda"
- 减小 image_size: `--size 416`
- 减小 batch size: `--batch 8`

### Q: 多 GPU 训练
A:
```bash
# 使用所有 GPU
python train_plant_model.py --device 0,1
```

---

## 验证 GPU 可用

```python
import torch
print(torch.cuda.is_available())
print(torch.cuda.get_device_name(0))
```
