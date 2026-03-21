// 问诊室列表页面
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, shadows, fontSize, fontWeight } from '../constants/theme';
import { getConversations, Conversation, deleteConversation } from '../services/consultationService';

interface Props {
  onGoBack: () => void;
  onNavigate: (page: string, params?: any) => void;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
}

export function ConsultationListScreen({ onGoBack, onNavigate, isLoggedIn, onRequireLogin }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // 使用 useFocusEffect 每次页面获得焦点时检查登录状态
  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn && onRequireLogin) {
        onRequireLogin();
      }
    }, [isLoggedIn, onRequireLogin])
  );

  const loadConversations = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error: any) {
      console.error('Load conversations error:', error);
      // 401 未授权，跳转到登录页面
      if (error?.response?.status === 401 && onRequireLogin) {
        onRequireLogin();
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleNewChat = () => {
    onNavigate('Consultation', { conversationId: null });
  };

  const handleOpenChat = (id: string) => {
    onNavigate('Consultation', { conversationId: id });
  };

  const handleDeleteChat = (id: string, title: string) => {
    Alert.alert(
      '删除对话',
      `确定要删除"${title || '这个对话'}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deleteConversation(id);
            loadConversations();
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return days + '天前';
    } else {
      return (date.getMonth() + 1) + '-' + date.getDate();
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const lastMessage = item.messages[item.messages.length - 1];
    const messageCount = item.messages.length;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleOpenChat(item.id)}
        onLongPress={() => handleDeleteChat(item.id, item.title)}
        activeOpacity={0.7}
      >
        <View style={styles.chatIcon}>
          <Icons.MessageCircle size={24} color={colors.primary} />
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {item.title || '新对话'}
            </Text>
            <Text style={styles.chatTime}>{formatTime(item.updatedAt)}</Text>
          </View>
          <Text style={styles.chatPreview} numberOfLines={1}>
            {lastMessage?.content || '暂无消息'}
          </Text>
          <Text style={styles.chatCount}>{messageCount} 条消息</Text>
        </View>
        <Icons.ChevronRight size={20} color={colors['text-tertiary']} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <Icons.ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>问诊室</Text>
        <TouchableOpacity onPress={handleNewChat} style={styles.newBtn}>
          <Icons.Edit3 size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <Icons.MessageCircle size={64} color={colors.primaryLight} />
            </View>
            <Text style={styles.emptyText}>暂无问诊记录</Text>
            <Text style={styles.emptySubtext}>点击右上角开始新对话</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleNewChat}>
              <Icons.Plus size={20} color={colors.white} />
              <Text style={styles.emptyButtonText}>开始问诊</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  newBtn: {
    padding: spacing.sm,
  },
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  chatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  chatTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  chatTime: {
    fontSize: fontSize.xs,
    color: colors['text-tertiary'],
  },
  chatPreview: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginBottom: spacing.xs,
  },
  chatCount: {
    fontSize: fontSize.xs,
    color: colors['text-tertiary'],
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: colors['text-secondary'],
    marginBottom: spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  emptyButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
