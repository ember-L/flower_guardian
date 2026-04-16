import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import CustomTabBar from '../../components/CustomTabBar'
import { getToken, getUserProfile, logout } from '../../services/auth'
import { getGardenStats, GardenStats } from '../../services/plantService'
import { API_BASE_URL } from '../../services/config'
import './index.scss'

interface MenuItem {
  id: string
  label: string
  subtitle: string
  icon: string
  color: string
  url: string
}

const menuItems: MenuItem[] = [
  { id: 'diary', label: '养花日记', subtitle: '记录植物成长', icon: 'book-open', color: '#52c41a', url: '/pages/diary/index' },
  { id: 'diagnosis', label: '病症诊断', subtitle: 'AI诊断病虫害', icon: 'stethoscope', color: '#ff4d4f', url: '/pages/diagnosis/index' },
  { id: 'diagnosisHistory', label: '诊断历史', subtitle: '查看历史诊断记录', icon: 'clipboard', color: '#1890ff', url: '/pages/diagnosisHistory/index' },
  { id: 'recommendation', label: '新手推荐', subtitle: '场景问答选植物', icon: 'sparkles', color: '#faad14', url: '/pages/recommendation/index' },
  { id: 'reminder', label: '提醒管理', subtitle: '智能提醒设置', icon: 'bell', color: '#f46', url: '/pages/reminder/index' },
  { id: 'address', label: '地址管理', subtitle: '收货地址管理', icon: 'map-pin', color: '#52c41a', url: '/pages/address/index' },
  { id: 'settings', label: '设置', subtitle: '偏好设置', icon: 'settings', color: '#999', url: '/pages/settings/index' },
  { id: 'help', label: '帮助反馈', subtitle: '联系我们', icon: 'help-circle', color: '#999', url: '/pages/help/index' },
]

// 计算用户等级
const getUserLevel = (plantCount: number) => {
  if (plantCount >= 20) return { level: 10, title: '植物大师' }
  if (plantCount >= 15) return { level: 9, title: '绿植达人' }
  if (plantCount >= 10) return { level: 8, title: '种植专家' }
  if (plantCount >= 7) return { level: 7, title: '养护高手' }
  if (plantCount >= 5) return { level: 6, title: '园丁之星' }
  if (plantCount >= 3) return { level: 5, title: '进阶园丁' }
  if (plantCount >= 2) return { level: 4, title: '新手园丁' }
  if (plantCount >= 1) return { level: 3, title: '种花新手' }
  return { level: 1, title: '养花小白' }
}

