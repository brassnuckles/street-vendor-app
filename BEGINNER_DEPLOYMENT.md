# Street Vendor App - Beginner's Deployment Guide

**This guide assumes you have ZERO experience with VPS deployment. We'll go step by step.**

---

## 📚 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: Get Your VPS](#part-1-get-your-vps)
3. [Part 2: Connect to VPS](#part-2-connect-to-vps)
4. [Part 3: Install Docker](#part-3-install-docker)
5. [Part 4: Setup Your App](#part-4-setup-your-app)
6. [Part 5: Configure Environment](#part-5-configure-environment)
7. [Part 6: Start Services](#part-6-start-services)
8. [Part 7: Setup Domain](#part-7-setup-domain)
9. [Part 8: Get SSL Certificate](#part-8-get-ssl-certificate)
10. [Part 9: Verify Everything Works](#part-9-verify-everything-works)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, you need:

1. **A VPS** (Virtual Private Server)
   - Recommended: DigitalOcean, Linode, or Vultr
   - Minimum specs: Ubuntu 22.04, 2GB RAM, 2 CPU cores, 50GB storage
   - Cost: ~$6-12/month

2. **A Domain Name**
   - Recommended: Namecheap, GoDaddy, or Google Domains
   - Cost: ~$10-15/year

3. **Stripe Account** (for payments)
   - Go to: https://dashboard.stripe.com
   - Get your API keys (we'll use these later)

4. **Git Account** (optional but recommended)
   - For storing your code

---

## PART 1: Get Your VPS

### Step 1.1: Choose a VPS Provider

**DigitalOcean (Easiest for beginners):**
1. Go to https://digitalocean.com
2. Sign up with your email
3. Click "Create" → "Droplets"
4. Choose:
   - Region: Pick closest to you
   - Operating System: **Ubuntu 22.04 LTS**
   - Plan: **$6/month Basic** (enough for testing)
   - Hostname: `street-vendor-app`
5. Click "Create Droplet"
6. Wait 2-3 minutes for it to boot

**You should see:**
- A droplet running Ubuntu 22.04
- An IP address (like `192.168.1.100`)

---

## PART 2: Connect to VPS

### Step 2.1: Get Terminal Access

**On Windows:**
1. Download PuTTY: https://www.putty.org/
2. Open PuTTY
3. Paste your VPS IP in "Host Name"
4. Click "Open"
5. Username: `root`
6. Password: Check your email from DigitalOcean

**On Mac/Linux:**
```bash
ssh root@your_vps_ip_address
# Enter password when prompted
```

**You should see:**
```
Welcome to Ubuntu 22.04
root@street-vendor-app:~#
```

✅ **Checkpoint:** You're now inside your VPS!

---

## PART 3: Install Docker

### Step 3.1: Copy-Paste This Command

Paste this entire command into your terminal:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
```

**Wait for it to finish** (takes 2-3 minutes).

You should see:
```
Successfully added user docker to group docker.
```

### Step 3.2: Install Docker Compose

Paste this command:

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3.3: Verify Installation

Type this to check both installed correctly:

```bash
docker --version && docker-compose --version
```

You should see version numbers like:
```
Docker version 24.0.0
Docker Compose version 2.20.0
```

✅ **Checkpoint:** Docker is installed!

---

## PART 4: Setup Your App

### Step 4.1: Create Project Directory

Type these commands one by one:

```bash
cd /opt
git clone https://github.com/yourusername/street-vendor-app.git
cd street-vendor-app
```

If git clone doesn't work, instead do:

```bash
apt install -y git
git clone https://github.com/yourusername/street-vendor-app.git
cd street-vendor-app
```

### Step 4.2: Create Necessary Directories

```bash
mkdir -p postgres_data
mkdir -p uploads
mkdir -p ssl/live/street-vendor.com
mkdir -p ssl/www
mkdir -p backups
chmod 700 postgres_data
```

✅ **Checkpoint:** Project structure is ready!

---

## PART 5: Configure Environment

### Step 5.1: Create .env File

This file contains all your secrets. **Do this carefully.**

Type:

```bash
cat > .env << 'EOF'
# Database Configuration
DB_USER=street_vendor
DB_PASSWORD=ChangeThis123!SuperSecure
DB_NAME=street_vendor_db

# JWT Secret (use a random string)
SECRET_KEY=your-secret-key-must-be-at-least-32-characters-long-change-this

# Stripe Keys (get from https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Domain and Email
DOMAIN_NAME=yourdomain.com
CERT_EMAIL=youremail@gmail.com

# Redis Password
REDIS_PASSWORD=ChangeThis456!AlsoSecure

# Other Settings (leave as-is)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
AWS_REGION=us-east-1
EOF
```

**Then press ENTER**

### Step 5.2: Edit the .env File

**IMPORTANT:** Edit these values with your actual information:

```bash
nano .env
```

You'll see a text editor. Edit:
1. `DB_PASSWORD` - Change to a secure password
2. `SECRET_KEY` - Generate a random string (minimum 32 chars)
3. `STRIPE_SECRET_KEY` - Paste your Stripe secret key
4. `STRIPE_PUBLISHABLE_KEY` - Paste your Stripe publishable key  
5. `DOMAIN_NAME` - Your domain (e.g., `vendor.example.com`)
6. `CERT_EMAIL` - Your email for SSL notifications
7. `REDIS_PASSWORD` - Change to a secure password

**To save:**
- Press `Ctrl + X`
- Type `y` and press Enter
- Press Enter again

✅ **Checkpoint:** Configuration is set!

---

## PART 6: Start Services

### Step 6.1: Start the Database

Type:

```bash
docker-compose -f docker-compose.prod.yml up -d postgres
```

**Wait 10 seconds**

Check if it started:

```bash
docker-compose -f docker-compose.prod.yml ps
```

You should see `postgres` with status `Up`

### Step 6.2: Start the Web Server

Type:

```bash
docker-compose -f docker-compose.prod.yml up -d nginx
```

Check status:

```bash
docker-compose -f docker-compose.prod.yml ps
```

You should see both `postgres` and `nginx` running

✅ **Checkpoint:** Services are running!

---

## PART 7: Setup Domain

### Step 7.1: Point Domain to VPS

1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Find "DNS" or "Nameservers" settings
3. Create an **A Record**:
   - Name: `@` (or leave blank)
   - Type: `A`
   - Value: Your VPS IP address
   - TTL: 3600

4. Create a **CNAME Record** (for www):
   - Name: `www`
   - Type: `CNAME`
   - Value: `yourdomain.com`
   - TTL: 3600

**Wait 5-10 minutes** for DNS to update.

### Step 7.2: Verify Domain Points to VPS

Type:

```bash
nslookup yourdomain.com
```

You should see your VPS IP address.

✅ **Checkpoint:** Domain is configured!

---

## PART 8: Get SSL Certificate

### Step 8.1: Generate Certificate

Type:

```bash
docker-compose -f docker-compose.prod.yml run --rm certbot
```

**Follow the prompts:**
- Enter your email
- Type `y` to agree to terms
- Type `n` if asked about sharing email

**Wait 1-2 minutes**

You should see:
```
Successfully received certificate
Certificate is saved at /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

### Step 8.2: Verify Certificate

Type:

```bash
ls -la ssl/live/street-vendor.com/
```

You should see files like `fullchain.pem` and `privkey.pem`

✅ **Checkpoint:** SSL certificate is installed!

---

## PART 9: Start Backend & Redis

### Step 9.1: Start All Remaining Services

Type:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Step 9.2: Check Everything is Running

Type:

```bash
docker-compose -f docker-compose.prod.yml ps
```

You should see:
```
NAME                STATUS
postgres           Up (healthy)
backend            Up (healthy)
nginx              Up (healthy)
redis              Up (healthy)
```

✅ **Checkpoint:** All services are running!

---

## PART 10: Verify Everything Works

### Step 10.1: Check API Health

Type:

```bash
curl https://yourdomain.com/health
```

You should see:
```
{"status":"healthy","service":"street-vendor-api"}
```

### Step 10.2: View Logs

Check if backend started correctly:

```bash
docker-compose -f docker-compose.prod.yml logs backend | tail -20
```

Look for:
```
Application startup complete
```

### Step 10.3: Access Your App

Open your browser and go to:
- **API Docs:** `https://yourdomain.com/docs`
- **API:** `https://yourdomain.com/api/vendors/`

You should see:
- Green padlock (secure connection)
- API documentation page
- No errors

✅ **Checkpoint:** Your app is LIVE!

---

## Setup Automated Backups

### Create Backup Script

Type:

```bash
cat > /opt/street-vendor-app/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/street-vendor-app/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

docker-compose -f /opt/street-vendor-app/docker-compose.prod.yml exec -T postgres pg_dump -U street_vendor street_vendor_db | gzip > $BACKUP_FILE

echo "Backup created: $BACKUP_FILE"
EOF

chmod +x /opt/street-vendor-app/backup.sh
```

### Schedule Daily Backup

Type:

```bash
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/street-vendor-app/backup.sh") | crontab -
```

This runs backup at 2 AM every day.

---

## Common Commands Reference

**Save these for later:**

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Stop all services
docker-compose -f docker-compose.prod.yml stop

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Manually backup database
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U street_vendor street_vendor_db > backup.sql

# View database
docker-compose -f docker-compose.prod.yml exec postgres psql -U street_vendor -d street_vendor_db

# Update code and restart
cd /opt/street-vendor-app
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Problem: "Connection refused"

**Solution:**
```bash
docker-compose -f docker-compose.prod.yml ps
# Check if services are running. If not:
docker-compose -f docker-compose.prod.yml logs backend
```

### Problem: "Certificate error"

**Solution:**
```bash
# Check certificate exists
ls -la ssl/live/street-vendor.com/

# If missing, regenerate:
docker-compose -f docker-compose.prod.yml run --rm certbot
```

### Problem: "Database won't start"

**Solution:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs postgres

# If corrupt, reset:
docker-compose -f docker-compose.prod.yml down
rm -rf postgres_data/*
docker-compose -f docker-compose.prod.yml up -d postgres
```

### Problem: "Backend not responding"

**Solution:**
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend | tail -50

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend

# Wait 10 seconds and try again
curl https://yourdomain.com/health
```

### Problem: "Disk space error"

**Solution:**
```bash
# Check disk usage
df -h

# Clean Docker cache
docker system prune -a
```

---

## Final Checklist

- [ ] VPS created with Ubuntu 22.04
- [ ] SSH access working
- [ ] Docker installed
- [ ] Project cloned
- [ ] .env file created with real values
- [ ] PostgreSQL running
- [ ] Domain pointing to VPS
- [ ] SSL certificate generated
- [ ] All services running
- [ ] API responding at https://yourdomain.com/health
- [ ] Can access API docs at https://yourdomain.com/docs
- [ ] Backups scheduled

---

## Getting Help

If something doesn't work:

1. **Check the logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

2. **Check services are running:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

3. **Verify domain is pointing to VPS:**
   ```bash
   nslookup yourdomain.com
   ```

4. **Test direct connection:**
   ```bash
   curl -k https://yourdomain.com/health
   ```

5. **Check disk space:**
   ```bash
   df -h
   ```

If you're still stuck, share the output of:
```bash
docker-compose -f docker-compose.prod.yml logs backend
```

---

## Next Steps

Once deployed:

1. **Create a vendor account** at `https://yourdomain.com/api/vendors/register`
2. **Test the API** using the docs at `https://yourdomain.com/docs`
3. **Setup SSL auto-renewal** (handled automatically)
4. **Monitor backups** in `/opt/street-vendor-app/backups`
5. **Update code** with `git pull && docker-compose -f docker-compose.prod.yml up -d`

---

**Congratulations! Your app is now live on the internet! 🎉**

