from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.models.user import User
from app.services.pest_recognition import pest_recognition_service
import tempfile
import os
import io
import uuid
from datetime import datetime
from typing import Optional
from PIL import Image
import asyncio
from concurrent.futures import ThreadPoolExecutor

router = APIRouter(prefix="/api/diagnosis", tags=["diagnosis"])


@router.post("/pest")
async def diagnose_pest(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """病虫害识别API"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = pest_recognition_service.recognize(tmp_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnosis failed: {str(e)}")
    finally:
        os.unlink(tmp_path)


@router.post("/full")
async def diagnose_full(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """完整诊断API（识别病虫害并返回处理建议）"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = pest_recognition_service.recognize(tmp_path)

        # 如果识别成功，返回更详细的诊断信息
        if result.get("id", "-1") != "-1":
            return {
                "diagnosis": result,
                "recommendations": {
                    "immediate": result.get("treatment", ""),
                    "prevention": _get_prevention_tips(result.get("type", "")),
                    "severity_level": result.get("severity", "low")
                }
            }
        else:
            return {
                "diagnosis": result,
                "recommendations": {
                    "immediate": "建议咨询专业人士或上传更清晰的照片",
                    "prevention": "保持良好的养护习惯",
                    "severity_level": "unknown"
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnosis failed: {str(e)}")
    finally:
        os.unlink(tmp_path)


def _get_prevention_tips(pest_type: str) -> str:
    """获取预防建议"""
    tips = {
        "insect": "定期检查植物叶片，保持通风，避免过度潮湿",
        "disease": "及时清除病叶，保持植株间距，加强通风",
        "physiological": "根据植物习性调整光照、浇水和施肥"
    }
    return tips.get(pest_type, "保持良好的养护习惯")


# 线程池用于阻塞操作
_executor = ThreadPoolExecutor(max_workers=4)


def _save_image_async(image_bytes: bytes, user_id: int, filename: str) -> None:
    """
    在线程池中保存图片
    """
    import os

    # 确保用户目录存在
    IMAGE_STORAGE_PATH = os.getenv("IMAGE_STORAGE_PATH", "/var/www/uploads")
    if not os.path.exists(IMAGE_STORAGE_PATH):
        IMAGE_STORAGE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")
    user_dir = os.path.join(IMAGE_STORAGE_PATH, str(user_id))
    os.makedirs(user_dir, exist_ok=True)

    file_path = os.path.join(user_dir, filename)

    # 直接写入文件（JPEG bytes 已经是处理好的）
    with open(file_path, 'wb') as f:
        f.write(image_bytes)

    print(f"[UploadAndRecognize] 图片已保存: {file_path}")


async def save_file_async(content: bytes, file_path: str) -> None:
    """异步保存文件"""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(_executor, _write_file, content, file_path)


def _write_file(content: bytes, file_path: str) -> None:
    """写入文件（同步）"""
    with open(file_path, 'wb') as f:
        f.write(content)


@router.post("/upload-and-recognize")
async def upload_and_recognize(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    合并上传和识别接口

    - 接收图片并直接识别
    - 识别完成后异步保存到存储
    - 返回识别结果和图片 URL
    """
    import logging
    logger = logging.getLogger(__name__)

    # 验证文件
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")

    try:
        # 读取图片内容
        content = await file.read()
        logger.info(f"[UploadAndRecognize] 收到图片，大小: {len(content)} bytes")

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="图片内容不能为空")

        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"图片大小不能超过 {MAX_FILE_SIZE // 1024 // 1024}MB")

        # 执行识别（直接从字节识别，返回识别结果和 JPEG 数据）
        result, jpeg_bytes = pest_recognition_service.recognize_from_bytes(content)
        logger.info(f"[UploadAndRecognize] 识别结果: {result}")

        # 如果用户已登录，异步保存图片（不阻塞返回）
        image_url = None
        if current_user and jpeg_bytes:
            # 直接在后台线程保存，不阻塞响应
            loop = asyncio.get_event_loop()
            # 生成文件名并异步保存
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_id = uuid.uuid4().hex[:8]
            filename = f"img_{timestamp}_{unique_id}.jpg"
            image_url = f"/api/diagnosis/images/{current_user.id}/{filename}"

            loop.run_in_executor(_executor, _save_image_async, jpeg_bytes, current_user.id, filename)
            logger.info(f"[UploadAndRecognize] 图片保存任务已创建: {image_url}")

        # 返回结果
        if result.get("id", "-1") != "-1":
            return {
                "success": True,
                "diagnosis": result,
                "recommendations": {
                    "immediate": result.get("treatment", ""),
                    "prevention": _get_prevention_tips(result.get("type", "")),
                    "severity_level": result.get("severity", "low")
                },
                "image_url": image_url
            }
        else:
            return {
                "success": True,
                "diagnosis": result,
                "recommendations": {
                    "immediate": "建议咨询专业人士或上传更清晰的照片",
                    "prevention": "保持良好的养护习惯",
                    "severity_level": "unknown"
                },
                "image_url": image_url
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UploadAndRecognize] 失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")
