import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { getOrderDetail, cancelOrder, reorder, Order } from '../services/storeService';
import { colors, spacing, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface OrderDetailScreenProps extends NavigationProps {}

export function OrderDetailScreen({ route, navigation, isLoggedIn, onRequireLogin }: OrderDetailScreenProps) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // 检查登录状态
  useEffect(() => {
    if (!isLoggedIn && onRequireLogin) {
      onRequireLogin();
    }
  }, [isLoggedIn, onRequireLogin]);

  useEffect(() => {
    if (isLoggedIn) {
      loadOrder();
    }
  }, [isLoggedIn, orderId]);

  const loadOrder = async () => {
    if (!isLoggedIn) return;
    try {
      const data = await getOrderDetail(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('确认取消', '确定要取消此订单吗?', [
      { text: '否', style: 'cancel' },
      { text: '是', style: 'destructive', onPress: async () => {
        try {
          await cancelOrder(orderId);
          loadOrder();
        } catch (error) {
          console.error('Failed to cancel order:', error);
        }
      }}
    ]);
  };

  const handleReorder = async () => {
    try {
      await reorder(orderId);
      if (navigation?.onNavigate) {
        navigation.onNavigate('Cart');
      }
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待确认', color: colors.warning },
    confirmed: { label: '已确认', color: colors.info },
    shipped: { label: '已发货', color: colors.success },
    completed: { label: '已完成', color: colors.success },
    cancelled: { label: '已取消', color: colors.error },
  };

  if (loading || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const statusInfo = statusMap[order.status] || { label: order.status, color: colors.text };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.orderNo}>{order.order_no}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>商品信息</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>¥{item.subtotal}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>合计</Text>
            <Text style={styles.totalAmount}>¥{order.total_amount}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>配送信息</Text>
          <Text style={styles.infoText}>配送方式: {order.delivery_type === 'express' ? '快递' : '自提'}</Text>
          {order.delivery_address && <Text style={styles.infoText}>地址: {order.delivery_address}</Text>}
          <Text style={styles.infoText}>联系人: {order.contact_name}</Text>
          <Text style={styles.infoText}>电话: {order.contact_phone}</Text>
          {order.remark && <Text style={styles.infoText}>备注: {order.remark}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>订单信息</Text>
          <Text style={styles.infoText}>下单时间: {new Date(order.created_at).toLocaleString()}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {order.status === 'pending' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>取消订单</Text>
          </TouchableOpacity>
        )}
        {order.status === 'completed' && (
          <TouchableOpacity style={styles.reorderBtn} onPress={handleReorder}>
            <Text style={styles.reorderBtnText}>再次购买</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, backgroundColor: colors.white },
  orderNo: { fontSize: 16, fontFamily: 'monospace', color: colors.text },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: spacing.xs },
  statusText: { fontSize: 14, fontWeight: '600' },
  section: { backgroundColor: colors.white, marginTop: spacing.sm, padding: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', paddingVertical: spacing.xs },
  itemName: { flex: 1, fontSize: 14, color: colors.text },
  itemQty: { fontSize: 14, color: colors['text-secondary'], marginRight: spacing.md },
  itemPrice: { fontSize: 14, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.background },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  infoText: { fontSize: 14, color: colors['text-secondary'], marginBottom: 4 },
  footer: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.background },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: colors.error, marginRight: spacing.sm },
  cancelBtnText: { color: colors.error, textAlign: 'center', fontWeight: '600' },
  reorderBtn: { flex: 1, paddingVertical: 12, borderRadius: 24, backgroundColor: colors.primary },
  reorderBtnText: { color: colors.white, textAlign: 'center', fontWeight: '600' },
});
