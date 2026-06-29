# Street Vendor API Documentation

## Base URL

```
http://localhost:8000/api
```

Production: Update host in environment

## Authentication

All endpoints except login/register require Bearer token in Authorization header:

```
Authorization: Bearer {access_token}
```

---

## Endpoints

### Authentication

#### Register Vendor
```
POST /vendors/register

{
  "email": "vendor@example.com",
  "password": "securepassword123",
  "business_name": "John's Fresh Produce",
  "phone": "+1-555-0123",
  "description": "Fresh fruits and vegetables"
}

Response: 200
{
  "id": 1,
  "email": "vendor@example.com",
  "business_name": "John's Fresh Produce",
  "status": "ACTIVE",
  "rating": 5.0,
  "created_at": "2026-06-29T10:00:00"
}
```

#### Login Vendor
```
POST /vendors/login

{
  "email": "vendor@example.com",
  "password": "securepassword123"
}

Response: 200
{
  "id": 1,
  "email": "vendor@example.com",
  "business_name": "John's Fresh Produce",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

#### Register Customer
```
POST /customers/register

{
  "email": "customer@example.com",
  "password": "securepassword123",
  "full_name": "Jane Smith",
  "phone": "+1-555-0456"
}

Response: 200
{
  "id": 1,
  "email": "customer@example.com",
  "full_name": "Jane Smith",
  "created_at": "2026-06-29T10:00:00"
}
```

---

### Vendors

#### Get Vendor Profile
```
GET /vendors/{vendor_id}

Response: 200
{
  "id": 1,
  "business_name": "John's Fresh Produce",
  "email": "vendor@example.com",
  "phone": "+1-555-0123",
  "rating": 4.8,
  "total_reviews": 45,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "123 Main St, New York, NY"
}
```

#### Update Vendor Profile
```
PUT /vendors/{vendor_id}
Authorization: Bearer {access_token}

{
  "business_name": "Updated Business Name",
  "description": "Updated description",
  "phone": "+1-555-0789",
  "latitude": 40.7150,
  "longitude": -74.0050,
  "address": "456 Park Ave, New York, NY"
}

Response: 200
```

#### List Vendors (with location filter)
```
GET /vendors?latitude=40.7128&longitude=-74.0060&radius_km=10

Response: 200
[
  {
    "id": 1,
    "business_name": "John's Fresh Produce",
    "rating": 4.8,
    "distance": 0.5
  }
]
```

---

### Products

#### Create Product
```
POST /products
Authorization: Bearer {access_token}

{
  "vendor_id": 1,
  "name": "Fresh Mango",
  "description": "Delicious fresh mango from local farm",
  "category": "Fruits",
  "price": 5.99,
  "quantity_available": 20,
  "images": ["http://example.com/image1.jpg"]
}

Response: 200
{
  "id": 1,
  "vendor_id": 1,
  "name": "Fresh Mango",
  "price": 5.99,
  "quantity_available": 20,
  "is_available": true
}
```

#### Get Product
```
GET /products/{product_id}

Response: 200
{
  "id": 1,
  "name": "Fresh Mango",
  "category": "Fruits",
  "price": 5.99,
  "description": "Delicious fresh mango from local farm",
  "images": ["http://example.com/image1.jpg"],
  "is_available": true,
  "quantity_available": 20
}
```

#### Update Product
```
PUT /products/{product_id}
Authorization: Bearer {access_token}

{
  "name": "Premium Fresh Mango",
  "price": 6.99,
  "quantity_available": 15,
  "is_available": true
}

Response: 200
```

#### Delete Product
```
DELETE /products/{product_id}
Authorization: Bearer {access_token}

Response: 200
{"message": "Product deleted successfully"}
```

#### List Vendor Products
```
GET /products/vendor/{vendor_id}?skip=0&limit=20

Response: 200
[
  {
    "id": 1,
    "name": "Fresh Mango",
    "price": 5.99
  }
]
```

#### List All Products
```
GET /products?category=Fruits&skip=0&limit=20

Response: 200
[
  {
    "id": 1,
    "name": "Fresh Mango",
    "category": "Fruits",
    "price": 5.99
  }
]
```

---

### Orders

#### Create Order
```
POST /orders
Authorization: Bearer {access_token}

{
  "customer_id": 1,
  "vendor_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ],
  "delivery_address": "123 Customer St, New York, NY",
  "customer_notes": "Please deliver after 5 PM"
}

Response: 200
{
  "id": 1,
  "customer_id": 1,
  "vendor_id": 1,
  "status": "PENDING",
  "total_amount": 11.98,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 5.99
    }
  ]
}
```

#### Get Order
```
GET /orders/{order_id}

Response: 200
{
  "id": 1,
  "status": "PENDING",
  "total_amount": 11.98,
  "delivery_address": "123 Customer St, New York, NY",
  "items": [...]
}
```

#### Update Order Status
```
PUT /orders/{order_id}/status
Authorization: Bearer {access_token}

