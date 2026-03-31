# AI对话管理接口
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.chat import Conversation, ChatMessage
from app.schemas.chat import (
    ConversationCreate, ConversationResponse, ChatMessageCreate, ChatMessageResponse, ConversationWithMessages
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    conversation: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建新对话"""
    print(f"[DEBUG] create_conversation: title={conversation.title}, user_id={current_user.id}")
    new_conversation = Conversation(
        user_id=current_user.id,
        title=conversation.title
    )
    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)
    print(f"[DEBUG] Created conversation: id={new_conversation.id}, user_id={new_conversation.user_id}")
    return new_conversation


@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户对话列表"""
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).offset(skip).limit(limit).all()
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取对话详情（包括消息）"""
    print(f"[DEBUG] get_conversation called with conversation_id={conversation_id}, user_id={current_user.id}")
    conversation = db.query(Conversation).options(joinedload(Conversation.messages)).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        print(f"[DEBUG] Conversation not found for id={conversation_id}")
        raise HTTPException(status_code=404, detail="Conversation not found")

    print(f"[DEBUG] Found conversation: id={conversation.id}, messages_count={len(conversation.messages)}")
    return conversation


@router.post("/conversations/{conversation_id}/messages", response_model=ChatMessageResponse)
def create_message(
    conversation_id: int,
    message: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建对话消息"""
    print(f"[DEBUG] create_message called: conversation_id={conversation_id}, role={message.role}, user_id={current_user.id}, content_length={len(message.content)}")
    # 验证对话属于当前用户
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    new_message = ChatMessage(
        conversation_id=conversation_id,
        role=message.role,
        content=message.content
    )
    db.add(new_message)

    # 更新对话的 updated_at
    from datetime import datetime
    conversation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(new_message)
    return new_message


@router.get("/conversations/{conversation_id}/messages", response_model=List[ChatMessageResponse])
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取对话的所有消息"""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id
    ).order_by(ChatMessage.created_at.asc()).all()

    return messages