"""
数据集下载器
支持从公开数据集获取植物图像
"""
import os
import requests
import zipfile
from pathlib import Path
from typing import List, Optional


class DatasetDownloader:
    DATASETS = {
        "plantnet": {
            "url": "https://zenodo.org/record/XXXXXXX/files/plantnet.zip",
            "description": "PlantNet数据集"
        },
        "iNaturalist": {
            "url": "https://github.com/...",
            "description": "iNaturalist植物图像"
        }
    }

    def __init__(self, output_dir: str = "backend/dataset/data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def download_from_url(self, url: str, filename: str) -> str:
        """从URL下载数据集"""
        output_path = self.output_dir / filename

        print(f"Downloading {filename}...")
        response = requests.get(url, stream=True)
        total_size = int(response.headers.get('content-length', 0))

        with open(output_path, 'wb') as f:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        print(f"\rProgress: {progress:.1f}%", end="")

        print(f"\nDownloaded to {output_path}")
        return str(output_path)

    def extract_zip(self, zip_path: str, extract_to: str = None) -> str:
        """解压ZIP文件"""
        if extract_to is None:
            extract_to = self.output_dir

        print(f"Extracting {zip_path}...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)

        print(f"Extracted to {extract_to}")
        return extract_to

    def download_plantnet_sample(self, plant_names: List[str]):
        """下载PlantNet示例数据（模拟）"""
        sample_dir = self.output_dir / "plantnet_sample"
        sample_dir.mkdir(exist_ok=True)

        # 模拟下载，实际使用时替换为真实API调用
        for name in plant_names:
            plant_dir = sample_dir / name.replace(" ", "_")
            plant_dir.mkdir(exist_ok=True)
            print(f"Created directory for: {name}")

        print(f"Sample dataset structure created at {sample_dir}")
        return str(sample_dir)

    def list_classes(self, data_dir: str) -> List[str]:
        """列出数据目录中的类别"""
        data_path = Path(data_dir)
        if not data_path.exists():
            return []

        classes = [d.name for d in data_path.iterdir() if d.is_dir()]
        return sorted(classes)


if __name__ == "__main__":
    downloader = DatasetDownloader()

    # 示例：创建示例数据结构
    plant_classes = ["绿萝", "虎皮兰", "吊兰", "多肉", "龟背竹"]
    data_dir = downloader.download_plantnet_sample(plant_classes)

    classes = downloader.list_classes(data_dir)
    print(f"Found {len(classes)} classes: {classes}")
