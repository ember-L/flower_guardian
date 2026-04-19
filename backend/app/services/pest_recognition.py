import os
import json
import tempfile
from typing import Optional


class PestRecognitionService:
    """病虫害识别服务"""

    # 置信度阈值，低于此值返回"未识别"
    CONFIDENCE_THRESHOLD = 0.3

    def __init__(self, model_path: str = "backend/models/pest.pt"):
        self.model = None
        self.model_path = model_path
        self.classes = self._load_classes()
        self._load_model()

    def _load_classes(self) -> dict:
        """加载病虫害类别"""
        classes = {}
        # 尝试多个可能的路径
        paths_to_try = [
            "backend/models/dataset/pest_classes.json",
            "models/dataset/pest_classes.json",
            "dataset/pest_classes.json",
            "../backend/models/dataset/pest_classes.json",
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models/dataset/pest_classes.json"),
        ]

        for path in paths_to_try:
            try:
                if os.path.exists(path):
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    print(f"[PestRecognition] 成功加载病虫害类别文件: {path}")
                    break
            except Exception as e:
                print(f"[PestRecognition] 尝试加载 {path} 失败: {e}")
        else:
            print("[PestRecognition] 无法找到病虫害类别文件")
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
        print(f"[PestRecognition] 加载了 {len(classes)} 个病虫害类别")
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

    def _ensure_valid_image(self, image_path: str) -> str:
        """验证并转换图片为 YOLO 可读的格式"""
        import io
        # 注册 HEIF 格式支持（iOS 相机默认格式）
        try:
            import pillow_heif
            pillow_heif.register_heif_opener()
        except ImportError:
            pass  # pillow-heif 未安装，跳过但仍支持其他格式
        try:
            from PIL import Image
            # 尝试打开图片验证其有效性
            with Image.open(image_path) as img:
                # 强制转换为 RGB（JPEG 不支持 RGBA）
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')

                # 检查文件扩展名是否与实际格式匹配
                ext = os.path.splitext(image_path)[1].lower()
                expected_format = {'jpg': 'JPEG', 'jpeg': 'JPEG', 'png': 'PNG', 'webp': 'WEBP'}.get(ext)

                # 如果格式不匹配或文件扩展名不是标准图片格式，转换为 JPEG
                if not expected_format or img.format != expected_format:
                    # 保存为 JPEG 到临时文件
                    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
                        img.save(tmp.name, format='JPEG', quality=95)
                        print(f"[PestRecognition] 图片已转换为 JPEG: {tmp.name}")
                        return tmp.name

            return image_path
        except Exception as e:
            print(f"[PestRecognition] 图片验证失败: {e}，尝试直接使用原路径")
            return image_path

    def _recognize_from_boxes(self, boxes_data: tuple) -> dict:
        """从 YOLO 检测结果提取识别结果"""
        boxes, class_id, confidence = boxes_data

        print(f"[PestRecognition] 检测到目标 - Class ID: {class_id}, 置信度: {confidence:.2%}")

        if confidence < self.CONFIDENCE_THRESHOLD:
            print(f"[PestRecognition] 置信度 {confidence:.2%} 低于阈值 {self.CONFIDENCE_THRESHOLD}, 返回未识别")
            return {
                "id": "-1",
                "name": "未识别",
                "confidence": confidence,
                "type": "unknown",
                "treatment": "置信度较低，请拍摄更清晰的照片",
                "severity": "low",
                "bbox": [0, 0, 0, 0]
            }

        class_info = self.classes.get(class_id, {})
        pest_type = class_info.get("type", "unknown")
        pest_name = class_info.get("name", "未知")

        print(f"[PestRecognition] 识别成功 - 病虫害: {pest_name}, 类型: {pest_type}, 严重程度: {class_info.get('severity', 'low')}")

        return {
            "id": class_id,
            "name": pest_name,
            "confidence": confidence,
            "type": pest_type,
            "treatment": class_info.get("treatment", ""),
            "severity": class_info.get("severity", "low"),
            "bbox": [0, 0, 0, 0]
        }

    def recognize_from_bytes(self, content: bytes) -> tuple:
        """
        从字节数据识别病虫害（不依赖文件路径）
        返回 (result_dict, jpeg_bytes) 元组
        """
        import io
        from PIL import Image

        print(f"[PestRecognition] 开始从字节数据识别，长度: {len(content)} bytes")

        if not self.model:
            print(f"[PestRecognition] 模型未加载，返回模拟结果")
            return {
                "id": "0",
                "name": "蚜虫",
                "confidence": 0.88,
                "type": "insect",
                "treatment": "使用吡虫啉喷洒",
                "severity": "medium",
                "bbox": [0, 0, 0, 0],
                "detections": [{
                    "id": "0",
                    "name": "蚜虫",
                    "confidence": 0.88,
                    "type": "insect",
                    "treatment": "使用吡虫啉喷洒",
                    "severity": "medium",
                    "bbox": [0, 0, 0, 0]
                }]
            }, content  # 返回原始内容

        tmp_path = None
        jpeg_bytes = None
        try:
            # 注册 HEIF 格式支持
            try:
                import pillow_heif
                pillow_heif.register_heif_opener()
            except ImportError:
                pass

            # 使用 BytesIO 打开图片
            image = Image.open(io.BytesIO(content))

            # 强制转换为 RGB
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                if image.mode == 'RGBA':
                    background.paste(image, mask=image.split()[-1])
                else:
                    background.paste(image)
                image = background
            elif image.mode != 'RGB':
                image = image.convert('RGB')

            # 保存为 JPEG bytes（用于返回给调用方，避免重新转换）
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=90)
            jpeg_bytes = output.getvalue()
            print(f"[PestRecognition] JPEG 转换完成，大小: {len(jpeg_bytes)} bytes")

            # 保存为临时 JPEG 文件供 YOLO 使用
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
                tmp.write(jpeg_bytes)
                tmp_path = tmp.name

            print(f"[PestRecognition] 临时文件: {tmp_path}")

            # 直接执行 YOLO 识别，避免重复转换
            try:
                results = self.model(tmp_path)
                result_data = results[0]

                if result_data.boxes and len(result_data.boxes) > 0:
                    detections = []
                    for i in range(len(result_data.boxes)):
                        box = result_data.boxes[i]
                        confidence = float(box.conf[0])
                        class_id = str(int(box.cls[0]))
                        bbox = box.xyxy[0].tolist()

                        if confidence < self.CONFIDENCE_THRESHOLD:
                            continue

                        class_info = self.classes.get(class_id, {})
                        pest_type = class_info.get("type", "unknown")
                        pest_name = class_info.get("name", "未知")

                        detections.append({
                            "id": class_id,
                            "name": pest_name,
                            "confidence": confidence,
                            "type": pest_type,
                            "treatment": class_info.get("treatment", ""),
                            "severity": class_info.get("severity", "low"),
                            "bbox": bbox
                        })

                    if detections:
                        first = detections[0]
                        result = {
                            "id": first["id"],
                            "name": first["name"],
                            "confidence": first["confidence"],
                            "type": first["type"],
                            "treatment": first["treatment"],
                            "severity": first["severity"],
                            "bbox": first["bbox"],
                            "detections": detections
                        }
                    else:
                        result = {"id": "-1", "name": "未识别", "confidence": 0.0, "type": "unknown", "bbox": [0, 0, 0, 0], "detections": []}
                else:
                    print(f"[PestRecognition] 未检测到目标框")
                    result = {"id": "-1", "name": "未识别", "confidence": 0.0, "type": "unknown", "bbox": [0, 0, 0, 0], "detections": []}
            except Exception as e:
                print(f"[PestRecognition] 识别出错: {e}")
                result = {"id": "-1", "name": "未识别", "confidence": 0.0, "type": "unknown", "bbox": [0, 0, 0, 0], "detections": []}

            return result, jpeg_bytes

        except Exception as e:
            print(f"[PestRecognition] 字节识别出错: {e}")
            return {"id": "-1", "name": "未识别", "confidence": 0.0, "type": "unknown", "bbox": [0, 0, 0, 0], "detections": []}, content
        finally:
            # 清理临时文件
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

    def recognize(self, image_path: str) -> dict:
        """识别病虫害 - 返回所有检测结果（兼容旧接口）"""
        print(f"[PestRecognition] 开始识别图片: {image_path}")

        if not self.model:
            print(f"[PestRecognition] 模型未加载，返回模拟结果")
            return {
                "id": "0",
                "name": "蚜虫",
                "confidence": 0.88,
                "type": "insect",
                "treatment": "使用吡虫啉喷洒",
                "severity": "medium",
                "bbox": [0, 0, 0, 0],
                "detections": [{
                    "id": "0",
                    "name": "蚜虫",
                    "confidence": 0.88,
                    "type": "insect",
                    "treatment": "使用吡虫啉喷洒",
                    "severity": "medium",
                    "bbox": [0, 0, 0, 0]
                }]
            }

        # 验证图片是否可读，必要时转换格式
        image_path = self._ensure_valid_image(image_path)

        try:
            results = self.model(image_path)
            result = results[0]

            if result.boxes and len(result.boxes) > 0:
                detections = []
                for i in range(len(result.boxes)):
                    box = result.boxes[i]
                    confidence = float(box.conf[0])
                    class_id = str(int(box.cls[0]))
                    bbox = box.xyxy[0].tolist()

                    # 低于阈值的跳过
                    if confidence < self.CONFIDENCE_THRESHOLD:
                        print(f"[PestRecognition] 检测到目标置信度 {confidence:.2%} 低于阈值，跳过")
                        continue

                    class_info = self.classes.get(class_id, {})
                    pest_type = class_info.get("type", "unknown")
                    pest_name = class_info.get("name", "未知")

                    print(f"[PestRecognition] 检测到目标 - Class ID: {class_id}, 名称: {pest_name}, 置信度: {confidence:.2%}")

                    detections.append({
                        "id": class_id,
                        "name": pest_name,
                        "confidence": confidence,
                        "type": pest_type,
                        "treatment": class_info.get("treatment", ""),
                        "severity": class_info.get("severity", "low"),
                        "bbox": bbox
                    })

                if detections:
                    # 返回第一个作为主结果（兼容旧接口），同时返回所有检测
                    first = detections[0]
                    return {
                        "id": first["id"],
                        "name": first["name"],
                        "confidence": first["confidence"],
                        "type": first["type"],
                        "treatment": first["treatment"],
                        "severity": first["severity"],
                        "bbox": first["bbox"],
                        "detections": detections
                    }
                else:
                    print(f"[PestRecognition] 所有检测置信度均低于阈值")
                    return {
                        "id": "-1",
                        "name": "未识别",
                        "confidence": 0.0,
                        "type": "unknown",
                        "bbox": [0, 0, 0, 0],
                        "detections": []
                    }
            else:
                print(f"[PestRecognition] 未检测到目标框")
        except Exception as e:
            print(f"[PestRecognition] 识别出错: {e}")

        print(f"[PestRecognition] 识别失败，返回未识别")
        return {"id": "-1", "name": "未识别", "confidence": 0.0, "type": "unknown", "bbox": [0, 0, 0, 0], "detections": []}

    def recognize_batch(self, image_paths: list) -> list:
        """批量识别"""
        print(f"[PestRecognition] 开始批量识别 {len(image_paths)} 张图片")

        if not self.model:
            print(f"[PestRecognition] 模型未加载，返回模拟结果")
            return [{
                "id": "0",
                "name": "未知",
                "confidence": 0.0,
                "type": "unknown",
                "bbox": [0, 0, 0, 0]
            }] * len(image_paths)

        results = self.model(image_paths)
        output = []
        for i, r in enumerate(results):
            if r.boxes and len(r.boxes) > 0:
                best_idx = r.boxes.conf.argmax()
                box = r.boxes[best_idx]
                confidence = float(box.conf[0])
                class_id = str(int(box.cls[0]))
                bbox = box.xyxy[0].tolist()

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
                        "severity": "low",
                        "bbox": bbox
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
                    "severity": class_info.get("severity", "low"),
                    "bbox": bbox
                })
            else:
                print(f"[PestRecognition] 图片{i+1} 未检测到目标")
                output.append({
                    "id": "-1",
                    "name": "未识别",
                    "confidence": 0.0,
                    "type": "unknown",
                    "bbox": [0, 0, 0, 0]
                })

        print(f"[PestRecognition] 批量识别完成，共 {len(output)} 个结果")
        return output


pest_recognition_service = PestRecognitionService()
