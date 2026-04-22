import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { diagnosisService } from '../../services/diagnosisService'
import Icon from '../../components/Icon'
import BboxOverlay, { BboxItem } from '../../components/BboxOverlay'
import { getFullImageUrl } from '../../services/request'
import './index.scss'

// 检测标签类型
interface DetectionTag {
  name: string
  count: number
  color: string
}

interface DiagnosisDetail {
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
    return { label: '高置信度', color: '#52c41a', bgColor: '#f6ffed' }
  }
  if (confidence >= 0.5) {
    return { label: '中等置信度', color: '#faad14', bgColor: '#fffbe6' }
  }
  return { label: '低置信度', color: '#ff4d4f', bgColor: '#ffccc7' }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DiagnosisDetail() {
  const [detail, setDetail] = useState<DiagnosisDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [diagnosisId, setDiagnosisId] = useState<number | null>(null)
  const [detectionBboxes, setDetectionBboxes] = useState<BboxItem[]>([])
  const [detectionTags, setDetectionTags] = useState<DetectionTag[]>([])
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  useDidShow(() => {
    const params = Taro.getCurrentInstance().router?.params
    const id = params?.diagnosisId || params?.id
    if (id) {
      setDiagnosisId(Number(id))
    }
  })

  useEffect(() => {
    if (diagnosisId) {
      loadDetail(diagnosisId)
    }
  }, [diagnosisId])

  const loadDetail = async (id: number) => {
    setLoading(true)
    try {
      const data = await diagnosisService.getDiagnosis(id)
      setDetail(data)

      // 解析存储的检测框数据
      try {
        const tagMap: Record<string, { count: number; color: string }> = {}

        const getTypeColor = (type?: string) => {
          switch (type) {
            case 'disease': return '#faad14'
            case 'insect': return '#ff4d4f'
            case 'plant': return '#52c41a'
            default: return '#52c41a'
          }
        }

        let bboxes: BboxItem[] = []
        let tags: DetectionTag[] = []

        // 从存储的detections字段解析检测框
        if (data.detections && data.detections.trim()) {
          const storedBboxes = JSON.parse(data.detections) as BboxItem[]
          console.log('[DiagnosisDetail] 解析存储的检测框:', storedBboxes.length)

          storedBboxes.forEach((item: BboxItem) => {
            if (item.bbox && item.bbox.length === 4 && item.bbox[2] > item.bbox[0] && item.bbox[3] > item.bbox[1]) {
              bboxes.push(item)
              const name = item.name || '未知'
              if (!tagMap[name]) {
                tagMap[name] = { count: 0, color: getTypeColor(item.type) }
              }
              tagMap[name].count++
            }
          })

          tags = Object.entries(tagMap).map(([name, info]) => ({
            name,
            count: info.count,
            color: info.color,
          }))
        }

        console.log('[DiagnosisDetail] bboxes:', bboxes.length, 'tags:', tags.length)
        setDetectionBboxes(bboxes)
        setDetectionTags(tags)
      } catch (parseErr) {
        console.error('[DiagnosisDetail] 解析检测框失败:', parseErr)
        setDetectionBboxes([])
        setDetectionTags([])
      }
    } catch (err: any) {
      console.error('加载诊断详情失败:', err)
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async () => {
    if (!detail) return
    try {
      const updated = await diagnosisService.toggleFavorite(detail.id)
      setDetail({ ...detail, is_favorite: updated.is_favorite })
      Taro.showToast({
        title: updated.is_favorite ? '已收藏' : '已取消收藏',
        icon: 'none',
      })
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  }

  if (loading) {
    return (
      <View className='detail-page'>
        <View className='loading-wrap'>
          <View className='loading-circle'>
            <Icon name="loader" size={32} color="#999" />
          </View>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!detail) {
    return (
      <View className='detail-page'>
        <View className='loading-wrap'>
          <Text className='loading-text'>暂无数据</Text>
        </View>
      </View>
    )
  }

  const confidenceConfig = getConfidenceConfig(detail.confidence)

  return (
    <View className='detail-page'>
      {/* 头部 */}


      <ScrollView scrollY className='scroll-view' enhanced showScrollbar={false}>
        {/* 主图区域 */}
        <View className='image-container'>
          {detail.image_url && detail.image_url.trim().length > 0 ? (
            <View className='detail-image-wrapper'>
              <Image
                className='detail-image'
                src={getFullImageUrl(detail.image_url)}
                mode='aspectFill'
                lazyLoad
                onLoad={(e) => {
                  console.log('[DiagnosisDetail] Image loaded, naturalWidth:', e.detail.width, 'naturalHeight:', e.detail.height)
                  // 存储图片尺寸用于BboxOverlay
                  setImageSize({ width: e.detail.width, height: e.detail.height })
                }}
              />
              <BboxOverlay
                imageSrc={getFullImageUrl(detail.image_url)}
                bboxes={detectionBboxes}
                imageHeightRpx={560}
                imageWidth={imageSize.width}
                imageHeight={imageSize.height}
              />
            </View>
          ) : (
            capturedImage && <Image className='detail-image' src={capturedImage} mode='aspectFill' lazyLoad />
          )}
          {!detail.image_url && !capturedImage && (
            <View className='detail-image-placeholder'>
              <Icon name="image" size={48} color="#ccc" />
            </View>
          )}
          {/* 渐变遮罩 */}
          <View className='image-gradient' />

          {/* 检测结果标签 */}
          {detectionTags.length > 0 && (
            <View className='detection-tags-overlay'>
              {detectionTags.map((tag, index) => (
                <View key={index} className='detection-tag-badge'>
                  <View className='detection-tag-dot' style={{ backgroundColor: tag.color }} />
                  <Text className='detection-tag-text'>{tag.name} × {tag.count}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 置信度徽章 */}
          <View className='confidence-badge' style={{ backgroundColor: confidenceConfig.bgColor }}>
            <Text className='confidence-badge-text' style={{ color: confidenceConfig.color }}>
              {confidenceConfig.label} * {(detail.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* 诊断结果 */}
        <View className='content'>
          <View className='title-section'>
            <Text className='disease-name'>{detail.disease_name}</Text>
            <View className='date-row'>
              <Icon name="clock" size={14} color="#999" />
              <Text className='date-text'>{formatDate(detail.created_at)}</Text>
            </View>
          </View>

          {/* 病因描述 */}
          {(detail.description || detail.disease_name === '未知') && (
            <View className='section'>
              <View className='section-header'>
                <View className='section-icon' style={{ backgroundColor: '#fffbe6' }}>
                  <Icon name="alert-triangle" size={16} color="#faad14" />
                </View>
                <Text className='section-title'>诊断说明</Text>
              </View>
              <View className='section-content'>
                <Text className='section-text'>
                  {detail.disease_name === '未知'
                    ? '很抱歉，未能识别出植物病害。建议您：\n1. 拍摄更清晰的照片\n2. 确保光线充足\n3. 拍摄植物的患病部位特写'
                    : detail.description || '暂无描述'}
                </Text>
              </View>
            </View>
          )}

          {/* 治疗建议 */}
          {(detail.treatment || detail.disease_name === '未知') && (
            <View className='section'>
              <View className='section-header'>
                <View className='section-icon' style={{ backgroundColor: '#f6ffed' }}>
                  <Icon name="stethoscope" size={16} color="#52c41a" />
                </View>
                <Text className='section-title'>治疗建议</Text>
              </View>
              <View className='section-content'>
                <Text className='section-text'>
                  {detail.disease_name === '未知'
                    ? '请尝试重新识别，建议拍摄：\n1. 患处清晰特写\n2. 整体植株照片\n3. 不同角度的照片'
                    : detail.treatment || '暂无建议'}
                </Text>
              </View>
            </View>
          )}

          {/* 预防措施 */}
          {(detail.prevention || detail.disease_name === '未知') && (
            <View className='section'>
              <View className='section-header'>
                <View className='section-icon' style={{ backgroundColor: 'rgba(255, 68, 102, 0.08)' }}>
                  <Icon name="shield" size={16} color="#f46" />
                </View>
                <Text className='section-title'>预防措施</Text>
              </View>
              <View className='section-content'>
                <Text className='section-text'>
                  {detail.disease_name === '未知'
                    ? '保持植物健康，定期检查叶片和茎干，及时发现并处理异常情况。'
                    : detail.prevention || '暂无预防措施'}
                </Text>
              </View>
            </View>
          )}

          {/* 推荐产品 */}
          {detail.recommended_products && detail.recommended_products !== '[]' && (
            <View className='section'>
              <View className='section-header'>
                <View className='section-icon' style={{ backgroundColor: '#e6f2ff' }}>
                  <Icon name="shopping-cart" size={16} color="#007aff" />
                </View>
                <Text className='section-title'>推荐产品</Text>
              </View>
              <View className='section-content'>
                <Text className='section-text'>{detail.recommended_products}</Text>
              </View>
            </View>
          )}

          {/* AI 问诊卡片 */}
          <View className='ai-consult-card' onClick={() => {
            const url = detail.conversation_id
              ? `/pages/consultation/index?conversationId=${detail.conversation_id}&disease=${encodeURIComponent(detail.disease_name)}`
              : `/pages/consultation/index?disease=${encodeURIComponent(detail.disease_name)}`
            Taro.navigateTo({ url })
          }}>
            <View className='ai-consult-left'>
              <View className='ai-consult-icon' style={{ backgroundColor: 'rgba(255, 68, 102, 0.08)' }}>
                <Icon name="message-circle" size={18} color="#f46" />
              </View>
              <View className='ai-consult-text'>
                <Text className='ai-consult-title'>AI 智能问诊</Text>
                <Text className='ai-consult-desc'>基于诊断结果获取专业治疗建议</Text>
              </View>
            </View>
            <Text className='ai-arrow'>&gt;</Text>
          </View>
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className='footer'>
        <View className='action-button' onClick={toggleFavorite}>
          <Icon name="star" size={20} color={detail.is_favorite ? '#faad14' : '#999'} />
          <Text className={`action-button-text ${detail.is_favorite ? 'action-button-text-active' : ''}`}>
            {detail.is_favorite ? '已收藏' : '收藏'}
          </Text>
        </View>

        <View className='primary-button' onClick={() => Taro.navigateTo({ url: '/pages/diagnosis/index' })}>
          <Icon name="camera" size={20} color="#fff" />
          <Text className='primary-button-text'>再次诊断</Text>
        </View>
      </View>
    </View>
  )
}

definePageConfig({
  navigationBarBackgroundColor: '#ffffff',
  navigationBarTextStyle: 'black',
  navigationBarTitleText: '',
})
