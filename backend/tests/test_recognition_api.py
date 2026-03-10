"""
识别API测试
"""
import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)


class TestRecognitionAPI:
    """植物识别API测试"""

    def test_health_check(self):
        """测试健康检查端点"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_models_status(self):
        """测试模型状态端点"""
        response = client.get("/models/status")
        assert response.status_code == 200
        data = response.json()
        assert "plant" in data
        assert "pest" in data

    @patch('app.services.recognition.plant_recognition_service.recognize')
    def test_plant_recognition(self, mock_recognize):
        """测试植物识别API"""
        # 模拟识别结果
        mock_recognize.return_value = {
            "id": "0",
            "name": "绿萝",
            "confidence": 0.95,
            "care_tips": "喜阴，避免直射"
        }

        # 创建测试图像文件
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(b"fake image content")
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as f:
                response = client.post(
                    "/api/recognition/plant",
                    files={"file": ("test.jpg", f, "image/jpeg")}
                )

            assert response.status_code == 200
            data = response.json()
            assert "name" in data
            assert "confidence" in data
        finally:
            os.unlink(tmp_path)

    @patch('app.services.pest_recognition.pest_recognition_service.recognize')
    def test_pest_recognition(self, mock_recognize):
        """测试病虫害识别API"""
        mock_recognize.return_value = {
            "id": "0",
            "name": "蚜虫",
            "confidence": 0.88,
            "type": "insect",
            "treatment": "使用吡虫啉喷洒",
            "severity": "medium"
        }

        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(b"fake image content")
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as f:
                response = client.post(
                    "/api/diagnosis/pest",
                    files={"file": ("test.jpg", f, "image/jpeg")}
                )

            assert response.status_code == 200
            data = response.json()
            assert "name" in data
            assert "treatment" in data
        finally:
            os.unlink(tmp_path)


class TestRecognitionService:
    """识别服务单元测试"""

    @patch('app.services.recognition.os.path.exists')
    @patch('app.services.recognition.YOLO')
    def test_plant_recognition_service(self, mock_yolo, mock_exists):
        """测试植物识别服务"""
        # 模拟模型存在
        mock_exists.return_value = False

        # 模拟YOLO返回结果
        mock_model = Mock()
        mock_result = Mock()
        mock_result.boxes = Mock()
        mock_result.boxes.conf = [0.95]
        mock_result.boxes.cls = [0]
        mock_model.return_value = [mock_result]
        mock_yolo.return_value = mock_model

        from app.services.recognition import PlantRecognitionService
        service = PlantRecognitionService()

        # 测试识别
        result = service.recognize("test.jpg")
        assert result is not None
        assert "name" in result
        assert "confidence" in result

    def test_pest_recognition_service_mock(self):
        """测试病虫害识别服务（模拟模式）"""
        from app.services.pest_recognition import PestRecognitionService

        # 在没有模型的情况下应该返回模拟结果
        service = PestRecognitionService()
        service.model = None  # 强制使用模拟结果

        result = service.recognize("test.jpg")
        assert result is not None
        assert result["name"] == "蚜虫"
        assert result["type"] == "insect"


class TestClasses:
    """类别配置测试"""

    def test_plant_classes_loaded(self):
        """测试植物类别加载"""
        from app.services.recognition import PlantRecognitionService
        service = PlantRecognitionService()

        # 验证类别数量
        assert len(service.classes) > 0

        # 验证类别格式
        for class_id, info in service.classes.items():
            assert "name" in info

    def test_pest_classes_loaded(self):
        """测试病虫害类别加载"""
        from app.services.pest_recognition import PestRecognitionService
        service = PestRecognitionService()

        # 验证类别数量
        assert len(service.classes) > 0

        # 验证类别包含治疗建议
        for class_id, info in service.classes.items():
            assert "treatment" in info
            assert "severity" in info


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
