// 问诊对话页面 - 与RN端保持一致
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect, useRef, useCallback } from 'react'
import './index.scss'
import Icon from '../../components/Icon'
import {
  getConversation,
  getConversationFromBackend,
  sendMessage,
  sendMessageToBackend,
  createConversation,
  getWelcomeMessage,
  createConversationToBackend,
  type Conversation,
  type Message,
  type DiagnosisContext,
} from '../../services/consultationService'

definePageConfig({
  navigationBarTitleText: 'AI 问诊',
  navigationBarBackgroundColor: '#ffffff',
  navigationBarTextStyle: 'black',
})

// 打字机效果组件
function TypewriterText({
  text,
  onComplete,
}: {
  text: string
  onComplete?: () => void
}) {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    // 重置状态
    setDisplayText('')
    setIsComplete(false)
    setIsStarted(false)

    // 延迟启动动画，确保组件已渲染
    const startTimer = setTimeout(() => {
      setIsStarted(true)
      const typeSpeed = 30 // 稍微慢一点，让效果更明显
      let currentIndex = 0

      intervalRef.current = setInterval(() => {
        if (currentIndex < text.length) {
          currentIndex++
          setDisplayText(text.substring(0, currentIndex))
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          setIsComplete(true)
          onComplete?.()
        }
      }, typeSpeed)
    }, 100) // 100ms 延迟启动

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      clearTimeout(startTimer)
    }
  }, [text, onComplete])

  return (
    <Text className='message-text'>
      {displayText}
      {isStarted && !isComplete && <Text className='cursor'>|</Text>}
    </Text>
  )
}

