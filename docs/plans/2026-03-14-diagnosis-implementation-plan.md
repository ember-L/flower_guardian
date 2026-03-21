# 诊断页面功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完善病症诊断页面功能，包括AI问诊、养护知识、病害识别API对接

**Architecture:** 采用混合模式 - 在线调用后端API，离线使用本地ONNX模型。AI问诊通过后端代理调用DashScope Qwen API，确保API Key安全

**Tech Stack:** React Native, AsyncStorage, FastAPI, YOLO11, ONNX Runtime

---

## 第一阶段：病害识别API对接

### Task 1.1: 创建病害识别服务

**Files:**
- Modify: `APP/src/services/hybridRecognition.ts:1-344`
- Create: `APP/src/services/pestRecognitionService.ts`

**Step 1: 阅读现有的hybridRecognition和PlantRecognition服务**

Run: 查看 `APP/src/services/hybridRecognition.ts` 和 `APP/src/services/PlantRecognition.ts` 的在线/离线切换逻辑

**Step 2: 创建pestRecognitionService**

```typescript
// APP/src/services/pestRecognitionService.ts
import { isNetworkConnected } from '../utils/networkMonitor';

const API_BASE_URL = 'http://localhost:8000';

export interface PestResult {
  id: string;
  name: string;
  confidence: number;
  type: 'insect' | 'disease' | 'physiological' | 'unknown';
  treatment: string;
  prevention: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DiagnosisResult extends PestResult {
  recommendations: {
    immediate: string;
    prevention: string;
    severity_level: string;
  };
}

// 在线识别
const recognizeOnline = async (imageUri: string): Promise<DiagnosisResult> => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  const response = await fetch(`${API_BASE_URL}/api/diagnosis/full`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    throw new Error(`诊断失败: ${response.status}`);
  }

  return await response.json();
};

// 离线识别（使用本地ONNX模型）
const recognizeOffline = async (imageUri: string): Promise<DiagnosisResult> => {
  // TODO: 实现本地ONNX模型推理
  // 参考 hybridRecognition.ts 的离线识别逻辑
  return {
    id: '0',
    name: '叶斑病',
    confidence: 0.85,
    type: 'disease',
    treatment: '及时清除病叶，喷洒多菌灵',
    prevention: '保持通风，避免过度潮湿',
    severity: 'medium',
    recommendations: {
      immediate: '喷洒杀菌剂',
      prevention: '加强通风',
      severity_level: 'medium'
    }
  };
};

export const pestRecognitionService = {
  async recognize(imageUri: string): Promise<DiagnosisResult> {
    const connected = await isNetworkConnected();
    if (connected) {
      return await recognizeOnline(imageUri);
    } else {
      return await recognizeOffline(imageUri);
    }
  },

  async isOfflineAvailable(): Promise<boolean> {
    // 检查ONNX是否可用
    return false;
  }
};
```

**Step 3: 更新 DiagnosisScreen 使用新服务**

Run: 修改 `APP/src/screens/DiagnosisScreen.tsx` 中的 `handleDiagnose` 函数，调用 `pestRecognitionService.recognize()`

**Step 4: 测试识别功能**

Run: 在模拟器中测试拍照识别流程

---

### Task 1.2: 添加API端点到后端

**Files:**
- Create: `backend/app/api/endpoints/diagnoses.py`
- Modify: `backend/app/api/router.py`

**Step 1: 创建 diagnoses 端点**

```python
# backend/app/api/endpoints/diagnoses.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/diagnoses", tags=["diagnoses"])

@router.get("")
async def get_diagnoses(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 获取用户诊断历史
    pass

@router.get("/{id}")
async def get_diagnosis(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 获取诊断详情
    pass

@router.post("/{id}/favorite")
async def toggle_favorite(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 收藏/取消收藏
    pass
```

**Step 2: 注册路由**

Run: 在 `backend/app/api/router.py` 中添加 diagnoses 路由

---

## 第二阶段：问诊室基础功能

### Task 2.1: 创建AI对话服务

**Files:**
- Create: `APP/src/services/consultationService.ts`

**Step 1: 创建对话服务**

