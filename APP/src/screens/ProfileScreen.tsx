// 我的屏幕 - 使用纯 StyleSheet
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../components/Icon';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface ProfileScreenProps extends Partial<NavigationProps> {}

const menuItems = [
  { id: '1', icon: Icons.BookOpen, title: '养花日记', subtitle: '记录植物成长', screen: 'Diary', color: colors.secondary },
  { id: '2', icon: Icons.Stethoscope, title: '病症诊断', subtitle: 'AI诊断病虫害', screen: 'Diagnosis', color: colors.error },
  { id: '3', icon: Icons.History, title: '诊断历史', subtitle: '查看历史诊断记录', screen: 'DiagnosisHistory', color: colors.info },
  { id: '4', icon: Icons.Sparkles, title: '新手推荐', subtitle: '场景问答选植物', screen: 'Recommendation', color: colors.warning },
  { id: '5', icon: Icons.Bell, title: '提醒管理', subtitle: '智能提醒设置', screen: 'Reminder', color: colors.primary },
  { id: '6', icon: Icons.Settings, title: '设置', subtitle: '偏好设置', screen: 'Settings', color: colors['text-secondary'] },
  { id: '7', icon: Icons.HelpCircle, title: '帮助反馈', subtitle: '联系我们', screen: 'Help', color: colors['text-secondary'] },
];

export function ProfileScreen({ onNavigate, currentTab, onTabChange, isLoggedIn, onRequireLogin, onLogout }: ProfileScreenProps) {
  const handleLoginPress = () => {
    if (onRequireLogin) {
      onRequireLogin();
    }
  };

  const handleLogoutPress = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: () => {
          if (onLogout) {
            onLogout();
          }
        },
      },
    ]);
  };

  const handleMenuPress = (screen: string) => {
    if (onNavigate) {
      const screenMap: Record<string, 'Diagnosis' | 'Recommendation' | 'Reminder' | 'EncyclopediaDetail' | 'Diary' | 'DiagnosisHistory'> = {
        'Diary': 'Diary',
        'Diagnosis': 'Diagnosis',
        'DiagnosisHistory': 'DiagnosisHistory',
        'Recommendation': 'Recommendation',
        'Reminder': 'Reminder',
        'EncyclopediaDetail': 'EncyclopediaDetail',
      };
      onNavigate(screenMap[screen] || null);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 用户信息 */}
        <View style={styles.profileHeader}>
          {isLoggedIn ? (
            <>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Icons.User size={36} color="#fff" />
                </View>
                <View style={styles.avatarBadge}>
                  <Icons.Sparkles size={12} color={colors.warning} />
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>养花小白</Text>
                <View style={styles.levelBadge}><Text style={styles.levelText}>Lv.3 园丁</Text></View>
                <Text style={styles.plantCount}>已养护 2 盆植物</Text>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={handleLoginPress} style={styles.loginButton} activeOpacity={0.8}>
                <Icons.User size={36} color={colors.primary} />
                <Text style={styles.loginButtonText}>点击登录</Text>
                <Text style={styles.loginButtonSubtext}>登录后可保存植物和记录</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 快捷统计 */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}><Icons.Clock size={18} color={colors.primary} /></View>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>本周浇水</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.secondary + '15' }]}><Icons.Camera size={18} color={colors.secondary} /></View>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>识别次数</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning + '15' }]}><Icons.Star size={18} color={colors.warning} /></View>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>连续打卡</Text>
          </View>
        </View>

        {/* 菜单列表 */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>功能入口</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={item.id} style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]} activeOpacity={0.7} onPress={() => handleMenuPress(item.screen)}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}><item.icon size={20} color={item.color} /></View>
              <View style={styles.menuContent}><Text style={styles.menuTitle}>{item.title}</Text><Text style={styles.menuSubtitle}>{item.subtitle}</Text></View>
              <Icons.ChevronRight size={18} color={colors['text-tertiary']} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 版本信息 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>护花使者 v1.0.0</Text>
          <Text style={styles.footerText}>让养花不再凭感觉</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileHeader: { backgroundColor: colors.surface, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl * 1.5 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarBadge: { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
  loginButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },
  loginButtonText: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginTop: spacing.sm },
  loginButtonSubtext: { fontSize: 14, color: colors['text-secondary'], marginTop: spacing.xs },
  profileInfo: { marginLeft: spacing.lg, flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  levelBadge: { backgroundColor: colors.warning, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginTop: spacing.xs },
  levelText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  plantCount: { fontSize: 14, color: colors['text-tertiary'], marginTop: spacing.xs },
  statsCard: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: -spacing.lg, backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 6 },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  statLabel: { fontSize: 12, color: colors['text-tertiary'], marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border },
  menuSection: { marginTop: spacing.xl, marginHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  menuSectionTitle: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, color: colors.warning, fontSize: 14, fontWeight: '500' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '500', color: colors.text },
  menuSubtitle: { fontSize: 13, color: colors['text-tertiary'] },
  footer: { alignItems: 'center', paddingVertical: spacing.xl },
  footerText: { fontSize: 13, color: colors['text-tertiary'] },
});
