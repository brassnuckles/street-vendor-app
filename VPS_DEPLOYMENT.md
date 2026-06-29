# Street Vendor App - VPS Deployment Guide

## Prerequisites

- VPS with Ubuntu 22.04 LTS (minimum 2 CPU, 4GB RAM, 50GB storage)
- Docker & Docker Compose installed
- Domain name pointing to VPS IP
- SSL certificate (will be generated with Let's Encrypt)
- Git installed

---

## Step 1: VPS Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 1.3 Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 1.4 Install Git
```bash
sudo apt install -y git
```

---

## Step 2: Clone & Setup Project

### 2.1 Clone Repository
```bash
cd /opt
sudo git clone https://github.com/brassnuckles/street-vendor-app.git
sudo chown -R $USER:$USER street-vendor-app
cd street-vendor-app
```

### 2.2 Create .env File
```bash
cat > .env << 'EOF'
# Database
DB_USER=street_vendor
DB_PASSWORD=generate_secure_password_here
DB_NAME=street_vendor_db

# JWT
SECRET_KEY=your-super-secret-key-here-min-32-chars

# Stripe
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# SSL/Domain
DOMAIN_NAME=yourdomain.com
CERT_EMAIL=your-email@example.com

# Redis
REDIS_PASSWORD=your_redis_password

# Other
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF
```

### 2.3 Create SSL Directory
```bash
mkdir -p ssl/live/street-vendor.com
mkdir -p ssl/www
```

---

## Step 3: Database Setup

### 3.1 Create Database Directory
```bash
mkdir -p postgres_data
chmod 700 postgres_data
```

### 3.2 Initialize Database
```bash
docker-compose -f docker-compose.prod.yml up -d postgres
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U street_vendor
```

---

## Step 4: SSL Certificate Setup

### 4.1 Generate SSL Certificate
```bash
# Start nginx to serve challenge
docker-compose -f docker-compose.prod.yml up -d nginx

# Generate certificate
docker-compose -f docker-compose.prod.yml run --rm certbot

# Wait for completion, then stop nginx
docker-compose -f docker-compose.prod.yml down
```

### 4.2 Verify Certificate
```bash
ls -la ssl/live/street-vendor.com/
```

---

## Step 5: Start All Services

### 5.1 Launch Full Stack
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 5.2 Check Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 5.3 Verify Services
```bash
# Check running containers
docker-compose -f docker-compose.prod.yml ps

# Health check
curl https://yourdomain.com/health
curl https://yourdomain.com/docs
```

---

## Step 6: Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check rules
sudo ufw status
```

---

## Step 7: Setup Monitoring & Logging

### 7.1 View Logs
```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs backend --tail=100

# Database logs
docker-compose -f docker-compose.prod.yml logs postgres --tail=50

# Nginx logs
docker logs street_vendor_nginx
```

### 7.2 Setup Log Rotation
```bash
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker
```

---

## Step 8: Database Backups

### 8.1 Create Backup Script
```bash
cat > backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/street-vendor-app/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/street_vendor_db_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

# Create backup
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U street_vendor street_vendor_db > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF

chmod +x backup_db.sh
```

### 8.2 Schedule Daily Backups
```bash
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/street-vendor-app/backup_db.sh") | crontab -
```

---

## Step 9: SSL Certificate Renewal

### 9.1 Auto-Renewal Script
```bash
cat > renew_ssl.sh << 'EOF'
#!/bin/bash
cd /opt/street-vendor-app
docker-compose -f docker-compose.prod.yml run --rm certbot renew
docker-compose -f docker-compose.prod.yml exec -T nginx nginx -s reload
EOF

chmod +x renew_ssl.sh
```

### 9.2 Schedule Monthly Renewal
```bash
(crontab -l 2>/dev/null; echo "0 3 1 * * /opt/street-vendor-app/renew_ssl.sh") | crontab -
```

---

## Step 10: Environment Monitoring

### 10.1 Check Disk Space
```bash
df -h
```

### 10.2 Check Memory Usage
```bash
docker stats
```

### 10.3 Monitor Docker Compose
```bash
watch docker-compose -f docker-compose.prod.yml ps
```

---

## Maintenance Commands

### Update Application
```bash
cd /opt/street-vendor-app
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Restart Services
```bash
# All services
docker-compose -f docker-compose.prod.yml restart

# Specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### View Database
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U street_vendor -d street_vendor_db
```

### Clear Logs
```bash
docker system prune -f
```

### Emergency Stop
```bash
docker-compose -f docker-compose.prod.yml down
```

---

## Troubleshooting

### Backend Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check database connection
docker-compose -f docker-compose.prod.yml exec backend python -c "from app.database import engine; print('DB connected')"

# Reset database
docker-compose -f docker-compose.prod.yml down
docker volume rm street-vendor-app_postgres_data
docker-compose -f docker-compose.prod.yml up -d postgres
```

### Nginx SSL Issues
```bash
# Check certificate
openssl x509 -in ssl/live/street-vendor.com/fullchain.pem -text -noout

# Test SSL
curl -v https://yourdomain.com
```

### Database Backup Issues
```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U street_vendor street_vendor_db > backup.sql

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U street_vendor street_vendor_db < backup.sql
```

### Out of Disk Space
```bash
# Clean docker
docker system prune -a

# Check uploads
du -sh uploads/

# Archive old uploads
tar -czf uploads_archive_$(date +%Y%m%d).tar.gz uploads/
rm -rf uploads/*
```

---

## Production Checklist

- [ ] Domain name pointing to VPS IP
- [ ] SSL certificate generated and verified
- [ ] Firewall configured (allow 80, 443, deny others)
- [ ] Environment variables configured in `.env`
- [ ] Database backup script running daily
- [ ] SSL renewal automated
- [ ] Monitoring alerts setup
- [ ] Logs are being rotated
- [ ] Regular backups tested and working
- [ ] Application accessible at https://yourdomain.com
- [ ] API docs available at https://yourdomain.com/docs

---

## Performance Tuning

### PostgreSQL Optimization
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U street_vendor -d street_vendor_db
```

```sql
-- Analyze query performance
ANALYZE;

-- Check index usage
SELECT * FROM pg_stat_user_indexes;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Redis Cache
```bash
docker-compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD
> INFO stats
> DBSIZE
> FLUSHDB  # Only if needed
```

---

## Security Hardening

### 1. SSH Key Authentication
```bash
# Disable password login
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 2. Fail2Ban Installation
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### 3. Keep System Updated
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Getting Help

For issues, check:
1. Application logs: `docker-compose -f docker-compose.prod.yml logs`
2. System logs: `sudo journalctl -u docker -f`
3. Nginx logs: `/var/log/nginx/error.log`
4. Documentation: `API.md`, `DEPLOYMENT.md`

