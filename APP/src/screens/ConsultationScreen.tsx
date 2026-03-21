// 问诊对话页面 - 带打字机效果
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Markdown from 'react-native-markdown-display';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, shadows, fontSize, fontWeight, touchTarget } from '../constants/theme';
import { sendMessage, createConversation, getConversation, Conversation, Message, getWelcomeMessage } from '../services/consultationService';

interface Props {
  onGoBack: () => void;
  conversationId?: string;
  diagnosisContext?: any;
}

// 打字机效果组件
function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 重置状态
    setDisplayText('');
    setIsComplete(false);

    // 打字速度 (毫秒)
    const typeSpeed = 20;
    let currentIndex = 0;

    intervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setIsComplete(true);
        onComplete?.();
      }
    }, typeSpeed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, onComplete]);

  return (
    <Text style={styles.messageText}>
      {displayText}
      {!isComplete && <Text style={styles.cursor}>|</Text>}
    </Text>
  );
}

export function ConsultationScreen({ onGoBack, conversationId, diagnosisContext }: Props) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [pendingAiMessage, setPendingAiMessage] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);

  // 打字动画 - 使用 isLoading 状态
  const dot1Anim = useRef(new Animated.Value(1)).current;
  const dot2Anim = useRef(new Animated.Value(1)).current;
  const dot3Anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLoading) {
      // 第一个点动画 - 慢速
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1Anim, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Anim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 第二个点动画 - 延迟启动
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot2Anim, {
              toValue: 0.4,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Anim, {
              toValue: 1.2,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 300);

      // 第三个点动画 - 再延迟启动
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot3Anim, {
              toValue: 0.4,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Anim, {
              toValue: 1.2,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 600);
    } else {
      dot1Anim.setValue(1);
      dot2Anim.setValue(1);
      dot3Anim.setValue(1);
    }
  }, [isLoading]);

  // 加载或创建对话
  const loadConversation = useCallback(async () => {
    if (conversationId) {
      const found = await getConversation(conversationId);
      if (found) {
        setConversation(found);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        return;
      }
    }
    // 创建新对话
    const newConv = createConversation(diagnosisContext);
    setConversation(newConv);

    // 如果有当前诊断结果，自动发送诊断摘要
    if (newConv.diagnosisContext?.currentDiagnosis) {
      const diagnosis = newConv.diagnosisContext.currentDiagnosis;
      const diagnosisText = `用户刚刚完成了病害诊断，结果如下：
- 病害名称：${diagnosis.name}
- 病害类型：${diagnosis.type}
- 严重程度：${diagnosis.severity}
- 置信度：${diagnosis.confidence}%

请基于以上诊断结果，提供专业的治疗建议和后续养护指导。`;

      setIsLoading(true);
      setIsTyping(true);

      try {
        const updated = await sendMessage(newConv, diagnosisText);
        const aiMessageId = updated.messages[updated.messages.length - 1].id;
        setTypingMessageId(aiMessageId);
        setConversation(updated);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } catch (error) {
        console.error('Auto send diagnosis error:', error);
        setIsLoading(false);
        setIsTyping(false);
      }
    }
  }, [conversationId, diagnosisContext]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim() || !conversation || isLoading) return;

    const text = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    // 立即添加用户消息到界面
    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    const userMessageId = userMessage.id;

    // 创建临时的 AI 消息占位（显示加载状态）
    const pendingAiMessageId = 'ai-pending-' + Date.now();

    setConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, userMessage, {
          id: pendingAiMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        }]
      };
    });

    // 滚动到底部
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // 调用 API 发送消息
      const updated = await sendMessage(conversation, text);

      // 获取 AI 返回的消息
      const aiMessage = updated.messages[updated.messages.length - 1];

      // 替换_pending消息为真实的AI消息（使用真实ID）
      const realAiMessageId = aiMessage.id;
      setConversation(prev => {
        if (!prev) return prev;
        const messages = prev.messages.map(msg =>
          msg.id === pendingAiMessageId ? aiMessage : msg
        );
        return { ...prev, messages };
      });

      // 设置正在打印的消息ID（使用真实ID）
      setTypingMessageId(realAiMessageId);
    } catch (error) {
      console.error('Send message error:', error);
      // 移除失败的 AI 消息占位
      setConversation(prev => {
        if (!prev) return prev;
        const messages = prev.messages.filter(msg => msg.id !== pendingAiMessageId);
        return { ...prev, messages };
      });
      Alert.alert('发送失败', '请检查网络连接后重试');
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // 打字完成回调
  const handleTypingComplete = useCallback(() => {
    setTypingMessageId(null);
    setIsTyping(false);
    setIsLoading(false);
  }, []);

  // 发送图片
  const handleAttachImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要相册权限');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (result.assets?.length && conversation) {
      const imageUri = result.assets[0].uri!;
      setIsLoading(true);
      setIsTyping(true);

      // 立即添加用户消息和图片
      const userMessage: Message = {
        id: 'user-' + Date.now(),
        role: 'user',
        content: '[图片]',
        imageUri: imageUri,
        timestamp: Date.now(),
      };
      const pendingAiMessageId = 'ai-pending-' + Date.now();

      setConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, userMessage, {
            id: pendingAiMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
          }]
        };
      });
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

      try {
        const updated = await sendMessage(conversation, '[图片]', imageUri);
        const aiMessage = updated.messages[updated.messages.length - 1];

        // 替换_pending消息为真实的AI消息（使用真实ID）
        const realAiMessageId = aiMessage.id;
        setConversation(prev => {
          if (!prev) return prev;
          const messages = prev.messages.map(msg =>
            msg.id === pendingAiMessageId ? aiMessage : msg
          );
          return { ...prev, messages };
        });

        setTypingMessageId(realAiMessageId);
      } catch (error) {
        console.error('Send image error:', error);
        setConversation(prev => {
          if (!prev) return prev;
          const messages = prev.messages.filter(msg => msg.id !== pendingAiMessageId);
          return { ...prev, messages };
        });
        Alert.alert('发送失败', '请检查网络连接后重试');
        setIsLoading(false);
        setIsTyping(false);
      }
    }
  };

  // 渲染消息气泡
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const isTyping = !isUser && item.id === typingMessageId;
    // 检查是否是待回复的AI消息（内容为空）
    const isPending = !isUser && !item.content;

    return (
      <View style={[styles.messageBubble, isUser ? styles.userMessage : styles.aiMessage]}>
        <View style={[styles.messageContent, isUser && styles.userMessageContent]}>
          {!isUser && (
            <Text style={styles.aiNamePrefix}>护花使者🌸</Text>
          )}
          {item.imageUri && (
            <View style={styles.messageImage}>
              <Icons.Image size={24} color={colors['text-tertiary']} />
            </View>
          )}
          {isPending ? (
            // 等待回复时显示加载动画 - 三个点循环缩放
            <View style={styles.typingIndicator}>
              <Animated.Text style={{ fontSize: 32, color: colors.primary, fontWeight: 'bold', transform: [{ scale: dot1Anim }] }}>·</Animated.Text>
              <Animated.Text style={{ fontSize: 32, color: colors.primary, fontWeight: 'bold', marginHorizontal: 4, transform: [{ scale: dot2Anim }] }}>·</Animated.Text>
              <Animated.Text style={{ fontSize: 32, color: colors.primary, fontWeight: 'bold', transform: [{ scale: dot3Anim }] }}>·</Animated.Text>
            </View>
          ) : isTyping ? (
            <TypewriterText text={item.content} onComplete={handleTypingComplete} />
          ) : isUser ? (
            <Text style={[styles.messageText, isUser && styles.userMessageText]}>
              {item.content}
            </Text>
          ) : (
            <Markdown style={markdownStyles}>
              {item.content}
            </Markdown>
          )}
        </View>
      </View>
    );
  };

  // 空状态欢迎消息
  const renderWelcome = () => {
    const welcomeMsg = getWelcomeMessage();
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeIcon}>
          <Icons.MessageCircle size={40} color={colors.primary} />
        </View>
        <Text style={styles.welcomeTitle}>AI 植物医生</Text>
        <Text style={styles.welcomeText}>{welcomeMsg.content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <Icons.ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI 问诊</Text>
          {isTyping && <Text style={styles.headerSubtitle}>正在输入...</Text>}
        </View>
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => {
            const newConv = createConversation(diagnosisContext);
            setConversation(newConv);
          }}
        >
          <Icons.Edit3 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={conversation?.messages || []}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.messageList,
          (!conversation?.messages.length) && styles.messageListEmpty,
        ]}
        ListEmptyComponent={renderWelcome}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* 输入区域 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttachImage}>
            <Icons.Image size={22} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="描述您的植物问题..."
              placeholderTextColor={colors['text-tertiary']}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            {isLoading && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.loadingIndicator}
              />
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Icons.Send size={20} color={colors.white} />
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.sm,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: 2,
  },
  newChatBtn: {
    padding: spacing.sm,
  },
  messageList: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  messageBubble: {
    flexDirection: 'column',
    marginBottom: spacing.md,
  },
  userMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingHorizontal: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
    flexShrink: 1,
  },
  userMessageContent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    alignItems: 'flex-end',
  },
  messageImage: {
    width: 150,
    height: 150,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  cursor: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 2,
  },
  typingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
  },
  typingDotMid: {
    marginHorizontal: 1,
  },
  aiNamePrefix: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  userMessageText: {
    color: colors.white,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  welcomeText: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  attachBtn: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    fontSize: fontSize.md,
    color: colors.text,
    maxHeight: 80,
    paddingVertical: 0,
  },
  loadingIndicator: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
  },
  sendBtn: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    borderRadius: touchTarget.minimum / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
    ...shadows.none,
  },
});

// Markdown样式
const markdownStyles = {
  body: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  paragraph: {
    marginVertical: spacing.xs,
  },
  strong: {
    fontWeight: 'bold' as const,
    color: colors.primary,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  bullet_list: {
    marginVertical: spacing.xs,
  },
  ordered_list: {
    marginVertical: spacing.xs,
  },
  list_item: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  bullet_list_icon: {
    marginRight: spacing.sm,
    color: colors.primary,
  },
  code_inline: {
    backgroundColor: colors.background,
    color: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  fence: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
  },
  blockquote: {
    backgroundColor: colors.primaryLight + '10',
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
    marginVertical: spacing.sm,
  },
};
