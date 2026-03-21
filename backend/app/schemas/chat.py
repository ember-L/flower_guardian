# 聊天相关 Schemas
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class Message(BaseModel):
    """消息"""
    role: str
    content: str


class ChatRequest(BaseModel):
    """聊天请求"""
    messages: List[Message]
    system_context: Optional[str] = None


class ChatResponse(BaseModel):
    """聊天响应"""
    message: Message


class ConversationBase(BaseModel):
    """对话基础"""
    title: str = "新对话"


class ConversationCreate(ConversationBase):
    """创建对话"""
    pass


class ConversationResponse(ConversationBase):
    """对话响应"""
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    """消息基础"""
    role: str
    content: str


class ChatMessageCreate(ChatMessageBase):
    """创建消息"""
    conversation_id: int


class ChatMessageResponse(ChatMessageBase):
    """消息响应"""
    id: int
    conversation_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationWithMessages(ConversationResponse):
    """带消息的对话"""
    messages: List[ChatMessageResponse] = []
