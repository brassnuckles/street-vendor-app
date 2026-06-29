# Quick Start: Deploy to VPS with Docker Compose

## 📋 What You Need

- Ubuntu 22.04 VPS (2 CPU, 4GB RAM, 50GB storage minimum)
- Domain name
- Stripe API keys
- SSH access to VPS

---

## 🚀 One-Command Deployment

### Option 1: Automated (Recommended)

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/brassnuckles/street-vendor-app/main/deploy.sh | sudo bash
```

The script will:
- ✅ Install Docker & Docker Compose
- ✅ Clone the project
- ✅ Create configuration files
- ✅ Generate SSL certificates
- ✅ Start all services
- ✅ Setup automated backups & SSL renewal

---

## 📝 Manual Deployment (Step-by-Step)

### Step 1: SSH into VPS
```bash
ssh root@your-vps-ip
apt update && apt upgrade -y
```

### Step 2: Install Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### Step 3: Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 4: Clone Project
```bash
cd /opt
git clone https://github.com/brassnuckles/street-vendor-app.git
cd street-vendor-app
```

### Step 5: Configure Environment
```bash
cat > .env << 'EOF'
# Database
DB_USER=street_vendor
DB_PASSWORD=your_secure_password_here
DB_NAME=street_vendor_db

# JWT
SECRET_KEY=your_secret_key_minimum_32_chars

# Stripe
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key

# Domain
DOMAIN_NAME=yourdomain.com
CERT_EMAIL=your@email.com

# Redis
REDIS_PASSWORD=your_redis_pass
EOF
```

### Step 6: Create Directories
```bash
mkdir -p postgres_data uploads ssl/live/street-vendor.com ssl/www backups
chmod 700 postgres_data
```

### Step 7: Start Services
```bash
# Start database
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 10

# Start nginx for cert generation
docker-compose -f docker-compose.prod.yml up -d nginx

# Generate SSL certificate
docker-compose -f docker-compose.prod.yml run --rm certbot

# Start all services
docker-compose -f docker-compose.prod.yml up -d
```

### Step 8: Verify
```bash
docker-compose -f docker-compose.prod.yml ps
curl https://yourdomain.com/health
```

---

## 🔧 Configuration Files Explained

### `docker-compose.prod.yml`
Production-ready Docker Compose configuration with:
- PostgreSQL database (persistent volume)
- FastAPI backend (4 worker processes)
- Nginx reverse proxy with SSL
- Redis cache
- Certbot for SSL generation
- Health checks and restart policies
- Resource limits for security

### `nginx.conf`
Nginx reverse proxy configuration with:
- SSL/TLS encryption
- Security headers
- Rate limiting (10 req/s general, 5 req/m auth)
- Gzip compression
- Static file caching
- Upstream health checks

### `.env` File
Environment variables for:
- Database credentials
- JWT secret key
- Stripe API keys
- Domain and SSL email
- Redis password
- AWS S3 settings (optional)

---

## 📊 Services Running

```
┌─────────────────────────────────────────┐
│         Your Domain (HTTPS)             │
│         :443 (SSL/TLS)                  │
└────────────────┬────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    ┌────▼─────┐      ┌───▼────┐
    │  Nginx   │      │ Certbot │
    │ :80, 443 │      │ SSL Mgmt│
    └────┬─────┘      └────────┘
         │
    ┌────▼──────────────────────┐
    │   Backend (FastAPI)       │
    │   :8000 (4 workers)       │
    │   - Auth                  │
    │   - Orders                │
    │   - Products              │
    │   - Payments              │
    └────┬──────────┬───────────┘
         │          │
    ┌────▼──┐   ┌───▼──────┐
    │   DB  │   │  Redis   │
    │  PG   │   │  Cache   │
    │ :5432 │   │ :6379    │
    └───────┘   └──────────┘
```

---

## 🔐 Security Features

- ✅ HTTPS/TLS with Let's Encrypt
- ✅ JWT authentication
- ✅ Rate limiting (brute force protection)
- ✅ Nginx security headers
- ✅ Database in isolated network
- ✅ Firewall rules (UFW)
- ✅ Resource limits per container
- ✅ Health checks for automatic recovery

---

## 💾 Backups & Maintenance

### Daily Database Backup
```bash
# View backup script
cat backup_db.sh

# Run manually
./backup_db.sh

# View backups
ls -lh backups/
```

### SSL Certificate Renewal
```bash
# Renew manually
./renew_ssl.sh

# Auto-renewal (runs monthly via cron)
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Stop/Restart
```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

---

## 📈 Accessing Your App

| Service | URL |
|---------|-----|
| **API** | `https://yourdomain.com/api/*` |
| **API Docs** | `https://yourdomain.com/docs` |
| **ReDoc** | `https://yourdomain.com/redoc` |
| **Health Check** | `https://yourdomain.com/health` |
| **Uploads** | `https://yourdomain.com/uploads/` |

---

## 🆘 Troubleshooting

### Check Service Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### View Error Logs
```bash
docker-compose -f docker-compose.prod.yml logs backend | tail -50
```

### Database Connection Issues
```bash
# Check if database is running
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U street_vendor

# Connect to database
docker-compose -f docker-compose.prod.yml exec postgres psql -U street_vendor -d street_vendor_db
```

### Nginx SSL Issues
```bash
# Test SSL certificate
openssl x509 -in ssl/live/yourdomain.com/fullchain.pem -text -noout

# Check Nginx configuration
docker exec street_vendor_nginx nginx -t
```

### Out of Disk Space
```bash
df -h
du -sh uploads/
docker system df
docker system prune -a
```

---

## 📚 More Information

- **Full VPS Guide**: See `VPS_DEPLOYMENT.md` for detailed instructions
- **API Docs**: See `API.md` for endpoint documentation
- **Architecture**: See `ARCHITECTURE.md` for system design
- **Setup Guide**: See `SETUP.md` for development setup

---

## ✅ Deployment Checklist

- [ ] VPS created (Ubuntu 22.04, 2+ CPU, 4GB+ RAM)
- [ ] Domain name pointing to VPS IP
- [ ] SSH key configured
- [ ] Git repository accessible
- [ ] Stripe API keys obtained
- [ ] Deployment script downloaded and executed
- [ ] SSL certificate generated (green padlock)
- [ ] API responding at `/health`
- [ ] Database backup script running
- [ ] SSL auto-renewal configured
- [ ] Firewall rules in place
- [ ] Monitoring and logging verified

---

## 🚨 Emergency Commands

```bash
# View disk usage
du -sh *

# Clear old logs
docker system prune

# Database backup now
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U street_vendor street_vendor_db > emergency_backup.sql

# Restart everything
docker-compose -f docker-compose.prod.yml restart
```

---

## 📞 Support

For issues:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Check status: `docker-compose -f docker-compose.prod.yml ps`
3. Review `VPS_DEPLOYMENT.md` troubleshooting section
4. Check system resources: `docker stats`

