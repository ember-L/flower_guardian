import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { getMyOrders, Order } from '../services/storeService';
import { colors, spacing, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface OrdersScreenProps extends Partial<NavigationProps> {}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: colors.warning },
  confirmed: { label: '已确认', color: colors.success },
  shipped: { label: '已发货', color: colors.success },
  completed: { label: '已完成', color: colors.success },
  cancelled: { label: '已取消', color: colors.error },
};

export function OrdersScreen({ onNavigate }: OrdersScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const statusInfo = statusMap[item.status] || { label: item.status, color: colors['text-tertiary'] };

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          if (onNavigate) {
            onNavigate('OrderDetail', { orderId: item.id });
          }
        }}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNo}>{item.order_no}</Text>
          <Text style={[styles.status, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        <View style={styles.orderItems}>
          {item.items.map((orderItem, index) => (
            <Text key={index} style={styles.itemText}>
              {orderItem.product_name} x{orderItem.quantity}
            </Text>
          ))}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.totalAmount}>¥{item.total_amount}</Text>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的订单</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无订单</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  listContent: {
    padding: spacing.md,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  orderNo: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: colors['text-secondary'],
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: spacing.sm,
  },
  itemText: {
    fontSize: 14,
    color: colors.text,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  date: {
    fontSize: 12,
    color: colors['text-tertiary'],
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors['text-tertiary'],
  },
});
