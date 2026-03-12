import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { getProducts, Product } from '../services/storeService';
import { colors, spacing, shadows } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { Icons } from '../components/Icon';

interface StoreScreenProps extends Partial<NavigationProps> {}

export function StoreScreen({ navigation, onNavigate, isLoggedIn, onRequireLogin }: StoreScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = search
    ? products.filter((p) => p.name.includes(search))
    : products;

  const navigateToDetail = (productId: number) => {
    if (onNavigate) {
      onNavigate('StoreDetail', { productId });
    } else if (onRequireLogin) {
      onRequireLogin();
    }
  };

  const navigateToCart = () => {
    if (onNavigate) {
      onNavigate('Cart');
    } else if (onRequireLogin) {
      onRequireLogin();
    }
  };

  const navigateToOrders = () => {
    if (onNavigate) {
      onNavigate('Orders');
    } else if (onRequireLogin) {
      onRequireLogin();
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigateToDetail(item.id)}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>¥{item.price}</Text>
        <Text style={styles.productStock}>
          {item.stock > 0 ? `库存: ${item.stock}` : '缺货'}
        </Text>
      </View>
    </TouchableOpacity>
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
      {/* 头部 - 渐变背景 */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>植物商城</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerBtn} onPress={navigateToOrders}>
              <Icons.FileText size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={navigateToCart}>
              <Icons.ShoppingCart size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 搜索栏 - 毛玻璃效果 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchIcon}>
          <Icons.Search size={18} color={colors.primary} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索商品"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors['text-tertiary']}
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: { backgroundColor: colors.primary, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl * 1.5,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerBtn: {
    padding: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  listContent: {
    padding: spacing.xs,
    paddingBottom: 100,
  },
  productCard: {
    flex: 1,
    margin: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.sm,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.background,
  },
  productInfo: {
    padding: spacing.sm,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  productStock: {
    fontSize: 12,
    color: colors['text-tertiary'],
    marginTop: 2,
  },
});
