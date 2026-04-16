import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import Icon, { IconName } from '../Icon'
import './index.scss'

interface TabItem {
  pagePath: string
  text: string
  icon: IconName
}

const tabs: TabItem[] = [
  { pagePath: '/pages/garden/index', text: '花园', icon: 'flower2' },
  { pagePath: '/pages/encyclopedia/index', text: '百科', icon: 'book-open' },
  { pagePath: '/pages/index/index', text: '首页', icon: 'home' },
  { pagePath: '/pages/store/index', text: '商城', icon: 'leaf' },
  { pagePath: '/pages/profile/index', text: '我的', icon: 'user' },
]

const CustomTabBar: React.FC = () => {
  const instance = getCurrentInstance()
  const currentPath = instance.router?.path || '/pages/index/index'

  const handleTabClick = (path: string) => {
    Taro.switchTab({ url: path })
  }

  return (
    <View className='custom-tabbar'>
      <View className='tabbar-content'>
        {tabs.map((tab, index) => {
          const isActive = currentPath === tab.pagePath
          const isMain = index === 2 // 首页是中间按钮

          if (isMain) {
            return (
              <View
                key={tab.pagePath}
                className='tab-item main-tab'
                onClick={() => handleTabClick(tab.pagePath)}
              >
                <View className='main-button'>
                  <Icon name={tab.icon} size={24} color='#fff' />
                </View>
              </View>
            )
          }

          return (
            <View
              key={tab.pagePath}
              className={`tab-item ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.pagePath)}
            >
              <View className={`tab-icon-wrapper ${isActive ? 'active' : ''}`}>
                <Icon name={tab.icon} size={20} color={isActive ? '#f46' : '#999'} />
              </View>
              <Text className={`tab-label ${isActive ? 'active' : ''}`}>{tab.text}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default CustomTabBar
