import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { getProductDetail, Product, createOrder } from '../services/storeService';
import { colors, spacing, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';

interface StoreDetailScreenProps extends Partial<NavigationProps> {
  productId?: number;
}

export function StoreDetailScreen({ onGoBack, productId, isLoggedIn, onRequireLogin }: StoreDetailScreenProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [deliveryType, setDeliveryType] = useState<'express' | 'pickup'>('express');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const data = await getProductDetail(productId!);
      setProduct(data);
    } catch (error) {
      console.error('Failed to load product:', error);
    }
  };

  const handleOrder = async () => {
    if (!isLoggedIn) {
      if (onRequireLogin) {
        onRequireLogin();
      }
      return;
    }
    if (!contactName || !contactPhone) {
      Alert.alert('提示', '请填写联系人和电话');
      return;
    }
    if (deliveryType === 'express' && !address) {
      Alert.alert('提示', '请填写收货地址');
      return;
    }

    setLoading(true);
    try {
      await createOrder({
        items: [{ product_id: product!.id, quantity: parseInt(quantity) }],
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'express' ? address : undefined,
        contact_name: contactName,
        contact_phone: contactPhone,
        remark: remark || undefined,
      });
      Alert.alert('成功', '订单创建成功！', [
        { text: '确定', onPress: () => onGoBack && onGoBack() },
      ]);
    } catch (error: any) {
      Alert.alert('错误', error.response?.data?.detail || '下单失败');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>加载中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: product.image_url || 'https://via.placeholder.com/300' }}
          style={styles.image}
        />

        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>¥{product.price}</Text>
          <Text style={styles.stock}>
            {product.stock > 0 ? `库存: ${product.stock}` : '缺货'}
          </Text>
          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>下单信息</Text>

          <View style={styles.inputRow}>
            <Text style={styles.label}>数量</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>配送方式</Text>
            <View style={styles.deliveryOptions}>
              <TouchableOpacity
                style={[
                  styles.option,
                  deliveryType === 'express' && styles.optionActive,
                ]}
                onPress={() => setDeliveryType('express')}
              >
                <Text
                  style={[
                    styles.optionText,
                    deliveryType === 'express' && styles.optionTextActive,
                  ]}
                >
                  快递
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.option,
                  deliveryType === 'pickup' && styles.optionActive,
                ]}
                onPress={() => setDeliveryType('pickup')}
              >
                <Text
                  style={[
                    styles.optionText,
                    deliveryType === 'pickup' && styles.optionTextActive,
                  ]}
                >
                  到店自提
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {deliveryType === 'express' && (
            <View style={styles.inputRow}>
              <Text style={styles.label}>收货地址</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="请输入收货地址"
                placeholderTextColor={colors['text-tertiary']}
              />
            </View>
          )}

          <View style={styles.inputRow}>
            <Text style={styles.label}>联系人</Text>
            <TextInput
              style={styles.input}
              value={contactName}
              onChangeText={setContactName}
              placeholder="请输入联系人姓名"
              placeholderTextColor={colors['text-tertiary']}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>联系电话</Text>
            <TextInput
              style={styles.input}
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              placeholder="请输入联系电话"
              placeholderTextColor={colors['text-tertiary']}
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>备注</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={remark}
              onChangeText={setRemark}
              multiline
              placeholder="请输入备注"
              placeholderTextColor={colors['text-tertiary']}
            />
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.orderButton, loading && styles.orderButtonDisabled]}
        onPress={handleOrder}
        disabled={loading}
      >
        <Text style={styles.orderButtonText}>
          {loading ? '提交中...' : '提交订单'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: colors.background,
  },
  info: {
    padding: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginVertical: spacing.sm,
  },
  stock: {
    fontSize: 14,
    color: colors['text-tertiary'],
  },
  description: {
    fontSize: 14,
    color: colors['text-secondary'],
    marginTop: spacing.md,
    lineHeight: 20,
  },
  form: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  inputRow: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    color: colors['text-secondary'],
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  deliveryOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionText: {
    color: colors['text-secondary'],
  },
  optionTextActive: {
    color: colors.white,
  },
  orderButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    alignItems: 'center',
  },
  orderButtonDisabled: {
    opacity: 0.6,
  },
  orderButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
