"""
图像预处理工具
用于YOLO模型训练的图像预处理和数据转换
"""
import os
import json
import shutil
import random
from pathlib import Path
from PIL import Image
from typing import Tuple, List, Dict
from collections import defaultdict


class ImagePreprocessor:
    def __init__(self, input_dir: str, output_dir: str):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def resize_image(self, image_path: str, target_size: Tuple[int, int] = (640, 640)) -> str:
        """调整图像大小"""
        img = Image.open(image_path)
        img_resized = img.resize(target_size, Image.Resampling.LANCZOS)

        output_path = self.output_dir / Path(image_path).name
        img_resized.save(output_path)
        return str(output_path)

    def resize_directory(self, target_size: Tuple[int, int] = (640, 640)):
        """批量调整图像大小"""
        processed = 0
        for img_path in self.input_dir.rglob("*.jpg"):
            try:
                self.resize_image(str(img_path), target_size)
                processed += 1
            except Exception as e:
                print(f"Error processing {img_path}: {e}")

        print(f"Processed {processed} images")
        return processed

    def convert_to_yolo_format(self, image_dir: str, label_dir: str):
        """转换为YOLO格式"""
        yolo_dir = self.output_dir / "labels"
        yolo_dir.mkdir(exist_ok=True)

        images_dir = self.output_dir / "images"
        images_dir.mkdir(exist_ok=True)

        for img_path in Path(image_dir).rglob("*.jpg"):
            shutil.copy(img_path, images_dir / img_path.name)

        print(f"Converted to YOLO format at {self.output_dir}")
        return str(self.output_dir)

    def validate_dataset(self, data_dir: str) -> dict:
        """验证数据集完整性"""
        data_path = Path(data_dir)
        stats = {
            "total_images": 0,
            "total_labels": 0,
            "missing_labels": [],
            "corrupted_images": []
        }

        for img_path in data_path.rglob("*.jpg"):
            stats["total_images"] += 1
            label_path = img_path.with_suffix('.txt')

            if not label_path.exists():
                stats["missing_labels"].append(img_path.name)

            try:
                Image.open(img_path).verify()
            except Exception:
                stats["corrupted_images"].append(img_path.name)

        for label_path in data_path.rglob("*.txt"):
            stats["total_labels"] += 1

        return stats


class YOLODatasetConverter:
    """YOLO数据集转换器 - 将原始数据转换为YOLO训练格式"""

    def __init__(self, class_mapping: Dict[str, int]):
        self.class_mapping = class_mapping  # {class_name: class_id}

    def convert_voc_to_yolo(self, voc_annotation_path: str, image_width: int, image_height: int) -> str:
        """将VOC格式标注转换为YOLO格式

        VOC格式: <xmin> <ymin> <xmax> <ymax>
        YOLO格式: <class_id> <x_center> <y_center> <width> <height> (normalized)
        """
        # 读取VOC标注文件
        # 解析XML获取bbox
        # 转换为YOLO格式
        pass

    def create_dataset_from_folders(
        self,
        input_base_dir: str,
        output_dir: str,
        train_ratio: float = 0.8,
        val_ratio: float = 0.1,
        test_ratio: float = 0.1
    ):
        """从文件夹结构创建YOLO数据集

        期望的输入目录结构:
        input_dir/
            class_name1/
                image1.jpg
                image2.jpg
            class_name2/
                image1.jpg
        """
        input_path = Path(input_base_dir)
        output_path = Path(output_dir)

        # 创建输出目录结构
        for split in ['train', 'val', 'test']:
            (output_path / split / 'images').mkdir(parents=True, exist_ok=True)
            (output_path / split / 'labels').mkdir(parents=True, exist_ok=True)

        # 收集所有图像
        all_images = []
        for class_name, class_id in self.class_mapping.items():
            class_dir = input_path / class_name
            if class_dir.exists():
                images = list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.png"))
                for img in images:
                    all_images.append((img, class_id))

        # 打乱数据
        random.shuffle(all_images)

        # 划分数据集
        total = len(all_images)
        train_end = int(total * train_ratio)
        val_end = train_end + int(total * val_ratio)

        splits = {
            'train': all_images[:train_end],
            'val': all_images[train_end:val_end],
            'test': all_images[val_end:]
        }

        # 复制图像并创建标注
        for split, images in splits.items():
            for img_path, class_id in images:
                # 复制图像
                dest_img = output_path / split / 'images' / img_path.name
                shutil.copy(img_path, dest_img)

                # 创建YOLO标注文件（如果原始有标注的话）
                # 这里创建一个示例标注（整张图像为一个对象）
                img = Image.open(img_path)
                width, height = img.size

                # 全局标注示例
                label_file = output_path / split / 'labels' / (img_path.stem + '.txt')
                with open(label_file, 'w') as f:
                    # class_id x_center y_center width height (normalized)
                    f.write(f"{class_id} 0.5 0.5 1.0 1.0\n")

        print(f"数据集创建完成:")
        print(f"  训练集: {len(splits['train'])} 图像")
        print(f"  验证集: {len(splits['val'])} 图像")
        print(f"  测试集: {len(splits['test'])} 图像")


class DatasetStatistics:
    """数据集统计工具"""

    @staticmethod
    def get_statistics(data_dir: str) -> dict:
        """获取数据集统计信息"""
        data_path = Path(data_dir)

        stats = {
            'total_images': 0,
            'total_labels': 0,
            'classes': defaultdict(int),
            'image_sizes': defaultdict(int),
            'corrupted': []
        }

        # 统计训练集
        for split in ['train', 'val', 'test']:
            split_path = data_path / split / 'images'
            if not split_path.exists():
                continue

            for img_path in split_path.glob("*"):
                if img_path.suffix.lower() not in ['.jpg', '.jpeg', '.png']:
                    continue

                stats['total_images'] += 1

                try:
                    img = Image.open(img_path)
                    w, h = img.size
                    stats['image_sizes'][f"{w}x{h}"] += 1
                except Exception:
                    stats['corrupted'].append(str(img_path))

            # 统计标注
            label_path = data_path / split / 'labels'
            if label_path.exists():
                for label_file in label_path.glob("*.txt"):
                    stats['total_labels'] += 1
                    with open(label_file, 'r') as f:
                        for line in f:
                            parts = line.strip().split()
                            if parts:
                                class_id = int(parts[0])
                                stats['classes'][class_id] += 1

        return dict(stats)


if __name__ == "__main__":
    # 示例: 创建数据集
    class_mapping = {
        "绿萝": 0,
        "吊兰": 1,
        "虎皮兰": 2,
        # ... 其他类别
    }

    converter = YOLODatasetConverter(class_mapping)
    converter.create_dataset_from_folders(
        input_base_dir="backend/dataset/raw/plants",
        output_dir="backend/dataset/processed/plant"
    )

    # 验证数据集
    preprocessor = ImagePreprocessor(
        input_dir="backend/dataset/processed/plant/train/images",
        output_dir="backend/dataset/processed/plant/train/images"
    )
    stats = preprocessor.validate_dataset("backend/dataset/processed/plant")
    print(f"Dataset validation: {stats}")
