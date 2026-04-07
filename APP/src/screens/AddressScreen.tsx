import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAddresses, deleteAddress, setDefaultAddress, Address } from '../services/addressService';
import { colors, spacing, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { Icons } from '../components/Icon';

interface AddressScreenProps extends Partial<NavigationProps> {}

export function AddressScreen({ onGoBack, onNavigate, isLoggedIn, onRequireLogin }: AddressScreenProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // 检查登录状态
  useEffect(() => {
    if (!isLoggedIn && onRequireLogin) {
      onRequireLogin();
    }
  }, [isLoggedIn]);

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadAddresses();
    }
  }, [isLoggedIn]);

  const handleDelete = (id: number) => {
    Alert.alert('确认删除', '确定要删除该地址吗?', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await deleteAddress(id);
        loadAddresses();
      }}
    ]);
  };

  const handleSetDefault = async (id: number) => {
    await setDefaultAddress(id);
    loadAddresses();
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  const handleAddAddress = () => {
    if (onNavigate) {
      onNavigate('AddressEdit');
    }
  };

  const handleEditAddress = (addressId: number) => {
    if (onNavigate) {
      onNavigate('AddressEdit', { addressId });
    }
  };

  const renderItem = ({ item }: { item: Address }) => (
    <View style={styles.addressCard}>
      <TouchableOpacity style={styles.addressInfo} onPress={() => handleEditAddress(item.id)}>
        {item.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>默认</Text>
          </View>
        )}
        <Text style={styles.name}>{item.name} {item.phone}</Text>
        <Text style={styles.address}>
          {item.province}{item.city}{item.district}{item.detail_address}
        </Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        {!item.is_default && (
          <TouchableOpacity onPress={() => handleSetDefault(item.id)}>
            <Text style={styles.actionText}>设为默认</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => handleEditAddress(item.id)}>
          <Text style={styles.actionText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Text style={[styles.actionText, styles.deleteText]}>删除</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
            <Icons.ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>收货地址</Text>
          <TouchableOpacity onPress={handleAddAddress}>
            <Icons.Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {addresses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无收货地址</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddAddress}>
            <Text style={styles.addBtnText}>添加地址</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  listContent: { padding: spacing.md },
  addressCard: {
    backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm,
  },
  defaultBadge: {
    backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: spacing.xs,
  },
  defaultText: { color: colors.white, fontSize: 12 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  address: { fontSize: 14, color: colors['text-secondary'], lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm, gap: spacing.md },
  actionText: { color: colors.primary, fontSize: 14 },
  deleteText: { color: colors.error },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors['text-tertiary'] },
  addBtn: { marginTop: spacing.md, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 24 },
  addBtnText: { color: colors.white, fontWeight: '600' },
});