export default function Profile() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [displayUser, setDisplayUser] = useState<any>(null)
  const [stats, setStats] = useState<GardenStats | null>(null)
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    checkLoginStatus()
  })

  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = () => {
    const token = getToken()
    if (token) {
      setIsLoggedIn(true)
      loadUserProfile()
      loadGardenStats()
    } else {
      setIsLoggedIn(false)
      setDisplayUser(null)
      setStats(null)
      setLoading(false)
    }
  }

  const loadUserProfile = async () => {
    try {
      const data = await getUserProfile()
      if (data) {
        setDisplayUser({
          id: data.id,
          username: data.username || '',
          nickname: data.nickname || data.username || '',
          avatar: data.avatar_url || '',
        })
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      setDisplayUser(null)
    } finally {
      setLoading(false)
    }
  }

  const loadGardenStats = async () => {
    try {
      const data = await getGardenStats()
      if (data) {
        setStats(data)
      }
    } catch (error) {
      console.error('获取花园统计失败:', error)
      setStats(null)
    }
  }

  const handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          setIsLoggedIn(false)
          setDisplayUser(null)
          setStats(null)
          Taro.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }

  const handleMenuPress = (item: MenuItem) => {
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }
    Taro.navigateTo({ url: item.url })
  }

  const handleEditProfile = () => {
    Taro.navigateTo({ url: '/pages/editProfile/index' })
  }

  const plantCount = stats?.total_plants || 0
  const userLevel = getUserLevel(plantCount)

  // 获取头像完整URL
  const getAvatarUrl = (avatar: string) => {
    if (!avatar || typeof avatar !== 'string') return ''
    const trimmed = avatar.trim()
    if (trimmed.length === 0) return ''
    if (trimmed.startsWith('http')) return trimmed
    return `${API_BASE_URL}${trimmed}`
  }

  return (
    <View className='page-container'>
      <ScrollView scrollY className='scroll-view'>
        {/* User Info Section */}
        <View className='user-info-section'>
          <View className='user-info-content'>
            {isLoggedIn && displayUser ? (
              <>
                <View className='profile-row'>
                  <View className='avatar-container'>
                    {displayUser.avatar ? (
                      <Image className='avatar' src={getAvatarUrl(displayUser.avatar)} mode='aspectFill' />
                    ) : (
                      <View className='avatar-placeholder'>
                        <Icon name="user" size={40} color="#fff" />
                      </View>
                    )}
                    <View className='avatar-badge'>
                      <Icon name="sparkles" size={14} color="#faad14" />
                    </View>
                  </View>
                  <View className='profile-info'>
                    <View className='name-row'>
                      <Text className='username'>{displayUser.nickname || displayUser.username || '养花小白'}</Text>
                      <View className='level-badge'>
                        <Text className='level-text'>Lv.{userLevel.level} {userLevel.title}</Text>
                      </View>
                    </View>
                    <Text className='plant-count'>已养护 {plantCount} 盆植物</Text>
                  </View>
                </View>
              </>
            ) : (
              <View className='login-button' onClick={handleLogin}>
                <Icon name="user" size={36} color="#f46" />
                <Text className='login-button-text'>点击登录</Text>
                <Text className='login-button-subtext'>登录后可保存植物和记录</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Card */}
        {isLoggedIn && stats && (
          <View className='stats-card'>
            <View className='stat-item'>
              <View className='stat-icon' style={{ backgroundColor: 'rgba(244, 68, 102, 0.1)' }}>
                <Icon name="clock" size={18} color="#f46" />
              </View>
              <Text className='stat-number'>{stats.this_month_cares || 0}</Text>
              <Text className='stat-label'>本月养护</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item'>
              <View className='stat-icon' style={{ backgroundColor: 'rgba(82, 196, 26, 0.1)' }}>
                <Icon name="check-circle" size={18} color="#52c41a" />
              </View>
              <Text className='stat-number'>{stats.health_distribution?.good || 0}</Text>
              <Text className='stat-label'>健康植物</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item'>
              <View className='stat-icon' style={{ backgroundColor: 'rgba(250, 173, 20, 0.1)' }}>
                <Icon name="heart" size={18} color="#faad14" />
              </View>
              <Text className='stat-number'>{stats.health_distribution?.fair || 0}</Text>
              <Text className='stat-label'>正常植物</Text>
            </View>
          </View>
        )}

        {/* Menu Section */}
        <View className='menu-section'>
          <Text className='menu-section-title'>功能入口</Text>
          <View className='menu-list'>
            {menuItems.map((item, index) => (
              <View
                key={item.id}
                className={`menu-item ${index < menuItems.length - 1 ? 'menu-item-border' : ''}`}
                onClick={() => handleMenuPress(item)}
              >
                <View className='menu-icon' style={{ backgroundColor: item.color + '20' }}>
                  <Icon name={item.icon as any} size={20} color={item.color} />
                </View>
                <View className='menu-content'>
                  <Text className='menu-title'>{item.label}</Text>
                  <Text className='menu-subtitle'>{item.subtitle}</Text>
                </View>
                <Icon name="chevron-right" size={18} color="#999" />
              </View>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        {isLoggedIn && (
          <View className='logout-section'>
            <View className='logout-button' onClick={handleLogout}>
              <Text className='logout-button-text'>退出登录</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View className='footer'>
          <Text className='footer-text'>护花使者 v1.0.0</Text>
          <Text className='footer-subtext'>让养花不再凭感觉</Text>
        </View>
      </ScrollView>
      <CustomTabBar />
    </View>
  )
}
