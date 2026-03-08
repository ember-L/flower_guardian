// 花园屏幕 - 我的植物列表
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Droplets, Scissors, Flower2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

// 模拟数据
const mockPlants = [
  { id: '1', name: '绿萝', image: '', nextAction: '浇水', daysUntil: 2 },
  { id: '2', name: '虎皮兰', image: '', nextAction: '施肥', daysUntil: 5 },
];

export function GardenScreen() {
  const renderPlant = ({ item }: { item: typeof mockPlants[0] }) => (
    <TouchableOpacity style={styles.plantCard}>
      <View style={styles.plantImage}>
        <Flower2 size={40} color={colors.secondary} />
      </View>
      <View style={styles.plantInfo}>
        <Text style={styles.plantName}>{item.name}</Text>
        <View style={styles.plantAction}>
          <Droplets size={14} color={colors.primary} />
          <Text style={styles.plantActionText}>
            {item.nextAction} · {item.daysUntil}天后
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.actionIcon}>
        <Scissors size={20} color={colors['text-secondary']} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的花园</Text>
        <Text style={styles.subtitle}>{mockPlants.length} 盆植物</Text>
      </View>

      <FlatList
        data={mockPlants}
        renderItem={renderPlant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Flower2 size={64} color={colors['text-light']} />
            <Text style={styles.emptyText}>还没有植物</Text>
            <Text style={styles.emptySubtext}>点击下方添加你的第一盆植物</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.addButton}>
        <Plus size={24} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.md,
  },
  plantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  plantImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  plantName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  plantAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  plantActionText: {
    fontSize: fontSize.xs,
    color: colors['text-secondary'],
  },
  actionIcon: {
    padding: spacing.sm,
  },
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors['text-secondary'],
    marginTop: spacing.xs,
  },
});
