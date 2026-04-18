import Taro from '@tarojs/taro'
import request from './request'
import { API_BASE_URL } from './config'

// 获取 Token
const getToken = (): string => {
  return Taro.getStorageSync('huaban_token') || ''
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUri?: string
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  diagnosisContext?: DiagnosisContext
  updatedAt: number
}

export interface DiagnosisContext {
  currentDiagnosis?: {
    name: string
    type: string
    severity: string
    confidence: number
  }
  recentDiagnoses?: Array<{
    name: string
    treatment: string
    prevention: string
  }>
  plantType?: string
}

const STORAGE_KEY = '@consultations'

// 调用后端AI聊天接口
export const callAIChat = async (messages: Message[], context?: DiagnosisContext): Promise<string> => {
  console.log('[AI Chat] callAIChat called, messages count:', messages.length)

  let systemContext = ''

  if (context && context.recentDiagnoses && context.recentDiagnoses.length > 0) {
    systemContext = '\n用户最近的诊断记录:\n'
    context.recentDiagnoses.forEach((d, i) => {
      systemContext += `${i + 1}. ${d.name} - 治疗: ${d.treatment} - 预防: ${d.prevention}\n`
    })
  }

  const requestBody: any = {
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  }

  if (systemContext) {
    requestBody.system_context = systemContext
  }

  console.log('[AI Chat] Sending request to:', `${API_BASE_URL}/api/ai/chat`)
  console.log('[AI Chat] Request body:', JSON.stringify(requestBody))

  let response
  try {
    response = await Taro.request({
      url: `${API_BASE_URL}/api/ai/chat`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      data: requestBody,
    })
  } catch (err) {
    console.error('[AI Chat] Request failed:', err)
    throw new Error(`AI请求失败: ${err}`)
  }

  console.log('[AI Chat] Response status:', response.statusCode)
  console.log('[AI Chat] Response headers:', response.header)
  console.log('[AI Chat] Response data:', JSON.stringify(response.data))

  if (response.statusCode !== 200) {
    throw new Error(`AI服务错误: ${response.statusCode}`)
  }

  const data = response.data as any
  if (!data) {
    throw new Error('AI服务返回空数据')
  }
  return data.message?.content || data.content || '抱歉，服务暂时不可用，请稍后重试。'
}

// 保存对话到本地存储
export const saveConversation = async (conversation: Conversation): Promise<void> => {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY)
    const conversations: Conversation[] = stored ? JSON.parse(stored) : []

    const existingIndex = conversations.findIndex(c => c.id === conversation.id)
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation
    } else {
      conversations.unshift(conversation)
    }

    const trimmed = conversations.slice(0, 20)
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error('Save conversation error:', error)
  }
}

// 获取所有对话
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// 获取单个对话
export const getConversation = async (id: string): Promise<Conversation | null> => {
  const conversations = await getConversations()
  return conversations.find(c => c.id === id) || null
}

// 删除对话
export const deleteConversation = async (id: string): Promise<void> => {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY)
    const conversations: Conversation[] = stored ? JSON.parse(stored) : []
    const filtered = conversations.filter(c => c.id !== id)
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Delete conversation error:', error)
  }
}

// 清空所有对话
export const clearAllConversations = async (): Promise<void> => {
  Taro.removeStorageSync(STORAGE_KEY)
}

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
    timestamp: Date.now(),
  }

  const updatedConversation: Conversation = {
    ...conversation,
    messages: [...conversation.messages, userMessage],
    updatedAt: Date.now(),
    title: conversation.title || content.substring(0, 20) + (content.length > 20 ? '...' : ''),
  }

  try {
    const aiResponse = await callAIChat(updatedConversation.messages, conversation.diagnosisContext)

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now(),
    }

    updatedConversation.messages = [...updatedConversation.messages, aiMessage]
    updatedConversation.updatedAt = Date.now()

    await saveConversation(updatedConversation)
    return updatedConversation
  } catch (error) {
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '抱歉，服务暂时不可用。请检查网络连接后重试。',
      timestamp: Date.now(),
    }
    updatedConversation.messages = [...updatedConversation.messages, errorMessage]
    return updatedConversation
  }
}

// 新建对话
export const createConversation = (diagnosisContext?: DiagnosisContext): Conversation => ({
  id: Date.now().toString(),
  title: '新对话',
  messages: [],
  diagnosisContext,
  updatedAt: Date.now(),
})

// 获取欢迎消息
export const getWelcomeMessage = (): Message => ({
  id: 'welcome',
  role: 'assistant',
  content: '您好！我是AI植物医生助手 🌿\n\n我可以帮您：\n• 解答植物养护问题 🌱\n• 分析病虫害原因 🐛\n• 提供治疗建议 💊\n• 制定养护计划 📋\n\n请描述您遇到的植物问题，我会尽力帮助您！',
  timestamp: Date.now(),
})

// ==================== 后端 API ====================

// 创建对话到后端
export const createConversationToBackend = async (title: string, diagnosisContext?: DiagnosisContext): Promise<number> => {
  const data = await request<{ id: number }>({
    url: '/api/chat/conversations',
    method: 'POST',
    data: { title, diagnosis_context: diagnosisContext }
  })
  return data.id
}

// 获取对话列表（从后端）
export const getConversationsFromBackend = async (): Promise<any[]> => {
  return request<any[]>({ url: '/api/chat/conversations' })
}

// 获取对话详情（从后端）
export const getConversationFromBackend = async (conversationId: number): Promise<any> => {
  return request({ url: `/api/chat/conversations/${conversationId}` })
}

// 发送消息到后端
export const sendMessageToBackend = async (conversationId: number, role: string, content: string): Promise<void> => {
  await request({
    url: `/api/chat/conversations/${conversationId}/messages`,
    method: 'POST',
    data: { conversation_id: conversationId, role, content },
  })
}

// 根据诊断ID获取关联对话
export const getConversationByDiagnosis = async (diagnosisId: number): Promise<number | null> => {
  try {
    const data = await request<any>({ url: `/api/diagnoses/${diagnosisId}` })
    return data.conversation_id || null
  } catch {
    return null
  }
}

// 关联诊断和对话
export const linkDiagnosisToConversation = async (diagnosisId: number, conversationId: number): Promise<void> => {
  await request({
    url: `/api/diagnoses/${diagnosisId}/conversation?conversation_id=${conversationId}`,
    method: 'PUT',
  })
}
