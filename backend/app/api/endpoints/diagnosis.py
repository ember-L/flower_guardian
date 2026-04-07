from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.diagnosis import diagnosis_service
from app.schemas.recognition import DiagnosisResponse
import os
import uuid
import hashlib
from datetime import datetime
from typing import Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
import io

router = APIRouter(prefix="/api/diagnosis", tags=["diagnosis"])

# 图片存储配置
IMAGE_STORAGE_PATH = os.getenv("IMAGE_STORAGE_PATH", "/var/www/uploads")
# 本地开发时使用项目目录
if not os.path.exists(IMAGE_STORAGE_PATH):
    IMAGE_STORAGE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")
    os.makedirs(IMAGE_STORAGE_PATH, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
THUMBNAIL_SIZE = (300, 300)  # 缩略图尺寸

# 线程池用于阻塞操作
executor = ThreadPoolExecutor(max_workers=4)


def ensure_user_directory(user_id: int) -> str:
    """确保用户目录存在"""
    user_dir = os.path.join(IMAGE_STORAGE_PATH, str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    # 创建缩略图目录
    thumb_dir = os.path.join(user_dir, 'thumbnails')
    os.makedirs(thumb_dir, exist_ok=True)
    return user_dir


def generate_filename(original_filename: str) -> str:
    """生成唯一文件名（固定为 WebP 格式）"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    return f"img_{timestamp}_{unique_id}.webp"


def convert_image_to_webp(content: bytes) -> bytes:
    """将图片转换为 WebP 格式（使用 Pillow 库）"""
    import logging
    from PIL import Image
    import io
    # 注册 HEIF 格式支持（iOS 相机默认格式）
    try:
        import pillow_heif
        pillow_heif.register_heif_opener()
    except ImportError:
        pass  # pillow-heif 未安装，跳过但仍支持其他格式
    logger = logging.getLogger(__name__)
    try:
        # 使用 Pillow 打开图片（自动检测格式，支持 JPEG, PNG, HEIC, WEBP 等）
        image = Image.open(io.BytesIO(content))

        # 强制转换为 RGB 模式（处理 RGBA 或其他模式）
        if image.mode in ('RGBA', 'LA', 'P'):
            # 对于 RGBA 图片，创建一个白色背景
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')

        # 转换为 WebP 格式
        output = io.BytesIO()
        image.save(output, format='WEBP', quality=85)
        result = output.getvalue()

        logger.info(f"WebP conversion done, size: {len(result)} bytes, original mode: {image.mode}")
        return result
    except Exception as e:
        logger.error(f"WebP conversion failed: {str(e)}")
        raise Exception(f"WebP 转换失败: {str(e)}")


async def save_file_async(content: bytes, file_path: str) -> None:
    """异步保存文件"""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, _write_file, content, file_path)


def _write_file(content: bytes, file_path: str) -> None:
    """写入文件（同步）"""
    with open(file_path, 'wb') as f:
        f.write(content)


async def get_file_async(file_path: str) -> bytes:
    """异步读取文件"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _read_file, file_path)


def _read_file(file_path: str) -> bytes:
    """读取文件（同步）"""
    with open(file_path, 'rb') as f:
        return f.read()


def validate_file(file: UploadFile) -> None:
    """验证文件"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"不支持的图片格式，仅支持: {', '.join(ALLOWED_EXTENSIONS)}")


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    上传图片到服务器本地存储（按用户分级，自动转换为 WebP）

    - 支持 JPG/PNG/WEBP 格式上传
    - 自动转换为 WebP 格式存储
    - 最大 10MB
    - 自动生成唯一文件名
    """
    import logging
    logger = logging.getLogger(__name__)

    # 验证文件
    validate_file(file)

    try:
        # 读取文件内容
        content = await file.read()
        logger.info(f"[Upload] Read file, size: {len(content)} bytes")

        # 检查文件大小
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"图片大小不能超过 {MAX_FILE_SIZE // 1024 // 1024}MB")

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="图片内容不能为空")

        # 使用线程池转换为 WebP 格式
        logger.info("[Upload] Starting WebP conversion...")
        loop = asyncio.get_event_loop()
        content = await loop.run_in_executor(executor, convert_image_to_webp, content)
        logger.info(f"[Upload] WebP conversion done, new size: {len(content)} bytes")

        # 再次检查转换后的大小
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"转换后图片大小不能超过 {MAX_FILE_SIZE // 1024 // 1024}MB")

        # 创建用户目录
        user_dir = ensure_user_directory(current_user.id)
        logger.info(f"[Upload] User dir: {user_dir}")

        # 生成文件名（固定为 .webp）
        filename = generate_filename(file.filename)
        file_path = os.path.join(user_dir, filename)
        logger.info(f"[Upload] File path: {file_path}")

        # 保存文件
        await save_file_async(content, file_path)
        logger.info("[Upload] File saved successfully")

        # 返回访问URL（相对路径）
        image_url = f"/api/diagnosis/images/{current_user.id}/{filename}"

        return {
            "success": True,
            "image_url": image_url,
            "filename": filename,
            "size": len(content)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Upload] Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")


