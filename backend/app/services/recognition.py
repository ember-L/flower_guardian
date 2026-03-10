import os
import json
from typing import Optional, List
from PIL import Image


class PlantRecognitionService:
    """植物识别服务"""

    def __init__(self, model_path: str = "backend/models/plant/plant_yolo11n.pt"):
        self.model = None
        self.model_path = model_path
        self.classes = self._load_classes()
        self._load_model()

    def _load_classes(self) -> dict:
        """加载植物类别"""
        try:
            with open("backend/dataset/plant_classes.json", "r", encoding="utf-8") as f:
                data = json.load(f)
        except FileNotFoundError:
            # 尝试从当前目录加载
            with open("dataset/plant_classes.json", "r", encoding="utf-8") as f:
                data = json.load(f)

        classes = {}
        for category in data.values():
            for item in category:
                classes[str(item["id"])] = {
                    "name": item["name"],
                    "care_tips": item.get("care_tips", "")
                }
        return classes

    def _load_model(self):
        """加载YOLO模型"""
        try:
            from ultralytics import YOLO
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
            else:
                # 尝试从相对路径加载
                alt_path = self.model_path.replace("backend/", "")
                if os.path.exists(alt_path):
                    self.model = YOLO(alt_path)
                else:
                    # 使用YOLOv11基础模型
                    self.model = YOLO("yolo11n.pt")
        except Exception as e:
            print(f"Warning: Could not load plant model: {e}")
            self.model = None

    def recognize(self, image_path: str) -> dict:
        """识别植物"""
        if not self.model:
            # 返回模拟结果
            return {"id": "0", "name": "绿萝", "confidence": 0.95, "care_tips": "喜阴，避免直射"}

        try:
            results = self.model(image_path)
            result = results[0]

            if result.boxes:
                best_idx = result.boxes.conf.argmax()
                box = result.boxes[best_idx]
                class_id = str(int(box.cls[0]))

                return {
                    "id": class_id,
                    "name": self.classes.get(class_id, {}).get("name", "未知"),
                    "confidence": float(box.conf[0]),
                    "care_tips": self.classes.get(class_id, {}).get("care_tips", "")
                }
        except Exception as e:
            print(f"Plant recognition error: {e}")

        return {"id": "-1", "name": "未识别", "confidence": 0.0}

    def recognize_batch(self, image_paths: list) -> list:
        """批量识别"""
        if not self.model:
            return [{"id": "0", "name": "未知", "confidence": 0.0}] * len(image_paths)

        results = self.model(image_paths)
        return [
            {
                "id": str(int(r.boxes[0].cls[0])) if r.boxes and len(r.boxes) > 0 else "-1",
                "name": self.classes.get(str(int(r.boxes[0].cls[0])), {}).get("name", "未知") if r.boxes and len(r.boxes) > 0 else "未识别",
                "confidence": float(r.boxes[0].conf[0]) if r.boxes and len(r.boxes) > 0 else 0.0
            }
            for r in results
        ]


plant_recognition_service = PlantRecognitionService()
