// 我的屏幕 - 个人中心
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { User, BookOpen, Settings, HelpCircle, Star, Clock, Camera, Bell } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

const menuItems = [
  { id: '1', icon: BookOpen, title: '养花日记', subtitle: '记录植物成长', screen: 'Diary' },
  { id: '2', icon: Camera, title: '病症诊断', subtitle: 'AI诊断病虫害', screen: 'Diagnosis' },
  { id: '3', icon: Star, title: '新手推荐', subtitle: '场景问答选植物', screen: 'Recommendation' },
  { id: '4', icon: Bell, title: '提醒管理', subtitle: '智能提醒设置', screen: 'Reminder' },
  { id: '5', icon: Settings, title: '设置', subtitle: '偏好设置', screen: 'Settings' },
  { id: '6', icon: HelpCircle, title: '帮助反馈', subtitle: '联系我们', screen: 'Help' },
];

export function ProfileScreen() {
  const navigation = useNavigation<any>();

  const handleMenuPress = (screen: string) => {
    if (screen === 'Settings' || screen === 'Help') {
      // TODO: 实现设置和帮助页面
      return;
    }
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 用户信息 */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <User size={40} color={colors.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>养花小白</Text>
            <Text style={styles.userDesc}>已养护 2 盆植物</Text>
          </View>
        </View>

        {/* 快捷入口 */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>本周浇水</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>识别次数</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>连续打卡</Text>
          </View>
        </View>

        {/* 菜单列表 */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.screen)}
            >
              <View style={styles.menuIcon}>
                <item.icon size={24} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: spacing.md,
  },
  username: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  userDesc: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.background,
  },
  menuSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  menuSubtitle: {
    fontSize: fontSize.xs,
    color: colors['text-secondary'],
    marginTop: 2,
  },
});
