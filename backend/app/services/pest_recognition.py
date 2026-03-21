import os
import json
from typing import Optional


class PestRecognitionService:
    """病虫害识别服务"""

    # 置信度阈值，低于此值返回"未识别"
    CONFIDENCE_THRESHOLD = 0.6

    def __init__(self, model_path: str = "backend/models/pest.pt"):
        self.model = None
        self.model_path = model_path
        self.classes = self._load_classes()
        self._load_model()

    def _load_classes(self) -> dict:
        """加载病虫害类别"""
        classes = {}
        try:
            with open("backend/models/dataset/pest_classes.json", "r", encoding="utf-8") as f:
                data = json.load(f)
        except FileNotFoundError:
            try:
                with open("dataset/pest_classes.json", "r", encoding="utf-8") as f:
                    data = json.load(f)
            except FileNotFoundError:
                return classes

        # 支持新的扁平格式 {"0": {...}, "1": {...}}
        if "classes" in data:
            for key, value in data["classes"].items():
                classes[key] = {
                    "name": value.get("zh_name", value.get("name", "")),
                    "type": value.get("type", "unknown"),
                    "treatment": value.get("treatment", ""),
                    "severity": value.get("severity", "low")
                }
        else:
            # 旧格式：按类别分组
            for category in data.values():
                if isinstance(category, list):
                    for item in category:
                        if isinstance(item, dict) and "id" in item:
                            classes[str(item["id"])] = {
                                "name": item.get("name", ""),
                                "type": item.get("type", "unknown"),
                                "treatment": item.get("treatment", ""),
                                "severity": item.get("severity", "low")
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
            print(f"Warning: Could not load pest model: {e}")
            self.model = None

    def recognize(self, image_path: str) -> dict:
        """识别病虫害"""
        print(f"[PestRecognition] 开始识别图片: {image_path}")

        if not self.model:
            # 返回模拟结果
            print(f"[PestRecognition] 模型未加载，返回模拟结果")
            return {
                "id": "0",
                "name": "蚜虫",
                "confidence": 0.88,
                "type": "insect",
                "treatment": "使用吡虫啉喷洒",
                "severity": "medium"
            }

        try:
            results = self.model(image_path)
            result = results[0]

            if result.boxes:
                best_idx = result.boxes.conf.argmax()
                box = result.boxes[best_idx]
                confidence = float(box.conf[0])
                class_id = str(int(box.cls[0]))

                print(f"[PestRecognition] 检测到目标 - Class ID: {class_id}, 置信度: {confidence:.2%}")

                # 检查置信度是否低于阈值
                if confidence < self.CONFIDENCE_THRESHOLD:
                    print(f"[PestRecognition] 置信度 {confidence:.2%} 低于阈值 {self.CONFIDENCE_THRESHOLD}, 返回未识别")
                    return {
                        "id": "-1",
                        "name": "未识别",
                        "confidence": confidence,
                        "type": "unknown",
                        "treatment": "置信度较低，请拍摄更清晰的照片",
                        "severity": "low"
                    }

                class_info = self.classes.get(class_id, {})

                # 使用类别文件中定义的类型
                pest_type = class_info.get("type", "unknown")
                pest_name = class_info.get("name", "未知")

                print(f"[PestRecognition] 识别成功 - 病虫害: {pest_name}, 类型: {pest_type}, 严重程度: {class_info.get('severity', 'low')}")

                return {
                    "id": class_id,
                    "name": pest_name,
                    "confidence": confidence,
                    "type": pest_type,
                    "treatment": class_info.get("treatment", ""),
                    "severity": class_info.get("severity", "low")
                }
            else:
                print(f"[PestRecognition] 未检测到目标框")
        except Exception as e:
            print(f"[PestRecognition] 识别出错: {e}")

        print(f"[PestRecognition] 识别失败，返回未识别")
        return {"id": "-1", "name": "未识别", "confidence": 0.0, "type": "unknown"}

    def recognize_batch(self, image_paths: list) -> list:
        """批量识别"""
        print(f"[PestRecognition] 开始批量识别 {len(image_paths)} 张图片")

        if not self.model:
            print(f"[PestRecognition] 模型未加载，返回模拟结果")
            return [{
                "id": "0",
                "name": "未知",
                "confidence": 0.0,
                "type": "unknown"
            }] * len(image_paths)

        results = self.model(image_paths)
        output = []
        for i, r in enumerate(results):
            if r.boxes and len(r.boxes) > 0:
                box = r.boxes[0]
                confidence = float(box.conf[0])
                class_id = str(int(box.cls[0]))

                print(f"[PestRecognition] 图片{i+1} - Class ID: {class_id}, 置信度: {confidence:.2%}")

                # 检查置信度是否低于阈值
                if confidence < self.CONFIDENCE_THRESHOLD:
                    print(f"[PestRecognition] 图片{i+1} 置信度低于阈值")
                    output.append({
                        "id": "-1",
                        "name": "未识别",
                        "confidence": confidence,
                        "type": "unknown",
                        "treatment": "置信度较低，请拍摄更清晰的照片",
                        "severity": "low"
                    })
                    continue

                class_info = self.classes.get(class_id, {})

                # 使用类别文件中定义的类型
                pest_type = class_info.get("type", "unknown")
                pest_name = class_info.get("name", "未知")

                print(f"[PestRecognition] 图片{i+1} 识别成功 - {pest_name}")

                output.append({
                    "id": class_id,
                    "name": pest_name,
                    "confidence": confidence,
                    "type": pest_type,
                    "treatment": class_info.get("treatment", ""),
                    "severity": class_info.get("severity", "low")
                })
            else:
                print(f"[PestRecognition] 图片{i+1} 未检测到目标")
                output.append({
                    "id": "-1",
                    "name": "未识别",
                    "confidence": 0.0,
                    "type": "unknown"
                })

        print(f"[PestRecognition] 批量识别完成，共 {len(output)} 个结果")
        return output


pest_recognition_service = PestRecognitionService()