export default function Consultation() {
  const router = useRouter()
  const conversationIdParam = router.params.conversationId || ''
  const diseaseParam = router.params.disease || ''

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const scrollRef = useRef<any>(null)

  // 加载或创建对话
  const loadConversation = useCallback(async () => {
    console.log('[Consultation] loadConversation, conversationId:', conversationIdParam, 'disease:', diseaseParam)

    if (conversationIdParam) {
      // 优先从后端获取对话
      const numericId = parseInt(conversationIdParam, 10)
      console.log('[Consultation] numericId:', numericId)

      try {
        const backendConv = await getConversationFromBackend(numericId)
        console.log('[Consultation] backendConv:', JSON.stringify(backendConv))

        if (backendConv) {
          // 将后端对话转换为本地格式
          const messages = backendConv.messages?.map((m: any) => ({
            id: String(m.id),
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at).getTime(),
          })) || []

          // 如果后端没有消息，但有disease参数，需要发送初始消息
          if (messages.length === 0 && diseaseParam) {
            console.log('[Consultation] No messages in backend, sending initial message...')
            const diagnosisText = `用户刚刚完成了病害诊断，结果如下：
- 病害名称：${decodeURIComponent(diseaseParam)}
- 病害类型：病害
- 严重程度：未知
- 置信度：未知

请基于以上诊断结果，提供专业的治疗建议和后续养护指导。`

            setIsLoading(true)
            setIsTyping(true)

            const tempConv: Conversation = {
              id: String(numericId),
              title: backendConv.title || '诊断咨询',
              messages: [],
              updatedAt: Date.now(),
            }

            try {
              const updated = await sendMessage(tempConv, diagnosisText)

              // 保存到后端
              try {
                await sendMessageToBackend(numericId, 'user', diagnosisText)
                const aiMessage = updated.messages[updated.messages.length - 1]
                if (aiMessage) {
                  await sendMessageToBackend(numericId, 'assistant', aiMessage.content)
                }
              } catch (backendError) {
                console.error('Save to backend error:', backendError)
              }

              // 设置打字动画
              const aiMessage = updated.messages[updated.messages.length - 1]
              if (aiMessage) {
                setTypingMessageId(aiMessage.id)
              }

              setConversation(updated)
              setIsLoading(false)
              scrollToBottom()
            } catch (sendError) {
              console.error('Send initial message error:', sendError)
              setIsLoading(false)
              setIsTyping(false)
            }
            return
          }

          // 有关消息，直接加载
          const converted: Conversation = {
            id: String(backendConv.id),
            title: backendConv.title,
            messages,
            updatedAt: new Date(backendConv.updated_at).getTime(),
          }
          setConversation(converted)
          scrollToBottom()
          return
        }
      } catch (error: any) {
        console.error('Load conversation from backend error:', error)
      }

      // 后端获取失败，从本地存储查找
      const found = await getConversation(conversationIdParam)
      if (found) {
        setConversation(found)
        scrollToBottom()
        return
      }
    }

    // 创建新对话
    const diagnosisContext: DiagnosisContext | undefined = diseaseParam ? {
      currentDiagnosis: {
        name: decodeURIComponent(diseaseParam),
        type: 'disease',
        severity: 'unknown',
        confidence: 0,
      },
    } : undefined

    const newConv = createConversation(diagnosisContext)
    setConversation(newConv)

    // 如果有disease参数，自动发送诊断摘要
    if (diseaseParam) {
      const diagnosisText = `用户刚刚完成了病害诊断，结果如下：
- 病害名称：${decodeURIComponent(diseaseParam)}
- 病害类型：病害
- 严重程度：未知
- 置信度：未知

请基于以上诊断结果，提供专业的治疗建议和后续养护指导。`

      setIsLoading(true)
      setIsTyping(true)

      try {
        const updated = await sendMessage(newConv, diagnosisText)

        // 保存初始诊断消息到后端（如果有conversationId）
        if (conversationIdParam) {
          const numericId = parseInt(conversationIdParam, 10)
          if (numericId && !isNaN(numericId)) {
            try {
              await sendMessageToBackend(numericId, 'user', diagnosisText)
              const aiMessage = updated.messages[updated.messages.length - 1]
              if (aiMessage) {
                await sendMessageToBackend(numericId, 'assistant', aiMessage.content)
              }
            } catch (backendError: any) {
              console.error('Save initial message to backend error:', backendError)
            }
          }
        }

        const aiMessageId = updated.messages[updated.messages.length - 1].id
        setTypingMessageId(aiMessageId)
        setConversation(updated)
        scrollToBottom()
      } catch (error) {
        console.error('Auto send diagnosis error:', error)
        setIsLoading(false)
        setIsTyping(false)
      }
    }
  }, [conversationIdParam, diseaseParam])

  useEffect(() => {
    loadConversation()
  }, [loadConversation])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 99999
      }
    }, 100)
  }, [])

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim() || !conversation || isLoading) return

    const text = inputText.trim()
    setInputText('')
    setIsLoading(true)
    setIsTyping(true)

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    const pendingAiMessageId = 'ai-pending-' + Date.now()

    setConversation(prev => {
      if (!prev) return prev
      return {
        ...prev,
        messages: [...prev.messages, userMessage, {
          id: pendingAiMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        }]
      }
    })

    scrollToBottom()

    try {
      const updated = await sendMessage(conversation, text)
      const aiMessage = updated.messages[updated.messages.length - 1]

      // 同时保存到后端（如果有有效的对话ID）
      const numericConversationId = typeof conversation.id === 'string' ? parseInt(conversation.id, 10) : conversation.id
      if (numericConversationId && !isNaN(numericConversationId)) {
        try {
          await sendMessageToBackend(numericConversationId, 'user', text)
          const aiMsg = updated.messages[updated.messages.length - 1]
          if (aiMsg) {
            await sendMessageToBackend(numericConversationId, 'assistant', aiMsg.content)
          }
        } catch (backendError: any) {
          console.error('Save to backend error:', backendError)
        }
      }

      // 替换pending消息为真实的AI消息
      const realAiMessageId = aiMessage.id
      setConversation(prev => {
        if (!prev) return prev
        const messages = prev.messages.map(msg =>
          msg.id === pendingAiMessageId ? aiMessage : msg
        )
        return { ...prev, messages }
      })

      setTypingMessageId(realAiMessageId)
    } catch (error) {
      console.error('Send message error:', error)
      setConversation(prev => {
        if (!prev) return prev
        const messages = prev.messages.filter(msg => msg.id !== pendingAiMessageId)
        return { ...prev, messages }
      })
      Taro.showToast({ title: '发送失败，请检查网络连接', icon: 'none' })
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  // 打字完成回调
  const handleTypingComplete = useCallback(() => {
    setTypingMessageId(null)
    setIsTyping(false)
    setIsLoading(false)
  }, [])

  // 选择图片
  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        if (tempFilePath && conversation) {
          setIsLoading(true)
          setIsTyping(true)

          const userMessage: Message = {
            id: 'user-' + Date.now(),
            role: 'user',
            content: '[图片]',
            imageUri: tempFilePath,
            timestamp: Date.now(),
          }
          const pendingAiMessageId = 'ai-pending-' + Date.now()

          setConversation(prev => {
            if (!prev) return prev
            return {
              ...prev,
              messages: [...prev.messages, userMessage, {
                id: pendingAiMessageId,
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
              }]
            }
          })
          scrollToBottom()

          sendMessage(conversation, '[图片]', tempFilePath).then(updated => {
            const aiMessage = updated.messages[updated.messages.length - 1]
            setConversation(prev => {
              if (!prev) return prev
              const messages = prev.messages.map(msg =>
                msg.id === pendingAiMessageId ? aiMessage : msg
              )
              return { ...prev, messages }
            })
            setTypingMessageId(aiMessage.id)
            setIsLoading(false)
          }).catch(() => {
            setConversation(prev => {
              if (!prev) return prev
              const messages = prev.messages.filter(msg => msg.id !== pendingAiMessageId)
              return { ...prev, messages }
            })
            Taro.showToast({ title: '发送失败', icon: 'none' })
            setIsLoading(false)
            setIsTyping(false)
          })
        }
      },
    })
  }

  // 新建对话
  const handleNewChat = () => {
    const newConv = createConversation()
    newConv.messages = [getWelcomeMessage()]
    setConversation(newConv)
    setInputText('')
    setIsLoading(false)
    setIsTyping(false)
    setTypingMessageId(null)
  }

  // 渲染Markdown（简化版）
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, index) => {
      if (line.startsWith('## ')) {
        return <Text key={index} className='md-h2'>{line.replace('## ', '')}</Text>
      }
      if (line.startsWith('### ')) {
        return <Text key={index} className='md-h3'>{line.replace('### ', '')}</Text>
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <View key={index} className='md-bullet-item'>
            <Text className='md-bullet'>•</Text>
            <Text className='md-body'>{line.replace(/^[*-] /, '')}</Text>
          </View>
        )
      }
      if (line.match(/^\d+\./)) {
        return (
          <View key={index} className='md-number-item'>
            <Text className='md-number'>{line.match(/^\d+/)?.[0]}.</Text>
            <Text className='md-body'>{line.replace(/^\d+\. /, '')}</Text>
          </View>
        )
      }
      if (line.trim() === '') {
        return <View key={index} className='md-spacer' />
      }
      const parts = line.split(/(\*\*[^*]+\*\*)/g)
      return (
        <Text key={index} className='md-body'>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <Text key={i} className='md-bold'>{part.replace(/\*\*/g, '')}</Text>
            }
            return part
          })}
        </Text>
      )
    })
  }

  // 欢迎消息
  const renderWelcome = () => {
    const welcomeMsg = getWelcomeMessage()
    return (
      <View className='welcome-container'>
        <View className='welcome-icon'>
          <Icon name="message-circle" size={40} color="#f46" />
        </View>
        <Text className='welcome-title'>AI 植物医生</Text>
        <Text className='welcome-text'>{welcomeMsg.content}</Text>
      </View>
    )
  }

  const messages = conversation?.messages || []

  return (
    <View className='container'>
      {/* 头部 */}
      <View className='header'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}>
          <Icon name="chevron-left" size={24} color="#333" />
        </View>
        <View className='header-center'>
          <Text className='header-title'>AI 问诊</Text>
          {isTyping && <Text className='header-subtitle'>正在输入...</Text>}
        </View>
        <View className='new-chat-btn' onClick={handleNewChat}>
          <Icon name="edit-2" size={20} color="#f46" />
        </View>
      </View>

      {/* 消息列表 */}
      <ScrollView
        scrollY
        className='message-list'
        ref={scrollRef}
      >
        {messages.length === 0 ? (
          renderWelcome()
        ) : (
          <View className={messages.length === 0 ? 'message-list-empty' : ''}>
            {messages.map((msg: Message) => {
              const isUser = msg.role === 'user'
              const isPending = !isUser && !msg.content
              const isDisplaying = !isUser && msg.id === typingMessageId

              return (
                <View
                  key={msg.id}
                  className={`message-bubble ${isUser ? 'user-message' : 'ai-message'}`}
                >
                  <View className={`message-content ${isUser ? 'user-message-content' : ''}`}>
                    {!isUser && (
                      <View className='ai-name-row'>
                        <Text className='ai-name-prefix'>护花使者🌸</Text>
                        {/* <Icon name="flower" size={14} color="#f46" /> */}
                      </View>
                    )}
                    {msg.imageUri && (
                      <View className='message-image'>
                        <Icon name="image" size={20} color="#999" />
                      </View>
                    )}
                    {isPending ? (
                      <View className='typing-indicator'>
                        <View className='typing-dot' />
                        <View className='typing-dot typing-dot-mid' />
                        <View className='typing-dot' />
                      </View>
                    ) : isDisplaying ? (
                      <TypewriterText
                        text={msg.content}
                        onComplete={handleTypingComplete}
                      />
                    ) : isUser ? (
                      <Text className='message-text user-message-text'>{msg.content}</Text>
                    ) : (
                      <View className='markdown-content'>{renderMarkdown(msg.content)}</View>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}
        <View className='scroll-anchor' />
      </ScrollView>

      {/* 输入区域 */}
      <View className='input-container'>
        <View className='attach-btn' onClick={handleChooseImage}>
          <Icon name="image" size={22} color="#f46" />
        </View>
        <View className='input-wrapper'>
          <Input
            className='input'
            placeholder='描述您的植物问题...'
            placeholderClass='input-placeholder'
            value={inputText}
            onInput={(e) => setInputText(e.detail.value)}
            onConfirm={handleSend}
            confirmType='send'
            disabled={isLoading}
            maxlength={500}
          />
          {isLoading && <View className='loading-dot' />}
        </View>
        <View
          className={`send-btn ${inputText.trim() && !isLoading ? 'send-btn-active' : 'send-btn-disabled'}`}
          onClick={handleSend}
        >
          <Icon name="send" size={20} color="#fff" />
        </View>
      </View>
    </View>
  )
}
