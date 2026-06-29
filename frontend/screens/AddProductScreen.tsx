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
  Image,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/api';

export const AddProductScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity_available: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{ url: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultiple: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleUploadImage = async (imageUri: string) => {
    setUploadingImage(true);
    try {
      const result = await apiClient.uploadProductImage(imageUri);
      setUploadedImages([...uploadedImages, { url: result.url, name: result.filename }]);
      Alert.alert('Success', 'Image uploaded successfully');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleRemoveUploadedImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleCreateProduct = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (uploadedImages.length === 0) {
      Alert.alert('Error', 'Please upload at least one product image');
      return;
    }

    setLoading(true);
    try {
      const vendorId = await AsyncStorage.getItem('user_id');
      if (vendorId) {
        await apiClient.createProduct(parseInt(vendorId), {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          price: parseFloat(formData.price),
          quantity_available: parseInt(formData.quantity_available) || 0,
          images: uploadedImages.map((img) => img.url),
        });

        Alert.alert('Success', 'Product created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Product Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images *</Text>

          {/* Image Picker Buttons */}
          <View style={styles.imagePickerButtons}>
            <TouchableOpacity style={styles.pickerButton} onPress={handlePickImage}>
              <Ionicons name="image" size={24} color="#007AFF" />
              <Text style={styles.pickerButtonText}>Pick from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pickerButton} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={24} color="#007AFF" />
              <Text style={styles.pickerButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Local Images Preview */}
          {images.length > 0 && (
            <View>
              <Text style={styles.subLabel}>Selected Images ({images.length})</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={images}
                keyExtractor={(_, index) => `image-${index}`}
                renderItem={({ item, index }) => (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: item }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.uploadImageButton, uploadingImage && styles.uploadImageButtonDisabled]}
                      onPress={() => handleUploadImage(item)}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Ionicons name="cloud-upload" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.subLabel}>Uploaded Images ({uploadedImages.length})</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={uploadedImages}
                keyExtractor={(_, index) => `uploaded-${index}`}
                renderItem={({ item, index }) => (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: item.url }} style={styles.imagePreview} />
                    <View style={styles.uploadedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    </View>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveUploadedImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Fresh Mango"
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Fruits, Vegetables, Prepared Food"
              placeholderTextColor="#999"
              value={formData.category}
              onChangeText={(value) => updateField('category', value)}
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
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your product (optional)"
              placeholderTextColor="#999"
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleCreateProduct}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Create Product</Text>
            </>
          )}
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  imagePickerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    gap: 8,
  },
  pickerButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  uploadImageButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 4,
  },
  uploadImageButtonDisabled: {
    opacity: 0.6,
  },
  uploadedBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
