import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
import { auth } from '../../services/auth'
import Icon from '../../components/Icon'
import './index.scss'

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleSendCode = async () => {
    if (!email.trim()) {
      Taro.showToast({ title: '请输入邮箱地址', icon: 'none' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Taro.showToast({ title: '请输入有效的邮箱地址', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await auth.forgotPassword({ email: email.trim() })
      setStep(2)
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
      Taro.showToast({ title: '验证码已发送到您的邮箱', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err.message || '发送失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!code.trim() || code.length !== 6) {
      Taro.showToast({ title: '请输入6位验证码', icon: 'none' })
      return
    }
    if (!newPassword) {
      Taro.showToast({ title: '请输入新密码', icon: 'none' })
      return
    }
    if (newPassword.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await auth.resetPassword({
        email: email.trim(),
        code: code.trim(),
        new_password: newPassword,
      })
      Taro.showToast({ title: '密码已重置', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (err: any) {
      Taro.showToast({ title: err.message || '重置失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='container'>
      {/* 头部 */}
      <View className='header'>
        <View className='back-button' onClick={() => Taro.navigateBack()}>
          <Text className='back-icon'>&lt;</Text>
        </View>
      </View>

      <ScrollView scrollY className='scroll-view' enhanced>
        {/* 内容 */}
        <View className='content'>
          {/* 标题 */}
          <View className='title-section'>
            <View className='icon-container'>
              <Icon name="lock" size={40} color="#333" />
            </View>
            <Text className='title'>忘记密码</Text>
            <Text className='subtitle'>
              {step === 1 ? '输入您的邮箱地址，接收验证码' : '请输入验证码和新密码'}
            </Text>
          </View>

          {/* 表单 */}
          <View className='form'>
            {step === 1 ? (
              <>
                <View className='input-container'>
                  <View className='input-icon'>
                    <Icon name="mail" size={18} color="#999" />
                  </View>
                  <Input
                    className='input'
                    placeholder='邮箱地址'
                    placeholderClass='input-placeholder'
                    value={email}
                    onInput={(e) => setEmail(e.detail.value)}
                  />
                </View>

                <View
                  className={`submit-button ${loading ? 'submit-button-disabled' : ''}`}
                  onClick={!loading ? handleSendCode : undefined}
                >
                  <Text className='submit-button-text'>
                    {loading ? '发送中...' : '发送验证码'}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View className='input-container'>
                  <View className='input-icon'>
                    <Icon name="shield" size={18} color="#999" />
                  </View>
                  <Input
                    className='input'
                    placeholder='6位验证码'
                    placeholderClass='input-placeholder'
                    type='number'
                    maxlength={6}
                    value={code}
                    onInput={(e) => setCode(e.detail.value)}
                  />
                  <View className='resend-button' onClick={countdown <= 0 ? handleSendCode : undefined}>
                    <Text className={`resend-text ${countdown > 0 ? 'resend-text-disabled' : ''}`}>
                      {countdown > 0 ? `${countdown}s` : '重新发送'}
                    </Text>
                  </View>
                </View>

                <View className='input-container'>
                  <View className='input-icon'>
                    <Icon name="lock" size={18} color="#999" />
                  </View>
                  <Input
                    className='input'
                    placeholder='新密码（至少6位）'
                    placeholderClass='input-placeholder'
                    password={!showPassword}
                    value={newPassword}
                    onInput={(e) => setNewPassword(e.detail.value)}
                  />
                  <View className='eye-button' onClick={() => setShowPassword(!showPassword)}>
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color="#999" />
                  </View>
                </View>

                <View className='input-container'>
                  <View className='input-icon'>
                    <Icon name="lock" size={18} color="#999" />
                  </View>
                  <Input
                    className='input'
                    placeholder='确认新密码'
                    placeholderClass='input-placeholder'
                    password={!showPassword}
                    value={confirmPassword}
                    onInput={(e) => setConfirmPassword(e.detail.value)}
                  />
                </View>

                <View
                  className={`submit-button ${loading ? 'submit-button-disabled' : ''}`}
                  onClick={!loading ? handleResetPassword : undefined}
                >
                  <Text className='submit-button-text'>
                    {loading ? '重置中...' : '重置密码'}
                  </Text>
                </View>

                <View className='back-step-button' onClick={() => setStep(1)}>
                  <Text className='back-step-text'>返回上一步</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

definePageConfig({
  navigationBarBackgroundColor: '#fafafa',
  navigationBarTextStyle: 'black',
  navigationBarTitleText: '',
})
