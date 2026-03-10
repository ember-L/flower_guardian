"""
病虫害识别模型训练脚本
支持 Windows/Linux/Mac 多平台
"""
import os
import sys
import platform
import yaml
import torch
from pathlib import Path


def check_environment():
    """检查训练环境"""
    print("=" * 50)
    print("检查训练环境...")
    print("=" * 50)

    # 系统信息
    print(f"操作系统: {platform.system()} {platform.release()}")
    print(f"Python 版本: {sys.version}")
    print(f"PyTorch 版本: {torch.__version__}")

    # CUDA 检查
    cuda_available = torch.cuda.is_available()
    print(f"CUDA 可用: {cuda_available}")

    if cuda_available:
        print(f"CUDA 版本: {torch.version.cuda}")
        print(f"GPU 数量: {torch.cuda.device_count()}")
        for i in range(torch.cuda.device_count()):
            print(f"  GPU {i}: {torch.cuda.get_device_name(i)}")
        print(f"当前 GPU: {torch.cuda.current_device()}")

    # 检查 YOLO
    try:
        from ultralytics import YOLO
        print("Ultralytics YOLO: 已安装")
    except ImportError:
        print("Ultralytics YOLO: 未安装，正在安装...")
        os.system("pip install ultralytics")

    print()
    return cuda_available


def get_device(device: str = "auto") -> str:
    """获取训练设备

    Args:
        device: 设备选择 "auto"/"cuda"/"cpu"

    Returns:
        实际使用的设备字符串
    """
    if device == "auto":
        if torch.cuda.is_available():
            device = "cuda"
        else:
            device = "cpu"

    if device == "cuda" and not torch.cuda.is_available():
        print("警告: CUDA 不可用，切换到 CPU")
        device = "cpu"

    return device


def prepare_data_yaml():
    """准备病虫害模型数据配置"""
    data = {
        'path': 'backend/dataset/processed/pest',
        'train': 'train/images',
        'val': 'val/images',
        'test': 'test/images',
        'nc': 12,
        'names': {
            0: '马铃薯早疫病',
            1: '黄化曲叶病毒',
            2: '番茄早疫病',
            3: '番茄靶斑病',
            4: '马铃薯晚疫病',
            5: '番茄叶霉病',
            6: '红蜘蛛',
            7: '番茄斑枯病',
            8: '花叶病毒',
            9: '辣椒细菌性斑点病',
            10: '番茄细菌性斑点病',
            11: '番茄晚疫病'
        }
    }

    yaml_path = Path("backend/dataset/processed/pest_train.yaml")
    with open(yaml_path, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, allow_unicode=True, default_flow_style=False)

    print(f"病虫害模型配置已保存: {yaml_path}")
    return yaml_path


def train_yolo(
    model_size: str = "n",
    epochs: int = 100,
    batch_size: int = 16,
    image_size: int = 640,
    device: str = "auto"
):
    """训练 YOLO 模型

    Args:
        model_size: 模型大小 n/s/m/l/x
        epochs: 训练轮数
        batch_size: 批次大小
        image_size: 输入图像尺寸
        device: 设备 "auto"/"cuda"/"cpu"
    """
    from ultralytics import YOLO

    # 获取实际设备
    actual_device = get_device(device)

    print("=" * 50)
    print(f"开始训练病虫害识别模型 YOLOv11-{model_size}")
    print("=" * 50)
    print(f"模型大小: {model_size}")
    print(f"训练轮数: {epochs}")
    print(f"批次大小: {batch_size}")
    print(f"图像尺寸: {image_size}")
    print(f"训练设备: {actual_device}")
    print()

    # Windows平台特定设置
    if platform.system() == "Windows":
        print("Windows 平台检测到，应用特殊设置...")
        # Windows 下设置 Num_workers 为 0 避免多进程问题
        num_workers = 0
    else:
        num_workers = 4

    # 加载模型
    model_name = f"yolo11{model_size}"
    model = YOLO(f"{model_name}.pt")
    print(f"使用预训练模型: {model_name}.pt")

    # 训练
    results = model.train(
        data="backend/dataset/processed/pest_train.yaml",
        epochs=epochs,
        batch=batch_size,
        imgsz=image_size,
        device=actual_device,
        project="runs/pest",
        name="train",
        exist_ok=True,
        patience=10,
        save=True,
        plots=True,
        val=True,
        workers=num_workers,
    )

    print("\n训练完成!")
    print(f"模型保存在: {results.save_dir}")

    return results


def export_model(model_path: str = None, format: str = "onnx"):
    """导出模型

    Args:
        model_path: 模型路径，默认查找最新训练结果
        format: 导出格式 onnx/torchscript/tflite
    """
    from ultralytics import YOLO

    if model_path is None:
        runs_dir = Path("runs/pest/train")
        if runs_dir.exists():
            weights_dir = runs_dir / "weights"
            if weights_dir.exists():
                model_path = weights_dir / "best.pt"

    if not model_path or not Path(model_path).exists():
        print("未找到训练好的模型")
        return

    print(f"导出模型: {model_path}")
    model = YOLO(model_path)
    model.export(format=format)
    print("导出完成!")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="病虫害识别模型训练")
    parser.add_argument("--model", "-m", default="n", choices=["n", "s", "m", "l", "x"],
                        help="模型大小: n=nano, s=small, m=medium, l=large, x=xlarge")
    parser.add_argument("--epochs", "-e", type=int, default=100,
                        help="训练轮数")
    parser.add_argument("--batch", "-b", type=int, default=16,
                        help="批次大小")
    parser.add_argument("--size", "-s", type=int, default=640,
                        help="图像尺寸")
    parser.add_argument("--device", "-d", default="auto",
                        help="训练设备: auto/cuda/cpu")
    parser.add_argument("--export", "-x", choices=["onnx", "torchscript", "tflite"],
                        help="训练后导出模型")

    args = parser.parse_args()

    # 检查环境
    check_environment()

    # 准备数据配置
    data_yaml = prepare_data_yaml()

    # 训练模型
    results = train_yolo(
        model_size=args.model,
        epochs=args.epochs,
        batch_size=args.batch,
        image_size=args.size,
        device=args.device
    )

    # 导出模型
    if args.export:
        export_model(format=args.export)


if __name__ == "__main__":
    main()
