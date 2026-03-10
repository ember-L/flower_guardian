"""模型下载脚本 - 用于从远程下载预训练模型"""

import os
from pathlib import Path


def download_plant_model():
    """下载植物识别模型"""
    model_dir = Path("backend/models/plant")
    model_dir.mkdir(parents=True, exist_ok=True)

    model_path = model_dir / "plant_yolo11n.pt"
    if model_path.exists():
        print(f"植物识别模型已存在: {model_path}")
        return

    print(f"植物识别模型路径: {model_path}")
    print("请选择以下方式获取模型:")
    print("1. 运行训练脚本生成模型: python backend/train/train_plant.py")
    print("2. 从远程存储下载预训练模型")
    print("3. 使用YOLOv11预训练模型（仅用于测试）")


def download_pest_model():
    """下载病虫害识别模型"""
    model_dir = Path("backend/models/pest")
    model_dir.mkdir(parents=True, exist_ok=True)

    model_path = model_dir / "pest_yolo11n.pt"
    if model_path.exists():
        print(f"病虫害识别模型已存在: {model_path}")
        return

    print(f"病虫害识别模型路径: {model_path}")
    print("请选择以下方式获取模型:")
    print("1. 运行训练脚本生成模型: python backend/train/train_pest.py")
    print("2. 从远程存储下载预训练模型")
    print("3. 使用YOLOv11预训练模型（仅用于测试）")


def download_all():
    """下载所有模型"""
    print("=== 护花使者模型下载 ===")
    download_plant_model()
    print()
    download_pest_model()
    print()
    print("模型准备完成！")


if __name__ == "__main__":
    download_all()