```typescript
// APP/src/services/consultationService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUri?: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  diagnosisContext?: any;
  updatedAt: number;
}

const STORAGE_KEY = '@consultations';

// 调用后端AI代理接口
const callAIChat = async (messages: Message[], context?: any): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      context
    }),
  });

  if (!response.ok) {
    throw new Error(`AI服务错误: ${response.status}`);
  }

  const data = await response.json();
  return data.message.content;
};

// 保存对话到本地
export const saveConversation = async (conversation: Conversation): Promise<void> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const conversations: Conversation[] = stored ? JSON.parse(stored) : [];

  const existingIndex = conversations.findIndex(c => c.id === conversation.id);
  if (existingIndex >= 0) {
    conversations[existingIndex] = conversation;
  } else {
    conversations.unshift(conversation);
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
};

// 获取所有对话
export const getConversations = async (): Promise<Conversation[]> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// 删除对话
export const deleteConversation = async (id: string): Promise<void> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const conversations: Conversation[] = stored ? JSON.parse(stored) : [];
  const filtered = conversations.filter(c => c.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// 发送消息
export const sendMessage = async (
  conversation: Conversation,
  content: string,
  imageUri?: string
): Promise<Conversation> => {
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content,
    imageUri,
    timestamp: Date.now()
  };

  const updatedConversation: Conversation = {
    ...conversation,
    messages: [...conversation.messages, userMessage],
    updatedAt: Date.now()
  };

  try {
    const aiResponse = await callAIChat(updatedConversation.messages, conversation.diagnosisContext);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now()
    };

    updatedConversation.messages = [...updatedConversation.messages, aiMessage];
    updatedConversation.title = conversation.title || content.substring(0, 20);

    await saveConversation(updatedConversation);
    return updatedConversation;
  } catch (error) {
    console.error('AI chat error:', error);
    throw error;
  }
};

// 新建对话
export const createConversation = (diagnosisContext?: any): Conversation => ({
  id: Date.now().toString(),
  title: '新对话',
  messages: [],
  diagnosisContext,
  updatedAt: Date.now()
});
```

**Step 2: 添加API端点配置**

Run: 修改 `APP/src/services/config.ts`，添加 AI_CHAT 接口

---

### Task 2.2: 创建问诊室列表页

**Files:**
- Create: `APP/src/screens/ConsultationListScreen.tsx`

**Step 1: 创建页面组件**

```typescript
// APP/src/screens/ConsultationListScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, shadows, fontSize, fontWeight } from '../constants/theme';
import { getConversations, Conversation, deleteConversation } from '../services/consultationService';

interface Props {
  onGoBack: () => void;
  onNavigate: (page: string, params?: any) => void;
}

export function ConsultationListScreen({ onGoBack, onNavigate }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const data = await getConversations();
    setConversations(data);
  };

  const handleNewChat = () => {
    onNavigate('Consultation', { conversationId: null });
  };

  const handleOpenChat = (id: string) => {
    onNavigate('Consultation', { conversationId: id });
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleOpenChat(item.id)}
    >
      <View style={styles.chatIcon}>
        <Icons.MessageCircle size={24} color={colors.primary} />
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatTitle}>{item.title || '新对话'}</Text>
        <Text style={styles.chatPreview} numberOfLines={1}>
          {item.messages[item.messages.length - 1]?.content || '暂无消息'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <Icons.ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>问诊室</Text>
        <TouchableOpacity onPress={handleNewChat} style={styles.newBtn}>
          <Icons.Edit3 size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icons.MessageCircle size={48} color={colors.border} />
            <Text style={styles.emptyText}>暂无问诊记录</Text>
            <Text style={styles.emptySubtext}>点击右上角开始新对话</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  backBtn: { padding: spacing.sm },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  newBtn: { padding: spacing.sm },
  list: { padding: spacing.lg },
  chatItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  chatIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  chatInfo: { flex: 1 },
  chatTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  chatPreview: { fontSize: fontSize.sm, color: colors['text-secondary'], marginTop: spacing.xs },
  empty: { alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: fontSize.lg, color: colors['text-secondary'], marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors['text-tertiary'], marginTop: spacing.xs },
});
```

---

### Task 2.3: 创建问诊对话页

**Files:**
- Create: `APP/src/screens/ConsultationScreen.tsx`

**Step 1: 创建对话页面**

