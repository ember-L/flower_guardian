# 诊断与AI对话历史记录功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现诊断记录与AI对话的关联，支持从诊断详情页跳转到AI对话并恢复上下文

**Architecture:** 后端扩展 diagnosis_records 表添加 conversation_id 字段，前端在诊断详情页增加"AI问诊"按钮，实现对话创建和跳转逻辑

**Tech Stack:** FastAPI, SQLAlchemy, React Native

---

## 实施概览

| 阶段 | 任务数 | 说明 |
|-----|-------|-----|
| 阶段1 | 2 | 数据库模型扩展 |
| 阶段2 | 2 | 后端 API 实现 |
| 阶段3 | 3 | 移动端实现 |
| 阶段4 | 1 | 测试验证 |

---

## 阶段 1: 数据库模型扩展

### Task 1: 扩展诊断记录模型

**Files:**
- Modify: `backend/app/models/diagnosis.py:1-23`

**Step 1: 添加 conversation_id 字段**

```python
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class DiagnosisRecord(Base):
    __tablename__ = "diagnosis_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String(500))
    disease_name = Column(String(100), nullable=False)
    confidence = Column(Float)
    description = Column(Text)
    treatment = Column(Text)  # 治疗建议
    prevention = Column(Text)  # 预防措施
    recommended_products = Column(Text)  # 推荐产品 (JSON)
    is_favorite = Column(Boolean, default=False)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=True)  # 新增：关联AI对话
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="diagnosis_records")
    conversation = relationship("Conversation", backref="diagnosis_records")
```

---

### Task 2: 更新诊断 Schema

**Files:**
- Modify: `backend/app/schemas/diagnosis.py:1-35`

**Step 1: 更新 Schema 添加可选字段**

```python
class DiagnosisRecordCreate(BaseModel):
    image_url: str
    disease_name: str
    confidence: float
    description: str = ""
    treatment: str = ""
    prevention: str = ""
    recommended_products: str = "[]"
    conversation_id: Optional[int] = None  # 新增


class DiagnosisRecordResponse(BaseModel):
    id: int
    image_url: str
    disease_name: str
    confidence: float
    description: str
    treatment: str
    prevention: str
    recommended_products: str
    is_favorite: bool
    conversation_id: Optional[int] = None  # 新增
    created_at: datetime

    class Config:
        from_attributes = True
```

---

## 阶段 2: 后端 API 实现

### Task 3: 添加更新诊断关联对话的 API

**Files:**
- Modify: `backend/app/api/endpoints/diagnoses.py:53-66`

**Step 1: 添加关联对话的 API**

```python
@router.put("/{diagnosis_id}/conversation", response_model=DiagnosisRecordResponse)
def link_conversation(
    diagnosis_id: int,
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """关联诊断记录与AI对话"""
    record = db.query(DiagnosisRecord).filter(
        DiagnosisRecord.id == diagnosis_id,
        DiagnosisRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Diagnosis record not found")

    # 验证对话是否存在
    from app.models.chat import Conversation
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
```

---

### Task 4: 修改创建对话 API 支持诊断上下文

**Files:**
- Modify: `backend/app/api/endpoints/ai_chat.py`

**Step 1: 查看现有对话创建 API**

查找现有的创建对话的 API 端点...

**Step 2: 添加支持诊断上下文的创建逻辑**

在对话创建时，如果传入了诊断上下文，自动生成初始消息：

```python
# 在创建对话后，如果传入了 diagnosis_context，自动创建初始消息
if diagnosis_context:
    initial_message = ChatMessage(
        conversation_id=new_conversation.id,
        role="user",
        content=f"我想咨询关于 {diagnosis_context.get('disease_name', '植物病虫害')} 的问题。"
    )
    db.add(initial_message)

    # 如果有治疗和预防建议，也添加进去
    if diagnosis_context.get('treatment'):
        treatment_msg = ChatMessage(
            conversation_id=new_conversation.id,
            role="user",
            content=f"诊断结果：{diagnosis_context.get('disease_name')}\n治疗建议：{diagnosis_context.get('treatment')}\n预防措施：{diagnosis_context.get('prevention', '')}"
        )
        db.add(treatment_msg)
```

---

## 阶段 3: 移动端实现

### Task 5: 创建对话服务（保存到后端）

**Files:**
- Modify: `APP/src/services/consultationService.ts`

**Step 1: 添加保存对话到后端的 API**

```typescript
// 新增：保存对话到后端
export const saveConversationToBackend = async (conversation: Conversation): Promise<number> => {
  const response = await api.post('/api/chat/conversations', {
    title: conversation.title,
    diagnosis_context: conversation.diagnosisContext ? {
      disease_name: conversation.diagnosisContext.currentDiagnosis?.name,
      treatment: conversation.diagnosisContext.currentDiagnosis?.treatment,
      prevention: conversation.diagnosisContext.currentDiagnosis?.prevention,
    } : null
  });
  return response.data.id;
};

// 新增：保存消息到后端
export const saveMessageToBackend = async (conversationId: number, message: Message): Promise<void> => {
  await api.post(`/api/chat/conversations/${conversationId}/messages`, {
    role: message.role,
    content: message.content
  });
};

// 新增：获取用户对话列表（从后端）
export const getConversationsFromBackend = async (): Promise<Conversation[]> => {
  const response = await api.get('/api/chat/conversations');
  return response.data.items;
};

// 新增：根据诊断ID获取关联对话
export const getConversationByDiagnosis = async (diagnosisId: number): Promise<number | null> => {
  const response = await api.get(`/api/diagnoses/${diagnosisId}`);
  return response.data.conversation_id;
};
```

