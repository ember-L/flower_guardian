"""植物模型训练脚本"""
import yaml
import os
from pathlib import Path

# 添加项目根目录到路径
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def train_plant_model():
    """训练植物识别模型"""
    from ultralytics import YOLO
    from train.config import TrainConfig

    config = TrainConfig()
    config.data_dir = "backend/dataset/processed/plant"
    config.model_type = "yolo11n"
    config.epochs = 100

    # 植物类别列表
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

    # 确保数据集目录存在
    dataset_dir = Path("backend/dataset/processed/plant")
    if not dataset_dir.exists():
        print(f"数据集目录不存在: {dataset_dir}")
        print("请先准备数据集，然后运行训练脚本")
        print("数据集应包含 train/images 和 val/images 目录")
        return

    # 创建数据集配置
    data_config = {
        "path": str(dataset_dir.parent),
        "train": "plant/train/images",
        "val": "plant/val/images",
        "nc": len(config.class_names),
        "names": {i: name for i, name in enumerate(config.class_names)}
    }

    # 保存数据集配置
    config_path = dataset_dir.parent / "plant.yaml"
    config_path.parent.mkdir(parents=True, exist_ok=True)
    with open(config_path, "w", encoding="utf-8") as f:
        yaml.dump(data_config, f, allow_unicode=True)

    print(f"数据集配置已保存到: {config_path}")
    print(f"类别数量: {len(config.class_names)}")

    # 检查是否有训练数据
    train_images = dataset_dir / "train" / "images"
    val_images = dataset_dir / "val" / "images"

    if not train_images.exists() or not val_images.exists():
        print("训练数据目录不存在，请先准备数据集")
        return

    print(f"开始训练植物识别模型...")
    print(f"训练轮数: {config.epochs}")
    print(f"模型类型: {config.model_type}")

    # 加载预训练模型
    model = YOLO(f"{config.model_type}.pt")

    # 训练模型
    model.train(
        data=str(config_path),
        epochs=config.epochs,
        imgsz=config.image_size,
        batch=config.batch_size,
        project=config.project,
        name="plant_train",
        exist_ok=True
    )

    # 保存模型
    model_dir = Path("backend/models/plant")
    model_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / "plant_yolo11n.pt"
    model.save(str(model_path))
    print(f"模型已保存到: {model_path}")


if __name__ == "__main__":
    train_plant_model()
