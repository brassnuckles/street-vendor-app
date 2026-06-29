# Street Vendor App - Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Git
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)

## Local Development

### Using Docker Compose

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd street-vendor-app
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Run migrations**
   ```bash
   docker-compose exec backend python manage_db.py migrate
   ```

5. **Access services**
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Database Admin: http://localhost:8080 (adminer)

### Without Docker

#### Backend Setup

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb street_vendor_db
   
   # Run migrations
   python manage_db.py migrate
   ```

4. **Create .env file**
   ```bash
   cp .env.example .env
   # Edit with your settings
   ```

5. **Run backend**
   ```bash
   python app/main.py
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

---

## Production Deployment

### Option 1: Heroku

#### Backend Deployment

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   choco install heroku-cli
   ```

2. **Create Heroku app**
   ```bash
   heroku create street-vendor-api
   heroku addons:create heroku-postgresql:hobby-dev
   ```

3. **Set environment variables**
   ```bash
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set STRIPE_SECRET_KEY=your-stripe-key
   heroku config:set STRIPE_PUBLISHABLE_KEY=your-stripe-pubkey
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

#### Frontend Deployment (Expo)

1. **Publish to Expo**
   ```bash
   cd frontend
   expo publish
   ```

2. **Build standalone app**
   ```bash
   eas build --platform all
   eas submit --platform all
   ```

---

### Option 2: DigitalOcean (Recommended)

#### Using App Platform

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Create App in DigitalOcean Console**
   - Go to Apps → Create App
   - Connect GitHub repository
   - Configure services:

   **Backend Service**
   - Build: `pip install -r backend/requirements.txt`
   - Run: `cd backend && uvicorn app.main:app --host 0.0.0.0`
   - Port: 8000
   - Environment variables from `.env`

   **Database Service**
   - PostgreSQL 15
   - Auto-generate credentials

3. **Configure database**
   - Connection string will be auto-generated
   - Update `DATABASE_URL` in App Platform

4. **Deploy**
   - Trigger deployment in DigitalOcean Console

---

### Option 3: AWS

#### Using ECS + RDS

1. **Create RDS PostgreSQL database**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier street-vendor-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username admin \
     --master-user-password your-password
   ```

2. **Create ECR repository**
   ```bash
   aws ecr create-repository --repository-name street-vendor-api
   ```

3. **Build and push Docker image**
   ```bash
   cd backend
   docker build -t street-vendor-api .
   docker tag street-vendor-api:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/street-vendor-api:latest
   aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<region>.amazonaws.com
   docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/street-vendor-api:latest
   ```

4. **Create ECS Task Definition**
   - Container image: ECR image URL
   - Memory: 512 MB
   - CPU: 256 units
   - Environment variables: Add from `.env`

5. **Create ECS Service**
   - Task definition: street-vendor-api
   - Desired count: 1-3
   - Load balancer: Application Load Balancer
   - Port: 8000

---

## Database Migrations

### Running Migrations

```bash
# Run pending migrations
python manage_db.py migrate

# Rollback last migration
python manage_db.py rollback -1

# Create new migration
python manage_db.py create "Add new feature"

# Check migration status
python manage_db.py status
```

---

## Monitoring & Logging

### Application Logs
```bash
# Docker Compose
docker-compose logs -f backend

# Heroku
heroku logs --tail

# DigitalOcean/AWS
Check via respective console dashboards
```

### Performance Monitoring
- Set up New Relic or Datadog for production
- Monitor database query performance
- Track API response times

---

## Security Checklist

- [ ] Change `SECRET_KEY` in production
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Set up security headers
- [ ] Regular security audits

---

## Backup & Recovery

### Database Backups
```bash
# PostgreSQL backup
pg_dump street_vendor_db > backup.sql

# Restore
psql street_vendor_db < backup.sql
```

### Cloud Backups
- Heroku: Automatic daily backups
- DigitalOcean: Snapshots via console
- AWS: RDS automated backups (retention: 7 days)

---

## Scaling

### Horizontal Scaling
1. Use load balancer (ALB, NLB)
2. Deploy multiple backend instances
3. Use managed database service

### Vertical Scaling
- Increase instance size
- Upgrade database tier
- Add caching layer (Redis)

---

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql -h <host> -U <user> -d street_vendor_db
```

### Migration Failures
```bash
# Check current migration
python manage_db.py status

# Rollback problematic migration
python manage_db.py rollback -1
```

### API Not Responding
- Check logs: `docker-compose logs backend`
- Verify environment variables are set
- Check database connectivity
- Verify Stripe keys are valid

---

## Support

For issues or questions:
1. Check application logs
2. Review API documentation at `/docs`
3. Check GitHub Issues
4. Contact support

