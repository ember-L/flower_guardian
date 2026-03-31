# 诊断与AI对话历史记录功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现诊断结果与AI对话的历史记录功能，用户可在诊断详情页点击"AI问诊"跳转到对应对话页面

**Architecture:** 后端通过 diagnosis_records.conversation_id 字段关联 AI 对话，前端在诊断详情页提供"AI问诊"按钮，点击后创建或跳转到对话，并自动传递诊断上下文

**Tech Stack:** FastAPI (后端), React Native + AsyncStorage (移动端), PostgreSQL

---

### Task 1: 修复 ConsultationScreen 加载后端对话逻辑

**Files:**
- Modify: `APP/src/screens/ConsultationScreen.tsx:136-175`
- Test: 手动测试从诊断详情页点击"AI问诊"按钮

**Step 1: 修改 loadConversation 使用后端 API**

在 ConsultationScreen.tsx 中，loadConversation 函数需要优先从后端 API 获取对话数据，而不是仅从本地 AsyncStorage 获取。

当前代码问题：`getConversation(conversationId)` 只从本地存储查找，找不到就创建新对话，导致后端创建的对话无法正确加载。

**修改 ConsultationScreen.tsx 第 136-175 行:**

```typescript
// 加载或创建对话
const loadConversation = useCallback(async () => {
  if (conversationId) {
    // 优先从后端获取对话
    const numericId = typeof conversationId === 'string' ? parseInt(conversationId, 10) : conversationId;
    try {
      const backendConv = await getConversationFromBackend(numericId);
      if (backendConv) {
        // 将后端对话转换为本地格式
        const converted: Conversation = {
          id: String(backendConv.id),
          title: backendConv.title,
          messages: backendConv.messages?.map((m: any) => ({
            id: String(m.id),
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at).getTime(),
          })) || [],
          updatedAt: new Date(backendConv.updated_at).getTime(),
        };
        setConversation(converted);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        return;
      }
    } catch (error) {
      console.error('Load conversation from backend error:', error);
    }

    // 后端获取失败，从本地存储查找
    const found = await getConversation(String(conversationId));
    if (found) {
      setConversation(found);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      return;
    }
  }
  // 创建新对话
  const newConv = createConversation(diagnosisContext);
  setConversation(newConv);

  // 如果有当前诊断结果，自动发送诊断摘要
  if (newConv.diagnosisContext?.currentDiagnosis) {
    const diagnosis = newConv.diagnosisContext.currentDiagnosis;
    const diagnosisText = `用户刚刚完成了病害诊断，结果如下：
- 病害名称：${diagnosis.name}
- 病害类型：${diagnosis.type}
- 严重程度：${diagnosis.severity}
- 置信度：${diagnosis.confidence}%

请基于以上诊断结果，提供专业的治疗建议和后续养护指导。`;

    setIsLoading(true);
    setIsTyping(true);

    try {
      const updated = await sendMessage(newConv, diagnosisText);
      const aiMessageId = updated.messages[updated.messages.length - 1].id;
      setTypingMessageId(aiMessageId);
      setConversation(updated);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Auto send diagnosis error:', error);
      setIsLoading(false);
      setIsTyping(false);
    }
  }
}, [conversationId, diagnosisContext]);
```

**Step 2: 添加 getConversationFromBackend 导入**

在 ConsultationScreen.tsx 顶部添加导入：

```typescript
import { sendMessage, createConversation, getConversation, getConversationFromBackend, Conversation, Message, getWelcomeMessage } from '../services/consultationService';
```

**Step 3: 测试验证**

1. 启动后端服务
2. 运行移动APP
3. 进行一次病症诊断
4. 在诊断详情页点击"AI问诊"按钮
5. 验证：
   - 对话是否成功创建
   - 是否正确跳转到 ConsultationScreen
   - 诊断上下文是否正确传递

---

### Task 2: 确保诊断详情页正确传递 diagnosisContext

**Files:**
- Modify: `APP/src/screens/DiagnosisDetailScreen.tsx:94-121`
- Test: 验证 diagnosisContext 包含完整诊断信息

**Step 1: 检查 handleAIConsult 函数**

当前 handleAIConsult 已正确构建 diagnosisContext：

```typescript
const diagnosisContext = {
  currentDiagnosis: record ? {
    name: record.disease_name,
    type: 'disease',
    severity: record.confidence >= 0.8 ? 'high' : record.confidence >= 0.5 ? 'medium' : 'low',
    confidence: record.confidence,
  } : undefined,
  plantType: undefined,
};
```

此任务已完成，无需修改。

---

### Task 3: 添加诊断历史列表页的对话关联显示

**Files:**
- Modify: `APP/src/screens/DiagnosisHistoryScreen.tsx`
- Test: 查看诊断历史列表是否显示关联对话图标

**Step 1: 检查 DiagnosisHistoryScreen**

查看诊断历史列表是否需要显示每个诊断是否有关联对话。可以添加一个图标指示。

此为可选优化任务，当前功能已可用。

---

### Task 4: 测试完整流程

**Step 1: 端到端测试**

1. 打开APP，登录账户
2. 进入"病症诊断"页面
3. 上传植物照片进行诊断
4. 查看诊断结果
5. 点击"AI 问诊"按钮
6. 验证跳转到的对话页面包含诊断上下文
7. 返回诊断详情，验证 conversation_id 已关联

---

## 执行说明

1. **Task 1** 是核心修复 - 确保 ConsultationScreen 正确加载后端对话
2. **Task 2-3** 是可选优化
3. **Task 4** 验证完整流程

完成后功能流程：
```
诊断历史 → 诊断详情 → 点击"AI问诊" → 创建对话并关联 → 跳转对话页面并传递诊断上下文
```
