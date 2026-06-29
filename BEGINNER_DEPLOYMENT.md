# Street Vendor App - NAS Deployment Guide (Zoraxy)

**This guide walks you through deploying to your Ugreen NAS using Zoraxy as the reverse proxy.**

---

## 📚 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: Connect to NAS](#part-1-connect-to-nas)
3. [Part 2: Clone Your App](#part-2-clone-your-app)
4. [Part 3: Configure Environment](#part-3-configure-environment)
5. [Part 4: Start Docker Services](#part-4-start-docker-services)
6. [Part 5: Configure Zoraxy](#part-5-configure-zoraxy)
7. [Part 6: Verify Everything Works](#part-6-verify-everything-works)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, you need:

1. **Ugreen NAS** (already have it! ✅)
   - Docker installed ✅
   - Zoraxy installed ✅

2. **Domain Name**
   - You have: `elote.littleshit.org` ✅

3. **Stripe Account** (for payments)
   - Go to: https://dashboard.stripe.com
   - Get your API keys (we'll use these later)

4. **Your NAS IP Address**
   - You have: `192.168.86.47` ✅

---

## PART 1: Connect to NAS

### Step 1.1: SSH into Your NAS

**On Windows PowerShell:**
```bash
ssh root@192.168.86.47
# Enter password when prompted
```

**On Mac/Linux:**
```bash
ssh root@192.168.86.47
```

**You should see:**
```
Welcome to your NAS
root@nas:~#
```

✅ **Checkpoint:** You're connected to your NAS!

---

## PART 2: Clone Your App

### Step 2.1: Navigate and Clone

Type these commands one by one:

```bash
cd /mnt/data
git clone https://github.com/brassnuckles/street-vendor-app.git
cd street-vendor-app
```

If git doesn't work, install it first:

```bash
apt install -y git
git clone https://github.com/brassnuckles/street-vendor-app.git
cd street-vendor-app
```

### Step 2.2: Create Necessary Directories

```bash
mkdir -p postgres_data
mkdir -p uploads
mkdir -p backups
chmod 700 postgres_data
```

✅ **Checkpoint:** Project is cloned and ready!

---

## PART 3: Configure Environment

### Step 3.1: Create .env File

Paste this entire block into your terminal:

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

# Domain (Zoraxy will handle SSL)
DOMAIN_NAME=elote.littleshit.org

# Redis Password
REDIS_PASSWORD=ChangeThis456!AlsoSecure

# Other Settings (leave as-is)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
AWS_REGION=us-east-1
EOF
```

**Then press ENTER**

### Step 3.2: Edit the .env File

Edit with real values:

```bash
nano .env
```

Edit these:
1. `DB_PASSWORD` - Change to a secure password
2. `SECRET_KEY` - Generate a random string (minimum 32 chars)
3. `STRIPE_SECRET_KEY` - Paste your Stripe secret key
4. `STRIPE_PUBLISHABLE_KEY` - Paste your Stripe publishable key  
5. `REDIS_PASSWORD` - Change to a secure password

**To save:**
- Press `Ctrl + X`
- Type `y` and press Enter
- Press Enter again

✅ **Checkpoint:** Configuration is set!

---

## PART 4: Start Docker Services

### Step 4.1: Start PostgreSQL

```bash
docker-compose -f docker-compose.prod.yml up -d postgres
```

**Wait 10 seconds**, then check:

```bash
docker-compose -f docker-compose.prod.yml ps
```

You should see `postgres` with status `Up`

### Step 4.2: Start Backend & Redis

```bash
docker-compose -f docker-compose.prod.yml up -d backend redis
```

Check status:

```bash
docker-compose -f docker-compose.prod.yml ps
```

You should see:
```
NAME                STATUS
postgres           Up (healthy)
backend            Up (healthy)
redis              Up (healthy)
```

✅ **Checkpoint:** All services are running!

---

## PART 5: Configure Zoraxy

### Step 5.1: Open Zoraxy Dashboard

1. Open your browser
2. Go to: `http://192.168.86.47:7001`
3. Log in to Zoraxy

### Step 5.2: Create Reverse Proxy Entry

1. Click **"Services"** or **"Proxies"**
2. Click **"Add New Proxy"** or **"+"**
3. Fill in:
   - **Name:** `street-vendor-app`
   - **Listen Port:** `80` (HTTP)
   - **Backend Host:** `localhost` or `127.0.0.1`
   - **Backend Port:** `8000`
   - **Domain:** `elote.littleshit.org`

4. Click **Save**

### Step 5.3: Enable SSL/TLS

1. Select your new proxy (`street-vendor-app`)
2. Click **Edit** or **Settings**
3. Look for **SSL/TLS** section
4. Click **Enable SSL**
5. Choose **"Let's Encrypt"** or **"Auto-Generate Certificate"**
6. Enter your email for certificate notifications
7. Click **Save**

**Wait 1-2 minutes** for the certificate to be generated

✅ **Checkpoint:** Zoraxy is configured!

---

## PART 6: Verify Everything Works

### Step 6.1: Test Your API

Open your browser and go to:

```
https://elote.littleshit.org/health
```

You should see:
```
{"status":"healthy","service":"street-vendor-api"}
```

### Step 6.2: Access API Docs

Go to:
```
https://elote.littleshit.org/docs
```

You should see:
- Green padlock (secure HTTPS)
- Swagger API documentation
- No errors

### Step 6.3: Check Logs

If something doesn't work, check the backend logs:

```bash
docker-compose -f docker-compose.prod.yml logs backend | tail -20
```

Look for `Application startup complete`

✅ **Checkpoint:** Your app is LIVE on your NAS!

---

## Setup Automated Backups

### Create Backup Script

```bash
cat > /mnt/data/street-vendor-app/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/mnt/data/street-vendor-app/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

docker-compose -f /mnt/data/street-vendor-app/docker-compose.prod.yml exec -T postgres pg_dump -U street_vendor street_vendor_db | gzip > $BACKUP_FILE

echo "Backup created: $BACKUP_FILE"
EOF

chmod +x /mnt/data/street-vendor-app/backup.sh
```

### Schedule Daily Backup

```bash
(crontab -l 2>/dev/null; echo "0 2 * * * /mnt/data/street-vendor-app/backup.sh") | crontab -
```

This runs backup at 2 AM every day.

---

## Common Commands

**Save these for later:**

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View backend logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Stop all services
docker-compose -f docker-compose.prod.yml stop

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart backend only
docker-compose -f docker-compose.prod.yml restart backend

# Manually backup database
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U street_vendor street_vendor_db > backup.sql

# Connect to database
docker-compose -f docker-compose.prod.yml exec postgres psql -U street_vendor -d street_vendor_db

# Update code and restart
cd /mnt/data/street-vendor-app
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Problem: "Backend not responding" or "Connection refused"

**Solution:**
```bash
docker-compose -f docker-compose.prod.yml ps
# Check if services are running. If not:
docker-compose -f docker-compose.prod.yml logs backend
```

### Problem: "SSL certificate error" in Zoraxy

**Solution:**
1. Go back to Zoraxy dashboard
2. Select your proxy
3. Check SSL/TLS status
4. If certificate failed, try regenerating:
   - Disable SSL
   - Re-enable SSL
   - Let it generate a new certificate

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

### Problem: "Can't reach app at domain"

**Solution:**
```bash
# 1. Check backend is running
docker-compose -f docker-compose.prod.yml ps

# 2. Test direct connection to backend
curl http://localhost:8000/health

# 3. Restart Zoraxy proxy
# Go to Zoraxy dashboard and disable/enable the proxy
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

- [ ] Connected to NAS via SSH
- [ ] Project cloned to `/mnt/data/street-vendor-app`
- [ ] .env file created with real Stripe keys
- [ ] PostgreSQL running
- [ ] Backend running
- [ ] Redis running
- [ ] Zoraxy proxy configured for `elote.littleshit.org`
- [ ] SSL certificate generated in Zoraxy
- [ ] API responding at `https://elote.littleshit.org/health`
- [ ] Can access API docs at `https://elote.littleshit.org/docs`
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

3. **Test backend directly:**
   ```bash
   curl http://localhost:8000/health
   ```

4. **Check Zoraxy dashboard:**
   - Open `http://192.168.86.47:7001`
   - Check proxy status
   - Check SSL certificate status

If you're still stuck, share the output of:
```bash
docker-compose -f docker-compose.prod.yml logs backend
```

---

## Next Steps

Once deployed:

1. **Create a vendor account** at `https://elote.littleshit.org/api/vendors/register`
2. **Test the API** using the docs at `https://elote.littleshit.org/docs`
3. **Monitor backups** in `/mnt/data/street-vendor-app/backups`
4. **Update code** with `git pull && docker-compose -f docker-compose.prod.yml up -d`

---

**Congratulations! Your app is now live on your NAS! 🎉**
