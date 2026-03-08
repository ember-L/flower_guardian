"""
YOLO训练配置文件
"""
from dataclasses import dataclass
from pathlib import Path


@dataclass
class TrainConfig:
    # 数据配置
    data_dir: str = "backend/dataset/processed"
    model_type: str = "yolo11n"  # yolo11n, yolo11s, yolo11m, yolo11l, yolo11x

    # 训练参数
    epochs: int = 100
    batch_size: int = 16
    image_size: int = 640
    patience: int = 50
    save_period: int = 10

    # 优化器参数
    lr0: float = 0.01
    lrf: float = 0.01
    momentum: float = 0.937
    weight_decay: float = 0.0005

    # 输出配置
    output_dir: str = "backend/models/runs"
    project: str = "flower_guardian"
    name: str = "train"

    # 类别名称
    class_names: list = None

    def __post_init__(self):
        if self.class_names is None:
            self.class_names = ["绿萝", "虎皮兰", "吊兰", "多肉", "龟背竹"]

    def to_dict(self):
        return {
            "path": str(Path(self.data_dir).parent),
            "train": f"{self.data_dir}/train/images",
            "val": f"{self.data_dir}/val/images",
            "nc": len(self.class_names),
            "names": {i: name for i, name in enumerate(self.class_names)}
        }


# 数据集划分比例
TRAIN_RATIO = 0.8
VAL_RATIO = 0.1
TEST_RATIO = 0.1
