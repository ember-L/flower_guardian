import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'
import Icon from '../../components/Icon'

interface Notification {
  id: string
  title: string
  body: string
  timestamp: number
  read: boolean
  data: {
    type: string
    [key: string]: any
  }
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: '浇水提醒',
    body: '您的绿萝已经3天没有浇水了，今天记得浇水哦！',
    timestamp: Date.now() - 10 * 60 * 1000,
    read: false,
    data: { type: 'reminder' },
  },
  {
    id: '2',
    title: '每日养护提醒',
    body: '今天有3个植物需要浇水，2个需要施肥，请及时处理。',
    timestamp: Date.now() - 60 * 60 * 1000,
    read: false,
    data: { type: 'daily_reminder' },
  },
  {
    id: '3',
    title: '订单发货通知',
    body: '您的订单 #20240315001 已发货，预计3-5天到达。',
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    read: true,
    data: { type: 'order' },
  },
  {
    id: '4',
    title: '养护知识推荐',
    body: '春季来了，了解春季植物养护要点，让您的花园更加美丽。',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    read: true,
    data: { type: 'knowledge' },
  },
  {
    id: '5',
    title: '系统通知',
    body: '护花使者小程序已更新至最新版本，新增AI问诊功能。',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    read: true,
    data: { type: 'system' },
  },
]

const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

const getNotifIcon = (type: string): string => {
  switch (type) {
    case 'daily_reminder':
    case 'reminder':
      return 'bell'
    default:
      return 'droplet'
  }
}

export default function Notification() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)

  const handleNotificationPress = (item: Notification) => {
    setNotifications(prev =>
      prev.map(n => n.id === item.id ? { ...n, read: true } : n)
    )

    if (item.data.type === 'reminder' || item.data.type === 'daily_reminder') {
      Taro.navigateTo({ url: '/pages/reminder/index' })
    }
  }

  const clearAll = () => {
    Taro.showModal({
      title: '清空通知',
      content: '确定要清空所有通知吗？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          setNotifications([])
          Taro.showToast({ title: '已清空', icon: 'success' })
        }
      },
    })
  }

  return (
    <View className='notification-page'>
      {/* 头部 */}
      <View className='header'>
        <View className='back-button' onClick={() => Taro.navigateBack()}>
          <Text className='back-button-text'>{'<'}</Text>
        </View>
        <Text className='header-title'>通知中心</Text>
        {notifications.length > 0 && (
          <View className='clear-button' onClick={clearAll}>
            <Text className='clear-button-text'>清空</Text>
          </View>
        )}
      </View>

      {/* 通知列表 */}
      {notifications.length === 0 ? (
        <View className='empty-container'>
          <View className='empty-icon'>
            <Icon name="bell-off" size={48} color="#ccc" />
          </View>
          <Text className='empty-title'>暂无通知</Text>
          <Text className='empty-subtitle'>
            当有浇水提醒到期时，您会收到通知
          </Text>
        </View>
      ) : (
        <ScrollView scrollY className='list-scroll'>
          <View className='list-content'>
            {notifications.map((item) => (
              <View
                key={item.id}
                className={`notification-card ${!item.read ? 'unread' : ''}`}
                onClick={() => handleNotificationPress(item)}
              >
                <View className='notification-icon'>
                  <Icon name={getNotifIcon(item.data.type) as any} size={20} color="#4CAF50" />
                </View>
                <View className='notification-content'>
                  <Text className='notification-title'>{item.title}</Text>
                  <Text className='notification-body'>{item.body}</Text>
                  <Text className='notification-time'>{formatTime(item.timestamp)}</Text>
                </View>
                {!item.read && <View className='unread-dot' />}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  )
}
