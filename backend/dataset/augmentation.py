"""
数据增强工具
用于扩充训练数据集，包含植物和病虫害专用增强配置
"""
import random
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps, ImageFilter
import shutil
from typing import List, Tuple
import numpy as np


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


class PlantAugmentation:
    """植物图像数据增强 - 适用于花卉、叶片识别"""

    def __init__(self):
        self.augmentations = []

    def apply_random_augmentation(self, image: Image.Image) -> Image.Image:
        """应用随机增强"""
        aug_img = image.copy()

        # 随机翻转
        if random.random() > 0.5:
            aug_img = ImageOps.mirror(aug_img)

        # 随机旋转 (小角度)
        if random.random() > 0.3:
            angle = random.uniform(-15, 15)
            aug_img = aug_img.rotate(angle, fillcolor=(255, 255, 255))

        # 随机亮度调整
        if random.random() > 0.3:
            factor = random.uniform(0.8, 1.2)
            enhancer = ImageEnhance.Brightness(aug_img)
            aug_img = enhancer.enhance(factor)

        # 随机对比度调整
        if random.random() > 0.3:
            factor = random.uniform(0.8, 1.2)
            enhancer = ImageEnhance.Contrast(aug_img)
            aug_img = enhancer.enhance(factor)

        # 随机饱和度调整
        if random.random() > 0.5:
            factor = random.uniform(0.9, 1.1)
            enhancer = ImageEnhance.Color(aug_img)
            aug_img = enhancer.enhance(factor)

        return aug_img

    def augment_dataset(self, input_dir: str, output_dir: str, num_per_image: int = 3):
        """批量增强植物数据集"""
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        total = 0
        for img_file in input_path.glob("*"):
            if img_file.suffix.lower() not in ['.jpg', '.jpeg', '.png']:
                continue

            img = Image.open(img_file)

            for i in range(num_per_image):
                aug_img = self.apply_random_augmentation(img)
                output_file = output_path / f"{img_file.stem}_aug{i}{img_file.suffix}"
                aug_img.save(output_file)
                total += 1

        print(f"Plant augmentation complete: {total} images created")
        return total


class PestAugmentation:
    """病虫害图像数据增强 - 病虫害需要更精细的增强"""

    def __init__(self):
        pass

    def apply_noise(self, image: Image.Image, var_limit: Tuple[float, float] = (10.0, 50.0)) -> Image.Image:
        """添加高斯噪声"""
        img_array = np.array(image).astype(np.float32)
        var = random.uniform(*var_limit)
        noise = np.random.normal(0, var, img_array.shape)
        noisy_img = np.clip(img_array + noise, 0, 255).astype(np.uint8)
        return Image.fromarray(noisy_img)

    def apply_blur(self, image: Image.Image, radius: int = 2) -> Image.Image:
        """应用模糊"""
        return image.filter(ImageFilter.GaussianBlur(radius=radius))

    def apply_random_augmentation(self, image: Image.Image) -> Image.Image:
        """应用随机增强 - 病虫害专用"""
        aug_img = image.copy()

        # 病虫害可以从多角度识别，允许更大的旋转角度
        if random.random() > 0.3:
            angle = random.uniform(-30, 30)
            aug_img = aug_img.rotate(angle, fillcolor=(255, 255, 255))

        # 水平翻转 - 病虫害通常对称
        if random.random() > 0.5:
            aug_img = ImageOps.mirror(aug_img)

        # 亮度调整 - 病虫害在不同光照下都应可识别
        if random.random() > 0.3:
            factor = random.uniform(0.7, 1.3)
            enhancer = ImageEnhance.Brightness(aug_img)
            aug_img = enhancer.enhance(factor)

        # 对比度调整
        if random.random() > 0.3:
            factor = random.uniform(0.7, 1.3)
            enhancer = ImageEnhance.Contrast(aug_img)
            aug_img = enhancer.enhance(factor)

        # 添加噪声 (概率较低)
        if random.random() > 0.7:
            aug_img = self.apply_noise(aug_img)

        # 添加模糊 (概率较低，模拟失焦)
        if random.random() > 0.8:
            aug_img = self.apply_blur(aug_img, radius=random.randint(1, 2))

        return aug_img

    def augment_dataset(self, input_dir: str, output_dir: str, num_per_image: int = 5):
        """批量增强病虫害数据集"""
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        total = 0
        for img_file in input_path.glob("*"):
            if img_file.suffix.lower() not in ['.jpg', '.jpeg', '.png']:
                continue

            img = Image.open(img_file)

            for i in range(num_per_image):
                aug_img = self.apply_random_augmentation(img)
                output_file = output_path / f"{img_file.stem}_aug{i}{img_file.suffix}"
                aug_img.save(output_file)
                total += 1

        print(f"Pest augmentation complete: {total} images created")
        return total


class YOLOAugmentation:
    """YOLO专用的数据增强 - 保持标注同步"""

    def __init__(self):
        pass

    def augment_yolo_dataset(
        self,
        image_dir: str,
        label_dir: str,
        output_dir: str,
        num_augmented: int = 3
    ):
        """增强YOLO数据集，同时更新标注"""
        image_path = Path(image_dir)
        label_path = Path(label_dir)
        output_path = Path(output_dir)

        # 创建输出目录
        (output_path / 'images').mkdir(parents=True, exist_ok=True)
        (output_path / 'labels').mkdir(parents=True, exist_ok=True)

        plant_aug = PlantAugmentation()

        total = 0
        for img_file in image_path.glob("*.jpg"):
            # 读取图像
            img = Image.open(img_file)

            # 读取标注
            label_file = label_path / (img_file.stem + '.txt')
            labels = []
            if label_file.exists():
                with open(label_file, 'r') as f:
                    labels = f.readlines()

            # 生成增强图像
            for i in range(num_augmented):
                aug_img = plant_aug.apply_random_augmentation(img)

                # 保存增强图像
                aug_img_name = f"{img_file.stem}_aug{i}{img_file.suffix}"
                aug_img.save(output_path / 'images' / aug_img_name)

                # 复制标注文件
                if labels:
                    aug_label_name = f"{img_file.stem}_aug{i}.txt"
                    with open(output_path / 'labels' / aug_label_name, 'w') as f:
                        f.writelines(labels)

                total += 1

        print(f"YOLO augmentation complete: {total} images created")
        return total


if __name__ == "__main__":
    # 植物数据增强示例
    plant_aug = PlantAugmentation()
    plant_aug.augment_dataset(
        input_dir="backend/dataset/processed/plant/train/images",
        output_dir="backend/dataset/augmented/plant/train",
        num_per_image=3
    )

    # 病虫害数据增强示例
    pest_aug = PestAugmentation()
    pest_aug.augment_dataset(
        input_dir="backend/dataset/processed/pest/train/images",
        output_dir="backend/dataset/augmented/pest/train",
        num_per_image=5
    )
