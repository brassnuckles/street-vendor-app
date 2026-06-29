#!/bin/bash

# Street Vendor App - VPS Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Street Vendor App - VPS Deployment Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Step 1: Update System
echo -e "${YELLOW}Step 1: Updating system...${NC}"
apt update && apt upgrade -y
apt install -y curl git

# Step 2: Install Docker
echo -e "${YELLOW}Step 2: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Step 3: Install Docker Compose
echo -e "${YELLOW}Step 3: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Step 4: Setup Project Directory
echo -e "${YELLOW}Step 4: Setting up project directory...${NC}"
PROJECT_DIR="/opt/street-vendor-app"

if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    git clone https://github.com/brassnuckles/street-vendor-app.git .
    chown -R $SUDO_USER:$SUDO_USER $PROJECT_DIR
    echo -e "${GREEN}✓ Project cloned${NC}"
else
    echo -e "${GREEN}✓ Project directory already exists${NC}"
    cd $PROJECT_DIR
fi

# Step 5: Create .env if it doesn't exist
echo -e "${YELLOW}Step 5: Setting up environment variables...${NC}"
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cat > .env << 'EOF'
# Database Configuration
DB_USER=street_vendor
DB_PASSWORD=change_this_secure_password_123
DB_NAME=street_vendor_db

# JWT Configuration
SECRET_KEY=your_super_secret_key_here_minimum_32_characters

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here

# AWS S3 Configuration (Optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=us-east-1

# Domain Configuration
DOMAIN_NAME=yourdomain.com
CERT_EMAIL=your-email@example.com

# Redis Configuration
REDIS_PASSWORD=your_redis_password_here

# Other Configuration
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF
    echo -e "${YELLOW}⚠ .env file created. Please edit with your credentials:${NC}"
    echo "  nano $PROJECT_DIR/.env"
    exit 0
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Step 6: Create necessary directories
echo -e "${YELLOW}Step 6: Creating necessary directories...${NC}"
mkdir -p postgres_data uploads ssl/live/street-vendor.com ssl/www backups
chmod 700 postgres_data
echo -e "${GREEN}✓ Directories created${NC}"

# Step 7: Configure Firewall
echo -e "${YELLOW}Step 7: Configuring UFW Firewall...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status
echo -e "${GREEN}✓ Firewall configured${NC}"

# Step 8: Start services
echo -e "${YELLOW}Step 8: Starting services...${NC}"
cd $PROJECT_DIR
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 10

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U street_vendor
sleep 5

# Start nginx to serve certbot challenge
docker-compose -f docker-compose.prod.yml up -d nginx

echo -e "${YELLOW}Step 9: Generating SSL Certificate...${NC}"
echo "Starting Certbot to generate SSL certificate..."
docker-compose -f docker-compose.prod.yml run --rm certbot

# Wait a moment for certificate to be written
sleep 5

# Check if certificate was created
if [ -f "ssl/live/street-vendor.com/fullchain.pem" ]; then
    echo -e "${GREEN}✓ SSL certificate generated${NC}"
else
    echo -e "${RED}✗ SSL certificate generation failed${NC}"
    echo "Please run manually:"
    echo "  docker-compose -f docker-compose.prod.yml run --rm certbot"
fi

# Step 10: Start remaining services
echo -e "${YELLOW}Step 10: Starting remaining services...${NC}"
docker-compose -f docker-compose.prod.yml up -d backend redis

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 15

# Step 11: Setup cron jobs for backups and renewal
echo -e "${YELLOW}Step 11: Setting up automated tasks...${NC}"

# Backup script
cat > $PROJECT_DIR/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/street-vendor-app/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/street_vendor_db_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

docker-compose -f /opt/street-vendor-app/docker-compose.prod.yml exec -T postgres pg_dump -U street_vendor street_vendor_db > $BACKUP_FILE
gzip $BACKUP_FILE

find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "[$(date)] Backup completed: $BACKUP_FILE.gz" >> $BACKUP_DIR/backup.log
EOF

chmod +x $PROJECT_DIR/backup_db.sh

# SSL renewal script
cat > $PROJECT_DIR/renew_ssl.sh << 'EOF'
#!/bin/bash
cd /opt/street-vendor-app
docker-compose -f docker-compose.prod.yml run --rm certbot renew
docker-compose -f docker-compose.prod.yml exec -T nginx nginx -s reload
EOF

chmod +x $PROJECT_DIR/renew_ssl.sh

# Add to crontab
(crontab -l 2>/dev/null | grep -v "backup_db.sh"; echo "0 2 * * * /opt/street-vendor-app/backup_db.sh") | crontab -
(crontab -l 2>/dev/null | grep -v "renew_ssl.sh"; echo "0 3 1 * * /opt/street-vendor-app/renew_ssl.sh") | crontab -

echo -e "${GREEN}✓ Automated tasks configured${NC}"

# Step 12: Final checks
echo -e "${YELLOW}Step 12: Running final checks...${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "Access your application at:"
echo -e "  ${YELLOW}https://$(grep DOMAIN_NAME .env | cut -d= -f2)${NC}"
echo ""
echo "API Documentation:"
echo -e "  ${YELLOW}https://$(grep DOMAIN_NAME .env | cut -d= -f2)/docs${NC}"
echo ""
echo "Docker Compose Commands:"
echo "  View logs:        docker-compose -f docker-compose.prod.yml logs -f"
echo "  Stop services:    docker-compose -f docker-compose.prod.yml stop"
echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "  Update code:      cd /opt/street-vendor-app && git pull && docker-compose -f docker-compose.prod.yml build && docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "For more help, see: $PROJECT_DIR/VPS_DEPLOYMENT.md"
echo ""
