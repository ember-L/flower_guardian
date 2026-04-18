import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { recognitionService } from '../../services/recognitionService'
import { createConversationToBackend, DiagnosisContext } from '../../services/consultationService'
import { getToken } from '../../services/auth'
import Icon from '../../components/Icon'
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
}

export default function Diagnosis() {
  const [isLoading, setIsLoading] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

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
      setDiagnosisResult({
        name: diagnosisData.disease_name || diagnosisData.name || '未知',
        confidence: diagnosisData.confidence || 0,
        type: diagnosisData.type || 'disease',
        severity: diagnosisData.severity || (diagnosisData.confidence >= 0.8 ? 'high' : diagnosisData.confidence >= 0.5 ? 'medium' : 'low'),
        treatment: diagnosisData.treatment || '',
        prevention: diagnosisData.prevention || '',
        recommendations: result.recommendations || { immediate: diagnosisData.treatment || '' },
      })
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
  const confidencePercent = Math.round((diagnosisResult?.confidence || 0) * 100)

  const handleReDiagnose = () => {
    setDiagnosisResult(null)
    setCapturedImage(null)
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
          <View className='back-button' onClick={() => Taro.navigateBack()}>
            <Text className='back-icon'>&lt;</Text>
          </View>
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
                <View className='image-tags'>
                  <View className='image-tag'>
                    <Text className='image-tag-text'>识别图片</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 置信度 */}
            <View className='confidence-section'>
              <View className='confidence-header'>
                <Text className='confidence-label'>置信度</Text>
                <Text className='confidence-value' style={{ color: severityConfig.color }}>{confidencePercent}%</Text>
              </View>
              <View className='confidence-bar'>
                <View
                  className='confidence-bar-fill'
                  style={{ width: `${confidencePercent}%`, background: severityConfig.color }}
                />
              </View>
            </View>

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
