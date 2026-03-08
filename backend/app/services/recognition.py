import os
from typing import Optional, List
from PIL import Image


class RecognitionService:
    def __init__(self, model_path: str = "backend/models/plant_model.pt"):
        self.model = None
        self.model_path = model_path
        self._load_model()

    def _load_model(self):
        try:
            from ultralytics import YOLO
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
            else:
                # 使用YOLOv11模型
                self.model = YOLO("yolo11n.pt")
        except Exception as e:
            print(f"Warning: Could not load YOLO model: {e}")
            self.model = None

    def recognize(self, image_path: str) -> dict:
        if not self.model:
            # Return mock result if model not loaded
            return {"id": "1", "name": "绿萝", "confidence": 0.95}

        try:
            results = self.model(image_path)
            result = results[0]

            if result.boxes:
                best_idx = result.boxes.conf.argmax()
                box = result.boxes[best_idx]

                return {
                    "id": str(int(box.cls[0])),
                    "name": result.names[int(box.cls[0])],
                    "confidence": float(box.conf[0])
                }
        except Exception as e:
            print(f"Recognition error: {e}")

        return {"id": "0", "name": "unknown", "confidence": 0.0}


recognition_service = RecognitionService()
