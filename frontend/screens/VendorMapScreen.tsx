import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../utils/api';
import { Vendor } from '../utils/types';

export const VendorMapScreen = ({ navigation }: any) => {
  const [vendors, setVendors] = useState<(Vendor & { distance?: number })[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert('Permission Denied', 'Location permission is required to find vendors');
        setLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request location permission');
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      loadNearbyVendors(latitude, longitude);
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
      setLoading(false);
    }
  };

  const loadNearbyVendors = async (latitude: number, longitude: number, radius: number = 10) => {
    try {
      const data = await apiClient.listVendors(latitude, longitude, radius);

      const vendorsWithDistance = data.map((vendor: Vendor) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          vendor.latitude || 0,
          vendor.longitude || 0
        );
        return { ...vendor, distance };
      });

      vendorsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setVendors(vendorsWithDistance);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load nearby vendors');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const handleRefresh = () => {
    if (userLocation) {
      setLoading(true);
      loadNearbyVendors(userLocation.latitude, userLocation.longitude);
    }
  };

  const toggleTracking = async () => {
    if (!trackingEnabled) {
      try {
        const subscription = Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 50,
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            setUserLocation({ latitude, longitude });
            loadNearbyVendors(latitude, longitude);
          }
        );
        setTrackingEnabled(true);
      } catch (error) {
        Alert.alert('Error', 'Failed to enable location tracking');
      }
    } else {
      setTrackingEnabled(false);
    }
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
      {/* Header with Controls */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={toggleTracking}>
          <Ionicons name={trackingEnabled ? 'location' : 'location-outline'} size={24} color={trackingEnabled ? '#FF3B30' : '#007AFF'} />
        </TouchableOpacity>
      </View>

      {/* Location Info */}
      {userLocation && (
        <View style={styles.infoBar}>
          <Ionicons name="navigate-circle" size={18} color="#007AFF" />
          <Text style={styles.infoText}>
            Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      {/* Vendors List */}
      <FlatList
        data={vendors}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.vendorCard}
            onPress={() => navigation.navigate('ProductList', { vendorId: item.id })}
          >
            <View style={styles.vendorHeader}>
              <View>
                <Text style={styles.vendorName}>{item.business_name}</Text>
                {item.address && <Text style={styles.address}>{item.address}</Text>}
              </View>
              <View style={styles.distanceBadge}>
                <Ionicons name="navigate" size={14} color="#fff" />
                <Text style={styles.distance}>
                  {(item.distance || 0).toFixed(1)} km
                </Text>
              </View>
            </View>

            <View style={styles.vendorDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text style={styles.detailText}>
                  {item.rating.toFixed(1)} ({item.total_reviews})
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="call" size={16} color="#007AFF" />
                <Text style={styles.detailText}>{item.phone}</Text>
              </View>

              {item.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => navigation.navigate('ProductList', { vendorId: item.id })}
              >
                <Text style={styles.viewButtonText}>View Products</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No vendors found nearby</Text>
            <Text style={styles.emptySubtext}>Try moving to a different area or expanding your search radius</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '500',
  },
  vendorCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: '#999',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  distance: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  vendorDetails: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  description: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    lineHeight: 18,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  },
  emptySubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
