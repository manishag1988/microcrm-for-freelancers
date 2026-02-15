# Micro-CRM Deployment Guide

> **Current Version:** 1.0.1 (2026-02-14)
> **Latest Update:** Login functionality has been fixed - critical bug where login button did nothing was resolved.

This guide covers deploying the Micro-CRM application to GitHub and moving it to production.

## Table of Contents
1. [Prepare for GitHub](#1-prepare-for-github)
2. [Create GitHub Repository](#2-create-github-repository)
3. [Push to GitHub](#3-push-to-github)
4. [Production Deployment Options](#4-production-deployment-options)
5. [Environment Variables](#5-environment-variables)
6. [Database Migration](#6-database-migration)
7. [Production Checklist](#7-production-checklist)

---

## 1. Prepare for GitHub

### Create .gitignore
Create a `.gitignore` file in the project root:

```
# Dependencies
node_modules/

# Database
database.sqlite
database.sqlite-shm
database.sqlite-wal

# Environment
.env
.env.local
.env.*.local

# Logs
logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build outputs
dist/

# Test files (optional)
test.js
coverage/
```

### Check git status
```bash
git status
```

---

## 2. Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** icon → **New repository**
3. Fill in:
   - **Repository name**: `micro-crm` (or your preferred name)
   - **Description**: A modern Micro-CRM for Freelancers
   - **Visibility**: Public or Private
4. Click **Create repository**

---

## 3. Push to GitHub

Run these commands in your project directory:

```bash
# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Micro-CRM application"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/micro-crm.git

# Push to GitHub
git push -u origin main
```

---

## 4. Production Deployment Options

### Option A: Deploy to Render.com (Recommended)

1. **Push code to GitHub** (done above)

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create Web Service**
   - Click **New** → **Web Service**
   - Connect your GitHub repository
   - Configure:
     - **Name**: micro-crm
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Plan**: Free (or paid for persistence)

4. **Environment Variables**
   - Add these in Render dashboard:
     - `NODE_ENV`: `production`
     - `JWT_SECRET`: (generate a secure random string)
     - `PORT`: `3000`
   - **PostgreSQL (Recommended)**:
     - Click **New** → **PostgreSQL**
     - Create a PostgreSQL instance
     - The `DATABASE_URL` will be automatically available to your web service

5. **Deploy**
   - Click **Create Web Service**
   - Wait for deployment to complete
   - Your app will be live at `https://micro-crm.onrender.com`

### Option B: Deploy to Railway

1. **Push code to GitHub** (done above)

2. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

3. **Create New Project**
   - Click **New Project**
   - Select **Deploy from GitHub repo**
   - Choose your repository

4. **Configure**
   - Railway will auto-detect Node.js
   - Add environment variables in **Variables** tab

5. **Deploy**
   - Click **Deploy Now**
   - Your app will be live at `https://your-project-name.railway.app`

### Option C: Deploy to VPS (DigitalOcean/AWS/etc)

1. **Server Setup**
   ```bash
   # Connect to your server
   ssh user@your-server-ip

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install Nginx
   sudo apt-get install -y nginx
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/micro-crm.git
   cd micro-crm
   npm install
   ```

3. **Create Systemd Service**
   ```bash
   sudo nano /etc/systemd/system/micro-crm.service
   ```
   
   Add:
   ```ini
   [Unit]
   Description=Micro-CRM
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/micro-crm
   ExecStart=/usr/bin/node /var/www/micro-crm/server.js
   Environment=NODE_ENV=production
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

4. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/micro-crm
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header upgrade $http_upgrade;
           proxy_set_header connection 'upgrade';
           proxy_set_header host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Enable and Start**
   ```bash
   sudo ln -s /etc/nginx/sites-available/micro-crm /etc/nginx/sites-enabled/
   sudo systemctl enable micro-crm
   sudo systemctl start micro-crm
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## 5. Environment Variables

Create a `.env` file (DO NOT commit to GitHub):

```env
# Required
JWT_SECRET=your-super-secure-random-string-min-32-chars
NODE_ENV=production

# Optional (defaults shown)
PORT=3000
DATABASE_PATH=./database.sqlite
```

### Generate Secure JWT_SECRET
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

---

## 6. Database Migration

### For SQLite (Current Setup)

The database file `database.sqlite` contains all data. For production:

1. **Option A: Keep using SQLite**
   - Database file will be stored on the server
   - Data persists as long as server doesn't delete it
   - Consider regular backups

2. **Option B: Migrate to PostgreSQL** (Recommended for production)

### Using PostgreSQL

The app now supports both SQLite (development) and PostgreSQL (production).

#### Set Environment Variable

In your production environment, set:
```
DATABASE_URL=postgres://user:password@host:port/database
```

Or on Render.com, add a PostgreSQL service and connect it to your web service.

#### PostgreSQL Setup

1. **Local Development**
   ```bash
   # Install PostgreSQL
   brew install postgresql  # macOS
   # or sudo apt-get install postgresql  # Ubuntu

   # Create database
   createdb microcrm

   # Set environment
   export DATABASE_URL="postgres://localhost:5432/mycrm"
   npm start
   ```

2. **Render.com (Automatic)**
   - Add PostgreSQL service in Render dashboard
   - Connect to your web service
   - DATABASE_URL is automatically set

#### Migrating Data from SQLite to PostgreSQL

1. Export SQLite data:
   ```bash
   sqlite3 database.sqlite ".dump" > dump.sql
   ```

2. Import to PostgreSQL (may need manual adjustments for syntax differences)

3. Or use tools like `pgloader` for automatic migration

### Backup Database
```bash
# On server (if using file-based SQLite)
cp database.sqlite database.sqlite.backup

# Download locally
scp user@server:/path/to/database.sqlite ./database-backup.sqlite
```

---

## 7. Production Checklist

Before going live:

- [ ] Set `NODE_ENV=production`
- [ ] Generate and set secure `JWT_SECRET`
- [ ] Test login/logout
- [ ] Test all CRUD operations (clients, projects, tasks, invoices)
- [ ] Test timer functionality
- [ ] Verify admin access control works
- [ ] Set up database backups (if using SQLite)
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring/logging
- [ ] Test error handling

---

## Quick Deploy Commands Summary

```bash
# Local development
npm install
npm run dev  # or npm start

# Get latest updates
git pull origin main

# Production deployment (Render example)
git add .
git commit -m "Production deploy"
git push origin main
# Then trigger deploy in Render dashboard
```

> **Important:** Always pull the latest code to get bug fixes. The v1.0.1 update includes critical login fixes.

---

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/YOUR_USERNAME/micro-crm/issues)
- Review the README.md for feature documentation
