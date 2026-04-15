import { View, Text, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { auth } from '../../services/auth'
import Icon from '../../components/Icon'
import './index.scss'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim()) {
      Taro.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    if (!password) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    setIsLoading(true)
    try {
      await auth.login({ email: email.trim(), password })
      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (err: any) {
      Taro.showToast({ title: err.message || '登录失败', icon: 'none' })
    } finally {
      setIsLoading(false)
    }
  }

  const goToRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  const goToForgotPassword = () => {
    Taro.navigateTo({ url: '/pages/forgotPassword/index' })
  }

  return (
    <View className='container'>
      {/* 头部 */}
      <View className='header'>
        <View className='back-button' onClick={() => Taro.navigateBack()}>
          <Text className='back-icon'>&lt;</Text>
        </View>
      </View>

      {/* 内容 */}
      <View className='content'>
        {/* 标题 */}
        <View className='title-section'>
          <View className='logo-container'>
            <Icon name="flower" size={40} color="#ff6b9d" />
          </View>
          <Text className='title'>欢迎回来</Text>
          <Text className='subtitle'>登录您的账号继续</Text>
        </View>

        {/* 表单 */}
        <View className='form'>
          {/* 邮箱 */}
          <View className='input-container'>
            <View className='input-icon'>
              <Icon name="mail" size={18} color="#999" />
            </View>
            <Input
              className='input'
              placeholder='邮箱'
              placeholderClass='input-placeholder'
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
            />
          </View>

          {/* 密码 */}
          <View className='input-container'>
            <View className='input-icon'>
              <Icon name="lock" size={18} color="#999" />
            </View>
            <Input
              className='input'
              placeholder='密码'
              placeholderClass='input-placeholder'
              password={!showPassword}
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
            <View className='eye-button' onClick={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color="#999" />
            </View>
          </View>

          {/* 登录按钮 */}
          <View
            className={`login-button ${isLoading ? 'login-button-disabled' : ''}`}
            onClick={!isLoading ? handleLogin : undefined}
          >
            <Text className='login-button-text'>
              {isLoading ? '登录中...' : '登录'}
            </Text>
          </View>

          {/* 忘记密码链接 */}
          <View className='forgot-password-section' onClick={goToForgotPassword}>
            <Text className='forgot-password-text'>忘记密码？</Text>
          </View>

          {/* 注册链接 */}
          <View className='register-section'>
            <Text className='register-text'>还没有账号？</Text>
            <Text className='register-link' onClick={goToRegister}>立即注册</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

definePageConfig({
  navigationBarBackgroundColor: '#fafafa',
  navigationBarTextStyle: 'black',
  navigationBarTitleText: '',
})
