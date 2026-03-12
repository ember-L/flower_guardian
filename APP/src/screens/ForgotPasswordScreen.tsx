// 忘记密码页面
import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import axios from 'axios';
import { API_BASE_URL } from '../services/config';

interface ForgotPasswordScreenProps {
  onGoBack: () => void;
  onResetSuccess: () => void;
}

export function ForgotPasswordScreen({ onGoBack, onResetSuccess }: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<1 | 2>(1); // 1: 输入邮箱, 2: 输入验证码和新密码
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 发送验证码
  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱地址');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('提示', '请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/users/forgot-password`, {
        email: email.trim(),
        purpose: 'password_reset',
      });
      setStep(2);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      Alert.alert('发送成功', '验证码已发送到您的邮箱');
    } catch (error: any) {
      const message = error.response?.data?.detail || '发送失败，请稍后重试';
      Alert.alert('发送失败', message);
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!code.trim() || code.length !== 6) {
      Alert.alert('提示', '请输入6位验证码');
      return;
    }
    if (!newPassword) {
      Alert.alert('提示', '请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('提示', '密码至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次密码不一致');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/users/reset-password`, {
        email: email.trim(),
        code: code.trim(),
        new_password: newPassword,
      });
      Alert.alert('重置成功', '密码已重置，请使用新密码登录', [
        { text: '确定', onPress: onResetSuccess },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.detail || '重置失败，请检查验证码是否正确';
      Alert.alert('重置失败', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Icons.ChevronLeft size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* 内容 */}
          <View style={styles.content}>
            {/* 标题 */}
            <View style={styles.titleSection}>
              <View style={styles.iconContainer}>
                <Icons.Lock size={48} color={colors.primary} />
              </View>
              <Text style={styles.title}>忘记密码</Text>
              <Text style={styles.subtitle}>
                {step === 1 ? '输入您的邮箱地址，接收验证码' : '请输入验证码和新密码'}
              </Text>
            </View>

            {/* 表单 */}
            <View style={styles.form}>
              {step === 1 ? (
                // 步骤1: 输入邮箱
                <>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIcon}>
                      <Icons.Mail size={20} color={colors.primary} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="邮箱地址"
                      placeholderTextColor={colors['text-tertiary']}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleSendCode}
                    disabled={loading}
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.submitButtonText}>
                      {loading ? '发送中...' : '发送验证码'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                // 步骤2: 输入验证码和新密码
                <>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIcon}>
                      <Icons.ShieldCheck size={20} color={colors.primary} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="6位验证码"
                      placeholderTextColor={colors['text-tertiary']}
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <TouchableOpacity
                      onPress={handleSendCode}
                      disabled={countdown > 0}
                      style={styles.resendButton}
                    >
                      <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
                        {countdown > 0 ? `${countdown}s` : '重新发送'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputIcon}>
                      <Icons.Lock size={20} color={colors.primary} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="新密码（至少6位）"
                      placeholderTextColor={colors['text-tertiary']}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      {showPassword ? (
                        <Icons.EyeOff size={20} color={colors['text-tertiary']} />
                      ) : (
                        <Icons.Eye size={20} color={colors['text-tertiary']} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputIcon}>
                      <Icons.Lock size={20} color={colors.primary} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="确认新密码"
                      placeholderTextColor={colors['text-tertiary']}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleResetPassword}
                    disabled={loading}
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.submitButtonText}>
                      {loading ? '重置中...' : '重置密码'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backStepButton}>
                    <Text style={styles.backStepText}>返回上一步</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors['text-secondary'],
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  inputIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: spacing.md,
  },
  resendButton: {
    paddingHorizontal: spacing.md,
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: colors['text-tertiary'],
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  backStepButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backStepText: {
    color: colors.primary,
    fontSize: 15,
  },
});
