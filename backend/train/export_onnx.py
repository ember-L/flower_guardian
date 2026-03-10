"""模型转换为ONNX格式用于边缘部署"""
import os
from pathlib import Path


def export_plant_to_onnx():
    """导出植物识别模型为ONNX"""
    try:
        from ultralytics import YOLO

        model_path = Path("backend/models/plant/plant_yolo11n.pt")
        if not model_path.exists():
            print(f"植物模型不存在: {model_path}")
            print("请先训练模型或下载模型文件")
            return

        print(f"加载植物识别模型: {model_path}")
        model = YOLO(str(model_path))

        # 导出为ONNX格式
        onnx_path = model.export(format="onnx", imgsz=640)
        print(f"植物模型已导出为ONNX格式: {onnx_path}")
    except Exception as e:
        print(f"导出植物模型失败: {e}")


def export_pest_to_onnx():
    """导出病虫害识别模型为ONNX"""
    try:
        from ultralytics import YOLO

        model_path = Path("backend/models/pest/pest_yolo11n.pt")
        if not model_path.exists():
            print(f"病虫害模型不存在: {model_path}")
            print("请先训练模型或下载模型文件")
            return

        print(f"加载病虫害识别模型: {model_path}")
        model = YOLO(str(model_path))

        # 导出为ONNX格式
        onnx_path = model.export(format="onnx", imgsz=640)
        print(f"病虫害模型已导出为ONNX格式: {onnx_path}")
    except Exception as e:
        print(f"导出病虫害模型失败: {e}")


def export_quantized():
    """导出量化模型（更小的体积，适合移动端）"""
    try:
        from ultralytics import YOLO

        # 植物模型量化
        plant_model_path = Path("backend/models/plant/plant_yolo11n.pt")
        if plant_model_path.exists():
            print("导出量化植物模型...")
            model = YOLO(str(plant_model_path))
            model.export(format="onnx", imgsz=640, int8=True)
            print("量化植物模型导出完成")

        # 病虫害模型量化
        pest_model_path = Path("backend/models/pest/pest_yolo11n.pt")
        if pest_model_path.exists():
            print("导出量化病虫害模型...")
            model = YOLO(str(pest_model_path))
            model.export(format="onnx", imgsz=640, int8=True)
            print("量化病虫害模型导出完成")
    except Exception as e:
        print(f"导出量化模型失败: {e}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="模型转换工具")
    parser.add_argument("--type", choices=["plant", "pest", "all", "quantized"], default="all",
                        help="转换类型: plant(植物), pest(病虫害), all(全部), quantized(量化)")
    args = parser.parse_args()

    if args.type == "plant":
        export_plant_to_onnx()
    elif args.type == "pest":
        export_pest_to_onnx()
    elif args.type == "all":
        export_plant_to_onnx()
        export_pest_to_onnx()
    elif args.type == "quantized":
        export_quantized()
