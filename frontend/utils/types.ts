export interface Vendor {
  id: number;
  email: string;
  business_name: string;
  phone: string;
  description?: string;
  profile_image?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  rating: number;
  total_reviews: number;
  created_at: string;
}

export interface Product {
  id: number;
  vendor_id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  currency: string;
  quantity_available: number;
  images: string[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  profile_image?: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  customer_id: number;
  vendor_id: number;
  status: string;
  total_amount: number;
  currency: string;
  payment_id?: string;
  delivery_address?: string;
  customer_notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  userType: 'vendor' | 'customer' | null;
  userId?: number;
  token?: string;
}