@router.get("/images/{user_id}/{filename}")
async def get_image(user_id: int, filename: str):
    """
    获取用户上传的图片

    - 支持缓存 headers
    - 自动检测 Content-Type
    """
    # 安全检查：防止路径遍历
    if '..' in filename or '/' in filename:
        raise HTTPException(status_code=400, detail="无效的文件名")

    file_path = os.path.join(IMAGE_STORAGE_PATH, str(user_id), filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="图片不存在")

    try:
        # 获取文件大小
        file_size = os.path.getsize(file_path)

        # 检测文件类型
        ext = os.path.splitext(filename)[1].lower()
        content_type_map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
        }
        content_type = content_type_map.get(ext, 'application/octet-stream')

        # 异步读取文件
        content = await get_file_async(file_path)

        from fastapi.responses import Response
        return Response(
            content=content,
            media_type=content_type,
            headers={
                'Content-Length': str(file_size),
                'Cache-Control': 'public, max-age=86400',  # 缓存 1 天
                'ETag': f'"{hashlib.md5(content).hexdigest}"',
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"读取图片失败: {str(e)}")


@router.delete("/images/{user_id}/{filename}")
async def delete_image(
    user_id: int,
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除用户上传的图片（只能删除自己的图片）
    """
    # 安全检查
    if '..' in filename or '/' in filename:
        raise HTTPException(status_code=400, detail="无效的文件名")

    # 验证权限
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="无权删除此图片")

    file_path = os.path.join(IMAGE_STORAGE_PATH, str(user_id), filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="图片不存在")

    try:
        # 删除文件
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(executor, os.remove, file_path)

        # 删除缩略图（如果存在）
        thumb_path = os.path.join(IMAGE_STORAGE_PATH, str(user_id), 'thumbnails', filename)
        if os.path.exists(thumb_path):
            await loop.run_in_executor(executor, os.remove, thumb_path)

        return {"success": True, "message": "图片已删除"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")


@router.get("/images/{user_id}/{filename}/info")
async def get_image_info(user_id: int, filename: str):
    """获取图片信息"""
    if '..' in filename or '/' in filename:
        raise HTTPException(status_code=400, detail="无效的文件名")

    file_path = os.path.join(IMAGE_STORAGE_PATH, str(user_id), filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="图片不存在")

    stat = os.stat(file_path)

    return {
        "filename": filename,
        "size": stat.st_size,
        "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
        "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "url": f"/api/diagnosis/images/{user_id}/{filename}"
    }


# 原有诊断 API
@router.post("", response_model=DiagnosisResponse)
async def diagnose_plant(
    file: UploadFile = File(...),
    symptom: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """植物病害诊断（临时接口，保留原有功能）"""
    import tempfile

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if not symptom:
            symptom = "黄叶"
        result = diagnosis_service.diagnose(symptom)
        return DiagnosisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnosis failed: {str(e)}")
    finally:
        os.unlink(tmp_path)
