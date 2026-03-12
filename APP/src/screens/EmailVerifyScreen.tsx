// 邮箱验证页面
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import axios from 'axios';
import { API_BASE_URL } from '../services/config';

interface EmailVerifyScreenProps {
  onGoBack: () => void;
  onVerifySuccess: () => void;
  email?: string;
}

export function EmailVerifyScreen({ onGoBack, onVerifySuccess, email }: EmailVerifyScreenProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailAddress, setEmailAddress] = useState(email || '');

  const handleVerify = async () => {
    if (!code.trim() || code.length !== 6) {
      Alert.alert('提示', '请输入6位验证码');
      return;
    }
    if (!emailAddress.trim()) {
      Alert.alert('提示', '请输入邮箱地址');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/users/verify-email`, {
        email: emailAddress,
        code: code,
      });
      Alert.alert('验证成功', '邮箱验证通过！现在可以登录了。', [
        { text: '确定', onPress: onVerifySuccess },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.detail || '验证失败，请检查验证码是否正确';
      Alert.alert('验证失败', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailAddress.trim()) {
      Alert.alert('提示', '请输入邮箱地址');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/users/send-verification-code`, {
        email: emailAddress,
        purpose: 'register',
      });
      Alert.alert('发送成功', '验证码已重新发送，请查收邮箱');
    } catch (error: any) {
      const message = error.response?.data?.detail || '发送失败';
      Alert.alert('发送失败', message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Icons.ChevronLeft size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icons.Mail size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>邮箱验证</Text>
        <Text style={styles.subtitle}>请输入发送到您邮箱的验证码</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Icons.Mail size={20} color={colors.primary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="邮箱地址"
              placeholderTextColor={colors['text-tertiary']}
              value={emailAddress}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

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
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading}
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            activeOpacity={0.8}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? '验证中...' : '立即验证'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
            <Text style={styles.resendText}>没收到验证码？重新发送</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    alignItems: 'center',
    paddingTop: spacing.xl,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors['text-secondary'],
    marginBottom: spacing.xl,
  },
  form: {
    width: '100%',
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
  verifyButton: {
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
  verifyButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
  },
});
