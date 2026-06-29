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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/api';
import { Vendor, Customer } from '../utils/types';

export const EditProfileScreen = ({ navigation, route }: any) => {
  const profile: Vendor | Customer = route.params?.profile;
  const isVendor = 'business_name' in profile;

  const [formData, setFormData] = useState(
    isVendor
      ? {
          business_name: (profile as Vendor).business_name,
          phone: (profile as Vendor).phone,
          description: (profile as Vendor).description || '',
        }
      : {
          full_name: (profile as Customer).full_name,
          phone: (profile as Customer).phone || '',
        }
  );

  const [profileImage, setProfileImage] = useState<string | null>(
    profile.profile_image || null
  );
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;

        setUploadingImage(true);
        try {
          const uploadResult = await apiClient.uploadProfileImage(imageUri);
          setProfileImage(uploadResult.url);
          Alert.alert('Success', 'Profile image updated');
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveProfile = async () => {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = { ...formData };
      if (profileImage) {
        updateData.profile_image = profileImage;
      }

      if (isVendor) {
        await apiClient.updateVendor(parseInt(userId), updateData);
      } else {
        await apiClient.updateCustomer(parseInt(userId), updateData);
      }

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
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
        {/* Profile Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>

          <View style={styles.imageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.imageplaceholder}>
                <Ionicons name="person-circle" size={80} color="#ccc" />
              </View>
            )}

            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={handlePickImage}
              disabled={uploadingImage || loading}
            >
              {uploadingImage ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>

          {isVendor ? (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Business Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Business name"
                  placeholderTextColor="#999"
                  value={formData.business_name}
                  onChangeText={(value) => updateField('business_name', value)}
                  editable={!loading}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell customers about your business"
                  placeholderTextColor="#999"
                  value={formData.description}
                  onChangeText={(value) => updateField('description', value)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>
            </>
          ) : (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor="#999"
                value={formData.full_name}
                onChangeText={(value) => updateField('full_name', value)}
                editable={!loading}
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#999"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Profile</Text>
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
  imageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  imageplaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  formGroup: {
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
