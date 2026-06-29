import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../utils/api';
import { Order } from '../utils/types';

const STATUS_STEPS = ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED'];
const STATUS_LABELS = {
  PENDING: 'Pending Payment',
  PAID: 'Payment Received',
  PROCESSING: 'Being Prepared',
  COMPLETED: 'Ready for Pickup',
  CANCELLED: 'Cancelled',
};

export const OrderDetailScreen = ({ navigation, route }: any) => {
  const orderId = route.params?.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    try {
      const data = await apiClient.getOrder(orderId);
      setOrder(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      await apiClient.updateOrderStatus(orderId, newStatus);
      setOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      Alert.alert('Success', 'Order status updated');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFA500';
      case 'PAID':
        return '#007AFF';
      case 'PROCESSING':
        return '#FF9500';
      case 'COMPLETED':
        return '#34C759';
      case 'CANCELLED':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStepIndex = (status: string) => {
    return STATUS_STEPS.indexOf(status);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const currentStepIndex = getStepIndex(order.status);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Order Number and Status */}
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.orderNumber}>Order #{order.id}</Text>
            <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Text style={styles.statusText}>{STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}</Text>
          </View>
        </View>

        {/* Progress Tracker */}
        {order.status !== 'CANCELLED' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Progress</Text>
            <View style={styles.progressContainer}>
              {STATUS_STEPS.map((step, index) => (
                <View key={step} style={styles.stepContainer}>
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor:
                          index <= currentStepIndex ? '#007AFF' : '#eee',
                      },
                    ]}
                  >
                    {index <= currentStepIndex && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      index <= currentStepIndex && styles.stepLabelActive,
                    ]}
                  >
                    {step}
                  </Text>

                  {index < STATUS_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        {
                          backgroundColor:
                            index < currentStepIndex ? '#007AFF' : '#eee',
                        },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>

          <FlatList
            scrollEnabled={false}
            data={order.items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>Product #{item.product_id}</Text>
                  <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </Text>
              </View>
            )}
          />
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Subtotal</Text>
            <Text style={styles.detailValue}>
              ${order.total_amount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Address</Text>
            <Text style={styles.detailValue}>
              {order.delivery_address || 'Not provided'}
            </Text>
          </View>

          {order.customer_notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Special Instructions</Text>
              <Text style={styles.detailValue}>{order.customer_notes}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.button} onPress={() => {}}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#007AFF" />
            <Text style={styles.buttonText}>Contact Vendor</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonOutline} onPress={() => {}}>
            <Ionicons name="receipt-outline" size={18} color="#007AFF" />
            <Text style={styles.buttonOutlineText}>Download Invoice</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    height: 2,
    width: '100%',
    top: 16,
    left: '50%',
    zIndex: -1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemQty: {
    fontSize: 12,
    color: '#999',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  buttonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonOutlineText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
