# Street Vendor App

A mobile marketplace platform for street vendors to post and sell their products with location-based discovery and integrated payments.

## Features

- **Vendor Management**: Register, manage store profile and location
- **Product Listings**: Add products with photos, descriptions, and pricing
- **GPS Location**: Vendors broadcast their location; customers find them nearby
- **Customer Marketplace**: Browse vendors by location, view products, and place orders
- **Payment Integration**: Secure Stripe payment processing
- **Order Management**: Track orders, manage fulfillment
- **Admin Dashboard**: Monitor vendors, manage disputes

## Tech Stack

- **Backend**: FastAPI + PostgreSQL
- **Frontend**: React Native (Expo) + TypeScript
- **Payments**: Stripe API
- **Maps**: Location-based services

## Project Structure

```
street-vendor-app/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # API endpoints
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Database connection
│   │   └── main.py          # FastAPI app
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
└── frontend/
    ├── screens/             # Screen components
    ├── components/          # Reusable components
    ├── utils/               # Helper functions
    ├── app.json             # Expo configuration
    ├── app.tsx              # Main app entry
    └── package.json
```

## Getting Started

### Backend Setup

1. **Create virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and Stripe keys
   ```

4. **Set up PostgreSQL database**:
   ```bash
   createdb street_vendor_db
   ```

5. **Run migrations and start server**:
   ```bash
   python app/main.py
   ```
   API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Expo development server**:
   ```bash
   npm start
   ```

3. **Run on device or emulator**:
   - Android: `npm run android`
   - iOS: `npm run ios`
   - Web: `npm run web`

## API Endpoints

### Vendors
- `POST /api/vendors/register` - Register vendor
- `POST /api/vendors/login` - Vendor login
- `GET /api/vendors/{vendor_id}` - Get vendor profile
- `PUT /api/vendors/{vendor_id}` - Update vendor profile
- `GET /api/vendors` - List vendors (with location filtering)

### Products
- `POST /api/products` - Create product
- `GET /api/products/{product_id}` - Get product
- `PUT /api/products/{product_id}` - Update product
- `DELETE /api/products/{product_id}` - Delete product
- `GET /api/products/vendor/{vendor_id}` - List vendor products
- `GET /api/products` - List all products (with filtering)

### Customers
- `POST /api/customers/register` - Register customer
- `POST /api/customers/login` - Customer login
- `GET /api/customers/{customer_id}` - Get profile
- `PUT /api/customers/{customer_id}` - Update profile

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/{order_id}` - Get order
- `GET /api/orders/customer/{customer_id}` - Get customer orders
- `GET /api/orders/vendor/{vendor_id}` - Get vendor orders
- `PUT /api/orders/{order_id}/status` - Update order status

### Payments
- `POST /api/payments` - Create payment intent
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/{payment_id}` - Get payment
- `GET /api/payments/order/{order_id}` - Get payment by order

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```
DATABASE_URL=postgresql://user:password@localhost:5432/street_vendor_db
SECRET_KEY=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Next Steps

1. Implement JWT authentication
2. Add image upload to S3/CloudStorage
3. Build out screen components (login, vendor dashboard, product listing)
4. Implement location tracking and geospatial queries
5. Add order notifications (push notifications)
6. Set up admin dashboard
7. Add review/rating system

## License

MIT
