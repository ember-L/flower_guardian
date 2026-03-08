"""
YOLO模型训练器
"""
import os
import yaml
from pathlib import Path
from typing import Optional
from sklearn.model_selection import train_test_split
import shutil


class YOLOTrainer:
    def __init__(self, config):
        self.config = config
        self.model = None

    def split_dataset(self, data_dir: str, output_dir: str):
        """划分训练集、验证集、测试集"""
        data_path = Path(data_dir)
        output_path = Path(output_dir)

        # 创建目录结构
        for split in ['train', 'val', 'test']:
            (output_path / split / 'images').mkdir(parents=True, exist_ok=True)
            (output_path / split / 'labels').mkdir(parents=True, exist_ok=True)

        # 获取所有类别目录
        class_dirs = [d for d in data_path.iterdir() if d.is_dir()]

        TRAIN_RATIO = 0.8
        TEST_RATIO = 0.1

        for class_dir in class_dirs:
            images = list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.png"))

            if len(images) == 0:
                continue

            # 划分数据
            train_images, temp_images = train_test_split(
                images, test_size=(1 - TRAIN_RATIO), random_state=42
            )
            val_images, test_images = train_test_split(
                temp_images, test_size=(TEST_RATIO / (1 - TRAIN_RATIO)), random_state=42
            )

            # 复制文件
            for img_list, split in [(train_images, 'train'),
                                    (val_images, 'val'),
                                    (test_images, 'test')]:
                for img in img_list:
                    # 复制图像
                    dest_img = output_path / split / 'images' / img.name
                    shutil.copy(img, dest_img)

                    # 复制标签（如果存在）
                    label_file = img.with_suffix('.txt')
                    if label_file.exists():
                        dest_label = output_path / split / 'labels' / label_file.name
                        shutil.copy(label_file, dest_label)

        print(f"Dataset split completed: {output_dir}")
        return output_dir

    def create_data_yaml(self, output_dir: str):
        """创建YOLO数据配置文件"""
        data_config = {
            'path': str(Path(output_dir).parent),
            'train': 'train/images',
            'val': 'val/images',
            'test': 'test/images',
            'nc': len(self.config.class_names),
            'names': {i: name for i, name in enumerate(self.config.class_names)}
        }

        yaml_path = Path(output_dir).parent / "data.yaml"
        with open(yaml_path, 'w') as f:
            yaml.dump(data_config, f)

        print(f"Created data config: {yaml_path}")
        return str(yaml_path)

    def train(self, data_yaml: str, resume: bool = False) -> str:
        """训练YOLO模型"""
        try:
            from ultralytics import YOLO
        except ImportError:
            raise ImportError("Please install ultralytics: pip install ultralytics")

        # 加载模型
        if resume:
            # 从上次训练继续
            last_checkpoint = Path(self.config.output_dir) / self.config.project / self.config.name / "weights" / "last.pt"
            if last_checkpoint.exists():
                self.model = YOLO(str(last_checkpoint))
            else:
                raise FileNotFoundError("No checkpoint found to resume")
        else:
            # 从预训练模型开始
            self.model = YOLO(f"{self.config.model_type}.pt")

        # 训练参数
        results = self.model.train(
            data=data_yaml,
            epochs=self.config.epochs,
            batch=self.config.batch_size,
            imgsz=self.config.image_size,
            patience=self.config.patience,
            save_period=self.config.save_period,
            lr0=self.config.lr0,
            lrf=self.config.lrf,
            momentum=self.config.momentum,
            weight_decay=self.config.weight_decay,
            project=self.config.output_dir,
            name=self.config.project,
            exist_ok=True,
            pretrained=True,
            optimizer='SGD',
            verbose=True
        )

        # 返回最佳模型路径
        best_model = Path(self.config.output_dir) / self.config.project / self.config.name / "weights" / "best.pt"
        return str(best_model)

    def export_model(self, model_path: str, format: str = "onnx") -> str:
        """导出模型为不同格式"""
        from ultralytics import YOLO

        model = YOLO(model_path)
        export_path = model.export(format=format)

        return export_path


def main():
    """训练入口"""
    from train.config import TrainConfig

    config = TrainConfig(
        data_dir="backend/dataset/processed",
        model_type="yolov8n",
        epochs=100,
        batch_size=16,
        class_names=["绿萝", "虎皮兰", "吊兰", "多肉", "龟背竹"]
    )

    trainer = YOLOTrainer(config)

    # 1. 划分数据集
    split_dir = "backend/dataset/split"
    trainer.split_dataset(config.data_dir, split_dir)

    # 2. 创建数据配置
    data_yaml = trainer.create_data_yaml(split_dir)

    # 3. 训练模型
    print("Starting training...")
    best_model = trainer.train(data_yaml)

    print(f"Training completed! Best model: {best_model}")

    # 4. 导出为ONNX格式
    onnx_model = trainer.export_model(best_model, format="onnx")
    print(f"Model exported to: {onnx_model}")


if __name__ == "__main__":
    main()
