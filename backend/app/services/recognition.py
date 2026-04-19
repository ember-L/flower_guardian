import os
import json
import logging
from typing import Optional, List
from PIL import Image

logger = logging.getLogger(__name__)


class PlantRecognitionService:
    """植物识别服务"""

    def __init__(self, model_path: str = "backend/models/plant.pt"):
        self.model = None
        self.model_path = model_path
        self.classes = self._load_classes()
        self._load_model()

    def _load_classes(self) -> dict:
        """加载植物类别"""
        classes = {}
        # 尝试多个可能的路径
        paths_to_try = [
            "backend/models/dataset/plant_classes.json",
            "dataset/plant_classes.json",
            "models/dataset/plant_classes.json",
            "../models/dataset/plant_classes.json",
        ]

        for path in paths_to_try:
            try:
                if os.path.exists(path):
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    logger.info(f"成功加载植物类别文件: {path}, 共 {len(data.get('classes', {}))} 个类别")
                    break
            except Exception as e:
                logger.warning(f"尝试加载 {path} 失败: {e}")
        else:
            # 所有路径都失败
            logger.error("无法找到植物类别文件")
            return classes

        # 新格式：直接是键值对 {"0": {...}, "1": {...}}
        if "classes" in data:
            for key, value in data["classes"].items():
                classes[key] = {
                    "name": value.get("zh_name", value.get("en_name", "")),
                    "care_tips": value.get("care_tips", "")
                }
        else:
            # 旧格式：按类别分组
            for category in data.values():
                if isinstance(category, list):
                    for item in category:
                        if isinstance(item, dict) and "id" in item:
                            classes[str(item["id"])] = {
                                "name": item.get("name", ""),
                                "care_tips": item.get("care_tips", "")
                            }
        return classes

    def _load_model(self):
        """加载YOLO模型"""
        try:
            from ultralytics import YOLO
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
                logger.info(f"成功加载模型: {self.model_path}")
            else:
                # 尝试从相对路径加载
                alt_path = self.model_path.replace("backend/", "")
                if os.path.exists(alt_path):
                    self.model = YOLO(alt_path)
                    logger.info(f"成功加载模型(相对路径): {alt_path}")
                else:
                    # 使用YOLOv11基础模型
                    self.model = YOLO("yolo11n.pt")
                    logger.info("使用YOLOv11基础模型")
        except Exception as e:
            logger.error(f"加载模型失败: {e}")
            self.model = None

    def recognize(self, image_path: str) -> dict:
        """识别植物 - 返回所有检测结果（兼容旧接口）"""
        logger.info(f"开始识别图片: {image_path}")
        logger.info(f"模型是否加载: {self.model is not None}")

        if not self.model:
            # 返回模拟结果
            logger.warning("模型未加载，返回模拟结果")
            return {
                "id": "0",
                "name": "绿萝",
                "confidence": 0.95,
                "care_tips": "喜阴，避免直射",
                "bbox": [0, 0, 0, 0],
                "detections": [{
                    "id": "0",
                    "name": "绿萝",
                    "confidence": 0.95,
                    "care_tips": "喜阴，避免直射",
                    "bbox": [0, 0, 0, 0]
                }]
            }

        try:
            results = self.model(image_path)
            result = results[0]
            logger.info(f"YOLO识别完成，boxes数量: {len(result.boxes) if result.boxes else 0}")

            if result.boxes and len(result.boxes) > 0:
                detections = []
                for i in range(len(result.boxes)):
                    box = result.boxes[i]
                    class_id = str(int(box.cls[0]))
                    confidence = float(box.conf[0])
                    bbox = box.xyxy[0].tolist()

                    detections.append({
                        "id": class_id,
                        "name": self.classes.get(class_id, {}).get("name", "未知"),
                        "confidence": confidence,
                        "care_tips": self.classes.get(class_id, {}).get("care_tips", ""),
                        "bbox": bbox
                    })

                if detections:
                    first = detections[0]
                    return {
                        "id": first["id"],
                        "name": first["name"],
                        "confidence": first["confidence"],
                        "care_tips": first["care_tips"],
                        "bbox": first["bbox"],
                        "detections": detections
                    }
        except Exception as e:
            print(f"Plant recognition error: {e}")

        return {"id": "-1", "name": "未识别", "confidence": 0.0, "bbox": [0, 0, 0, 0], "detections": []}

    def recognize_batch(self, image_paths: list) -> list:
        """批量识别"""
        if not self.model:
            return [{
                "id": "0",
                "name": "未知",
                "confidence": 0.0,
                "care_tips": "",
                "bbox": [0, 0, 0, 0],
                "detections": []
            }] * len(image_paths)

        results = self.model(image_paths)
        output = []
        for r in results:
            if r.boxes and len(r.boxes) > 0:
                detections = []
                for i in range(len(r.boxes)):
                    box = r.boxes[i]
                    class_id = str(int(box.cls[0]))
                    confidence = float(box.conf[0])
                    bbox = box.xyxy[0].tolist()

                    detections.append({
                        "id": class_id,
                        "name": self.classes.get(class_id, {}).get("name", "未知"),
                        "confidence": confidence,
                        "care_tips": self.classes.get(class_id, {}).get("care_tips", ""),
                        "bbox": bbox
                    })

                first = detections[0]
                output.append({
                    "id": first["id"],
                    "name": first["name"],
                    "confidence": first["confidence"],
                    "care_tips": first["care_tips"],
                    "bbox": first["bbox"],
                    "detections": detections
                })
            else:
                output.append({
                    "id": "-1",
                    "name": "未识别",
                    "confidence": 0.0,
                    "bbox": [0, 0, 0, 0],
                    "detections": []
                })
        return output


plant_recognition_service = PlantRecognitionService()
