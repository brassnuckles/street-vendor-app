# Street Vendor App - Architecture Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                         │
│  (React Native + Expo - iOS/Android/Web)                   │
│  - Login/Registration                                       │
│  - Browse Products                                          │
│  - Place Orders                                             │
│  - Vendor Dashboard                                         │
│  - Notifications                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────┴──────────────────────────────────────┐
│                    API Gateway / Load Balancer              │
│              (Nginx/ALB in production)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   Backend Layer (FastAPI)                   │
│  ┌────────────────────────────────────────────────┐        │
│  │         Authentication & Authorization         │        │
│  │  - JWT Token Management                        │        │
│  │  - Role-based Access Control                   │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │          Business Logic Routers                │        │
│  │  - /vendors, /products, /orders                │        │
│  │  - /payments, /reviews, /favorites             │        │
│  │  - /notifications, /admin                      │        │
│  └────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────┐        │
│  │         External Service Integration           │        │
│  │  - Stripe Payment Processing                   │        │
│  │  - Expo Push Notifications                     │        │
│  │  - AWS S3 (optional)                           │        │
│  └────────────────────────────────────────────────┘        │
└──────────────────────┬──────────────────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
┌───▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
│PostgreSQL│   │File Storage │   │Redis/Cache │
│Database  │   │  (Local/S3) │   │ (Optional) │
└──────────┘   └─────────────┘   └────────────┘
```

---

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 12+
- **ORM**: SQLAlchemy 2.0
- **Auth**: JWT (python-jose)
- **Validation**: Pydantic
- **Migrations**: Alembic
- **Payments**: Stripe API
- **File Storage**: Local/AWS S3
- **Testing**: Pytest

### Frontend
- **Framework**: React Native + Expo
- **Navigation**: React Navigation v6
- **HTTP Client**: Axios
- **Persistence**: AsyncStorage
- **Location**: Expo Location
- **Notifications**: Expo Notifications
- **Payment**: Stripe React Native

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git
- **CI/CD**: GitHub Actions (optional)

---

## Database Schema

### Core Tables

**vendors**
- id (PK)
- email (UNIQUE)
- business_name, description
- phone, address
- latitude, longitude (for location-based search)
- stripe_account_id
- rating, total_reviews
- status (ACTIVE, INACTIVE, SUSPENDED)
- created_at, updated_at

**products**
- id (PK)
- vendor_id (FK)
- name, description, category
- price, currency
- quantity_available
- images (JSON array)
- is_available
- created_at, updated_at

**customers**
- id (PK)
- email (UNIQUE)
- full_name, phone
- profile_image
- created_at, updated_at

**orders**
- id (PK)
- customer_id (FK), vendor_id (FK)
- status (PENDING, PAID, PROCESSING, COMPLETED, CANCELLED)
- total_amount, currency
- payment_id (FK)
- delivery_address, customer_notes
- created_at, updated_at

**order_items**
- id (PK)
- order_id (FK), product_id (FK)
- quantity, unit_price

**payments**
- id (PK)
- order_id
- stripe_payment_intent_id (UNIQUE)
- amount, currency
- status (PENDING, COMPLETED, FAILED, REFUNDED)
- payment_method
- customer_email
- receipt_url
- created_at, updated_at

**reviews**
- id (PK)
- product_id (FK), vendor_id (FK), customer_id (FK)
- rating, title, comment
- helpful_count
- created_at, updated_at

**favorites**
- id (PK)
- customer_id (FK), product_id (FK)
- created_at

**push_tokens**
- id (PK)
- user_id, user_type
- token (UNIQUE)
- is_active
- created_at, updated_at

**notifications**
- id (PK)
- user_id, user_type
- title, body, data (JSON)
- sent, read
- created_at

---

## API Architecture

### Request Flow

```
1. Client Request (with JWT)
   ↓
2. Authentication Middleware
   - Verify token
   - Extract user info
   ↓
3. Route Handler
   - Input validation (Pydantic)
   - Business logic
   ↓
4. Database Operations (SQLAlchemy)
   - Query/Insert/Update/Delete
   ↓
5. External Services (if needed)
   - Stripe payment
   - Expo notifications
   - S3 upload
   ↓
6. Response (JSON)
   - 2xx Success
   - 4xx Client Error
   - 5xx Server Error
```

### Error Handling

```python
# Global exception handlers
- HTTPException → 400, 401, 403, 404, 500
- ValidationError → 422
- DatabaseError → 500
- ExternalServiceError → 503
```

---

## Authentication Flow

### JWT Token Lifecycle

```
1. Login/Register
   ↓
2. Generate JWT Token
   - Subject: user_id
   - Type: vendor|customer
   - Expiry: 30 minutes
   ↓
