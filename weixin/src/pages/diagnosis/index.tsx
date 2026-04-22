import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { recognitionService } from '../../services/recognitionService'
import { createConversationToBackend, DiagnosisContext } from '../../services/consultationService'
import { diagnosisService } from '../../services/diagnosisService'
import { getToken } from '../../services/auth'
import Icon from '../../components/Icon'
import BboxOverlay, { BboxItem } from '../../components/BboxOverlay'
import logoPng from '../../assets/logo.png'
import './index.scss'

interface DiagnosisResult {
  name: string
  confidence: number
  type: string
  severity: string
  treatment: string
  prevention: string
  recommendations?: {
    immediate?: string
  }
  bbox?: number[]
}

// 检测标签类型
interface DetectionTag {
  name: string
  count: number
  color: string
}

export default function Diagnosis() {
  const [isLoading, setIsLoading] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [detectionBboxes, setDetectionBboxes] = useState<BboxItem[]>([])
  const [detectionTags, setDetectionTags] = useState<DetectionTag[]>([])

  const handleDiagnose = async (source: 'camera' | 'album') => {
    try {
      setIsLoading(true)
      setDiagnosisResult(null)

      let tempFilePath = ''
      if (source === 'camera') {
        const res = await Taro.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['camera'],
        })
        tempFilePath = res.tempFilePaths[0]
      } else {
        const res = await Taro.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album'],
        })
        tempFilePath = res.tempFilePaths[0]
      }

      if (!tempFilePath) {
        setIsLoading(false)
        return
      }

      setCapturedImage(tempFilePath)

      const result = await recognitionService.diagnosePest(tempFilePath)
      // 兼容RN端返回格式 { diagnosis: {...}, recommendations: {...} }
      const diagnosisData = result.diagnosis || result
      const diagnosisResultData = {
        name: diagnosisData.disease_name || diagnosisData.name || '未知',
        confidence: diagnosisData.confidence || 0,
        type: diagnosisData.type || 'disease',
        severity: diagnosisData.severity || (diagnosisData.confidence >= 0.8 ? 'high' : diagnosisData.confidence >= 0.5 ? 'medium' : 'low'),
        treatment: diagnosisData.treatment || '',
        prevention: diagnosisData.prevention || '',
        recommendations: result.recommendations || { immediate: diagnosisData.treatment || '' },
        bbox: diagnosisData.bbox || [0, 0, 0, 0],
      }
      setDiagnosisResult(diagnosisResultData)

      // 设置检测框数据（来自完整识别接口的 plant 和 pest 结果）
      const bboxes: BboxItem[] = []
      // 临时收集标签（未分组）
      const tagMap: Record<string, { count: number; color: string }> = {}

      // 获取类型对应的颜色
      const getTypeColor = (type: string) => {
        switch (type) {
          case 'disease': return '#faad14'
          case 'insect': return '#ff4d4f'
          case 'plant': return '#52c41a'
          default: return '#52c41a'
        }
      }

      // 植物检测框
      if (result.plant) {
        if (result.plant.detections && result.plant.detections.length > 0) {
          result.plant.detections.forEach((det: any) => {
            if (det.bbox && det.bbox.length === 4) {
              bboxes.push({
                name: det.name || result.plant.name || '植物',
                confidence: det.confidence || 0,
                bbox: det.bbox,
                type: 'plant',
              })
              const name = det.name || result.plant.name || '植物'
              if (!tagMap[name]) {
                tagMap[name] = { count: 0, color: getTypeColor('plant') }
              }
              tagMap[name].count++
            }
          })
        } else if (result.plant.bbox && result.plant.bbox.length === 4) {
          bboxes.push({
            name: result.plant.name || '植物',
            confidence: result.plant.confidence || 0,
            bbox: result.plant.bbox,
            type: 'plant',
          })
          const name = result.plant.name || '植物'
          if (!tagMap[name]) {
            tagMap[name] = { count: 0, color: getTypeColor('plant') }
          }
          tagMap[name].count++
        }
      }
      // 病虫害检测框
      if (result.pest) {
        if (result.pest.detections && result.pest.detections.length > 0) {
          result.pest.detections.forEach((det: any) => {
            if (det.bbox && det.bbox.length === 4) {
              const pestType = det.type || result.pest.type || 'pest'
              bboxes.push({
                name: det.name || result.pest.name || '病虫害',
                confidence: det.confidence || 0,
                bbox: det.bbox,
                type: pestType,
              })
              const name = det.name || result.pest.name || '病虫害'
              if (!tagMap[name]) {
                tagMap[name] = { count: 0, color: getTypeColor(pestType) }
              }
              tagMap[name].count++
            }
          })
        } else if (result.pest.bbox && result.pest.bbox.length === 4) {
          const pestType = result.pest.type || 'pest'
          bboxes.push({
            name: result.pest.name || '病虫害',
            confidence: result.pest.confidence || 0,
            bbox: result.pest.bbox,
            type: pestType,
          })
          const name = result.pest.name || '病虫害'
          if (!tagMap[name]) {
            tagMap[name] = { count: 0, color: getTypeColor(pestType) }
          }
          tagMap[name].count++
        }
      }
      // 转换为标签数组
      const tags: DetectionTag[] = Object.entries(tagMap).map(([name, data]) => ({
        name,
        count: data.count,
        color: data.color,
      }))
      setDetectionBboxes(bboxes)
      setDetectionTags(tags)

      // 保存诊断记录到后端（RN端逻辑）
      const token = getToken()
      const diseaseName = diagnosisData.disease_name || diagnosisData.name || '未知'
      if (token && diseaseName && diseaseName !== '未知') {
        try {
          const imageUrl = result.image_url || ''
          // 将检测框数据转为JSON字符串存储
          const detectionsJson = JSON.stringify(bboxes)
          await diagnosisService.createDiagnosis({
            image_url: imageUrl,
            disease_name: diseaseName,
            confidence: diagnosisData.confidence || 0,
            description: diagnosisData.description || '',
            treatment: diagnosisData.treatment || '',
            prevention: diagnosisData.prevention || '',
            recommended_products: result.recommendations?.immediate || '',
            detections: detectionsJson,
          })
          console.log('[Diagnosis] 诊断记录已保存, disease_name:', diseaseName, 'detections:', bboxes.length)
        } catch (saveErr) {
          console.error('[Diagnosis] 保存诊断记录失败:', saveErr)
        }
      } else {
        console.log('[Diagnosis] 未保存诊断记录: token=', !!token, 'diseaseName=', diseaseName)
      }
    } catch (err: any) {
      Taro.showToast({ title: err.message || '识别失败，请重试', icon: 'none' })
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'high':
        return { label: '严重', color: '#ff4d4f', bgColor: '#ffccc7' }
      case 'medium':
        return { label: '中等', color: '#faad14', bgColor: '#fffbe6' }
      default:
        return { label: '轻微', color: '#52c41a', bgColor: '#f6ffed' }
    }
  }

  const severityConfig = diagnosisResult ? getSeverityConfig(diagnosisResult.severity) : null

  const handleReDiagnose = () => {
    setDiagnosisResult(null)
    setCapturedImage(null)
    setDetectionBboxes([])
    setDetectionTags([])
  }

  const handleAIConsult = async () => {
    if (!diagnosisResult) return

    const isLoggedIn = !!getToken()

    // 构建诊断上下文
    const diagnosisContext: DiagnosisContext = {
      currentDiagnosis: {
        name: diagnosisResult.name,
        type: diagnosisResult.type,
        severity: diagnosisResult.severity,
        confidence: diagnosisResult.confidence,
      },
    }

    // 需要登录才能创建对话
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '登录后可使用AI问诊功能',
        confirmText: '登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }

    try {
      // 创建新对话，传递诊断上下文作为标题的一部分
      const title = `诊断咨询: ${diagnosisResult.name}`
      const conversationId = await createConversationToBackend(title, diagnosisContext)

      if (!conversationId) {
        Taro.showToast({ title: '创建对话失败，请重试', icon: 'none' })
        return
      }

      // 跳转到问诊页面
      Taro.navigateTo({
        url: `/pages/consultation/index?conversationId=${conversationId}&disease=${encodeURIComponent(diagnosisResult.name)}`
      })
    } catch (err: any) {
      console.error('AI问诊错误:', err)
      Taro.showToast({ title: err.message || 'AI问诊失败，请重试', icon: 'none' })
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'disease': return '真菌性病害'
      case 'insect': return '虫害'
      case 'physiological': return '生理病害'
      default: return '未知'
    }
  }

  return (
    <View className='container'>
      <ScrollView scrollY className='scroll-view' enhanced showScrollbar={false}>
        {/* 头部 */}
        <View className='header'>
          <View className='header-bg' />
          {/* <View className='back-button' onClick={() => Taro.navigateBack()}>
            <Text className='back-icon'>&lt;</Text>
          </View> */}
          <View className='header-content'>
            <View className='header-icon'>
              <Image className='header-logo' src={logoPng} mode='aspectFit' />
            </View>
            <Text className='header-title'>病症诊断</Text>
            <Text className='header-subtitle'>AI智能识别病虫害</Text>
          </View>
        </View>

        {/* 初始状态 */}
        {!diagnosisResult && !isLoading && (
          <View className='content'>
            {/* 主操作按钮 */}
            <View className='primary-btn' onClick={() => handleDiagnose('camera')}>
              <View className='primary-btn-icon'>
                <Icon name="camera" size={24} color="#fff" />
              </View>
              <View className='primary-btn-text'>
                <Text className='primary-btn-title'>拍照诊断</Text>
                <Text className='primary-btn-desc'>拍摄植物病害部位</Text>
              </View>
              <Text className='arrow-icon'>&gt;</Text>
            </View>

            {/* 次要按钮 */}
            <View className='secondary-btn' onClick={() => handleDiagnose('album')}>
              <View className='secondary-btn-icon'>
                <Icon name="image" size={20} color="#f46" />
              </View>
              <View className='secondary-btn-text'>
                <Text className='secondary-btn-title'>相册选择</Text>
                <Text className='secondary-btn-desc'>从相册选取照片</Text>
              </View>
              <Text className='arrow-icon-sm'>&gt;</Text>
            </View>

            {/* 技巧卡片 */}
            <View className='tips-card'>
              <View className='tips-header'>
                <Icon name="lightbulb" size={20} color="#faad14" />
                <Text className='tips-title'>拍摄技巧</Text>
              </View>
              <View className='tips-items'>
                <Text className='tip-item'>* 拍摄清晰的照片，避免模糊</Text>
                <Text className='tip-item'>* 包含整体植株和病害部位特写</Text>
                <Text className='tip-item'>* 最好在自然光下拍摄</Text>
              </View>
            </View>

            {/* 快捷入口 */}
            <View className='quick-actions'>
              <View className='quick-action' onClick={() => Taro.navigateTo({ url: '/pages/diagnosisHistory/index' })}>
                <Icon name="clipboard" size={20} color="#52c41a" />
                <Text className='quick-action-text'>诊断历史</Text>
                <Text className='arrow-icon-xs'>&gt;</Text>
              </View>
              <View className='quick-action' onClick={() => Taro.navigateTo({ url: '/pages/consultation/index' })}>
                <Icon name="message-circle" size={20} color="#007aff" />
                <Text className='quick-action-text'>问诊室</Text>
                <Text className='arrow-icon-xs'>&gt;</Text>
              </View>
              <View className='quick-action' onClick={() => Taro.navigateTo({ url: '/pages/knowledge/index' })}>
                <Icon name="book-open" size={20} color="#f46" />
                <Text className='quick-action-text'>养护知识</Text>
                <Text className='arrow-icon-xs'>&gt;</Text>
              </View>
            </View>
          </View>
        )}

        {/* 加载状态 */}
        {isLoading && (
          <View className='loading-wrapper'>
            <View className='loading-circle'>
              <Icon name="bug" size={40} color="#f46" />
            </View>
            <Text className='loading-title'>AI正在分析...</Text>
            <Text className='loading-desc'>正在识别病虫害特征</Text>
            <View className='loading-steps'>
              <View className='loading-step'>
                <Icon name="check-circle" size={18} color="#52c41a" />
                <Text className='loading-step-text'>图像上传完成</Text>
              </View>
              <View className='loading-step'>
                <Icon name="loader" size={18} color="#f46" />
                <Text className='loading-step-text'>AI模型分析中</Text>
              </View>
            </View>
          </View>
        )}

        {/* 诊断结果 */}
        {diagnosisResult && severityConfig && (
          <View className='result-wrapper'>
            {/* 图片展示 */}
            {capturedImage && (
              <View className='image-section'>
                <Image className='result-image' src={capturedImage} mode='aspectFill' />
                <BboxOverlay
                  imageSrc={capturedImage}
                  bboxes={detectionBboxes}
                  imageHeightRpx={360}
                />
                <View className='image-tags'>
                  <View className='image-tag'>
                    <Text className='image-tag-text'>识别图片</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 检测类别标签（颜色圆点+名称+数量） */}
            {detectionTags.length > 0 && (
              <View className='confidence-section'>
                <View className='confidence-header'>
                  <Text className='confidence-label'>检测结果</Text>
                  <Text className='confidence-value'>{detectionTags.length} 个目标</Text>
                </View>
                <View className='detection-tags'>
                  {detectionTags.map((tag, index) => (
                    <View key={index} className='detection-tag-item'>
                      <View
                        className='detection-tag-dot'
                        style={{ backgroundColor: tag.color }}
                      />
                      <Text className='detection-tag-name'>{tag.name} : {tag.count}个</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 结果卡片 */}
            <View className='result-card'>
              <View className='result-header'>
                <View className='result-header-left'>
                  <Icon name="check-circle" size={20} color="#52c41a" />
                  <Text className='result-title'>诊断结果</Text>
                </View>
                <View className='severity-badge' style={{ backgroundColor: severityConfig.bgColor }}>
                  <Text className='severity-text' style={{ color: severityConfig.color }}>{severityConfig.label}</Text>
                </View>
              </View>

              {/* 病害名称 */}
              <View className='result-item'>
                <View className='result-item-header'>
                  <View className='result-item-icon' style={{ backgroundColor: '#fffbe6' }}>
                    <Icon name="alert-triangle" size={16} color="#faad14" />
                  </View>
                  <Text className='result-item-label'>病害名称</Text>
                </View>
                <Text className='result-item-value'>{diagnosisResult.name}</Text>
              </View>

              {/* 病害类型 */}
              <View className='result-item'>
                <View className='result-item-header'>
                  <View className='result-item-icon' style={{ backgroundColor: '#e6f2ff' }}>
                    <Icon name="search" size={16} color="#007aff" />
                  </View>
                  <Text className='result-item-label'>病害类型</Text>
                </View>
                <View className='type-badge-wrap'>
                  <Text className='type-badge-text'>{getTypeLabel(diagnosisResult.type)}</Text>
                </View>
              </View>

              {/* 治疗建议 */}
              {diagnosisResult.treatment && (
                <View className='result-item'>
                  <View className='result-item-header'>
                    <View className='result-item-icon' style={{ backgroundColor: '#f6ffed' }}>
                      <Icon name="stethoscope" size={16} color="#52c41a" />
                    </View>
                    <Text className='result-item-label'>治疗建议</Text>
                  </View>
                  <Text className='result-item-text'>{diagnosisResult.treatment}</Text>
                </View>
              )}

              {/* 预防措施 */}
              {diagnosisResult.prevention && (
                <View className='result-item'>
                  <View className='result-item-header'>
                    <View className='result-item-icon' style={{ backgroundColor: 'rgba(255, 68, 102, 0.08)' }}>
                      <Icon name="shield" size={16} color="#f46" />
                    </View>
                    <Text className='result-item-label'>预防措施</Text>
                  </View>
                  <Text className='result-item-text'>{diagnosisResult.prevention}</Text>
                </View>
              )}

              {/* 紧急处理 */}
              {diagnosisResult.recommendations?.immediate && (
                <View className='result-item'>
                  <View className='result-item-header'>
                    <View className='result-item-icon' style={{ backgroundColor: '#ffccc7' }}>
                      <Icon name="alert-triangle" size={16} color="#ff4d4f" />
                    </View>
                    <Text className='result-item-label'>紧急处理</Text>
                  </View>
                  <Text className='result-item-text'>{diagnosisResult.recommendations.immediate}</Text>
                </View>
              )}
            </View>

            {/* 操作按钮 */}
            <View className='action-buttons'>
              <View className='retry-btn' onClick={handleReDiagnose}>
                <Icon name="camera" size={20} color="#f46" />
                <Text className='retry-btn-text'>再次诊断</Text>
              </View>
              <View className='consult-btn' onClick={handleAIConsult}>
                <Icon name="message-circle" size={20} color="#fff" />
                <Text className='consult-btn-text'>咨询医生</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

definePageConfig({
  navigationBarBackgroundColor: '#f46',
  navigationBarTextStyle: 'white',
  navigationBarTitleText: '',
})
