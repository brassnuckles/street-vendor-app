import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/api';
import { Vendor, Product } from '../utils/types';

export const VendorDashboardScreen = ({ navigation }: any) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      const vendorId = await AsyncStorage.getItem('user_id');
      if (vendorId) {
        const vendorData = await apiClient.getVendor(parseInt(vendorId));
        setVendor(vendorData);

        const productsData = await apiClient.getVendorProducts(parseInt(vendorId));
        setProducts(productsData);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load vendor data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVendorData();
  };

  const handleDeleteProduct = (productId: number) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.deleteProduct(productId);
            setProducts(products.filter((p) => p.id !== productId));
            Alert.alert('Success', 'Product deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete product');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Vendor Info Card */}
      {vendor && (
        <View style={styles.vendorCard}>
          {vendor.profile_image && (
            <Image source={{ uri: vendor.profile_image }} style={styles.vendorImage} />
          )}
          <View style={styles.vendorInfo}>
            <Text style={styles.businessName}>{vendor.business_name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#FFB800" />
              <Text style={styles.rating}>{vendor.rating.toFixed(1)}</Text>
              <Text style={styles.reviews}>({vendor.total_reviews} reviews)</Text>
            </View>
            <Text style={styles.phone}>{vendor.phone}</Text>
            {vendor.address && <Text style={styles.address}>{vendor.address}</Text>}
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditVendorProfile', { vendor })}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{products.filter((p) => p.is_available).length}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
      </View>

      {/* Add Product Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Product</Text>
      </TouchableOpacity>

      {/* Products List */}
      <Text style={styles.sectionTitle}>Your Products</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            {item.images[0] && (
              <Image source={{ uri: item.images[0] }} style={styles.productImage} />
            )}
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category}</Text>
              <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
              <View style={styles.stockBadge}>
                <Text
                  style={[
                    styles.stockText,
                    !item.is_available && styles.stockTextUnavailable,
                  ]}
                >
                  {item.is_available ? `${item.quantity_available} in stock` : 'Out of stock'}
                </Text>
              </View>
            </View>
            <View style={styles.productActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditProduct', { product: item })}
              >
                <Ionicons name="pencil" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteProduct(item.id)}>
                <Ionicons name="trash" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No products yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddProduct')}
            >
              <Text style={styles.emptyButtonText}>Create your first product</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  vendorInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviews: {
    fontSize: 12,
    color: '#999',
  },
  phone: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    color: '#999',
  },
  editButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  productDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 4,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  stockText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },
  stockTextUnavailable: {
    color: '#FF3B30',
  },
  productActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 16,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
