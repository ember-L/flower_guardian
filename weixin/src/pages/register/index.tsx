import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
import { auth } from '../../services/auth'
import Icon from '../../components/Icon'
import './index.scss'

export default function Register() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleSendCode = async () => {
    if (!email.trim()) {
      Taro.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Taro.showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
      return
    }

    setSendingCode(true)
    try {
      await auth.sendVerifyCode({ email, purpose: 'register' })
      setCountdown(60)
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      Taro.showToast({ title: '验证码已发送', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err.message || '发送失败', icon: 'none' })
    } finally {
      setSendingCode(false)
    }
  }

  const handleRegister = async () => {
    if (!email.trim()) {
      Taro.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }
    if (!code.trim()) {
      Taro.showToast({ title: '请输入验证码', icon: 'none' })
      return
    }
    if (!username.trim()) {
      Taro.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }
    if (!password) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    if (password.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }
    if (password !== confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }

    setIsLoading(true)
    try {
      await auth.register({
        email: email.trim(),
        username: username.trim(),
        password,
        code: code.trim(),
      })
      Taro.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (err: any) {
      Taro.showToast({ title: err.message || '注册失败', icon: 'none' })
    } finally {
      setIsLoading(false)
    }
  }

  const goToLogin = () => {
    Taro.navigateBack()
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
            <Icon name="sparkles" size={40} color="#af52de" />
          </View>
          <Text className='title'>创建账号</Text>
          <Text className='subtitle'>注册成为护花使者</Text>
        </View>

        {/* 表单 */}
        <View className='form'>
          {/* 邮箱 + 验证码 */}
          <View className='code-row'>
            <View className='input-container input-flex'>
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
            <View
              className={`code-button ${(sendingCode || countdown > 0) ? 'code-button-disabled' : ''}`}
              onClick={!sendingCode && countdown <= 0 ? handleSendCode : undefined}
            >
              <Text className='code-button-text'>
                {countdown > 0 ? `${countdown}s` : sendingCode ? '发送中...' : '获取验证码'}
              </Text>
            </View>
          </View>

          {/* 验证码 */}
          <View className='input-container'>
            <View className='input-icon'>
              <Icon name="shield" size={18} color="#999" />
            </View>
            <Input
              className='input'
              placeholder='验证码'
              placeholderClass='input-placeholder'
              type='number'
              maxlength={6}
              value={code}
              onInput={(e) => setCode(e.detail.value)}
            />
          </View>

          {/* 用户名 */}
          <View className='input-container'>
            <View className='input-icon'>
              <Icon name="user" size={18} color="#999" />
            </View>
            <Input
              className='input'
              placeholder='用户名'
              placeholderClass='input-placeholder'
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
            />
          </View>

          {/* 密码 */}
          <View className='input-container'>
            <View className='input-icon'>
              <Icon name="lock" size={18} color="#999" />
            </View>
            <Input
              className='input'
              placeholder='密码（至少6位）'
              placeholderClass='input-placeholder'
              password={!showPassword}
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
            <View className='eye-button' onClick={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color="#999" />
            </View>
          </View>

          {/* 确认密码 */}
          <View className='input-container'>
            <View className='input-icon'>
              <Icon name="lock" size={18} color="#999" />
            </View>
            <Input
              className='input'
              placeholder='确认密码'
              placeholderClass='input-placeholder'
              password={!showPassword}
              value={confirmPassword}
              onInput={(e) => setConfirmPassword(e.detail.value)}
            />
          </View>

          {/* 注册按钮 */}
          <View
            className={`register-button ${isLoading ? 'register-button-disabled' : ''}`}
            onClick={!isLoading ? handleRegister : undefined}
          >
            <Text className='register-button-text'>
              {isLoading ? '注册中...' : '注册'}
            </Text>
          </View>

          {/* 登录链接 */}
          <View className='login-section'>
            <Text className='login-text'>已有账号？</Text>
            <Text className='login-link' onClick={goToLogin}>立即登录</Text>
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
