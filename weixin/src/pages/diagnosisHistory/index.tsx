import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { diagnosisService } from '../../services/diagnosisService'
import { getToken } from '../../services/auth'
import Icon from '../../components/Icon'
import { API_BASE_URL } from '../../services/config'
import { getFullImageUrl } from '../../services/request'
import './index.scss'

interface DiagnosisRecord {
  id: number
  image_url: string
  disease_name: string
  confidence: number
  description?: string
  treatment?: string
  prevention?: string
  recommended_products?: string
  is_favorite: boolean
  conversation_id?: number
  created_at: string
}

const getConfidenceConfig = (confidence: number) => {
  if (confidence >= 0.8) {
    return { label: '高置信', color: '#52c41a', bgColor: '#f6ffed' }
  }
  if (confidence >= 0.5) {
    return { label: '中等', color: '#faad14', bgColor: '#fffbe6' }
  }
  return { label: '低置信', color: '#ff4d4f', bgColor: '#ffccc7' }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return diffMins <= 1 ? '刚刚' : `${diffMins}分钟前`
    }
    return `${diffHours}小时前`
  }
  if (diffDays === 1) return '昨天'
  if (diffDays === 2) return '前天'
  if (diffDays < 7) return `${diffDays}天前`

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

export default function DiagnosisHistory() {
  const [records, setRecords] = useState<DiagnosisRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'favorite'>('all')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const loadRecords = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setRecords([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const favoriteParam = filter === 'favorite' ? true : undefined
      const data = await diagnosisService.getHistory(favoriteParam)
      setRecords(data.items || [])
    } catch (err: any) {
      console.error('加载诊断历史失败:', err)
      // 401 未授权，跳转登录
      if (err.message?.includes('登录已过期') || err.message?.includes('未授权')) {
        Taro.showModal({
          title: '提示',
          content: '登录已过期，请重新登录',
          success: () => {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        })
      }
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  const checkLoginStatus = useCallback(() => {
    const token = getToken()
    setIsLoggedIn(!!token)
    if (token) {
      loadRecords()
    } else {
      setRecords([])
      setLoading(false)
    }
  }, [loadRecords])

  useDidShow(() => {
    checkLoginStatus()
  })

  useEffect(() => {
    checkLoginStatus()
  }, [checkLoginStatus])

  const navigateToDetail = (diagnosisId: number) => {
    Taro.navigateTo({ url: `/pages/diagnosisDetail/index?diagnosisId=${diagnosisId}` })
  }

  const navigateToDiagnosis = () => {
    Taro.navigateTo({ url: '/pages/diagnosis/index' })
  }

  const handleToggleFavorite = async (id: number) => {
    try {
      const result = await diagnosisService.toggleFavorite(id)
      setRecords(prev => prev.map(r => r.id === id ? { ...r, is_favorite: result.is_favorite } : r))
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  }

  const handleDelete = async (id: number) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条诊断记录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await diagnosisService.deleteDiagnosis(id)
            setRecords(prev => prev.filter(r => r.id !== id))
          } catch (err: any) {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  const filteredRecords = filter === 'favorite' ? records.filter(r => r.is_favorite) : records

  return (
    <View className='container'>
      {/* Header */}


      {/* Filter tabs */}
      <View className='tabs-container'>
        <View className='tabs'>
          <View
            className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <Icon name="clipboard" size={18} color={filter === 'all' ? '#f46' : '#666'} />
            <Text className={`tab-text ${filter === 'all' ? 'tab-text-active' : ''}`}>全部</Text>
          </View>
          <View
            className={`tab ${filter === 'favorite' ? 'tab-active' : ''}`}
            onClick={() => setFilter('favorite')}
          >
            <Icon name="star" size={18} color={filter === 'favorite' ? '#faad14' : '#666'} />
            <Text className={`tab-text ${filter === 'favorite' ? 'tab-text-active-fav' : ''}`}>收藏</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className='loading-container'>
          <View className='loading-circle'>
            <Icon name="loader" size={32} color="#999" />
          </View>
          <Text className='loading-text'>加载中...</Text>
        </View>
      ) : filteredRecords.length === 0 ? (
        <View className='empty-container'>
          <View className='empty-icon-container'>
            <View className='empty-icon-inner'>
              <Icon name={filter === 'all' ? 'clipboard' : 'star'} size={48} color="#999" />
            </View>
          </View>
          <Text className='empty-title'>
            {filter === 'all' ? '暂无诊断记录' : '暂无收藏'}
          </Text>
          <Text className='empty-subtitle'>
            {filter === 'all'
              ? '开始拍照诊断，记录植物健康状况'
              : '点击收藏按钮，保存重要的诊断结果'}
          </Text>
          {filter === 'all' && (
            <View className='empty-button' onClick={navigateToDiagnosis}>
              <View className='empty-button-icon'>
                <Icon name="camera" size={20} color="#fff" />
              </View>
              <Text className='empty-button-text'>开始诊断</Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView scrollY className='list-scroll' enhanced showScrollbar={false}>
          <View className='list-content'>
            {filteredRecords.map((record) => {
              const confidenceConfig = getConfidenceConfig(record.confidence)
              return (
                <View
                  key={record.id}
                  className='card'
                  onClick={() => navigateToDetail(record.id)}
                >
                  <View className='card-image-container'>
                    {record.image_url ? (
                      <Image
                        className='card-image'
                        src={getFullImageUrl(record.image_url)}
                        mode='aspectFill'
                        lazyLoad
                      />
                    ) : (
                      <View className='card-image card-image-placeholder'>
                        <Icon name="image" size={24} color="#999" />
                      </View>
                    )}
                    {record.is_favorite && (
                      <View className='favorite-badge'>
                        <Icon name="star" size={14} color="#faad14" />
                      </View>
                    )}
                  </View>

                  <View className='card-content'>
                    <View className='card-header'>
                      <Text className='disease-name'>{record.disease_name}</Text>
                    </View>

                    <View className='confidence-badge' style={{ backgroundColor: confidenceConfig.bgColor }}>
                      <Text className='confidence-text' style={{ color: confidenceConfig.color }}>
                        {confidenceConfig.label} {(record.confidence * 100).toFixed(0)}%
                      </Text>
                    </View>

                    <View className='card-meta'>
                      <View className='meta-item'>
                        <Icon name="clock" size={14} color="#999" />
                        <Text className='meta-text'>{formatDate(record.created_at)}</Text>
                      </View>
                    </View>
                  </View>

                  <View className='card-actions'>
                    <View
                      className='favorite-button'
                      onClick={(e) => { e.stopPropagation(); handleToggleFavorite(record.id) }}
                    >
                      <Icon name="star" size={18} color={record.is_favorite ? '#faad14' : '#666'} />
                    </View>
                    <View
                      className='delete-button'
                      onClick={(e) => { e.stopPropagation(); handleDelete(record.id) }}
                    >
                      <Icon name="trash" size={18} color="#ff4d4f" />
                    </View>
                    <Text className='card-arrow'>&gt;</Text>
                  </View>
                </View>
              )
            })}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

definePageConfig({
  navigationBarBackgroundColor: '#ffffff',
  navigationBarTextStyle: 'black',
  navigationBarTitleText: '',
})
