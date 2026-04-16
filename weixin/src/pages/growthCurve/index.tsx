import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import './index.scss'
import { getDiaries, getMyPlants, type Diary, type Plant } from '../../services/diaryService'

const TIME_RANGES = [
  { label: '1个月', value: 1 },
  { label: '3个月', value: 3 },
  { label: '6个月', value: 6 },
  { label: '全部', value: 0 },
]

export default function GrowthCurve() {
  const router = useRouter()
  const preselectedPlantId = router.params.plantId ? Number(router.params.plantId) : null

  const [plants, setPlants] = useState<Plant[]>([])
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(preselectedPlantId || null)
  const [selectedRange, setSelectedRange] = useState(3)
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlants()
  }, [])

  useEffect(() => {
    if (selectedPlantId) {
      loadDiaries()
    }
  }, [selectedPlantId, selectedRange])

  const loadPlants = async () => {
    try {
      const data = await getMyPlants()
      setPlants(data)
      if (data.length > 0 && !selectedPlantId) {
        setSelectedPlantId(data[0].id)
      }
    } catch (error) {
      console.error('Failed to load plants:', error)
    }
  }

  const loadDiaries = async () => {
    if (!selectedPlantId) return
    setLoading(true)
    try {
      const data = await getDiaries(selectedPlantId)
      // 过滤有生长数据的日记
      const filtered = data.filter(d => d.height || d.leaf_count)

      // 按时间范围过滤
      if (selectedRange > 0) {
        const cutoff = new Date()
        cutoff.setMonth(cutoff.getMonth() - selectedRange)
        const filteredByDate = filtered.filter(d => new Date(d.created_at) >= cutoff)
        setDiaries(filteredByDate)
      } else {
        setDiaries(filtered)
      }
    } catch (error) {
      console.error('Failed to load diaries:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  const formatDateFull = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  }

  // 高度图表数据
  const renderHeightChart = () => {
    const dataWithHeight = diaries.filter(d => d.height)
    if (dataWithHeight.length < 2) {
      return <Text className='no-data-text'>暂无足够数据绘制图表</Text>
    }

    const heights = dataWithHeight.map(d => d.height!)
    const minHeight = Math.min(...heights) - 5
    const maxHeight = Math.max(...heights) + 5
    const range = maxHeight - minHeight || 1

    return (
      <View className='chart-inner'>
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <View key={i} className='chart-grid-line' style={{ bottom: `${ratio * 100}%` }} />
        ))}

        {/* 折线图用柱状图替代 */}
        <View className='chart-bars'>
          {dataWithHeight.map((d, i) => {
            const barHeight = Math.max(((d.height! - minHeight) / range) * 240, 8)
            return (
              <View key={i} className='chart-bar-wrap'>
                <Text className='chart-bar-value'>{d.height}</Text>
                <View className='chart-bar' style={{ height: `${barHeight}px` }} />
                <Text className='chart-bar-date'>{formatDate(d.created_at)}</Text>
              </View>
            )
          })}
        </View>

        {/* Y轴标签 */}
        <View className='y-labels'>
          <Text className='y-label'>{maxHeight}</Text>
          <Text className='y-label'>{Math.round((maxHeight + minHeight) / 2)}</Text>
          <Text className='y-label'>{minHeight}</Text>
        </View>
      </View>
    )
  }

  // 叶片图表数据
  const renderLeafChart = () => {
    const dataWithLeaf = diaries.filter(d => d.leaf_count)
    if (dataWithLeaf.length < 2) {
      return <Text className='no-data-text'>暂无足够数据绘制图表</Text>
    }

    const leafCounts = dataWithLeaf.map(d => d.leaf_count!)
    const maxLeaf = Math.max(...leafCounts) || 1

    return (
      <View className='chart-inner'>
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <View key={i} className='chart-grid-line' style={{ bottom: `${ratio * 100}%` }} />
        ))}

        {/* 柱状图 */}
        <View className='chart-bars'>
          {dataWithLeaf.map((d, i) => {
            const barHeight = Math.max((d.leaf_count! / maxLeaf) * 240, 8)
            return (
              <View key={i} className='chart-bar-wrap'>
                <Text className='chart-bar-value'>{d.leaf_count}</Text>
                <View className='chart-bar leaf-bar' style={{ height: `${barHeight}px` }} />
                <Text className='chart-bar-date'>{formatDate(d.created_at)}</Text>
              </View>
            )
          })}
        </View>

        {/* Y轴标签 */}
        <View className='y-labels'>
          <Text className='y-label'>{maxLeaf}</Text>
          <Text className='y-label'>{Math.round(maxLeaf / 2)}</Text>
          <Text className='y-label'>0</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='growth-curve'>
      {/* 头部 */}
      <View className='header'>
        <View className='header-btn' onClick={() => Taro.navigateBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </View>
        <Text className='header-title'>生长曲线</Text>
        <View className='header-btn' />
      </View>

      <ScrollView scrollY className='content'>
        {/* 植物选择 */}
        <View className='section'>
          <Text className='section-title'>选择植物</Text>
          {plants.length === 0 ? (
            <Text className='empty-text'>暂无植物</Text>
          ) : (
            <ScrollView scrollX className='plant-chips-scroll'>
              <View className='plant-chips'>
                {plants.map((plant) => (
                  <View
                    key={plant.id}
                    className={`plant-chip ${selectedPlantId === plant.id ? 'active' : ''}`}
                    onClick={() => setSelectedPlantId(plant.id)}
                  >
                    <Text className={`plant-chip-text ${selectedPlantId === plant.id ? 'active' : ''}`}>
                      {plant.name}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* 时间范围选择 */}
        <View className='section'>
          <Text className='section-title'>时间范围</Text>
          <View className='range-selector'>
            {TIME_RANGES.map((range) => (
              <View
                key={range.value}
                className={`range-btn ${selectedRange === range.value ? 'active' : ''}`}
                onClick={() => setSelectedRange(range.value)}
              >
                <Text className={`range-btn-text ${selectedRange === range.value ? 'active' : ''}`}>
                  {range.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {loading ? (
          <View className='loader'>
            <Text className='loading-text'>加载中...</Text>
          </View>
        ) : (
          <>
            {/* 高度变化 */}
            <View className='chart-section'>
              <View className='chart-title-row'>
                <Icon name="ruler" size={16} color="#f46" />
                <Text className='chart-title'> 高度变化 (cm)</Text>
              </View>
              <View className='chart-card'>
                {renderHeightChart()}
              </View>
            </View>

            {/* 叶片数量 */}
            <View className='chart-section'>
              <View className='chart-title-row'>
                <Icon name="leaf" size={16} color="#52c41a" />
                <Text className='chart-title'> 叶片数量</Text>
              </View>
              <View className='chart-card'>
                {renderLeafChart()}
              </View>
            </View>

            {/* 数据列表 */}
            <View className='section'>
              <Text className='section-title'>记录详情</Text>
              {diaries.length === 0 ? (
                <Text className='no-data-text'>暂无生长数据</Text>
              ) : (
                diaries.map((d) => (
                  <View key={d.id} className='data-item'>
                    <Text className='data-date'>{formatDateFull(d.created_at)}</Text>
                    <View className='data-values'>
                      {d.height && <Text className='data-value'>高度: {d.height}cm</Text>}
                      {d.leaf_count && <Text className='data-value'>叶片: {d.leaf_count}片</Text>}
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}
