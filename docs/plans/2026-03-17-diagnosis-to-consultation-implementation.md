# 病症诊断结果接入AI问诊实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 当用户从诊断页面点击"咨询医生"时，自动将诊断结果发送给AI，AI基于诊断结果回复（打字机效果）

**Architecture:** 前端修改：更新类型定义 → 转换数据格式 → 自动发送消息

**Tech Stack:** React Native, TypeScript, FastAPI

---

### Task 1: 更新 DiagnosisContext 类型定义

**Files:**
- Modify: `APP/src/services/consultationService.ts:21-28`

**Step 1: 添加 currentDiagnosis 类型**

```typescript
export interface DiagnosisContext {
  // 新增：当前诊断结果
  currentDiagnosis?: {
    name: string;
    type: string;
    severity: string;
    confidence: number;
  };
  // 保留：历史诊断
  recentDiagnoses?: Array<{
    name: string;
    treatment: string;
    prevention: string;
  }>;
}
```

**Step 2: 运行 TypeScript 检查**

Run: `cd APP && npx tsc --noEmit 2>&1 | grep consultationService`
Expected: 无错误

---

### Task 2: 诊断页面转换数据格式

**Files:**
- Modify: `APP/src/screens/DiagnosisScreen.tsx:329`

**Step 1: 修改传递的数据格式**

将 `diagnosisResult` 转换为 `diagnosisContext` 格式：

```typescript
// 当前代码（约第329行）
onNavigate?.('Consultation', { diagnosisContext: diagnosisResult })

// 修改为：
onNavigate?.('Consultation', {
  diagnosisContext: {
    currentDiagnosis: {
      name: diagnosisResult.name,
      type: diagnosisResult.type === 'disease' ? '真菌性病害' :
            diagnosisResult.type === 'insect' ? '虫害' :
            diagnosisResult.type === 'physiological' ? '生理病害' : '未知',
      severity: diagnosisResult.severity,
      confidence: Math.round(diagnosisResult.confidence * 100)
    }
  }
})
```

**Step 2: 运行 TypeScript 检查**

Run: `cd APP && npx tsc --noEmit 2>&1 | grep DiagnosisScreen`
Expected: 无错误

---

### Task 3: 问诊页面自动发送诊断摘要

**Files:**
- Modify: `APP/src/screens/ConsultationScreen.tsx`

**Step 1: 在 loadConversation 函数中添加自动发送逻辑**

在 `loadConversation` 函数中，创建新对话后检测是否有 `diagnosisContext.currentDiagnosis`：

```typescript
// 在 setConversation(newConv); 之后添加：

// 如果有当前诊断结果，自动发送诊断摘要
if (newConv.diagnosisContext?.currentDiagnosis) {
  const diagnosis = newConv.diagnosisContext.currentDiagnosis;
  const diagnosisText = `用户刚刚完成了病害诊断，结果如下：
- 病害名称：${diagnosis.name}
- 病害类型：${diagnosis.type}
- 严重程度：${diagnosis.severity === 'high' ? '严重' : diagnosis.severity === 'medium' ? '中等' : '轻微'}
- 置信度：${diagnosis.confidence}%

请基于以上诊断结果，提供专业的治疗建议和后续养护指导。`;

  // 设置为正在加载
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
```

**Step 2: 运行 TypeScript 检查**

Run: `cd APP && npx tsc --noEmit 2>&1 | grep ConsultationScreen`
Expected: 无错误

---

### Task 4: 测试完整流程

**Step 1: 启动后端**

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Step 2: 启动APP并测试**

1. 打开诊断页面
2. 拍照进行病害识别
3. 点击"咨询医生"按钮
4. 验证：AI自动回复（打字机效果）

**预期结果：**
- 问诊页面自动发送诊断摘要
- AI基于诊断结果回复治疗建议
- 回复使用打字机效果显示

---

### 执行顺序

1. Task 1: 更新类型定义
2. Task 2: 诊断页面数据转换
3. Task 3: 问诊页面自动发送
4. Task 4: 测试验证
