import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import './index.scss'
import Icon from '../../components/Icon'
import {
  getConversations,
  deleteConversation,
  createConversation,
  type Conversation,
} from '../../services/consultationService'

definePageConfig({
  navigationBarTitleText: '问诊室',
  navigationBarBackgroundColor: '#ffffff',
  navigationBarTextStyle: 'black',
})

export default function ConsultationList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations()
      setConversations(data)
    } catch (err) {
      console.error('加载对话列表失败', err)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useDidShow(() => {
    loadConversations()
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadConversations()
    setRefreshing(false)
  }

  const handleNewChat = () => {
    Taro.navigateTo({ url: '/pages/consultation/index' })
  }

  const handleOpenChat = (id: string) => {
    Taro.navigateTo({ url: `/pages/consultation/index?id=${id}` })
  }

  const handleDeleteChat = (id: string, title: string) => {
    Taro.showModal({
      title: '删除对话',
      content: `确定要删除"${title || '这个对话'}"吗？`,
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteConversation(id)
            loadConversations()
          } catch (err) {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      },
    })
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0')
    } else if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return days + '天前'
    } else {
      return (date.getMonth() + 1) + '-' + date.getDate()
    }
  }

  return (
    <View className='container'>
      <ScrollView
        scrollY
        className='list-scroll'
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        {conversations.length === 0 ? (
          <View className='empty'>
            <View className='empty-icon-container'>
              <Icon name="message-circle" size={48} color="#ff6b88" />
            </View>
            <Text className='empty-text'>暂无问诊记录</Text>
            <Text className='empty-subtext'>点击右上角开始新对话</Text>
            <View className='empty-button' onClick={handleNewChat}>
              <Text className='empty-button-icon'>+</Text>
              <Text className='empty-button-text'>开始问诊</Text>
            </View>
          </View>
        ) : (
          <View className='list'>
            {conversations.map((item) => {
              const lastMessage = item.messages[item.messages.length - 1]
              const messageCount = item.messages.length

              return (
                <View
                  key={item.id}
                  className='chat-item'
                  onClick={() => handleOpenChat(item.id)}
                  onLongPress={() => handleDeleteChat(item.id, item.title)}
                >
                  <View className='chat-icon'>
                    <Icon name="message-circle" size={24} color="#f46" />
                  </View>
                  <View className='chat-info'>
                    <View className='chat-header'>
                      <Text className='chat-title'>{item.title || '新对话'}</Text>
                      <Text className='chat-time'>{formatTime(item.updatedAt)}</Text>
                    </View>
                    <Text className='chat-preview'>
                      {lastMessage?.content || '暂无消息'}
                    </Text>
                    <Text className='chat-count'>{messageCount} 条消息</Text>
                  </View>
                  <Icon name="chevron-right" size={18} color="#999" />
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 新建对话浮动按钮 */}
      <View className='fab' onClick={handleNewChat}>
        <Icon name="edit-2" size={24} color="#fff" />
      </View>
    </View>
  )
}