```typescript
// APP/src/screens/ConsultationScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, shadows, fontSize, fontWeight, touchTarget } from '../constants/theme';
import { sendMessage, createConversation, Conversation, Message, getConversations } from '../services/consultationService';

interface Props {
  onGoBack: () => void;
  conversationId?: string;
  diagnosisContext?: any;
}

export function ConsultationScreen({ onGoBack, conversationId, diagnosisContext }: Props) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  const loadConversation = async () => {
    if (conversationId) {
      const conversations = await getConversations();
      const found = conversations.find(c => c.id === conversationId);
      if (found) setConversation(found);
    } else {
      setConversation(createConversation(diagnosisContext));
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !conversation || isLoading) return;

    const text = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      const updated = await sendMessage(conversation, text);
      setConversation(updated);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.role === 'user' ? styles.userMessage : styles.aiMessage]}>
      <Text style={[styles.messageText, item.role === 'user' && styles.userMessageText]}>
        {item.content}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <Icons.ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI 问诊</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={conversation?.messages || []}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.welcome}>
            <Icons.MessageCircle size={48} color={colors.primary} />
            <Text style={styles.welcomeText}>您好！我是AI植物医生</Text>
            <Text style={styles.welcomeSubtext}>请描述您的植物问题，我会为您提供专业建议</Text>
          </View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="描述您的植物问题..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Icons.Send size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  messageList: { padding: spacing.lg },
  messageBubble: { maxWidth: '80%', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  userMessage: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  aiMessage: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  messageText: { fontSize: fontSize.md, color: colors.text, lineHeight: 22 },
  userMessageText: { color: colors.white },
  welcome: { alignItems: 'center', paddingTop: 100 },
  welcomeText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, marginTop: spacing.md },
  welcomeSubtext: { fontSize: fontSize.md, color: colors['text-secondary'], textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.xl },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: borderRadius.lg, padding: spacing.md, fontSize: fontSize.md, maxHeight: 100 },
  sendBtn: { width: touchTarget.minimum, height: touchTarget.minimum, borderRadius: touchTarget.minimum / 2, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },
  sendBtnDisabled: { backgroundColor: colors.border },
});
```

---

### Task 2.4: 添加导航路由

**Files:**
- Modify: `APP/src/navigation/AppNavigator.tsx`

**Step 1: 添加新页面到导航**

```typescript
// 添加导入
import { ConsultationListScreen } from '../screens/ConsultationListScreen';
import { ConsultationScreen } from '../screens/ConsultationScreen';

// 添加类型
export type SubPageName = ... | 'ConsultationList' | 'Consultation' | 'Knowledge';

// 添加路由逻辑
if (currentSubPage === 'ConsultationList') {
  return <ConsultationListScreen onGoBack={handleGoBack} onNavigate={handleNavigate} />;
}
if (currentSubPage === 'Consultation') {
  return <ConsultationScreen onGoBack={handleGoBack} conversationId={navParams?.conversationId} diagnosisContext={navParams?.diagnosisContext} />;
}
```

---

## 第三阶段：问诊室增强功能

### Task 3.1: 添加图片输入功能

**Files:**
- Modify: `APP/src/screens/ConsultationScreen.tsx`

**Step 1: 添加图片选择器**

```typescript
// 添加到 ConsultationScreen
const handleAttachImage = async () => {
  const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
  if (result.assets?.length) {
    // TODO: 添加图片到消息
  }
};

// 在输入区域添加按钮
<TouchableOpacity onPress={handleAttachImage} style={styles.attachBtn}>
  <Icons.Image size={20} color={colors.primary} />
</TouchableOpacity>
```

---

### Task 3.2: 创建后端AI代理接口

**Files:**
- Create: `backend/app/api/endpoints/ai_chat.py`

**Step 1: 创建AI聊天端点**

```python
# backend/app/api/endpoints/ai_chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import os

router = APIRouter(prefix="/api/ai", tags=["ai"])

DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
DASHSCOPE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    context: Optional[Dict[str, Any]] = None

# 植物专家系统提示
SYSTEM_PROMPT = """你是一位专业的植物医生和园艺专家。
用户会向你咨询植物养护和病虫害问题。
请用专业、友善的语气回答，尽量提供实用的建议。
如果需要更多信息来诊断问题，请询问用户。"""

@router.post("/chat")
async def chat(request: ChatRequest):
    if not DASHSCOPE_API_KEY:
        raise HTTPException(status_code=503, detail="AI服务未配置")

    # 构建消息
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # 添加上下文（诊断历史）
    if request.context and request.context.get("diagnosis_history"):
        history = request.context["diagnosis_history"]
        context_info = f"用户最近的诊断记录: {history}"
        messages.append({"role": "system", "content": context_info})

    # 添加用户消息
    messages.extend([{"role": m.role, "content": m.content} for m in request.messages])

    async with httpx.AsyncClient() as client:
        response = await client.post(
            DASHSCOPE_URL,
            json={
                "model": "qwen-plus",
                "messages": messages,
                "temperature": 0.7
            },
            headers={
                "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
                "Content-Type": "application/json"
            }
        )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="AI服务调用失败")

    data = response.json()
    return {"message": data["choices"][0]["message"]}
```

