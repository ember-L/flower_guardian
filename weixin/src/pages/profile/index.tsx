import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import { API_BASE_URL } from '../../services/config'
import './index.scss'

interface UserProfile {
  id: number
  username: string
  nickname: string
  avatar_url: string
  level: number
  points: number
  created_at: string
}

interface UserStats {
  total_plants: number
  total_cares: number
  total_recognitions: number
}

interface MenuItem {
  id: string
  label: string
  icon: string
  color: string
  url: string
}

const menuItems: MenuItem[] = [
  { id: 'orders', label: '我的订单', icon: 'package', color: '#007aff', url: '/pages/orders/index' },
  { id: 'favorites', label: '我的收藏', icon: 'heart', color: '#ff2d55', url: '/pages/favorites/index' },
  { id: 'care-history', label: '养护记录', icon: 'clipboard', color: '#34c759', url: '/pages/careHistory/index' },
  { id: 'achievements', label: '成就徽章', icon: 'trophy', color: '#ff9500', url: '/pages/achievements/index' },
  { id: 'settings', label: '通知设置', icon: 'bell', color: '#5856d6', url: '/pages/notificationSettings/index' },
  { id: 'about', label: '关于我们', icon: 'info', color: '#8e8e93', url: '/pages/about/index' },
  { id: 'feedback', label: '意见反馈', icon: 'message-circle', color: '#5ac8fa', url: '/pages/feedback/index' },
  { id: 'help', label: '帮助中心', icon: 'help-circle', color: '#ffcc00', url: '/pages/help/index' },
]

const levelNames: Record<number, string> = {
  1: '植物新手',
  2: '园艺学徒',
  3: '养护达人',
  4: '植物专家',
  5: '园艺大师',
}

export default function Profile() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    checkLoginStatus()
  })

  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = () => {
    const token = Taro.getStorageSync('token')
    if (token) {
      setIsLoggedIn(true)
      loadUserProfile()
      loadUserStats()
    } else {
      setIsLoggedIn(false)
      setLoading(false)
    }
  }

  const loadUserProfile = () => {
    Taro.request({
      url: `${API_BASE_URL}/api/user/profile`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${Taro.getStorageSync('token')}` },
      success: (res) => {
        const data = res.data as any
        if (data) {
          setUserProfile({
            id: data.id,
            username: data.username || '',
            nickname: data.nickname || data.username || '植物爱好者',
            avatar_url: data.avatar_url || '',
            level: data.level || 1,
            points: data.points || 0,
            created_at: data.created_at || '',
          })
        }
      },
      fail: () => {
        setUserProfile({
          id: 0,
          username: '',
          nickname: '植物爱好者',
          avatar_url: '',
          level: 1,
          points: 0,
          created_at: '',
        })
      },
      complete: () => {
        setLoading(false)
      }
    })
  }

  const loadUserStats = () => {
    Taro.request({
      url: `${API_BASE_URL}/api/user/stats`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${Taro.getStorageSync('token')}` },
      success: (res) => {
        const data = res.data as any
        if (data) {
          setUserStats(data)
        }
      },
      fail: () => {
        setUserStats({
          total_plants: 3,
          total_cares: 28,
          total_recognitions: 15,
        })
      }
    })
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
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('userInfo')
          setIsLoggedIn(false)
          setUserProfile(null)
          setUserStats(null)
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

  return (
    <View className='page-container'>
      <ScrollView scrollY className='scroll-view'>
        {/* User Info Section */}
        <View className='user-info-section'>
          <View className='user-info-content'>
            {isLoggedIn && userProfile ? (
              <View className='user-row'>
                <View className='avatar-container'>
                  {userProfile.avatar_url ? (
                    <Image className='avatar' src={userProfile.avatar_url} mode='aspectFill' />
                  ) : (
                    <View className='avatar-placeholder'>
                      <Text className='avatar-text'>
                        {(userProfile.nickname || userProfile.username || 'U').slice(0, 1)}
                      </Text>
                    </View>
                  )}
                  <View className='level-badge'>
                    <Text className='level-badge-text'>Lv.{userProfile.level}</Text>
                  </View>
                </View>
                <View className='user-text'>
                  <View className='name-row'>
                    <Text className='username'>{userProfile.nickname || userProfile.username}</Text>
                    <View className='edit-profile' onClick={handleEditProfile}>
                      <Icon name="edit-2" size={16} color="#999" />
                    </View>
                  </View>
                  <View className='level-row'>
                    <Text className='level-name'>{levelNames[userProfile.level] || '植物新手'}</Text>
                    <Text className='points-text'>{userProfile.points} 积分</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className='user-row' onClick={handleLogin}>
                <View className='avatar-container'>
                  <View className='avatar-placeholder'>
                    <Icon name="user" size={24} color="#ccc" />
                  </View>
                </View>
                <View className='user-text'>
                  <Text className='login-hint'>点击登录</Text>
                  <Text className='login-subhint'>登录后享受更多功能</Text>
                </View>
                <Icon name="chevron-right" size={16} color="#ccc" />
              </View>
            )}
          </View>
        </View>

        {/* Stats Card */}
        {isLoggedIn && userStats && (
          <View className='stats-card'>
            <View className='stat-item' onClick={() => Taro.switchTab({ url: '/pages/garden/index' })}>
              <Text className='stat-value'>{userStats.total_plants}</Text>
              <Text className='stat-label'>我的植物</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item' onClick={() => Taro.navigateTo({ url: '/pages/careHistory/index' })}>
              <Text className='stat-value'>{userStats.total_cares}</Text>
              <Text className='stat-label'>养护次数</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat-item' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
              <Text className='stat-value'>{userStats.total_recognitions}</Text>
              <Text className='stat-label'>识别次数</Text>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View className='menu-section'>
          <View className='menu-list'>
            {menuItems.map((item, index) => (
              <View key={item.id} className='menu-item' onClick={() => handleMenuPress(item)}>
                <View className='menu-item-left'>
                  <View className='menu-icon' style={{ backgroundColor: item.color }}>
                    <Icon name={item.icon as any} size={20} color="#fff" />
                  </View>
                  <Text className='menu-label'>{item.label}</Text>
                </View>
                <Icon name="chevron-right" size={16} color="#ccc" />
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
          <Text className='footer-subtext'>用心呵护每一株绿植</Text>
        </View>
      </ScrollView>
    </View>
  )
}
