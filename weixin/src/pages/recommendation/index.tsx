import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { recommendationService } from '../../services/recommendService'
import { addToMyGarden } from '../../services/plantService'
import Icon from '../../components/Icon'
import './index.scss'

interface PlantRecommendation {
  plant_id?: number | string
  name: string
  match_score: number
  reason: string
  features: string[]
  is_toxic?: boolean
}

const questions = [
  {
    id: 1,
    question: '你家的光照条件怎么样？',
    options: [
      { label: '光线充足', value: 'full', icon: 'sun' as const },
      { label: '一般光线', value: 'partial', icon: 'cloud' as const },
      { label: '光线较弱', value: 'low', icon: 'moon' as const },
    ],
  },
  {
    id: 2,
    question: '你多久浇一次水？',
    options: [
      { label: '经常忘记', value: 'monthly', icon: 'clock' as const },
      { label: '一周一次', value: 'weekly', icon: 'calendar' as const },
      { label: '想起来就浇', value: 'frequent', icon: 'droplet' as const },
    ],
  },
  {
    id: 3,
    question: '你养植物的目的是？',
    options: [
      { label: '净化空气', value: 'air-purify', icon: 'wind' as const },
      { label: '装饰美观', value: 'decoration', icon: 'flower' as const },
      { label: '兴趣爱好', value: 'hobby', icon: 'heart' as const },
    ],
  },
  {
    id: 4,
    question: '你家有小孩或宠物吗？',
    options: [
      { label: '有', value: 'true', icon: 'heart' as const },
      { label: '没有', value: 'false', icon: 'check-circle' as const },
    ],
  },
  {
    id: 5,
    question: '你有多少养植物经验？',
    options: [
      { label: '新手', value: 'beginner', icon: 'star' as const },
      { label: '养过几盆', value: 'intermediate', icon: 'star' as const },
      { label: '老手', value: 'expert', icon: 'star' as const },
    ],
  },
]

