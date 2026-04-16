import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import './index.scss'
import { getDiary, deleteDiary, type Diary } from '../../services/diaryService'
import { getFullImageUrl } from '../../services/request'

export default function DiaryDetail() {
  const router = useRouter()
  const diaryId = Number(router.params.id)
  const [diary, setDiary] = useState<Diary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (diaryId) loadDiary()
  }, [diaryId])

  const loadDiary = async () => {
    try {
      setLoading(true)
      const data = await getDiary(diaryId)
      setDiary(data)
    } catch (error) {
      console.error('加载日记失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条日记吗？',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteDiary(diaryId)
            Taro.showToast({ title: '删除成功', icon: 'success' })
            setTimeout(() => Taro.navigateBack(), 1000)
          } catch (error) {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      },
    })
  }

  const handlePreviewImage = (current: string) => {
    if (!diary?.images) return
    Taro.previewImage({
      current,
      urls: diary.images,
    })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <View className='page-loading'>
        <Text className='loading-text'>加载中...</Text>
      </View>
    )
  }

  if (!diary) {
    return (
      <View className='page-empty'>
        <Text className='empty-text'>日记不存在</Text>
      </View>
    )
  }

  return (
    <View className='diary-detail'>
      {/* 头部 */}
      <View className='header'>
        <View className='header-btn' onClick={() => Taro.navigateBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </View>
        <Text className='header-title'>日记详情</Text>
        <View className='header-btn' onClick={handleDelete}>
          <Icon name="trash" size={20} color="#ff4d4f" />
        </View>
      </View>

      <ScrollView scrollY className='content'>
        {/* 基本信息 */}
        <View className='info'>
          <View className='plant-info'>
            <View className='avatar'>
              <Icon name="flower2" size={16} color="#52c41a" />
            </View>
            <View>
              <Text className='plant-name'>{diary.plant_name || '我的植物'}</Text>
              <Text className='date'>{formatDate(diary.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* 生长数据 */}
        {(diary.height || diary.leaf_count) && (
          <View className='growth-data'>
            {diary.height && (
              <View className='growth-item'>
                <Icon name="ruler" size={14} color="#52c41a" />
                <Text className='growth-value'>{diary.height} cm</Text>
              </View>
            )}
            {diary.leaf_count && (
              <View className='growth-item'>
                <Icon name="leaf" size={14} color="#52c41a" />
                <Text className='growth-value'>{diary.leaf_count} 片叶子</Text>
              </View>
            )}
          </View>
        )}

        {/* 图片 */}
        {diary.images && diary.images.length > 0 && (
          <View className='images'>
            {diary.images.length === 1 && typeof diary.images[0] === 'string' && diary.images[0].trim().length > 0 ? (
              <Image
                className='single-image'
                src={getFullImageUrl(diary.images[0])}
                mode='aspectFill'
                onClick={() => handlePreviewImage(getFullImageUrl(diary.images[0]))}
              />
            ) : (
              <ScrollView scrollX className='images-scroll'>
                {diary.images.map((uri, index) => (
                  uri && typeof uri === 'string' && uri.trim().length > 0 ? (
                    <Image
                      key={index}
                      className='thumbnail'
                      src={getFullImageUrl(uri)}
                      mode='aspectFill'
                      onClick={() => handlePreviewImage(getFullImageUrl(uri))}
                    />
                  ) : null
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* 文字内容 */}
        {diary.content && (
          <View className='content-section'>
            <Text className='diary-content'>{diary.content}</Text>
          </View>
        )}

        {/* 对比按钮 */}
        <View className='compare-btn' onClick={() => Taro.showToast({ title: '对比功能开发中', icon: 'none' })}>
          <Icon name="git-compare" size={16} color="#f46" />
          <Text className='compare-btn-text'>与上次记录对比</Text>
        </View>
      </ScrollView>
    </View>
  )
}
