import React, { useEffect, useState } from 'react';
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

interface StoreScreenProps extends Partial<NavigationProps> {}

export function StoreScreen({ onNavigate, isLoggedIn, onRequireLogin }: StoreScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = search
    ? products.filter((p) => p.name.includes(search))
    : products;

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => {
        if (onNavigate) {
          onNavigate('StoreDetail', { productId: item.id });
        }
      }}
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>植物商城</Text>
      </View>

      <View style={styles.searchContainer}>
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
  header: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.text,
  },
  listContent: {
    padding: spacing.xs,
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
