"""
数据增强工具
用于扩充训练数据集
"""
import random
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps
import shutil
from typing import List


class DataAugmenter:
    def __init__(self, input_dir: str, output_dir: str):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def apply_flip(self, image: Image.Image, horizontal: bool = True) -> Image.Image:
        """水平/垂直翻转"""
        if horizontal:
            return ImageOps.mirror(image)
        return ImageOps.flip(image)

    def apply_rotation(self, image: Image.Image, angle: int) -> Image.Image:
        """旋转图像"""
        return image.rotate(angle, expand=True)

    def apply_brightness(self, image: Image.Image, factor: float) -> Image.Image:
        """调整亮度"""
        enhancer = ImageEnhance.Brightness(image)
        return enhancer.enhance(factor)

    def apply_contrast(self, image: Image.Image, factor: float) -> Image.Image:
        """调整对比度"""
        enhancer = ImageEnhance.Contrast(image)
        return enhancer.enhance(factor)

    def apply_saturation(self, image: Image.Image, factor: float) -> Image.Image:
        """调整饱和度"""
        enhancer = ImageEnhance.Color(image)
        return enhancer.enhance(factor)

    def random_augment(self, image_path: str, num_augmented: int = 5) -> List[str]:
        """随机增强"""
        img = Image.open(image_path)
        output_paths = []

        base_name = Path(image_path).stem
        extension = Path(image_path).suffix

        for i in range(num_augmented):
            aug_img = img.copy()

            # 随机应用增强
            if random.random() > 0.5:
                aug_img = self.apply_flip(aug_img, random.random() > 0.5)

            if random.random() > 0.5:
                angle = random.choice([90, 180, 270])
                aug_img = self.apply_rotation(aug_img, angle)

            if random.random() > 0.3:
                factor = random.uniform(0.7, 1.3)
                aug_img = self.apply_brightness(aug_img, factor)

            if random.random() > 0.3:
                factor = random.uniform(0.8, 1.2)
                aug_img = self.apply_contrast(aug_img, factor)

            # 保存
            output_path = self.output_dir / f"{base_name}_aug{i}{extension}"
            aug_img.save(output_path)
            output_paths.append(str(output_path))

        return output_paths

    def augment_directory(self, num_augmented: int = 5):
        """批量增强目录中的图像"""
        total_created = 0

        for img_path in self.input_dir.rglob("*.jpg"):
            try:
                self.random_augment(str(img_path), num_augmented)
                total_created += num_augmented
            except Exception as e:
                print(f"Error augmenting {img_path}: {e}")

        print(f"Created {total_created} augmented images")
        return total_created


if __name__ == "__main__":
    augmenter = DataAugmenter(
        input_dir="backend/dataset/processed",
        output_dir="backend/dataset/augmented"
    )

    augmenter.augment_directory(num_augmented=3)
