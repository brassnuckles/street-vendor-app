import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/api';

export const UpdateLocationScreen = ({ navigation }: any) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert('Permission Denied', 'Location permission is required to set your store location');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request location permission');
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;
      setLocation({ latitude, longitude });

      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocode[0]) {
          const addr = `${reverseGeocode[0].street}, ${reverseGeocode[0].city}, ${reverseGeocode[0].region}`;
          setAddress(addr);
        }
      } catch (e) {
        console.log('Reverse geocoding failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not set');
      return;
    }

    setLoading(true);
    try {
      const vendorId = await AsyncStorage.getItem('user_id');
      if (vendorId) {
        await apiClient.updateVendor(parseInt(vendorId), {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address || undefined,
        });

        Alert.alert('Success', 'Location updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Location Card */}
        {location ? (
          <View style={styles.locationCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={24} color="#007AFF" />
              <Text style={styles.cardTitle}>Current Location</Text>
            </View>

            <View style={styles.coordinateBox}>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>Latitude</Text>
                <Text style={styles.coordValue}>{location.latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>Longitude</Text>
                <Text style={styles.coordValue}>{location.longitude.toFixed(6)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.refreshButton} onPress={getCurrentLocation}>
              <Ionicons name="refresh" size={18} color="#007AFF" />
              <Text style={styles.refreshButtonText}>Update Current Location</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.locationCard}>
            <Text style={styles.noLocationText}>
              No location set yet. Please enable location services and try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={requestLocationPermission}>
              <Text style={styles.retryButtonText}>Request Permission</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Address Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Address (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your store address"
            placeholderTextColor="#999"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.helperText}>
            This helps customers find you more easily
          </Text>
        </View>

        {/* Map Preview (Placeholder) */}
        <View style={styles.mapPreview}>
          <Ionicons name="map" size={32} color="#ccc" />
          <Text style={styles.mapPreviewText}>
            Latitude: {location?.latitude.toFixed(4) || 'N/A'}
          </Text>
          <Text style={styles.mapPreviewText}>
            Longitude: {location?.longitude.toFixed(4) || 'N/A'}
          </Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#0066cc" />
          <Text style={styles.infoText}>
            Your location is visible to customers searching nearby. You can update it anytime.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (loading || !location) && styles.saveButtonDisabled]}
          onPress={handleSaveLocation}
          disabled={loading || !location}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Location</Text>
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
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  coordinateBox: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  coordItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coordLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  coordValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Courier New',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    gap: 8,
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noLocationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
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
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
  },
  mapPreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  mapPreviewText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0066cc',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
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
