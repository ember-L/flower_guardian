// 花园屏幕 - 我的植物列表 - UI Kitten 组件
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  List,
  ListItem,
  Button,
  Card,
  Text,
  Layout,
  useTheme,
} from '@ui-kitten/components';
import { Icons } from '../components/Icon';
import { colors, spacing, borderRadius, fontSize, shadows, touchTarget } from '../constants/theme';

// 模拟数据
const mockPlants = [
  { id: '1', name: '绿萝', image: '', nextAction: '浇水', daysUntil: 2, health: 'good' },
  { id: '2', name: '虎皮兰', image: '', nextAction: '施肥', daysUntil: 5, health: 'good' },
  { id: '3', name: '吊兰', image: '', nextAction: '修剪', daysUntil: 1, health: 'warning' },
];

export function GardenScreen() {
  const theme = useTheme();
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return colors.success;
      case 'warning': return colors.warning;
      case 'bad': return colors.error;
      default: return colors.success;
    }
  };

  const getHealthText = (health: string) => {
    switch (health) {
      case 'good': return '健康';
      case 'warning': return '需关注';
      case 'bad': return '生病';
      default: return '健康';
    }
  };

  const renderPlant = ({ item }: { item: typeof mockPlants[0] }) => (
    <ListItem
      style={styles.plantCard}
      accessoryLeft={(props) => (
        <View {...props} style={[styles.plantAvatar, { backgroundColor: colors.secondary + '15' }]}>
          <Icons.Flower2 size={28} />
        </View>
      )}
      description={(props: any) => (
        <View {...props} style={styles.plantAction}>
          <Icons.Droplets size={12} />
          <Text style={styles.plantActionText}>
            {item.nextAction} · {item.daysUntil}天后
          </Text>
        </View>
      )}
      accessoryRight={() => (
        <Button
          size="tiny"
          appearance="ghost"
          status="primary"
          accessoryLeft={<Icons.Bell size={16} />}
        />
      )}
    >
      <View style={styles.plantHeader}>
        <Text category="s1">{item.name}</Text>
        <Text
          category="c1"
          status={item.health === 'good' ? 'success' : item.health === 'warning' ? 'warning' : 'danger'}
        >
          {getHealthText(item.health)}
        </Text>
      </View>
    </ListItem>
  );

  const renderEmpty = () => (
    <Layout style={styles.empty} level="1">
      <View style={styles.emptyIcon}>
        <Icons.Flower2 size={48} />
      </View>
      <Text category="h6">还没有植物</Text>
      <Text appearance="hint">点击下方添加你的第一盆植物</Text>
      <Button
        style={styles.emptyButton}
        appearance="filled"
        status="primary"
        accessoryLeft={<Icons.Plus size={18} />}
      >
        添加植物
      </Button>
    </Layout>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <Layout style={styles.header} level="1">
        <View style={styles.headerContent}>
          <Text category="h2">我的花园</Text>
          <Text appearance="hint">{mockPlants.length} 盆植物</Text>
        </View>
        <Button
          style={styles.headerButton}
          size="small"
          appearance="filled"
          status="basic"
          accessoryLeft={<Icons.Scissors size={18} />}
        />
      </Layout>

      {/* 植物列表 */}
      <List
        data={mockPlants}
        renderItem={renderPlant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty()}
      />

      {/* 添加按钮 - 悬浮 */}
      <Button
        style={styles.addButton}
        size="large"
        appearance="filled"
        status="primary"
        accessoryLeft={<Icons.Plus size={26} />}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerButton: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    borderRadius: borderRadius.lg,
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  plantCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  plantAvatar: {
    marginRight: spacing.md,
  },
  plantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  plantAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  plantActionText: {
    fontSize: fontSize.sm,
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...shadows.lg,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyButton: {
    marginTop: spacing.xl,
    ...shadows.md,
  },
});
