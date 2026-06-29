import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Auth
  async vendorLogin(email: string, password: string) {
    const response = await this.client.post('/vendors/login', { email, password });
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('user_type', 'vendor');
      await AsyncStorage.setItem('user_id', response.data.id.toString());
    }
    return response.data;
  }

  async vendorRegister(data: any) {
    const response = await this.client.post('/vendors/register', data);
    return response.data;
  }

  async customerLogin(email: string, password: string) {
    const response = await this.client.post('/customers/login', { email, password });
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('user_type', 'customer');
      await AsyncStorage.setItem('user_id', response.data.id.toString());
    }
    return response.data;
  }

  async customerRegister(data: any) {
    const response = await this.client.post('/customers/register', data);
    return response.data;
  }

  // Vendors
  async getVendor(vendorId: number) {
    const response = await this.client.get(`/vendors/${vendorId}`);
    return response.data;
  }

  async updateVendor(vendorId: number, data: any) {
    const response = await this.client.put(`/vendors/${vendorId}`, data);
    return response.data;
  }

  async listVendors(latitude?: number, longitude?: number, radiusKm?: number) {
    const params: any = {};
    if (latitude) params.latitude = latitude;
    if (longitude) params.longitude = longitude;
    if (radiusKm) params.radius_km = radiusKm;

    const response = await this.client.get('/vendors', { params });
    return response.data;
  }

  // Products
  async createProduct(vendorId: number, data: any) {
    const response = await this.client.post('/products', { vendor_id: vendorId, ...data });
    return response.data;
  }

  async getProduct(productId: number) {
    const response = await this.client.get(`/products/${productId}`);
    return response.data;
  }

  async updateProduct(productId: number, data: any) {
    const response = await this.client.put(`/products/${productId}`, data);
    return response.data;
  }

  async deleteProduct(productId: number) {
    const response = await this.client.delete(`/products/${productId}`);
    return response.data;
  }

  async getVendorProducts(vendorId: number) {
    const response = await this.client.get(`/products/vendor/${vendorId}`);
    return response.data;
  }

  async listProducts(category?: string) {
    const params: any = {};
    if (category) params.category = category;
    const response = await this.client.get('/products', { params });
    return response.data;
  }

  // Orders
  async createOrder(customerId: number, data: any) {
    const response = await this.client.post('/orders', { customer_id: customerId, ...data });
    return response.data;
  }

  async getOrder(orderId: number) {
    const response = await this.client.get(`/orders/${orderId}`);
    return response.data;
  }

  async getCustomerOrders(customerId: number) {
    const response = await this.client.get(`/orders/customer/${customerId}`);
    return response.data;
  }

  async getVendorOrders(vendorId: number) {
    const response = await this.client.get(`/orders/vendor/${vendorId}`);
    return response.data;
  }

  async updateOrderStatus(orderId: number, status: string) {
    const response = await this.client.put(`/orders/${orderId}/status`, { status });
    return response.data;
  }

  // Payments
  async createPayment(data: any) {
    const response = await this.client.post('/payments', data);
    return response.data;
  }

  async getPayment(paymentId: number) {
    const response = await this.client.get(`/payments/${paymentId}`);
    return response.data;
  }

  async logout() {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user_type');
    await AsyncStorage.removeItem('user_id');
  }
}

export const apiClient = new ApiClient();
