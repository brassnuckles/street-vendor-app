# Street Vendor App - Setup Guide

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 12+
- Git
- Expo CLI (for mobile)

### 5-Minute Setup (with Docker)

1. **Clone & Enter Directory**
   ```bash
   git clone <repo-url>
   cd street-vendor-app
   ```

2. **Create Environment File**
   ```bash
   cp .env.example .env
   # Edit .env with your Stripe keys (optional for testing)
   ```

3. **Start Services**
   ```bash
   docker-compose up -d
   ```

4. **Run Migrations**
   ```bash
   docker-compose exec backend python manage_db.py migrate
   ```

5. **Access Services**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - DB Admin: http://localhost:8080

---

## Manual Setup

### Backend Setup

1. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **PostgreSQL Database**
   ```bash
   # Create database
   createdb street_vendor_db
   
   # Connect as postgres user
   psql -U postgres -d street_vendor_db
   ```

4. **Environment Configuration**
   ```bash
   cd ..
   cp .env.example .env
   
   # Edit .env with:
   DATABASE_URL=postgresql://username:password@localhost:5432/street_vendor_db
   SECRET_KEY=your-super-secret-key-here
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key
   ```

5. **Run Migrations**
   ```bash
   cd backend
   python manage_db.py migrate
   ```

6. **Start Backend Server**
   ```bash
   python app/main.py
   ```
   
   Server runs at: http://localhost:8000

---

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Update app.json with your Expo project ID
   # Expo Project ID is from: https://expo.dev/projects
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Run on Device/Emulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# With coverage
pytest --cov=app

# Specific test
pytest tests/test_vendors.py -v

# Using test runner script
bash run_tests.sh
```

### Frontend Tests

```bash
cd frontend

# Run tests (if configured)
npm test

# With coverage
npm test -- --coverage
```

---

## Database Migrations

### Create New Migration

```bash
cd backend
python manage_db.py create "Add new feature"
```

### Apply Migrations

```bash
python manage_db.py migrate
```

### Rollback

```bash
# Last migration
python manage_db.py rollback -1

# To specific revision
python manage_db.py rollback revision_name
```

### Check Status

```bash
python manage_db.py status
```

---

## Configuration

### Environment Variables

Essential variables in `.env`:

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/street_vendor_db

# JWT
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
```

### Optional: AWS S3 Configuration

For production image storage:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_REGION=us-east-1
```

---

## Development Workflow

### 1. Backend Development

```bash
cd backend
source venv/bin/activate

# Make changes to app code

# Run tests
pytest

# Start server
python app/main.py
```

### 2. Frontend Development

```bash
cd frontend

# Start Expo server
npm start

# Scan QR code or press 'i'/'a' to run on simulator
```

### 3. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
# Make changes
git add .
git commit -m "feat: Add your feature"
git push origin feature/your-feature-name
```

---

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U postgres

# Verify DATABASE_URL in .env
# Format: postgresql://username:password@host:port/database
```

### Port Already in Use

```bash
# Change port in .env
SERVER_PORT=8001

# Or kill process using port
lsof -i :8000  # Find process ID
kill -9 <PID>  # Kill process
```

### Migration Errors

```bash
# Check current status
python manage_db.py status

# Rollback and retry
python manage_db.py rollback -1
python manage_db.py migrate
```

### Module Not Found

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Expo/React Native Issues

```bash
# Clear cache
cd frontend
npm start -c

# Reinstall dependencies
rm -rf node_modules
npm install

# Clear Expo cache
rm -rf .expo
```

---

## First Run Checklist

- [ ] Clone repository
- [ ] Create virtual environment
- [ ] Install backend dependencies
- [ ] Install frontend dependencies
- [ ] Copy .env.example to .env
- [ ] Configure database
- [ ] Run migrations
- [ ] Start backend server
- [ ] Start frontend dev server
- [ ] Test API at http://localhost:8000/docs
- [ ] Test app on device/simulator

---

## Next Steps

1. **Create Vendor Account** - Register at http://localhost:8000
2. **Add Products** - Upload images and create listings
3. **Test Purchases** - Create orders and test payment flow
4. **Monitor** - Check API logs and database

---

## Documentation

- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Architecture](ARCHITECTURE.md)
- [Contributing](CONTRIBUTING.md)