---

## 第四阶段：养护知识

### Task 4.1: 创建预置知识库

**Files:**
- Create: `APP/src/data/knowledgeBase.ts`

**Step 1: 创建知识库数据**

```typescript
// APP/src/data/knowledgeBase.ts

export interface KnowledgeArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  icon: string;
}

export const knowledgeBase: KnowledgeArticle[] = [
  {
    id: '1',
    category: '浇水',
    title: '科学浇水指南',
    summary: '掌握正确的浇水方法，让植物健康生长',
    content: '...',
    icon: 'droplet'
  },
  {
    id: '2',
    category: '光照',
    title: '光照需求详解',
    summary: '了解不同植物的光照需求',
    content: '...',
    icon: 'sun'
  },
  {
    id: '3',
    category: '施肥',
    title: '施肥技巧',
    summary: '合理施肥，促进植物生长',
    content: '...',
    icon: 'feather'
  },
  {
    id: '4',
    category: '病虫害',
    title: '病虫害预防',
    summary: '预防为主，早发现早治疗',
    content: '...',
    icon: 'bug'
  },
  {
    id: '5',
    category: '季节',
    title: '四季养护要点',
    summary: '不同季节的养护注意事项',
    content: '...',
    icon: 'calendar'
  }
];
```

---

### Task 4.2: 创建养护知识页面

**Files:**
- Create: `APP/src/screens/KnowledgeScreen.tsx`

**Step 1: 创建知识页面**

```typescript
// APP/src/screens/KnowledgeScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, shadows, fontSize, fontWeight } from '../constants/theme';
import { knowledgeBase, KnowledgeArticle } from '../data/knowledgeBase';

interface Props {
  onGoBack: () => void;
  onNavigate: (page: string, params?: any) => void;
  hasDiagnosisHistory?: boolean;
}

export function KnowledgeScreen({ onGoBack, onNavigate, hasDiagnosisHistory }: Props) {
  const [selectedTab, setSelectedTab] = useState<'general' | 'personal'>(hasDiagnosisHistory ? 'personal' : 'general');

  const renderArticle = ({ item }: { item: KnowledgeArticle }) => (
    <TouchableOpacity style={styles.articleCard} onPress={() => onNavigate('KnowledgeDetail', { article: item })}>
      <View style={styles.articleIcon}>
        <Icons.Droplet size={24} color={colors.primary} />
      </View>
      <View style={styles.articleInfo}>
        <Text style={styles.articleTitle}>{item.title}</Text>
        <Text style={styles.articleSummary}>{item.summary}</Text>
      </View>
      <Icons.ChevronRight size={20} color={colors['text-tertiary']} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <Icons.ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>养护知识</Text>
        <View style={{ width: 40 }} />
      </View>

      {hasDiagnosisHistory && (
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, selectedTab === 'general' && styles.tabActive]} onPress={() => setSelectedTab('general')}>
            <Text style={[styles.tabText, selectedTab === 'general' && styles.tabTextActive]}>通用知识</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, selectedTab === 'personal' && styles.tabActive]} onPress={() => setSelectedTab('personal')}>
            <Text style={[styles.tabText, selectedTab === 'personal' && styles.tabTextActive]}>个性化建议</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={knowledgeBase}
        keyExtractor={item => item.id}
        renderItem={renderArticle}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  backBtn: { padding: spacing.sm },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xs },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: fontSize.md, color: colors['text-secondary'] },
  tabTextActive: { color: colors.white, fontWeight: fontWeight.semibold },
  list: { padding: spacing.lg },
  articleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  articleIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primaryLight + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  articleInfo: { flex: 1 },
  articleTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  articleSummary: { fontSize: fontSize.sm, color: colors['text-secondary'], marginTop: spacing.xs },
});
```

---

## 实现顺序总结

1. **Task 1.1** - 创建病害识别服务
2. **Task 1.2** - 后端添加诊断历史API
3. **Task 2.1** - 创建AI对话服务
4. **Task 2.2** - 创建问诊室列表页
5. **Task 2.3** - 创建问诊对话页
6. **Task 2.4** - 添加导航路由
7. **Task 3.1** - 添加图片输入功能
8. **Task 3.2** - 创建后端AI代理
9. **Task 4.1** - 创建预置知识库
10. **Task 4.2** - 创建养护知识页面