3. Client stores token in AsyncStorage
   ↓
4. Each request includes: Authorization: Bearer {token}
   ↓
5. Server validates token
   - Signature verification
   - Expiry check
   - User existence
   ↓
6. Token refresh (if needed)
   - Get new token with /auth/refresh
```

---

## Payment Processing

### Stripe Integration

```
1. Create Order
   ↓
2. Create Payment Intent (Stripe)
   - Amount, currency, metadata
   ↓
3. Client-side card submission
   ↓
4. Stripe webhook confirmation
   - payment_intent.succeeded
   - payment_intent.payment_failed
   ↓
5. Update Order Status
   - PAID or FAILED
   ↓
6. Send Notifications
```

---

## Notification System

### Push Notification Flow

```
1. Mobile app registers push token
   - Expo.getExpoPushTokenAsync()
   - Save to backend
   ↓
2. Event trigger (new order, status change)
   ↓
3. Server sends notification
   - NotificationService.send_push_notification()
   - Stripe webhook → POST /notifications/register-token
   ↓
4. Expo receives and routes to device
   ↓
5. App displays notification
   - Update notification badge
   - Local notification handler
```

---

## Location Services

### Vendor Discovery with GPS

```
1. Get customer location
   - Location.getCurrentPositionAsync()
   ↓
2. Request nearby vendors
   - GET /vendors?latitude=X&longitude=Y&radius_km=10
   ↓
3. Haversine distance calculation
   - Backend calculates distances
   - Filters by radius
   - Sorts by distance
   ↓
4. Display on map
   - Show vendor pins
   - Show distances
```

---

## File Upload & Storage

### Product Image Upload

```
Local Storage (Development):
/uploads/
  ├── products/
  │   ├── abc123def456.jpg
  │   └── xyz789uvw456.jpg
  ├── vendor_profiles/
  └── customer_profiles/

AWS S3 (Production):
s3://bucket-name/
  ├── products/
  ├── vendor_profiles/
  └── customer_profiles/
```

---

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer (ALB/NLB)
    ↓
┌───┴───┬────────┬────────┐
│       │        │        │
API-1  API-2   API-3   API-N
(each with own connection pool)
    ↓
Managed Database (RDS/AWS)
    ↓
S3 (object storage)
    ↓
CloudFront (CDN - optional)
```

### Performance Optimization

1. **Database**
   - Connection pooling
   - Query optimization
   - Indexing strategy
   - Read replicas for scale

2. **Caching**
   - Redis for product listings
   - Browser caching for images
   - API response caching

3. **CDN**
   - CloudFront for image delivery
   - Global edge locations

---

## Security Architecture

### Layers

```
1. HTTPS/TLS
   - All traffic encrypted

2. Authentication
   - JWT tokens
   - Secure password hashing (bcrypt)

3. Authorization
   - Role-based access control
   - Resource-level permissions

4. Input Validation
   - Pydantic schemas
   - SQL injection prevention

5. Rate Limiting
   - Per-IP and per-user limits
   - Prevents brute force

6. CORS
   - Whitelist origins
   - Restrict methods

7. OWASP Top 10
   - SQL injection prevention
   - XSS protection
   - CSRF tokens
```

---

## Monitoring & Logging

### Application Metrics

```
- API Response Times
- Database Query Performance
- Error Rates
- User Activity
- Payment Success Rate
- Notification Delivery Rate
```

### Logging Strategy

```
DEBUG   → Development/detailed tracing
INFO    → Important events (login, order)
WARNING → Potential issues
ERROR   → Failures that need attention
CRITICAL→ System failures
```

---

## Deployment Architecture

### Development
- Local PostgreSQL
- Local file storage
- Docker Compose orchestration

### Staging
- AWS RDS (PostgreSQL)
- AWS S3 (file storage)
- AWS ECS (containers)
- Staging Stripe account

### Production
- AWS RDS Multi-AZ
- AWS S3 with CloudFront
- AWS ECS Auto-scaling
- AWS Lambda (optional webhooks)
- Production Stripe account
- Monitoring: CloudWatch/DataDog

---

## Future Enhancements

1. **Real-time Features**
   - WebSocket for order tracking
   - Live chat between vendor/customer

2. **Machine Learning**
   - Product recommendations
   - Price optimization
   - Fraud detection

3. **Advanced Analytics**
   - Vendor performance dashboard
   - Customer behavior analysis
   - Demand forecasting

4. **Social Features**
   - Vendor profiles/following
   - Community reviews
   - Referral system

5. **International Expansion**
   - Multi-currency support
   - Localization
   - Regional payment methods

