from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.diagnosis import DiagnosisRecord
from app.models.chat import Conversation
from app.schemas.diagnosis import (
    DiagnosisRecordCreate, DiagnosisRecordResponse, DiagnosisRecordListResponse
)
from app.services.diagnosis import diagnosis_service

router = APIRouter(prefix="/api/diagnoses", tags=["diagnoses"])

# 图片存储路径配置（与 diagnosis.py 保持一致）
IMAGE_STORAGE_PATH = os.getenv("IMAGE_STORAGE_PATH", "/var/www/uploads")
if not os.path.exists(IMAGE_STORAGE_PATH):
    IMAGE_STORAGE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")


@router.get("", response_model=DiagnosisRecordListResponse)
def list_diagnoses(
    favorite: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DiagnosisRecord).filter(DiagnosisRecord.user_id == current_user.id)

    if favorite is not None:
        query = query.filter(DiagnosisRecord.is_favorite == favorite)

    total = query.count()
    items = query.order_by(DiagnosisRecord.created_at.desc()).offset(skip).limit(limit).all()

    return {"total": total, "items": items}


@router.get("/{diagnosis_id}", response_model=DiagnosisRecordResponse)
def get_diagnosis(
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"[DEBUG] get_diagnosis called with diagnosis_id={diagnosis_id}, user_id={current_user.id}")
    record = db.query(DiagnosisRecord).filter(
        DiagnosisRecord.id == diagnosis_id,
        DiagnosisRecord.user_id == current_user.id
    ).first()

    if not record:
        print(f"[DEBUG] Record not found for diagnosis_id={diagnosis_id}, user_id={current_user.id}")
        raise HTTPException(status_code=404, detail="Diagnosis record not found")

    print(f"[DEBUG] Found diagnosis: id={record.id}, conversation_id={record.conversation_id}")
    return record


@router.post("", response_model=DiagnosisRecordResponse)
def create_diagnosis(
    diagnosis: DiagnosisRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = DiagnosisRecord(
        user_id=current_user.id,
        **diagnosis.model_dump()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/{diagnosis_id}/favorite")
def toggle_favorite(
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(DiagnosisRecord).filter(
        DiagnosisRecord.id == diagnosis_id,
        DiagnosisRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Diagnosis record not found")

    record.is_favorite = not record.is_favorite
    db.commit()
    db.refresh(record)

    return {"is_favorite": record.is_favorite}


@router.post("/{diagnosis_id}/rediagnose", response_model=DiagnosisRecordResponse)
def rediagnose(
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """基于历史诊断再次诊断"""
    original = db.query(DiagnosisRecord).filter(
        DiagnosisRecord.id == diagnosis_id,
        DiagnosisRecord.user_id == current_user.id
    ).first()

    if not original:
        raise HTTPException(status_code=404, detail="Diagnosis record not found")

    # 调用诊断服务获取新结果
    result = diagnosis_service.diagnose(original.disease_name)

    # 创建新记录
    new_record = DiagnosisRecord(
        user_id=current_user.id,
        image_url=original.image_url,
        disease_name=result.get("disease_name", original.disease_name),
        confidence=result.get("confidence", 0),
        description=result.get("description", ""),
        treatment=result.get("treatment", ""),
        prevention=result.get("prevention", ""),
        recommended_products=json.dumps(result.get("recommended_products", []))
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


@router.put("/{diagnosis_id}/conversation", response_model=DiagnosisRecordResponse)
def link_conversation(
    diagnosis_id: int,
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """关联诊断记录与AI对话"""
    print(f"[DEBUG] link_conversation called: diagnosis_id={diagnosis_id}, conversation_id={conversation_id}, user_id={current_user.id}")
    record = db.query(DiagnosisRecord).filter(
        DiagnosisRecord.id == diagnosis_id,
        DiagnosisRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Diagnosis record not found")

    # 验证对话是否存在
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    record.conversation_id = conversation_id
    db.commit()
    db.refresh(record)

    return record


@router.delete("/{diagnosis_id}")
def delete_diagnosis(
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除诊断记录（同时删除关联的图片）"""
    record = db.query(DiagnosisRecord).filter(
        DiagnosisRecord.id == diagnosis_id,
        DiagnosisRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Diagnosis record not found")

    # 删除关联的图片文件
    if record.image_url:
        try:
            # 从 URL 解析文件路径，格式如：/api/diagnosis/images/{user_id}/{filename}
            if record.image_url.startswith("/api/diagnosis/images/"):
                relative_path = record.image_url.replace("/api/diagnosis/images/", "")
                file_path = os.path.join(IMAGE_STORAGE_PATH, relative_path)

                if os.path.exists(file_path):
                    os.unlink(file_path)
                    print(f"[DeleteDiagnosis] 图片已删除: {file_path}")
        except Exception as e:
            print(f"[DeleteDiagnosis] 删除图片失败: {e}")

    db.delete(record)
    db.commit()

    return {"message": "Diagnosis record deleted successfully"}
