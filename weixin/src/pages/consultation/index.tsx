import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect, useRef, useCallback } from 'react'
import './index.scss'
import Icon from '../../components/Icon'
import {
  getConversation,
  sendMessage,
  getWelcomeMessage,
  type Conversation,
  type Message,
} from '../../services/consultationService'

definePageConfig({
  navigationBarTitleText: 'AI 问诊',
  navigationBarBackgroundColor: '#ffffff',
  navigationBarTextStyle: 'black',
})

export default function Consultation() {
  const router = useRouter()
  const conversationId = router.params.id || ''
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const scrollRef = useRef<any>(null)

  useEffect(() => {
    loadConversation()
  }, [conversationId])

  const loadConversation = async () => {
    try {
      let conv = await getConversation(conversationId)
      if (!conv) {
        conv = {
          id: conversationId || 'new-' + Date.now(),
          title: '新对话',
          messages: [getWelcomeMessage()],
          updatedAt: Date.now(),
        }
      }
      setConversation(conv)
    } catch (err) {
      console.error('加载对话失败', err)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 99999
      }
    }, 100)
  }

  useEffect(() => {
    if (conversation) {
      scrollToBottom()
    }
  }, [conversation?.messages?.length])

  const handleTypingComplete = useCallback(() => {
    setTypingMessageId(null)
    setIsTyping(false)
    setIsLoading(false)
  }, [])

  const handleSend = async () => {
    if (!inputText.trim() || isLoading || !conversation) return

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

      setConversation(prev => {
        if (!prev) return prev
        const messages = prev.messages.map(msg =>
          msg.id === pendingAiMessageId ? aiMessage : msg
        )
        return { ...prev, messages }
      })

      setTypingMessageId(aiMessage.id)
      setIsLoading(false)
      setIsTyping(false)
    } catch (error) {
      console.error('发送失败', error)
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
            setIsTyping(false)
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

  // 简单Markdown渲染
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
      // 处理加粗 **text**
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

  const renderWelcome = () => {
    const welcomeMsg = getWelcomeMessage()
    return (
      <View className='welcome-container'>
        <View className='welcome-icon'>
          <Icon name="message-circle" size={32} color="#4CAF50" />
        </View>
        <Text className='welcome-title'>AI 植物医生</Text>
        <Text className='welcome-text'>{welcomeMsg.content}</Text>
      </View>
    )
  }

  const messages = conversation?.messages || []

  return (
    <View className='container'>
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
              const isTypingMsg = !isUser && msg.id === typingMessageId
              const isPending = !isUser && !msg.content

              return (
                <View
                  key={msg.id}
                  className={`message-bubble ${isUser ? 'user-message' : 'ai-message'}`}
                >
                  <View className={`message-content ${isUser ? 'user-message-content' : ''}`}>
                    {!isUser && <Text className='ai-name-prefix'>护花使者</Text>}<Icon name="flower" size={14} color="#4CAF50" />
                    {msg.imageUri && (
                      <View className='message-image'>
                        <Icon name="image" size={20} color="#999" />
                      </View>
                    )}
                    {isPending ? (
                      <View className='typing-indicator'>
                        <Text className='typing-dot'>·</Text>
                        <Text className='typing-dot typing-dot-mid'>·</Text>
                        <Text className='typing-dot'>·</Text>
                      </View>
                    ) : isTypingMsg ? (
                      <Text className='message-text'>
                        {msg.content}<Text className='cursor'>|</Text>
                      </Text>
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
          <Icon name="image" size={22} color="#666" />
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
