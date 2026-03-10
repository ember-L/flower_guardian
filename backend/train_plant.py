"""
植物识别模型训练脚本
使用 YOLOv11 进行植物和病虫害识别训练
"""
import os
import sys
import yaml
import torch
from pathlib import Path


def check_environment():
    """检查训练环境"""
    print("=" * 50)
    print("检查训练环境...")
    print("=" * 50)

    print(f"Python 版本: {sys.version}")
    print(f"PyTorch 版本: {torch.__version__}")
    print(f"CUDA 可用: {torch.cuda.is_available()}")

    if torch.cuda.is_available():
        print(f"CUDA 版本: {torch.version.cuda}")
        print(f"GPU 设备: {torch.cuda.get_device_name(0)}")
        print(f"GPU 数量: {torch.cuda.device_count()}")

    # 检查 YOLO
    try:
        from ultralytics import YOLO
        print("Ultralytics YOLO 已安装")
    except ImportError:
        print("Ultralytics YOLO 未安装，正在安装...")
        os.system("pip install ultralytics")

    print()


def prepare_data_yaml():
    """准备数据配置文件"""
    data_yaml = {
        'path': 'backend/dataset/processed/plant',
        'train': 'train/images',
        'val': 'val/images',
        'test': 'test/images',
        'nc': 59,
        'names': {
            0: '非洲紫罗兰', 1: '芦荟', 2: '红掌', 3: '散尾葵', 4: '文竹',
            5: '秋海棠', 6: '天堂鸟', 7: '鸟巢蕨', 8: '波士顿蕨', 9: '竹芋',
            10: '一叶兰', 11: '金钱草', 12: '万年青', 13: '蟹爪兰', 14: '菊花',
            15: '浪星竹芋', 16: '水仙', 17: '龙血树', 18: '黛粉叶', 19: '海芋',
            20: '常春藤', 21: '风信子', 22: '铁十字秋海棠', 23: '玉树', 24: '长寿花',
            25: '萱草', 26: '铃兰', 27: '发财树', 28: '龟背竹', 29: '兰花',
            30: '棕竹', 31: '白掌', 32: '一品红', 33: '红斑竹叶', 34: '酒瓶兰',
            35: '绿萝', 36: '竹节秋海棠', 37: '响尾蛇竹芋', 38: '橡皮树', 39: '苏铁',
            40: '鹅掌柴', 41: '虎皮兰', 42: '紫露草', 43: '郁金香', 44: '捕蝇草',
            45: '丝兰', 46: '金钱树', 47: '马铃薯早疫病', 48: '黄化曲叶病毒',
            49: '番茄早疫病', 50: '番茄靶斑病', 51: '马铃薯晚疫病', 52: '番茄叶霉病',
            53: '红蜘蛛', 54: '番茄斑枯病', 55: '花叶病毒', 56: '辣椒细菌性斑点病',
            57: '番茄细菌性斑点病', 58: '番茄晚疫病'
        }
    }

    yaml_path = Path("backend/dataset/processed/plant_train.yaml")
    with open(yaml_path, 'w', encoding='utf-8') as f:
        yaml.dump(data_yaml, f, allow_unicode=True, default_flow_style=False)

    print(f"训练配置文件已保存: {yaml_path}")
    return yaml_path


def train_yolo(
    model_size: str = "n",
    epochs: int = 100,
    batch_size: int = 16,
    image_size: int = 640,
    data_yaml: str = None,
    pretrained: bool = True,
    device: str = "cuda"
):
    """训练 YOLO 模型

    Args:
        model_size: 模型大小 (n/s/m/l/x)
        epochs: 训练轮数
        batch_size: 批次大小
        image_size: 输入图像尺寸
        data_yaml: 数据配置文件路径
        pretrained: 是否使用预训练权重
        device: 训练设备 (cuda/cpu)
    """
    from ultralytics import YOLO

    print("=" * 50)
    print(f"开始训练 YOLOv11-{model_size} 模型")
    print("=" * 50)
    print(f"模型大小: {model_size}")
    print(f"训练轮数: {epochs}")
    print(f"批次大小: {batch_size}")
    print(f"图像尺寸: {image_size}")
    print(f"设备: {device}")
    print()

    # 加载模型
    model_name = f"yolo11{model_size}"
    print(f"加载模型: {model_name}")

    if pretrained:
        model = YOLO(f"{model_name}.pt")
        print("使用预训练权重")
    else:
        model = YOLO(f"{model_name}.yaml")
        print("从头训练")

    # 开始训练
    results = model.train(
        data=data_yaml or "backend/dataset/processed/plant_train.yaml",
        epochs=epochs,
        batch=batch_size,
        imgsz=image_size,
        device=device,
        project="runs/plant",
        name="train",
        exist_ok=True,
        patience=10,
        save=True,
        plots=True,
        val=True,
        workers=4,
        # 优化器设置
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        momentum=0.937,
        weight_decay=0.0005,
        # 数据增强
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=0.0,
        translate=0.1,
        scale=0.5,
        shear=0.0,
        flipud=0.0,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.0,
    )

    print("\n训练完成!")
    print(f"模型保存在: {results.save_dir}")

    return results


def export_model(model_path: str = None, format: str = "onnx"):
    """导出模型

    Args:
        model_path: 模型路径
        format: 导出格式 (onnx/torchscript/tflite/etc)
    """
    from ultralytics import YOLO

    if model_path is None:
        # 查找最新的训练模型
        runs_dir = Path("runs/plant/train")
        if runs_dir.exists():
            weights_dir = runs_dir / "weights"
            if weights_dir.exists():
                model_path = weights_dir / "best.pt"

    if not model_path or not Path(model_path).exists():
        print("未找到训练好的模型")
        return

    print(f"导出模型: {model_path}")
    print(f"导出格式: {format}")

    model = YOLO(model_path)
    model.export(format=format)

    print("导出完成!")


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="植物识别模型训练")
    parser.add_argument("--model", "-m", default="n", choices=["n", "s", "m", "l", "x"],
                       help="模型大小: n= nano, s= small, m= medium, l= large, x= xlarge")
    parser.add_argument("--epochs", "-e", type=int, default=100,
                       help="训练轮数")
    parser.add_argument("--batch", "-b", type=int, default=16,
                       help="批次大小")
    parser.add_argument("--size", "-s", type=int, default=640,
                       help="图像尺寸")
    parser.add_argument("--device", "-d", default="cuda",
                       help="训练设备 (cuda/cpu)")
    parser.add_argument("--no-pretrained", action="store_true",
                       help="不使用预训练权重")
    parser.add_argument("--export", "-x", choices=["onnx", "torchscript", "tflite", "coreml"],
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
        data_yaml=str(data_yaml),
        pretrained=not args.no_pretrained,
        device=args.device
    )

    # 导出模型
    if args.export:
        export_model(format=args.export)


if __name__ == "__main__":
    main()
