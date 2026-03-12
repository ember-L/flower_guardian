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
import { getAddresses, Address } from '../services/addressService';
import { colors, spacing, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { Icons } from '../components/Icon';

interface StoreDetailScreenProps extends Partial<NavigationProps> {
  productId?: number;
}

export function StoreDetailScreen({ onGoBack, productId, isLoggedIn, onRequireLogin, onNavigate }: StoreDetailScreenProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [deliveryType, setDeliveryType] = useState<'express' | 'pickup'>('express');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddressList, setShowAddressList] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
    if (isLoggedIn) {
      loadAddresses();
    }
  }, [productId, isLoggedIn]);

  const loadProduct = async () => {
    try {
      const data = await getProductDetail(productId!);
      setProduct(data);
    } catch (error) {
      console.error('Failed to load product:', error);
    }
  };

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
      // 自动选择默认地址
      const defaultAddr = data.find((a: Address) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setContactName(defaultAddr.name);
        setContactPhone(defaultAddr.phone);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddressId(address.id);
    setContactName(address.name);
    setContactPhone(address.phone);
    setShowAddressList(false);
  };

  const getSelectedAddress = () => {
    return addresses.find((a: Address) => a.id === selectedAddressId);
  };

  const handleOrder = async () => {
    if (!isLoggedIn) {
      if (onRequireLogin) {
        onRequireLogin();
      }
      return;
    }
    if (!contactName || !contactPhone) {
      Alert.alert('提示', '请选择收货地址');
      return;
    }

    const selectedAddress = getSelectedAddress();
    const fullAddress = selectedAddress
      ? `${selectedAddress.province || ''}${selectedAddress.city || ''}${selectedAddress.district || ''}${selectedAddress.detail_address}`
      : '';

    setLoading(true);
    try {
      await createOrder({
        items: [{ product_id: product!.id, quantity: parseInt(quantity) }],
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'express' ? fullAddress : undefined,
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

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 返回按钮 */}
      <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
        <Icons.ArrowLeft size={24} color="#333" />
      </TouchableOpacity>

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
              {addresses.length > 0 ? (
                <TouchableOpacity
                  style={styles.addressSelector}
                  onPress={() => setShowAddressList(!showAddressList)}
                >
                  {selectedAddressId ? (
                    <View>
                      <Text style={styles.addressText}>
                        {getSelectedAddress()?.name} {getSelectedAddress()?.phone}
                      </Text>
                      <Text style={styles.addressDetail}>
                        {getSelectedAddress()?.province}{getSelectedAddress()?.city}{getSelectedAddress()?.district}{getSelectedAddress()?.detail_address}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.placeholderText}>请选择收货地址</Text>
                  )}
                  <Icons.ChevronRight size={20} color={colors['text-tertiary']} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addAddressBtn}
                  onPress={() => onNavigate && onNavigate('AddressEdit')}
                >
                  <Icons.Plus size={18} color={colors.primary} />
                  <Text style={styles.addAddressText}>添加收货地址</Text>
                </TouchableOpacity>
              )}
              {showAddressList && (
                <View style={styles.addressList}>
                  {addresses.map((addr: Address) => (
                    <TouchableOpacity
                      key={addr.id}
                      style={[
                        styles.addressItem,
                        selectedAddressId === addr.id && styles.addressItemSelected,
                      ]}
                      onPress={() => handleAddressSelect(addr)}
                    >
                      <View>
                        <Text style={styles.addressText}>{addr.name} {addr.phone}</Text>
                        <Text style={styles.addressDetail}>
                          {addr.province}{addr.city}{addr.district}{addr.detail_address}
                        </Text>
                      </View>
                      {addr.is_default && (
                        <View style={styles.defaultTag}>
                          <Text style={styles.defaultTagText}>默认</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.addNewAddress}
                    onPress={() => {
                      setShowAddressList(false);
                      onNavigate && onNavigate('AddressEdit');
                    }}
                  >
                    <Icons.Plus size={16} color={colors.primary} />
                    <Text style={styles.addNewAddressText}>添加新地址</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
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
  addressSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    backgroundColor: colors.white,
  },
  addressText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  addressDetail: {
    fontSize: 12,
    color: colors['text-secondary'],
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 14,
    color: colors['text-tertiary'],
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: spacing.sm,
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  addressList: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    maxHeight: 200,
  },
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addressItemSelected: {
    backgroundColor: colors.primary + '10',
  },
  defaultTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultTagText: {
    color: colors.white,
    fontSize: 10,
  },
  addNewAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  addNewAddressText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: spacing.xs,
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
