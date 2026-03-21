# 病症诊断结果接入AI问诊设计方案

> **设计日期**: 2026-03-17

## 目标

当用户从病症诊断页面点击"咨询医生"时，将诊断结果（病害名称、类型、严重程度、置信度）传递给AI问诊，并自动发送诊断摘要消息，AI基于诊断结果进行回复。

## 背景

目前已有功能：
- 诊断页面可以拍照识别病害
- 识别结果包含：name, type, severity, confidence, treatment, prevention
- 问诊页面已有打字机效果
- 后端支持 `system_context` 传递诊断数据

## 数据结构设计

### DiagnosisContext 更新

```typescript
export interface DiagnosisContext {
  // 新增：当前诊断结果
  currentDiagnosis?: {
    name: string;        // 病害名称
    type: string;        // 病害类型
    severity: string;    // 严重程度
    confidence: number;  // 置信度 0-100
  };
  // 保留：历史诊断（可选）
  recentDiagnoses?: Array<{
    name: string;
    treatment: string;
    prevention: string;
  }>;
}
```

### 消息格式

```
用户刚刚完成了病害诊断，结果如下：
- 病害名称：白粉病
- 病害类型：真菌性病害
- 严重程度：中等
- 置信度：85%

请基于以上诊断结果，提供专业的治疗建议和后续养护指导。
```

## 流程设计

1. **诊断页面** → 点击"咨询医生" → 传递 `diagnosisResult` 作为 `diagnosisContext`
2. **问诊页面** → 检测到有 `diagnosisContext.currentDiagnosis` → 自动发送诊断摘要
3. **后端** → 收到消息 → 调用 AI → 返回回复
4. **前端** → 收到 AI 回复 → 使用打字机效果逐步显示

## UI/UX 设计

- AI 回复使用已有的打字机效果
- 用户消息在诊断摘要下方显示
- 保持现有问诊页面的交互风格

## 实施范围

1. **前端**:
   - 更新 `DiagnosisContext` 类型定义
   - 修改诊断页面传递的数据
   - 问诊页面自动发送诊断摘要消息

2. **后端**:
   - 无需修改（已有 `system_context` 支持）
