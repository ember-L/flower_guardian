# 诊断与AI对话历史记录设计方案

## 1. 整体架构

```
诊断记录 (diagnosis_records)
    │
    ├── id, user_id, disease_name, ...
    │
    └── conversation_id (新增，关联对话)
            │
            ▼
AI对话记录 (conversations + chat_messages)
```

## 2. 数据模型扩展

### diagnosis_records 表新增字段
- `conversation_id`: 关联的 AI 对话 ID（可为空，Integer）

### API 调整
- 诊断完成后，如果用户发起 AI 对话，自动关联 conversation_id
- 对话列表可显示关联的诊断结果摘要

## 3. 页面流程

```
诊断历史列表 → 诊断详情页 → 点击"AI问诊"按钮
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                         ▼
         已有对话(关联此诊断)                        无对话 → 创建新对话
                    │                                         │
                    ▼                                         ▼
          跳转到该对话                         传递诊断结果作为上下文
```

## 4. 实现方式

### 4.1 诊断详情页
- 增加"AI问诊"按钮
- 点击时检查该诊断是否有关联对话 (conversation_id)
- 有关联：直接跳转到对话页面
- 无关联：创建新对话，传递诊断结果作为初始消息

### 4.2 后端 API
- 创建对话时支持传入诊断上下文
- 自动生成初始消息，包含诊断结果内容

### 4.3 数据流向
1. 用户在诊断详情页点击"AI问诊"
2. 检查该诊断记录是否有 conversation_id
3. 如果有：跳转到已有对话页面
4. 如果没有：
   - 调用 API 创建新对话
   - 将诊断结果（disease_name, treatment, prevention）作为初始消息
   - 更新 diagnosis_records 的 conversation_id
   - 跳转到新对话页面

## 5. 注意事项
- 对话记录需要持久化存储到后端（目前可能只存储在本地）
- 需要实现对话列表 API 供前端调用