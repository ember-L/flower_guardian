// 我的屏幕 - 个人中心 - UI Kitten 组件
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  List,
  ListItem,
  Divider,
  Text,
  Button,
  TopNavigation,
  Layout,
  useTheme,
} from '@ui-kitten/components';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, fontSize, shadows, touchTarget } from '../constants/theme';

const menuItems = [
  { id: '1', icon: Icons.BookOpen, title: '养花日记', subtitle: '记录植物成长', screen: 'Diary', color: colors.secondary },
  { id: '2', icon: Icons.Camera, title: '病症诊断', subtitle: 'AI诊断病虫害', screen: 'Diagnosis', color: colors.error },
  { id: '3', icon: Icons.Star, title: '新手推荐', subtitle: '场景问答选植物', screen: 'Recommendation', color: colors.warning },
  { id: '4', icon: Icons.Bell, title: '提醒管理', subtitle: '智能提醒设置', screen: 'Reminder', color: colors.primary },
  { id: '5', icon: Icons.Settings, title: '设置', subtitle: '偏好设置', screen: 'Settings', color: colors['text-secondary'] },
  { id: '6', icon: Icons.HelpCircle, title: '帮助反馈', subtitle: '联系我们', screen: 'Help', color: colors['text-secondary'] },
];

export function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  const handleMenuPress = (screen: string) => {
    if (screen === 'Settings' || screen === 'Help') {
      return;
    }
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 用户信息 - UI Kitten Layout */}
        <Layout style={styles.profileHeader} level="1">
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Icons.User size={36} />
            </View>
            <View style={styles.avatarBadge}>
              <Icons.Sparkles size={12} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text category="h1">养花小白</Text>
            <Button
              size="tiny"
              appearance="filled"
              status="warning"
            >
              Lv.3 园丁
            </Button>
            <Text appearance="hint">已养护 2 盆植物</Text>
          </View>
        </Layout>

        {/* 快捷统计 - UI Kitten Layout */}
        <Layout style={styles.quickStats} level="1">
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
              <Icons.Clock size={18} />
            </View>
            <Text category="h5">5</Text>
            <Text appearance="hint" category="c1">本周浇水</Text>
          </View>
          <Divider style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.secondary + '15' }]}>
              <Icons.Camera size={18} />
            </View>
            <Text category="h5">2</Text>
            <Text appearance="hint" category="c1">识别次数</Text>
          </View>
          <Divider style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning + '15' }]}>
              <Icons.Star size={18} />
            </View>
            <Text category="h5">1</Text>
            <Text appearance="hint" category="c1">连续打卡</Text>
          </View>
        </Layout>

        {/* 菜单列表 - UI Kitten List */}
        <Layout style={styles.menuSection} level="1">
          <Text category="c1" status="warning" style={styles.menuSectionTitle}>功能入口</Text>
          <List
            data={menuItems}
            ItemSeparatorComponent={Divider}
            renderItem={({ item }) => (
              <ListItem
                style={styles.menuItem}
                accessoryLeft={(props) => (
                  <View {...props} style={[styles.menuIconAvatar, { backgroundColor: item.color + '15' }]}>
                    <item.icon size={20} />
                  </View>
                )}
                title={(props: any) => <Text {...props} category="s1">{item.title}</Text>}
                description={(props: any) => <Text {...props} appearance="hint">{item.subtitle}</Text>}
                accessoryRight={(props) => <Icons.ChevronRight {...props} size={18} />}
                onPress={() => handleMenuPress(item.screen)}
              />
            )}
          />
        </Layout>

        {/* 版本信息 */}
        <View style={styles.footer}>
          <Text appearance="hint" category="c1">护花使者 v1.0.0</Text>
          <Text appearance="hint" category="c1">让养花不再凭感觉</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
    gap: spacing.xs,
  },
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statDivider: {
    width: 1,
  },
  menuSection: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuSectionTitle: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  menuItem: {
    minHeight: touchTarget.comfortable,
  },
  menuIconAvatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
});