{
  "status": "PROCESSING"
}

Response: 200
```

#### Get Customer Orders
```
GET /orders/customer/{customer_id}?skip=0&limit=10

Response: 200
[
  {
    "id": 1,
    "status": "COMPLETED",
    "total_amount": 11.98
  }
]
```

---

### Payments

#### Create Payment Intent
```
POST /payments
Authorization: Bearer {access_token}

{
  "order_id": "1",
  "amount": 11.98,
  "currency": "USD",
  "customer_email": "customer@example.com"
}

Response: 200
{
  "id": 1,
  "order_id": "1",
  "stripe_payment_intent_id": "pi_1234567890",
  "status": "pending",
  "amount": 11.98,
  "client_secret": "pi_1234567890_secret_1234567890"
}
```

#### Get Payment
```
GET /payments/{payment_id}

Response: 200
{
  "id": 1,
  "order_id": "1",
  "status": "completed",
  "amount": 11.98,
  "receipt_url": "https://stripe.com/receipt"
}
```

---

### Reviews

#### Create Review
```
POST /reviews
Authorization: Bearer {access_token}

{
  "product_id": 1,
  "rating": 4.5,
  "title": "Great quality mango!",
  "comment": "Very fresh and delicious. Highly recommend!"
}

Response: 200
{
  "id": 1,
  "product_id": 1,
  "rating": 4.5,
  "title": "Great quality mango!",
  "comment": "Very fresh and delicious. Highly recommend!",
  "helpful_count": 0
}
```

#### Get Product Reviews
```
GET /reviews/product/{product_id}

Response: 200
[
  {
    "id": 1,
    "rating": 4.5,
    "title": "Great quality mango!",
    "customer_id": 1
  }
]
```

---

### Favorites

#### Add to Favorites
```
POST /favorites/{product_id}
Authorization: Bearer {access_token}

Response: 200
{"message": "Added to favorites"}
```

#### Remove from Favorites
```
DELETE /favorites/{product_id}
Authorization: Bearer {access_token}

Response: 200
{"message": "Removed from favorites"}
```

#### Get Favorite Products
```
GET /favorites
Authorization: Bearer {access_token}

Response: 200
[
  {
    "id": 1,
    "name": "Fresh Mango",
    "price": 5.99
  }
]
```

#### Check if Product is Favorite
```
GET /favorites/{product_id}/is-favorite
Authorization: Bearer {access_token}

Response: 200
{"is_favorite": true}
```

---

### Notifications

#### Register Push Token
```
POST /notifications/register-token
Authorization: Bearer {access_token}

{
  "token": "ExponentPushToken[abc123def456]"
}

Response: 200
{"message": "Token registered successfully"}
```

#### Get Notifications
```
GET /notifications
Authorization: Bearer {access_token}

Response: 200
[
  {
    "id": 1,
    "title": "New Order",
    "body": "You have a new order #1",
    "read": false,
    "created_at": "2026-06-29T10:00:00"
  }
]
```

#### Mark as Read
```
PUT /notifications/{notification_id}/read
Authorization: Bearer {access_token}

Response: 200
```

---

### File Uploads

#### Upload Product Image
```
POST /uploads/products
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: <image_file>

Response: 200
{
  "url": "/uploads/products/abc123def456.jpg",
  "filename": "abc123def456.jpg"
}
```

#### Upload Profile Image
```
POST /uploads/profiles
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: <image_file>

Response: 200
{
  "url": "/uploads/customer_profiles/abc123def456.jpg",
  "filename": "abc123def456.jpg"
}
```

---

### Admin

#### Get Dashboard Stats
```
GET /admin/stats
Authorization: Bearer {access_token}

Response: 200
{
  "total_vendors": 100,
  "total_customers": 500,
  "total_orders": 1500,
  "total_products": 2000,
  "recent_orders_7d": 150,
  "revenue_7d": 5000.00,
  "avg_order_value": 35.00
}
```

#### List Vendors (Admin)
```
GET /admin/vendors?skip=0&limit=10&status=ACTIVE

Response: 200
{
  "total": 100,
  "vendors": [...]
}
```

#### Update Vendor Status
```
PUT /admin/vendors/{vendor_id}/status
Authorization: Bearer {access_token}

{
  "new_status": "SUSPENDED"
}

Response: 200
```

---

## Error Responses

### 400 Bad Request
```
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```
{
  "detail": "Invalid credentials"
}
```

### 403 Forbidden
```
{
  "detail": "Access denied"
}
```

### 404 Not Found
```
{
  "detail": "Resource not found"
}
```

### 500 Server Error
```
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user

---

## Webhooks

### Stripe Webhook
```
POST /api/payments/webhook

Events:
- payment_intent.succeeded
- payment_intent.payment_failed
```

---

## API Documentation

Interactive API docs available at: `/docs` (Swagger UI)
Alternative docs: `/redoc` (ReDoc)

