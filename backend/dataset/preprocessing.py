"""
图像预处理工具
用于YOLO模型训练的图像预处理
"""
import os
from pathlib import Path
from PIL import Image
from typing import Tuple, List
import shutil


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


if __name__ == "__main__":
    preprocessor = ImagePreprocessor(
        input_dir="backend/dataset/data",
        output_dir="backend/dataset/processed"
    )

    preprocessor.resize_directory()
