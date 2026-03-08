from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.diagnosis import diagnosis_service
from app.schemas.recognition import DiagnosisResponse
import tempfile
import os

router = APIRouter(prefix="/api/diagnosis", tags=["diagnosis"])


@router.post("", response_model=DiagnosisResponse)
async def diagnose_plant(
    file: UploadFile = File(...),
    symptom: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
