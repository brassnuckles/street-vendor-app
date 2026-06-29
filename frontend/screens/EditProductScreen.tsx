import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../utils/api';
import { Product } from '../utils/types';

export const EditProductScreen = ({ navigation, route }: any) => {
  const product: Product = route.params.product;

  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    category: product.category,
    price: product.price.toString(),
    quantity_available: product.quantity_available.toString(),
    is_available: product.is_available,
  });

  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await apiClient.updateProduct(product.id, {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        price: parseFloat(formData.price),
        quantity_available: parseInt(formData.quantity_available) || 0,
        is_available: formData.is_available,
      });

      Alert.alert('Success', 'Product updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Product</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Product name"
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <TextInput
              style={styles.input}
              placeholder="Category"
              placeholderTextColor="#999"
              value={formData.category}
              onChangeText={(value) => updateField('category', value)}
              editable={!loading}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Price ($) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#999"
                value={formData.price}
                onChangeText={(value) => updateField('price', value)}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#999"
                value={formData.quantity_available}
                onChangeText={(value) => updateField('quantity_available', value)}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Product description"
              placeholderTextColor="#999"
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          <View style={styles.toggleContainer}>
            <View style={styles.toggleContent}>
              <Ionicons
                name={formData.is_available ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={formData.is_available ? '#34C759' : '#FF3B30'}
              />
              <Text style={styles.toggleLabel}>Available for Purchase</Text>
            </View>
            <Switch
              value={formData.is_available}
              onValueChange={(value) => updateField('is_available', value)}
              disabled={loading}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  apiClient.deleteProduct(product.id).then(() => {
                    Alert.alert('Success', 'Product deleted', [
                      { text: 'OK', onPress: () => navigation.goBack() },
                    ]);
                  });
                },
              },
            ]);
          }}
          disabled={loading}
        >
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete Product</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
});
