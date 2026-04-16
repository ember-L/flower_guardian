import { View, Text, ScrollView, Switch, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import './index.scss'
import Icon from '../../components/Icon'
import {
  getSmartReminders,
  createSmartReminder,
  toggleReminder,
  completeReminder,
  deleteReminder,
  type SmartReminder,
} from '../../services/reminderService'
import { getMyPlants } from '../../services/plantService'

interface UserPlant {
  id: number
  plant_name: string
  nickname: string
  plant_id?: number
}

const reminderTypeIcons: Record<string, string> = {
  water: 'droplet',
  fertilize: 'flask-conical',
  prune: 'scissors',
}

const reminderTypeColors: Record<string, string> = {
  water: '#0891B2',
  fertilize: '#059669',
  prune: '#F59E0B',
}

const getTypeName = (type: string) => {
  switch (type) {
    case 'water': return '浇水'
    case 'fertilize': return '施肥'
    case 'prune': return '修剪'
    default: return type
  }
}

const formatNextDue = (nextDue?: string) => {
  if (!nextDue) return '未知'
  const date = new Date(nextDue)
  const now = new Date()
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return '已到期'
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  return `${diff}天后`
}

export default function Reminder() {
  const [reminders, setReminders] = useState<SmartReminder[]>([])
  const [userPlants, setUserPlants] = useState<UserPlant[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<'water' | 'fertilize' | 'prune'>('water')
  const [intervalDays, setIntervalDays] = useState(7)

  const loadReminders = useCallback(async () => {
    setLoading(true)
    try {
      const [remindersData, plantsData] = await Promise.all([
        getSmartReminders(),
        getMyPlants()
      ])
      setReminders(remindersData || [])
      setUserPlants(plantsData || [])
    } catch (error: any) {
      console.error('Failed to load reminders:', error)
      setReminders([])
      setUserPlants([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  useDidShow(() => {
    loadReminders()
  })

  const handleAddReminder = async () => {
    if (!selectedPlantId) {
      Taro.showToast({ title: '请选择植物', icon: 'none' })
      return
    }
    try {
      const plant = userPlants.find(p => p.id === selectedPlantId)
      await createSmartReminder({
        user_plant_id: selectedPlantId,
        plant_id: plant?.plant_id,
        type: selectedType,
        interval_days: intervalDays,
      })
      Taro.showToast({ title: '提醒创建成功', icon: 'success' })
      setShowAddModal(false)
      setSelectedPlantId(null)
      loadReminders()
    } catch (error: any) {
      Taro.showToast({ title: '创建提醒失败', icon: 'none' })
    }
  }

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await toggleReminder(id, !enabled)
      setReminders(prev =>
        prev.map(r => r.id === id ? { ...r, enabled: !enabled } : r)
      )
    } catch (error) {
      Taro.showToast({ title: '更新提醒失败', icon: 'none' })
    }
  }

  const handleComplete = (id: number, title: string) => {
    Taro.showModal({
      title: '确认完成',
      content: `确定已完成 ${title} 吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await completeReminder(id)
            Taro.showToast({ title: '已记录完成', icon: 'success' })
            loadReminders()
          } catch (error) {
            Taro.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleSnooze = (id: number) => {
    Taro.showActionSheet({
      itemList: ['1天后', '3天后'],
      success: () => {}
    })
  }

  const handleDelete = (id: number, plantName: string, type: string) => {
    Taro.showModal({
      title: '删除提醒',
      content: `确定删除 "${plantName} - ${getTypeName(type)}" 提醒吗？`,
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteReminder(id)
            setReminders(prev => prev.filter(r => r.id !== id))
            Taro.showToast({ title: '提醒已删除', icon: 'success' })
          } catch (error) {
            Taro.showToast({ title: '删除提醒失败', icon: 'none' })
          }
        }
      }
    })
  }

  const activeCount = reminders.filter(r => r.enabled).length
  const todayCount = reminders.filter(r => {
    if (!r.next_due) return false
    const diff = Math.ceil((new Date(r.next_due).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff <= 0
  }).length

  return (
    <View className='reminder-page'>
      {/* 头部包装器 */}
      <View className='header-wrapper'>
        <View className='header'>
          <View className='header-content'>
            <View className='header-icon'>
              <Icon name="bell" size={24} color="#fff" />
            </View>
            <Text className='header-title'>智能提醒</Text>
            <Text className='header-subtitle'>根据天气智能调整浇水间隔</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className='scroll-view' scrollWithAnimation>
        <View className='content'>
          {/* 统计卡片 */}
          <View className='stats-card'>
            <View className='stat-item'>
              <Text className='stat-number'>{activeCount}</Text>
              <Text className='stat-label'>活跃提醒</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item'>
              <Text className='stat-number'>{reminders.length}</Text>
              <Text className='stat-label'>总提醒数</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item'>
              <Text className='stat-number warning'>{todayCount}</Text>
              <Text className='stat-label'>今日待办</Text>
            </View>
          </View>

          {/* 列表标题 */}
          <View className='section-header'>
            <Text className='section-title'>提醒列表</Text>
            <View className='section-badge'>
              <Text className='section-badge-text'>{activeCount} 个</Text>
            </View>
          </View>

          {/* 提醒卡片 */}
          {reminders.map((reminder) => {
            const icon = reminderTypeIcons[reminder.type] || 'bell'
            const typeColor = reminderTypeColors[reminder.type] || '#f46'
            const intervalText = reminder.calculated_interval && reminder.calculated_interval !== reminder.interval_days
              ? `每 ${reminder.calculated_interval} 天（智能）`
              : `每 ${reminder.interval_days} 天`
            const titleText = reminder.plant_name
              ? `${reminder.plant_name} - ${getTypeName(reminder.type)}`
              : getTypeName(reminder.type)

            return (
              <View key={reminder.id.toString()} className={`reminder-card ${!reminder.enabled ? 'disabled' : ''}`}>
                <View className='reminder-row'>
                  <View className='reminder-icon' style={`background-color: ${typeColor}15`}>
                    <Icon name={icon as any} size={20} color={typeColor} />
                  </View>
                  <View className='reminder-info'>
                    <Text className='reminder-title'>{titleText}</Text>
                    <View className='reminder-meta'>
                      <Text className='reminder-interval'>{intervalText}</Text>
                    </View>
                    {reminder.weather_tip && reminder.enabled && (
                      <View className='weather-tip-badge' style={`background-color: #faad1415`}>
                        <Icon name="cloud" size={14} color="#faad14" />
                        <Text className='weather-tip-text'>{reminder.weather_tip}</Text>
                      </View>
                    )}
                    <View className={`next-date-badge ${reminder.enabled ? '' : 'disabled'}`} style={`background-color: ${reminder.enabled ? typeColor + '15' : '#eeeeee'}`}>
                      <Icon name="clock" size={14} color={reminder.enabled ? typeColor : '#999999'} />
                      <Text className={`next-date-text ${reminder.enabled ? '' : 'disabled'}`} style={`color: ${reminder.enabled ? typeColor : '#999999'}`}>
                        {formatNextDue(reminder.next_due)}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    checked={reminder.enabled}
                    onChange={() => handleToggle(reminder.id, reminder.enabled)}
                    color={typeColor}
                  />
                </View>
                <View className='reminder-actions'>
                  {reminder.enabled ? (
                    <>
                      <View className='action-button' onClick={() => handleSnooze(reminder.id)}>
                        <Icon name="clock" size={16} color="#666" />
                        <Text className='action-button-text'>延迟</Text>
                      </View>
                      <View className='action-button primary' onClick={() => handleComplete(reminder.id, getTypeName(reminder.type))}>
                        <Icon name="check" size={16} color="#fff" />
                        <Text className='action-button-text-white'>完成</Text>
                      </View>
                    </>
                  ) : null}
                  <View className='action-button danger' onClick={() => handleDelete(reminder.id, reminder.plant_name || getTypeName(reminder.type), reminder.type)}>
                    <Icon name="trash" size={16} color="#ff4d4f" />
                    <Text className='action-button-text-danger'>删除</Text>
                  </View>
                </View>
              </View>
            )
          })}

          {/* 空状态 */}
          {reminders.length === 0 && (
            <View className='empty-container'>
              <View className='empty-icon-container'>
                <Icon name="bell" size={48} color="#999" />
              </View>
              <Text className='empty-title'>暂无提醒</Text>
              <Text className='empty-subtitle'>
                {userPlants.length > 0
                  ? '点击下方按钮添加提醒'
                  : '在花园中添加植物后，可以创建智能浇水提醒'}
              </Text>
              {userPlants.length > 0 && (
                <View className='empty-button' onClick={() => setShowAddModal(true)}>
                  <Text className='empty-button-text'>添加提醒</Text>
                </View>
              )}
            </View>
          )}

          {/* 底部添加按钮 */}
          {reminders.length > 0 && userPlants.length > 0 && (
            <View className='fab-button' onClick={() => setShowAddModal(true)}>
              <Text className='fab-icon'>+</Text>
              <Text className='fab-text'>添加提醒</Text>
            </View>
          )}

          {/* 养护小贴士 */}
          <View className='tip-card'>
            <View className='tip-header'>
              <View className='tip-icon'>
                <Icon name="lightbulb" size={20} color="#faad14" />
              </View>
              <Text className='tip-title'>智能提醒说明</Text>
            </View>
            <Text className='tip-text'>
              智能提醒会根据植物种类、季节和天气自动调整浇水间隔。高温天气会提前提醒，阴雨天气会适当延迟。
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 添加提醒弹窗 */}
      {showAddModal && (
        <View className='modal-overlay' onClick={() => setShowAddModal(false)}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <Text className='modal-title'>添加提醒</Text>

            {/* 选择植物 */}
            <Text className='modal-label'>选择植物</Text>
            <View className='plant-list'>
              {userPlants.map((plant) => (
                <View
                  key={plant.id}
                  className={`plant-item ${selectedPlantId === plant.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlantId(plant.id)}
                >
                  <Text className={`plant-item-text ${selectedPlantId === plant.id ? 'selected' : ''}`}>
                    {plant.nickname || plant.plant_name}
                  </Text>
                </View>
              ))}
            </View>

            {/* 选择类型 */}
            <Text className='modal-label'>提醒类型</Text>
            <View className='type-list'>
              {[
                { key: 'water', label: '浇水', icon: 'droplet', color: '#0891B2' },
                { key: 'fertilize', label: '施肥', icon: 'flask-conical', color: '#059669' },
                { key: 'prune', label: '修剪', icon: 'scissors', color: '#F59E0B' }
              ].map((item) => (
                <View
                  key={item.key}
                  className={`type-item ${selectedType === item.key ? 'selected' : ''}`}
                  style={selectedType === item.key ? `background-color: ${item.color}20; border-color: ${item.color}` : ''}
                  onClick={() => setSelectedType(item.key as any)}
                >
                  <Icon name={item.icon as any} size={16} color={selectedType === item.key ? item.color : '#666'} />
                  <Text className={`type-item-text ${selectedType === item.key ? 'selected' : ''}`} style={selectedType === item.key ? `color: ${item.color}` : ''}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* 间隔天数 */}
            <Text className='modal-label'>提醒间隔（天）</Text>
            <View className='interval-row'>
              {[3, 7, 14, 30].map((days) => (
                <View
                  key={days}
                  className={`interval-item ${intervalDays === days ? 'selected' : ''}`}
                  onClick={() => setIntervalDays(days)}
                >
                  <Text className={`interval-item-text ${intervalDays === days ? 'selected' : ''}`}>
                    {days}天
                  </Text>
                </View>
              ))}
            </View>

            {/* 按钮 */}
            <View className='modal-buttons'>
              <View className='modal-cancel-btn' onClick={() => setShowAddModal(false)}>
                <Text className='modal-cancel-text'>取消</Text>
              </View>
              <View className='modal-confirm-btn' onClick={handleAddReminder}>
                <Text className='modal-confirm-text'>确定</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
