# Micro-CRM for Freelancers

A modern, fully-functional Customer Relationship Management (CRM) application designed specifically for freelancers. Built with 100% free resources, this SaaS application provides everything you need to manage your freelance business efficiently.

![Micro-CRM Dashboard](https://via.placeholder.com/800x400?text=Micro-CRM+Dashboard)

## Features

> **Latest Update (v1.1.1):** Proxy trust configuration fix for rate limiting in production (Railway), timelog route reorganization to prevent 404 errors, and improved deployment stability.

### Core Functionality

- **Dashboard** - Get an at-a-glance view of your business with stats on clients, active projects, pending tasks, and revenue. The dashboard also shows recent activity and provides quick action buttons for common tasks.

- **Client Management** - Maintain a comprehensive database of all your clients with pagination support. Track contact information, company details, addresses, and notes. Each client profile shows associated projects and invoices for quick reference.

- **Project Management** - Create and track projects for each client. Set budgets, deadlines, and monitor progress through visual progress bars. Projects can be filtered by status (Active, Completed, On Hold, Cancelled).

- **Task Management** - Organize your work with a Kanban-style task board. Drag and drop tasks between To Do, In Progress, and Done columns. Set priorities and due dates to stay on top of your workload.

- **Invoicing System** - Generate professional invoices with automatic sequential numbering. Add multiple line items, apply tax rates, and track payment status (Draft, Sent, Paid, Overdue). Print or save invoices as PDF directly from the browser. Supports recurring invoices with automatic cron-based generation.

- **Time Tracker** - Track time spent on projects with a built-in stopwatch. Add manual time entries for past work. All time logs are associated with projects and can be marked as billable or non-billable.

- **Admin Panel** - Manage user accounts, view system statistics, and configure application settings. The admin panel shows total users, database size, and provides user management capabilities.

### Technical Features

- **Secure Authentication** - JWT tokens with bcrypt password hashing (cost factor 12), rate limiting on auth endpoints, token blacklist on logout, and HTTP-only secure cookies.

- **Input Validation & Sanitization** - Server-side input validation with password complexity requirements, XSS protection through HTML escaping, and parameterized SQL queries.

- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices. The interface adapts to different screen sizes with a collapsible sidebar on mobile.

- **Real-time Updates** - All data is persisted to database with instant feedback through toast notifications and loading states.

- **Modern UI** - Clean, professional design with smooth animations and transitions. Custom CSS without external framework dependencies.

## Tech Stack

The application is built using entirely free and open-source technologies:

- **Backend:** Node.js with Express.js
- **Database:** SQLite (development) or PostgreSQL (production with Railway)
- **Authentication:** JSON Web Tokens (JWT) with bcryptjs
- **Frontend:** Vanilla HTML5, CSS3, and JavaScript (ES6 Modules)
- **No External Dependencies:** All icons are inline SVGs, fonts load from Google Fonts

## Quick Start

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm (comes with Node.js)

### Installation

1. Clone or download the application code:
```bash
git clone https://github.com/YOUR_USERNAME/micro-crm-freelancers.git
cd micro-crm-freelancers
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

5. Log in with the default admin credentials (first run only):
- **Email:** admin@microcrm.com
- **Password:** Set via `ADMIN_PASSWORD` env var, or auto-generated

6. Change the default password after first login by clicking on your user avatar and selecting "Settings".

> **Important Note on Hosting:** 
> - **Render.com** no longer offers persistent disks on the free tier, making it unsuitable for SQLite-based apps
> - **Railway.app** is the recommended free hosting option - it includes persistent PostgreSQL with $5/month free credit
> - **DigitalOcean** free tier has traffic limitations but can work with proper configuration

## Deployment Options Comparison

| Platform | Free Tier | Database | Pros | Cons |
|----------|-----------|----------|------|------|
| **Railway.app** ⭐ | $5/mo credit | PostgreSQL | Generous free credit, easy setup, unlimited traffic | Limited to $5/mo |
| Render.com | Limited | SQLite | Previously popular | ❌ No persistent disk on free tier |
| DigitalOcean | Limited | PostgreSQL/MySQL | Good performance | Traffic limitations |
| Heroku | Discontinued | - | - | ❌ Free tier discontinued |



## Deployment to Railway.app (Recommended)

Railway.app provides a free tier with persistent PostgreSQL database and $5/month free credit. This is the **recommended** deployment option for Micro-CRM.

### Quick Start via Railway CLI

#### Step 1: Install Railway CLI
```bash
npm i -g @railway/cli
```

#### Step 2: Login to Railway
```bash
railway login
```

#### Step 3: Link to Your Project
```bash
railway link
# Select "Create a new project" if you haven't created one
```

#### Step 4: Deploy the Application
```bash
railway up
```

#### Step 5: Add PostgreSQL Database
```bash
railway add
# Select "PostgreSQL" from the menu
```

#### Step 6: Set Required Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

#### Step 7: Open Your App
```bash
railway open
```

Your app will be accessible at the Railway-provided URL (e.g., `https://your-project-name.up.railway.app`)

### Setup via Railway Dashboard

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub account
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your **microcrm-for-freelancers** repository
5. Railway will auto-detect Node.js and start the initial deployment

**Configure Database:**
1. After initial deployment, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway automatically sets `DATABASE_URL` environment variable
3. Redeploy after database is provisioned

**Set Environment Variables:**
1. Click on your service
2. Go to **"Variables"** tab
3. Add the following variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `ADMIN_PASSWORD`: Your secure admin password

### Railway Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | **Yes** | production | Must be set to `production` |
| `JWT_SECRET` | **Yes** | - | 32+ character random string for token signing |
| `ADMIN_EMAIL` | No | admin@microcrm.com | Admin email address |
| `ADMIN_PASSWORD` | No | Auto-generated | Admin password (user will be prompted to change on first login) |
| `DATABASE_URL` | Auto-set | - | PostgreSQL connection string (set automatically by Railway PostgreSQL plugin) |
| `ALLOWED_ORIGINS` | No | - | Comma-separated list of allowed CORS origins |
| `SMTP_HOST` | No | - | SMTP server hostname (for email notifications) |
| `SMTP_PORT` | No | 587 | SMTP port |
| `SMTP_USER` | No | - | SMTP username |
| `SMTP_PASS` | No | - | SMTP password |
| `SMTP_FROM` | No | - | From email address for notifications |
| `PORT` | No | 3000 | Server port (Railway sets this automatically) |
| `LOG_REQUESTS` | No | false | Set to `true` to log all requests in production |

### Production Configuration Notes

**Proxy Trust:**
- Railway uses a reverse proxy, so `trust proxy` is enabled in the Express configuration
- This is essential for rate limiting to work correctly  
- Rate limiting identifies users by their real IP address

**Database:**
- SQLite is used for development mode (when `DATABASE_URL` is not set)
- PostgreSQL is automatically used when `DATABASE_URL` is provided
- Railway's PostgreSQL plugin provides a free database with reliable backups

**Security:**
- All connections to Railway are over HTTPS
- JWT tokens are signed with your `JWT_SECRET`
- Change default admin password immediately after first login
- Use HTTP-only secure cookies for session management

### After Deployment

1. Access your app at the Railway-provided URL
2. Log in with default credentials:
   - **Email:** `admin@microcrm.com`
   - **Password:** `Admin123!` (or your `ADMIN_PASSWORD` if set)
3. **Change the admin password** immediately in Settings

### Redeploying Updates

```bash
# Make changes and commit
git add .
git commit -m "Your changes"
git push origin main

# Redeploy to Railway
railway up
```

Or through the Railway dashboard:
1. Click **"Deployments"** tab
2. Click **"Deploy latest commit"** button

### Troubleshooting Railway Deployment

**App crashes immediately after deployment:**
- Check that `JWT_SECRET` is set in Variables
- Railway requires `JWT_SECRET` in production mode
- Verify all required variables are present

**Database connection fails:**
- Ensure PostgreSQL plugin is added to your project
- Check that `DATABASE_URL` is set automatically by Railway
- Wait for PostgreSQL to fully initialize (may take 1-2 minutes)

**Rate limiting errors (ValidationError with X-Forwarded-For):**
- This is fixed in v1.1.1+ with proper proxy trust configuration
- Ensure you're running the latest version from GitHub

**Login returns 401 errors:**
- Clear browser cookies and cache
- Verify `JWT_SECRET` is correctly set
- Try in an incognito/private browser window
- Check that the admin user was created in the database

**Static files return 404:**
- Ensure all files were pushed to GitHub
- Verify the `public` directory and its contents are in the repository
- Redeploy after pushing changes

**Slow page loads:**
- Check Railway dashboard for resource usage
- PostgreSQL queries may be optimized with indexes
- Monitor logs for performance issues

## Deployment to DigitalOcean App Platform

> **⚠️ Note:** DigitalOcean's free tier is limited with restricted outbound traffic and database options. **Railway.app is recommended for free hosting.**

DigitalOcean offers app hosting with good performance but requires careful configuration for CDN usage.

### Step 1: Prepare Your Code

Push your code to GitHub as described previously.

### Step 2: Create DigitalOcean Account

1. Sign up at [DigitalOcean.com](https://www.digitalocean.com)
2. Verify your account through email

### Step 3: Create App

1. From the DigitalOcean dashboard, click "Apps" in the left sidebar
2. Click "Launch Your App" or "Create App"
3. Select GitHub as your source
4. Choose your Micro-CRM repository
5. DigitalOcean will auto-detect Node.js settings

### Step 4: Configure App

1. Review the build and start commands (DigitalOcean usually auto-detects correctly)
2. Add environment variables in the "Environment Variables" section:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Your secret key

3. Under "Info", verify the plan is set to "Basic" or "Free tier"

### Step 5: Deploy

Click "Launch App" to begin deployment. DigitalOcean will build and deploy your application, providing a URL upon completion.

## Updating Your Application

### Local Updates

To update your application with new features or fixes:

1. Make your changes to the code
2. Test locally:
```bash
npm start
```

3. Commit and push to GitHub:
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

### Railway.app Updates

Railway automatically deploys when changes are pushed to the connected branch:

1. Push your changes to GitHub
2. Railway detects the new commit automatically
3. Watch the deployment logs in the Railway dashboard
4. Once complete, your live application is updated

To manually redeploy:
```bash
railway up
```

### Manual Redeploy on Render

If automatic deployment doesn't trigger:

1. Go to your service in the Render dashboard
2. Click the "Deployments" tab
3. Click "Deploy latest commit" at the top
4. Wait for deployment to complete

### Rollback on Railway

To revert to a previous deployment:

1. Go to your project in Railway dashboard
2. Click on the "Deployments" tab
3. Find the previous deployment you want to restore
4. Click "Redeploy"

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | Set to `production` for production deployments |
| `PORT` | No | Port number (defaults to 3000, automatically set by Render) |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens (minimum 32 characters) |

## File Structure

```
micro-crm/
├── public/                 # Frontend assets
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── style.css      # Application styles
│   └── js/
│       ├── app.js         # Main application entry point
│       ├── api.js         # API client wrapper
│       ├── router.js      # Client-side router
│       ├── modal.js       # Modal component management
│       ├── toast.js       # Toast notification system
│       └── modules/       # Feature-specific modules
│           ├── dashboard.js
│           ├── clients.js
│           ├── projects.js
│           ├── tasks.js
│           ├── invoices.js
│           ├── timetracker.js
│           └── admin.js
├── server/                 # Backend code
│   ├── server.js          # Express application entry
│   ├── models/
│   │   └── database.js    # SQLite database operations
│   ├── middleware/
│   │   └── auth.js        # JWT authentication middleware
│   └── routes/            # API route handlers
│       ├── auth.js
│       ├── clients.js
│       ├── projects.js
│       ├── tasks.js
│       ├── invoices.js
│       ├── timelogs.js
│       └── admin.js
├── database.sqlite        # SQLite database file (created automatically)
├── package.json           # Node.js dependencies and scripts
└── README.md              # This file
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | User login |
| POST | /api/auth/logout | User logout (token blacklisted) |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password with token |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/password | Change password |

### Clients (supports pagination)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/clients?page=1&limit=20 | Get paginated clients |
| GET | /api/clients/:id | Get single client |
| GET | /api/clients/stats | Get client statistics |
| POST | /api/clients | Create new client |
| PUT | /api/clients/:id | Update client |
| DELETE | /api/clients/:id | Delete client |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | Get all projects |
| GET | /api/projects/:id | Get single project |
| GET | /api/projects/stats | Get project statistics |
| POST | /api/projects | Create new project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | Get all tasks |
| GET | /api/tasks/:id | Get single task |
| GET | /api/tasks/stats | Get task statistics |
| GET | /api/tasks/project/:projectId | Get tasks for a project |
| POST | /api/tasks | Create new task |
| PUT | /api/tasks/:id | Update task |
| PATCH | /api/tasks/:id/status | Update task status |
| DELETE | /api/tasks/:id | Delete task |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/invoices | Get all invoices |
| GET | /api/invoices/:id | Get single invoice |
| GET | /api/invoices/stats | Get invoice statistics |
| GET | /api/invoices/next-number | Get next invoice number |
| POST | /api/invoices | Create new invoice |
| PUT | /api/invoices/:id | Update invoice |
| PATCH | /api/invoices/:id/status | Update invoice status |
| DELETE | /api/invoices/:id | Delete invoice |

### Time Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/timelogs | Get all time logs |
| GET | /api/timelogs/active | Get active timer |
| GET | /api/timelogs/stats | Get time log statistics |
| POST | /api/timelogs/start | Start timer |
| POST | /api/timelogs/stop/:id | Stop timer |
| POST | /api/timelogs | Create manual entry |
| PUT | /api/timelogs/:id | Update time log |
| DELETE | /api/timelogs/:id | Delete time log |

### Admin (Admin Role Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/users | Get all users |
| GET | /api/admin/stats | Get system statistics |
| PUT | /api/admin/users/:id/role | Update user role |
| DELETE | /api/admin/users/:id | Delete user |

### Recurring Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/recurring-invoices | Get all recurring invoices |
| GET | /api/recurring-invoices/:id | Get single recurring invoice |
| GET | /api/recurring-invoices/due | Get due recurring invoices |
| POST | /api/recurring-invoices | Create recurring invoice |
| POST | /api/recurring-invoices/:id/generate | Generate invoice now |
| PUT | /api/recurring-invoices/:id | Update recurring invoice |
| DELETE | /api/recurring-invoices/:id | Delete recurring invoice |

Note: Recurring invoices are automatically processed hourly via cron job.

### Client Portal

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/portal/portal-login | Client portal login |
| GET | /api/portal/portal/data | Get client portal data |
| POST | /api/portal/portal/generate-token/:clientId | Generate client access token |
| POST | /api/portal/portal/revoke-token/:clientId | Revoke client access token |

## Recent Changes & Version History

### v1.1.1 (Latest)
- ✅ Fixed proxy trust configuration for rate limiting in production environments (Railway)
- ✅ Reorganized timelog routes to prevent 404 errors on `/api/timelogs/stop/:id` endpoint
- ✅ Improved deployment stability on Railway.app with PostgreSQL
- ✅ Updated documentation with comprehensive Railway deployment guide

**What was fixed:**
- Express `trust proxy` setting is now enabled for production deployments behind reverse proxies
- Rate limiting errors (`ValidationError: X-Forwarded-For`) are now resolved
- Timelog stop endpoint now works correctly on all deployments

### v1.1.0
- Route conflict fixes
- Invoice form accessibility improvements
- Timer workflow enhancements
- General bug fixes

### v1.0.1
- Fixed critical login bug
- Improved authentication middleware
- Enhanced error handling

### v1.0.0
- Initial release
- Full CRM functionality for freelancers
- Dashboard, client management, projects, tasks, invoices, time tracking, admin panel

## Migration Guide

### From v1.0.x to v1.1.1

If you have an existing Railway deployment from v1.0.x:

1. Pull the latest code:
```bash
git pull origin main
```

2. Push to GitHub:
```bash
git push origin main
```

3. Railway will automatically redeploy with the latest fixes

No database migration is required. The app is fully backward compatible.



The application creates a default admin account on first run. Credentials can be configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_EMAIL` | admin@microcrm.com | Admin email address |
| `ADMIN_PASSWORD` | auto-generated | Admin password (printed to console) |
| `ADMIN_NAME` | System Administrator | Admin display name |

**Production:** Set `ADMIN_PASSWORD` environment variable to ensure secure default credentials.

**Important:** Change these credentials immediately after first login for security purposes.

## Troubleshooting

### Local Development Issues

#### Application Won't Start

**Problem:** `Error: listen EADDRINUSE: address already in use 3000`

**Solution:** Another process is using port 3000. Either stop the other process or run:
```bash
PORT=3001 npm start
```

#### Database Errors

**Problem:** `Error: SQLITE_ERROR: no such table: users`

**Solution:** The database hasn't been initialized. Ensure the application has write permissions to its directory. Run locally and access the app to initialize the database.

### Railway Deployment Issues

#### App Crashes Immediately on Deploy

**Problem:** App crashes with "Uncaught Exception" shortly after deployment starts

**Solutions:**
1. **Check JWT_SECRET is set:**
   - Go to Railway dashboard → Your project → Variables
   - Verify `JWT_SECRET` variable exists and is at least 32 characters
   - Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

2. **Check NODE_ENV:**
   - Ensure `NODE_ENV` is set to `production`

3. **Restart deployment:**
   - Make a small commit and push: `git commit --allow-empty -m "Trigger redeploy"`
   - Or click "Deploy latest commit" in Railway dashboard

#### Database Connection Fails (ECONNREFUSED)

**Problem:** `Error: connect ECONNREFUSED` at database connection

**Solutions:**
1. **Add PostgreSQL if missing:**
   - Go to Railway dashboard
   - Click "+ New" → "Database" → "PostgreSQL"
   - Wait 1-2 minutes for database to initialize

2. **Verify DATABASE_URL:**
   - Check Variables - Railway should auto-set `DATABASE_URL`
   - If missing, create it with your PostgreSQL public URL

3. **Wait for PostgreSQL to start:**
   - Services take time to initialize
   - Check the PostgreSQL service logs to see startup progress

#### Rate Limiting Errors (ValidationError with X-Forwarded-For)

**Problem:** `ValidationError: The 'X-Forwarded-For' header is set...`

**Solutions:**
- **This is fixed in v1.1.1+**
- Ensure you're running the latest code:
  ```bash
  git pull origin main
  git push origin main
  railway up
  ```

#### Login Returns 401 Errors

**Problem:** Login fails with `401 (Unauthorized)` response

**Solutions:**
1. **Clear browser cache and cookies:**
   - Open DevTools (F12) → Application → Clear all cookies and cache
   - Reload the page

2. **Try incognito mode:**
   - Open in incognito/private browser window

3. **Verify JWT_SECRET:**
   - Check that `JWT_SECRET` is properly set in Variables
   - It should be at least 32 random characters

4. **Check admin user exists:**
   - Admin user should be auto-created on first deployment
   - Default credentials: email=`admin@microcrm.com`, password=`Admin123!`
   - If issues persist, set `ADMIN_PASSWORD` environment variable

5. **Check logs for errors:**
   - Go to Railway dashboard → Deployments → Latest deployment
   - Look for authentication or JWT-related errors

#### Time Tracker Stop Endpoint Returns 404

**Problem:** `POST /api/timelogs/stop/:id` returns `404 (Not Found)`

**Solutions:**
- **This is fixed in v1.1.1+**
- Route ordering issue was corrected
- Update to latest version:
  ```bash
  git pull origin main
  git push origin main
  railway up
  ```

#### Static Files Not Loading

**Problem:** CSS or JavaScript files return 404 or 500 errors

**Solutions:**
1. Ensure all files were pushed to GitHub
2. Verify the `public` directory and its contents are committed
3. Check deployment logs for missing files
4. Rebuild and redeploy:
   ```bash
   git push origin main
   railway up
   ```

#### Can't Create Projects, Tasks, or Invoices

**Problem:** Unable to create new items

**Solutions:**
1. Ensure you're logged in (authentication required)
2. Check that required fields are filled
3. For invoices, at least one line item is required
4. Check browser console for validation errors
5. Verify user has proper permissions

### Browser Console Issues

#### "Uncaught (in promise) Error: A listener indicated an asynchronous response..."

**Problem:** Error appears in console but app works fine

**Solution:** This is usually caused by browser extensions (password managers, ad blockers, etc.)
- Disable extensions temporarily to verify
- The error doesn't affect app functionality
- Safe to ignore if app works normally

### Running Out of Disk Space

**Problem:** Deployment fails with disk space error

**Solutions:**
- Clear unnecessary database records
- Archive old invoices and time logs
- For Railway PostgreSQL, disk space is generous but can be monitored

### Cannot Access App After Deployment

**Problem:** Railway URL returns 503 or timeout

**Solutions:**
1. Check Railway dashboard for deployment status
2. Wait for deployment to complete (usually 2-5 minutes)
3. Check build logs for errors
4. Try refreshing the page after a few minutes
5. Ensure PORT is not set in Variables (Railway sets it automatically)

### Session Not Persisting

**Problem:** Logged out after refreshing the page

**Solution:** Check that cookies are enabled in the browser. The application uses HTTP-only cookies which require cookies to be enabled. Also verify CORS configuration if using a custom domain.

### Performance Issues

**Problem:** Slow page loads or timeouts on Railway

**Solution:**
- Monitor Railway dashboard for resource usage
- Optimize database queries with proper indexing
- Check PostgreSQL query performance
- Ensure no background processes are hogging resources
- Performance varies by usage patterns - Railway free tier is generous

## Security Considerations

### Built-in Security Features

1. **JWT Authentication** - Token-based auth with secure HTTP-only cookies
2. **Rate Limiting** - 10 requests/15min on auth endpoints, 100 requests/15min general
3. **Password Validation** - Minimum 8 chars with uppercase, lowercase, and number
4. **Input Sanitization** - Server-side XSS protection via HTML escaping
5. **Token Blacklist** - Logged out tokens are invalidated
6. **CORS Configuration** - Configurable allowed origins for production
7. **bcrypt Hashing** - Passwords hashed with cost factor 12
8. **Proxy Trust** - Properly configured for reverse proxy environments (v1.1.1+)

### Production Recommendations

1. **Environment Variables:** Set all security-related env vars:
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-secure-random-string
   ADMIN_PASSWORD=your-secure-admin-password
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

2. **HTTPS Only:** In production, ensure SSL/TLS is enabled. Railway.app provides automatic HTTPS.

3. **SMTP Configuration:** Configure email for password reset functionality:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

4. **Database:** Consider using PostgreSQL for production:
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```

### Regular Maintenance

1. **Update Dependencies:** Regularly update npm packages to patch security vulnerabilities:
```bash
npm update
git add package-lock.json
git commit -m "Update dependencies"
git push
```

2. **Database Backups:** Railway's PostgreSQL provides persistence, but consider regular backups for critical data using the Railway dashboard or `pg_dump`.

3. **Monitor Logs:** Regularly review application logs for suspicious activity or errors.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository or contact the development team.

---

Built with ❤️ for freelancers everywhere.
