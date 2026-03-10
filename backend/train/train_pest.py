"""病虫害模型训练脚本"""
import yaml
import os
from pathlib import Path

# 添加项目根目录到路径
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 病虫害类别列表
PEST_CLASSES = [
    # 虫害 (0-7)
    "蚜虫", "红蜘蛛", "介壳虫", "粉虱", "蓟马", "小黑飞", "蜗牛", "鼻涕虫",
    # 病害 (8-14)
    "白粉病", "黑斑病", "炭疽病", "叶斑病", "锈病", "灰霉病", "根腐病",
    # 生理性病害 (15-19)
    "黄叶", "晒伤", "冻害", "肥害", "药害"
]


def train_pest_model():
    """训练病虫害识别模型"""
    from ultralytics import YOLO

    # 确保数据集目录存在
    dataset_dir = Path("backend/dataset/processed/pest")
    if not dataset_dir.exists():
        print(f"数据集目录不存在: {dataset_dir}")
        print("请先准备数据集，然后运行训练脚本")
        print("数据集应包含 train/images 和 val/images 目录")
        return

    # 创建数据集配置
    data_config = {
        "path": str(dataset_dir.parent),
        "train": "pest/train/images",
        "val": "pest/val/images",
        "nc": len(PEST_CLASSES),
        "names": {i: name for i, name in enumerate(PEST_CLASSES)}
    }

    # 保存数据集配置
    config_path = dataset_dir.parent / "pest.yaml"
    config_path.parent.mkdir(parents=True, exist_ok=True)
    with open(config_path, "w", encoding="utf-8") as f:
        yaml.dump(data_config, f, allow_unicode=True)

    print(f"数据集配置已保存到: {config_path}")
    print(f"类别数量: {len(PEST_CLASSES)}")
    print(f"类别列表: {PEST_CLASSES}")

    # 检查是否有训练数据
    train_images = dataset_dir / "train" / "images"
    val_images = dataset_dir / "val" / "images"

    if not train_images.exists() or not val_images.exists():
        print("训练数据目录不存在，请先准备数据集")
        return

    print(f"开始训练病虫害识别模型...")
    print(f"训练轮数: 100")
    print(f"模型类型: yolo11n")

    # 加载预训练模型
    model = YOLO("yolo11n.pt")

    # 训练模型
    model.train(
        data=str(config_path),
        epochs=100,
        imgsz=640,
        batch=16,
        project="flower_guardian",
        name="pest_train",
        exist_ok=True
    )

    # 保存模型
    model_dir = Path("backend/models/pest")
    model_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / "pest_yolo11n.pt"
    model.save(str(model_path))
    print(f"模型已保存到: {model_path}")


if __name__ == "__main__":
    train_pest_model()
