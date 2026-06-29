import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/api';
import { Product } from '../utils/types';

export const CheckoutScreen = ({ navigation, route }: any) => {
  const { product, quantity, vendorId } = route.params;
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  const subtotal = product.price * quantity;
  const tax = subtotal * 0.08;
  const shipping = 5.0;
  const total = subtotal + tax + shipping;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter a delivery address');
      return;
    }

    setLoading(true);
    try {
      const customerId = await AsyncStorage.getItem('user_id');
      if (customerId) {
        const order = await apiClient.createOrder(parseInt(customerId), {
          vendor_id: product.vendor_id,
          items: [
            {
              product_id: product.id,
              quantity,
            },
          ],
          delivery_address: deliveryAddress,
          customer_notes: customerNotes || undefined,
        });

        await apiClient.createPayment({
          order_id: order.id.toString(),
          amount: total,
          currency: 'USD',
          customer_email: await AsyncStorage.getItem('user_email') || '',
        });

        Alert.alert('Success', 'Order placed! Redirecting to payment...', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Orders'),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.productSummary}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>
                ${product.price.toFixed(2)} × {quantity} = ${subtotal.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter your full delivery address"
            placeholderTextColor="#999"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            multiline
            numberOfLines={3}
            editable={!loading}
            textAlignVertical="top"
          />
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any special instructions for the vendor"
            placeholderTextColor="#999"
            value={customerNotes}
            onChangeText={setCustomerNotes}
            multiline
            numberOfLines={3}
            editable={!loading}
            textAlignVertical="top"
          />
        </View>

        {/* Promo Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code (Optional)</Text>
          <View style={styles.promoCodeContainer}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter promo code"
              placeholderTextColor="#999"
              value={promoCode}
              onChangeText={setPromoCode}
              editable={!loading}
            />
            <TouchableOpacity style={styles.applyButton} disabled={loading || !promoCode}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>${subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tax (8%)</Text>
            <Text style={styles.priceValue}>${tax.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping</Text>
            <Text style={styles.priceValue}>${shipping.toFixed(2)}</Text>
          </View>

          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <View style={styles.paymentMethod}>
            <Ionicons name="card" size={20} color="#007AFF" />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Credit/Debit Card</Text>
              <Text style={styles.paymentSubtitle}>Powered by Stripe</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Ionicons name="information-circle" size={16} color="#0066cc" />
          <Text style={styles.termsText}>
            By placing this order, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Place Order Button */}
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color="#fff" />
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  productSummary: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  productInfo: {
    gap: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productPrice: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
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
    minHeight: 80,
  },
  promoCodeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#333',
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  paymentSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#0066cc',
    lineHeight: 18,
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