---

### Task 6: 诊断详情页增加 AI 问诊按钮

**Files:**
- Modify: `APP/src/screens/DiagnosisDetailScreen.tsx`

**Step 1: 添加 AI 问诊按钮**

在诊断详情页的按钮区域添加：

```typescript
// 在 handleRediagnose 函数后添加
const handleAIConsult = async () => {
  try {
    // 检查是否已有关联对话
    const existingConvId = await getConversationByDiagnosis(diagnosisId);

    if (existingConvId) {
      // 已有对话，直接跳转到该对话
      onNavigate?.('Consultation', { conversationId: existingConvId.toString() });
    } else {
      // 创建新对话，传递诊断上下文
      const newConv = {
        ...createConversation({
          currentDiagnosis: {
            name: record.disease_name,
            treatment: record.treatment,
            prevention: record.prevention,
          }
        }),
        diagnosisContext: {
          currentDiagnosis: {
            name: record.disease_name,
            treatment: record.treatment,
            prevention: record.prevention,
          }
        }
      };

      // 保存到后端并获取ID
      const backendConvId = await saveConversationToBackend(newConv);

      // 更新诊断记录的关联对话
      await api.put(`/api/diagnoses/${diagnosisId}/conversation`, {
        conversation_id: backendConvId
      });

      // 跳转到对话页面
      onNavigate?.('Consultation', { conversationId: backendConvId.toString() });
    }
  } catch (error) {
    console.error('Failed to start AI consultation:', error);
    Alert.alert('错误', '无法启动 AI 问诊');
  }
};
```

**Step 2: 在 UI 中添加按钮**

在"再次诊断"按钮旁边添加：

```typescript
<TouchableOpacity
  style={styles.secondaryButton}
  onPress={handleAIConsult}
  activeOpacity={duration.pressed}
>
  <Icon name="message-circle" size={22} color={colors.primary} />
  <Text style={styles.secondaryButtonText}>AI 问诊</Text>
</TouchableOpacity>
```

**Step 3: 添加按钮样式**

```typescript
secondaryButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  backgroundColor: colors.primary + '15',
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  borderColor: colors.primary,
  marginTop: spacing.md,
},
secondaryButtonText: {
  fontSize: fontSize.md,
  fontWeight: fontWeight.semibold,
  color: colors.primary,
},
```

---

### Task 7: 对话列表支持显示关联诊断

**Files:**
- Modify: `APP/src/screens/ConsultationListScreen.tsx`

**Step 1: 显示关联诊断信息**

在对话列表项中，如果对话有关联的诊断，显示诊断名称：

```typescript
// 渲染对话列表项时
const renderItem = ({ item }: { item: Conversation }) => {
  const diagnosisInfo = item.diagnosisContext?.currentDiagnosis;

  return (
    <View style={styles.conversationItem}>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationTitle}>{item.title}</Text>
        {diagnosisInfo && (
          <Text style={styles.diagnosisTag}>
            关联诊断: {diagnosisInfo.name}
          </Text>
        )}
        <Text style={styles.lastMessage}>
          {item.messages[item.messages.length - 1]?.content || ''}
        </Text>
      </View>
    </View>
  );
};
```

---

## 阶段 4: 测试验证

### Task 8: 测试整体流程

**Step 1: 测试创建诊断记录**

```bash
# 调用诊断 API 创建记录
curl -X POST "http://localhost:8000/api/diagnoses" \
  -H "Authorization: Bearer <token>" \
  -d '{"image_url": "test.jpg", "disease_name": "叶斑病", "confidence": 0.8}'
```

**Step 2: 测试关联对话**

```bash
# 先创建对话
curl -X POST "http://localhost:8000/api/chat/conversations" \
  -H "Authorization: Bearer <token>" \
  -d '{"title": "叶斑病咨询"}'

# 关联诊断和对话
curl -X PUT "http://localhost:8000/api/diagnoses/1/conversation?conversation_id=1" \
  -H "Authorization: Bearer <token>"
```

**Step 3: 测试移动端流程**

1. 在诊断历史页面点击一条记录
2. 点击"AI 问诊"按钮
3. 验证是否跳转到对话页面
4. 验证对话中是否包含诊断上下文

---

## 实施完成

**Plan complete and saved to `docs/plans/2026-03-26-diagnosis-chat-history-implementation-plan.md`**

**Which approach?**

1. **Subagent-Driven (this session)** - 本会话中逐任务执行
2. **Parallel Session (separate)** - 新会话中批量执行