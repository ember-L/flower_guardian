import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getCart, updateCartItem, deleteCartItem, clearCart, Cart, CartItem } from '../services/storeService';
import { colors, spacing, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { Icons } from '../components/Icon';

interface CartScreenProps extends Partial<NavigationProps> {}

export function CartScreen({ navigation, onGoBack, onNavigate, isLoggedIn, onRequireLogin }: CartScreenProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  // 检查登录状态
  useEffect(() => {
    if (!isLoggedIn && onRequireLogin) {
      onRequireLogin();
    }
  }, [isLoggedIn, onRequireLogin]);

  const loadCart = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await getCart();
      setCart(data);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', () => {
      loadCart();
    });
    return unsubscribe;
  }, [navigation, loadCart]);

  const handleUpdateQuantity = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    if (newQty > item.stock) {
      Alert.alert('库存不足', `当前库存仅剩 ${item.stock} 件`);
      return;
    }
    try {
      await updateCartItem(item.id, newQty);
      loadCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleDelete = (itemId: number) => {
    Alert.alert('确认删除', '确定要从购物车中删除该商品吗?', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await deleteCartItem(itemId);
        loadCart();
      }}
    ]);
  };

  const handleClearCart = () => {
    Alert.alert('确认清空', '确定要清空购物车吗?', [
      { text: '取消', style: 'cancel' },
      { text: '清空', style: 'destructive', onPress: async () => {
        await clearCart();
        loadCart();
      }}
    ]);
  };

  const navigateToCheckout = () => {
    if (navigation?.onNavigate) {
      navigation.onNavigate('Checkout');
    }
  };

  const navigateToStore = () => {
    if (navigation?.onNavigate) {
      navigation.onNavigate('Store');
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.product_image || 'https://via.placeholder.com/80' }}
        style={styles.productImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.product_name}</Text>
        <Text style={styles.productPrice}>¥{item.price}</Text>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => handleUpdateQuantity(item, -1)}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => handleUpdateQuantity(item, 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.subtotal}>¥{item.subtotal}</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteBtn}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (onNavigate) {
      onNavigate('Store');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 - 渐变背景 */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
            <Icons.ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>购物车</Text>
          {cart && cart.items.length > 0 ? (
            <TouchableOpacity onPress={handleClearCart}>
              <Text style={styles.clearBtn}>清空</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </View>

      {(!cart || cart.items.length === 0) ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>购物车是空的</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={navigateToStore}
          >
            <Text style={styles.shopBtnText}>去逛逛</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>共 {cart.item_count} 件</Text>
              <Text style={styles.totalAmount}>¥{cart.total_amount}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={navigateToCheckout}
            >
              <Text style={styles.checkoutBtnText}>去结算</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: { backgroundColor: colors.primary, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, paddingTop: spacing.xl * 1.5, paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center', marginHorizontal: 36 },
  clearBtn: { color: '#fff', fontSize: 14 },
  placeholder: { width: 36 },
  listContent: { padding: spacing.md },
  cartItem: {
    flexDirection: 'row', backgroundColor: colors.white, borderRadius: 12,
    padding: spacing.sm, marginBottom: spacing.sm, ...shadows.sm,
  },
  productImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.background },
  itemInfo: { flex: 1, marginLeft: spacing.sm },
  productName: { fontSize: 14, fontWeight: '600', color: colors.text },
  productPrice: { fontSize: 14, color: colors.primary, marginTop: 4 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  quantity: { marginHorizontal: 12, fontSize: 14 },
  itemRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  subtotal: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  deleteBtn: { color: colors.error, fontSize: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors['text-tertiary'] },
  shopBtn: { marginTop: spacing.md, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 24 },
  shopBtnText: { color: colors.white, fontWeight: '600' },
  footer: { backgroundColor: colors.white, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.background },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  totalLabel: { fontSize: 14, color: colors['text-secondary'] },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  checkoutBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  checkoutBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
