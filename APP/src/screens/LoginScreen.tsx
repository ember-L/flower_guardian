// 登录页面
import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { login } from '../services/auth';

interface LoginScreenProps {
  onGoBack: () => void;
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export function LoginScreen({ onGoBack, onLoginSuccess, onSwitchToRegister, onSwitchToForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱');
      return;
    }
    if (!password) {
      Alert.alert('提示', '请输入密码');
      return;
    }

    setIsLoading(true);
    const result = await login({ email, password });
    setIsLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else {
      Alert.alert('登录失败', result.error || '请检查输入');
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
              <Image source={require('../../assets/logo.png')} style={styles.logo} />
            </View>
            <Text style={styles.title}>欢迎回来</Text>
            <Text style={styles.subtitle}>登录您的账号继续</Text>
          </View>

          {/* 表单 */}
          <View style={styles.form}>
            {/* 邮箱 */}
            <View style={styles.inputContainer}>
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

            {/* 密码 */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Icons.Lock size={20} color={colors.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="密码"
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

            {/* 登录按钮 */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? '登录中...' : '登录'}
              </Text>
            </TouchableOpacity>

            {/* 忘记密码链接 */}
            <TouchableOpacity onPress={onSwitchToForgotPassword} style={styles.forgotPasswordSection}>
              <Text style={styles.forgotPasswordText}>忘记密码？</Text>
            </TouchableOpacity>

            {/* 注册链接 */}
            <View style={styles.registerSection}>
              <Text style={styles.registerText}>还没有账号？</Text>
              <TouchableOpacity onPress={onSwitchToRegister}>
                <Text style={styles.registerLink}>立即注册</Text>
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
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
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
  loginButton: {
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
  loginButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  forgotPasswordSection: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 15,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  registerText: {
    color: colors['text-secondary'],
    fontSize: 15,
  },
  registerLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
