// 注册页面
import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { register, sendVerificationCode } from '../services/auth';

interface RegisterScreenProps {
  onGoBack: () => void;
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterScreen({ onGoBack, onRegisterSuccess, onSwitchToLogin }: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('提示', '请输入有效的邮箱地址');
      return;
    }

    setSendingCode(true);
    const result = await sendVerificationCode(email);
    setSendingCode(false);

    if (result.success) {
      setCodeSent(true);
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
      Alert.alert('验证码已发送', `验证码: ${result.code}`);
    } else {
      Alert.alert('发送失败', result.error);
    }
  };

  const handleRegister = async () => {
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱');
      return;
    }
    if (!code.trim()) {
      Alert.alert('提示', '请输入验证码');
      return;
    }
    if (!username.trim()) {
      Alert.alert('提示', '请输入用户名');
      return;
    }
    if (!password) {
      Alert.alert('提示', '请输入密码');
      return;
    }
    if (password.length < 6) {
      Alert.alert('提示', '密码至少6位');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次密码不一致');
      return;
    }

    setIsLoading(true);
    const result = await register({
      email,
      username: username.trim(),
      password,
      confirmPassword,
    });
    setIsLoading(false);

    if (result.success) {
      onRegisterSuccess();
    } else {
      Alert.alert('注册失败', result.error || '请检查输入');
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

        {/* 内容 */}
        <View style={styles.content}>
          {/* 标题 */}
          <View style={styles.titleSection}>
            <View style={styles.logoContainer}>
              <Icons.Sparkles size={48} color={colors.warning} />
            </View>
            <Text style={styles.title}>创建账号</Text>
            <Text style={styles.subtitle}>注册成为护花使者</Text>
          </View>

          {/* 表单 */}
          <View style={styles.form}>
            {/* 邮箱 + 验证码 */}
            <View style={styles.codeRow}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <View style={styles.inputIcon}>
                  <Icons.Mail size={20} color={colors.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="邮箱"
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
                disabled={sendingCode || countdown > 0}
                style={[styles.codeButton, (sendingCode || countdown > 0) && styles.codeButtonDisabled]}
              >
                <Text style={styles.codeButtonText}>
                  {countdown > 0 ? `${countdown}s` : sendingCode ? '发送中...' : '获取验证码'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 验证码 */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Icons.ShieldCheck size={20} color={colors.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="验证码"
                placeholderTextColor={colors['text-tertiary']}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            {/* 用户名 */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Icons.User size={20} color={colors.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="用户名"
                placeholderTextColor={colors['text-tertiary']}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            {/* 密码 */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Icons.Lock size={20} color={colors.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="密码（至少6位）"
                placeholderTextColor={colors['text-tertiary']}
                value={password}
                onChangeText={setPassword}
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

            {/* 确认密码 */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Icons.Lock size={20} color={colors.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="确认密码"
                placeholderTextColor={colors['text-tertiary']}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            {/* 注册按钮 */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? '注册中...' : '注册'}
              </Text>
            </TouchableOpacity>

            {/* 登录链接 */}
            <View style={styles.loginSection}>
              <Text style={styles.loginText}>已有账号？</Text>
              <TouchableOpacity onPress={onSwitchToLogin}>
                <Text style={styles.loginLink}>立即登录</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.warning + '15',
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
  },
  form: {
    gap: spacing.md,
  },
  codeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  codeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeButtonDisabled: {
    backgroundColor: colors.border,
  },
  codeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  registerButton: {
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
  registerButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  loginText: {
    color: colors['text-secondary'],
    fontSize: 15,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