export default function Recommendation() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [recommendations, setRecommendations] = useState<PlantRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})

  const progress = ((currentQuestion + 1) / questions.length) * 100

  const handleAnswer = async () => {
    if (selectedOption !== null) {
      const question = questions[currentQuestion]
      const option = question.options[selectedOption]
      const newAnswers = { ...userAnswers, [question.id.toString()]: option.value }
      setUserAnswers(newAnswers)

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedOption(null)
      } else {
        setLoading(true)
        try {
          const result = await recommendationService.getRecommendations({
            light: (newAnswers['1'] || 'partial') as any,
            watering: (newAnswers['2'] || 'weekly') as any,
            purpose: (newAnswers['3'] || 'decoration') as any,
            has_pets_kids: newAnswers['4'] === 'true',
            experience: (newAnswers['5'] || 'beginner') as any,
          })
          setRecommendations(result)
          setShowResults(true)
        } catch (err: any) {
          Taro.showToast({ title: err.message || '获取推荐失败', icon: 'none' })
        } finally {
          setLoading(false)
        }
      }
    }
  }

  const handleAddToGarden = async (plant: PlantRecommendation) => {
    try {
      await addToMyGarden({ plant_id: plant.plant_id, nickname: plant.name })
      Taro.showToast({ title: '已添加到我的花园', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err.message || '添加失败', icon: 'none' })
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedOption(null)
    setShowResults(false)
    setRecommendations([])
    setUserAnswers({})
  }

  return (
    <View className='container'>
      {/* 头部包装器 */}
      <View className='header-wrapper'>
        <View className='header'>
          {/* <View className='back-button' onClick={() => Taro.navigateBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </View> */}
          <View className='header-content'>
            <View className='header-icon'>
              <Icon name="sparkles" size={28} color="#faad14" />
            </View>
            <Text className='header-title'>新手推荐</Text>
            <Text className='header-subtitle'>回答几个问题，帮你找到适合的植物</Text>
          </View>
          <View className='placeholder' />
        </View>
      </View>

      <ScrollView scrollY className='scroll-view' enhanced showScrollbar={false}>
        {!showResults ? (
          <View className='content'>
            {/* 进度条 */}
            <View className='progress-container'>
              <View className='progress-header'>
                <Text className='progress-label'>问题 {currentQuestion + 1}/{questions.length}</Text>
                <Text className='progress-percent'>{Math.round(progress)}%</Text>
              </View>
              <View className='progress-bar'>
                <View className='progress-fill' style={{ width: `${progress}%` }} />
              </View>
            </View>

            {/* 问题卡片 */}
            <View className='question-card'>
              <View className='question-icon'>
                <Icon name="help-circle" size={24} color="#f46" />
              </View>
              <Text className='question-text'>{questions[currentQuestion].question}</Text>
              <View className='options-list'>
                {questions[currentQuestion].options.map((option, index) => (
                  <View
                    key={index}
                    className={`option-button ${selectedOption === index ? 'option-button-selected' : ''}`}
                    onClick={() => setSelectedOption(index)}
                  >
                    <View className={`option-icon ${selectedOption === index ? 'option-icon-selected' : ''}`}>
                      <Icon name={option.icon} size={20} color={selectedOption === index ? '#fff' : '#f46'} />
                    </View>
                    <Text className={`option-text ${selectedOption === index ? 'option-text-selected' : ''}`}>
                      {option.label}
                    </Text>
                    {selectedOption === index && (
                      <Icon name="check-circle" size={18} color="#fff" />
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* 继续按钮 */}
            <View
              className={`continue-button ${(selectedOption === null || loading) ? 'continue-button-disabled' : ''}`}
              onClick={selectedOption !== null && !loading ? handleAnswer : undefined}
            >
              <Text className='continue-button-text'>
                {loading ? '加载中...' : currentQuestion < questions.length - 1 ? '下一题' : '查看结果'}
              </Text>
              {!loading && <Text className='continue-arrow'>&gt;</Text>}
            </View>
          </View>
        ) : (
          <View className='content'>
            {/* 结果头部 */}
            <View className='result-header'>
              <View className='result-icon'>
                <Icon name="check-circle" size={32} color="#52c41a" />
              </View>
              <Text className='result-title'>为你推荐</Text>
              <Text className='result-subtitle'>根据你的情况，这些植物很适合</Text>
            </View>

            {/* 推荐列表 */}
            {recommendations.length > 0 ? (
              recommendations.map((plant, index) => (
                <View key={index} className='recommend-card'>
                  <View className='recommend-row'>
                    <View className='recommend-icon'>
                      <Icon name="leaf" size={24} color="#52c41a" />
                    </View>
                    <View className='recommend-info'>
                      <View className='recommend-top'>
                        <Text className='recommend-name'>{plant.name}</Text>
                        <View className='survival-badge'>
                          <Icon name="star" size={14} color="#faad14" />
                          <Text className='survival-text'>匹配度 {plant.match_score}%</Text>
                        </View>
                      </View>
                      <Text className='recommend-reason'>{plant.reason}</Text>
                    </View>
                  </View>
                  <View className='feature-row'>
                    {plant.features.map((feature, i) => (
                      <View key={i} className='feature-tag'>
                        <Icon name="check-circle" size={14} color="#52c41a" />
                        <Text className='feature-text'>{feature}</Text>
                      </View>
                    ))}
                    {plant.is_toxic && (
                      <View className='feature-tag feature-tag-danger'>
                        <Icon name="alert-triangle" size={14} color="#ff4d4f" />
                        <Text className='feature-text-danger'>有毒</Text>
                      </View>
                    )}
                  </View>
                  <View className='add-button' onClick={() => handleAddToGarden(plant)}>
                    <Text className='add-icon'>+</Text>
                    <Text className='add-button-text'>添加到花园</Text>
                  </View>
                </View>
              ))
            ) : (
              <View className='empty-result'>
                <Icon name="search" size={40} color="#999" />
                <Text className='empty-text'>暂无推荐，请尝试其他条件</Text>
              </View>
            )}

            {/* 重新测试 */}
            <View className='restart-button' onClick={handleRestart}>
              <Icon name="refresh-cw" size={20} color="#f46" />
              <Text className='restart-button-text'>重新测试</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

definePageConfig({
  navigationBarBackgroundColor: '#ffffff',
  navigationBarTextStyle: 'black',
  navigationBarTitleText: '',
})
