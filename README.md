# Micro-CRM for Freelancers

A modern, fully-functional Customer Relationship Management (CRM) application designed specifically for freelancers. Built with 100% free resources, this SaaS application provides everything you need to manage your freelance business efficiently.

![Micro-CRM Dashboard](https://via.placeholder.com/800x400?text=Micro-CRM+Dashboard)

## Features

> **Latest Update (v1.1.0):** Route conflict fixes, invoice form accessibility improvements, timer workflow enhancements, and general bug fixes.

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
- **Database:** SQLite (file-based, no setup required)
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

## Deployment to Render.com

Render.com offers a free tier that's perfect for hosting this application, including persistent storage for the SQLite database.

### Step 1: Prepare Your Code

Ensure your code is pushed to a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit: Micro-CRM for Freelancers"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 2: Create Render Account

1. Go to [Render.com](https://render.com) and sign up using your GitHub account
2. Authorize Render to access your GitHub repositories

### Step 3: Create Web Service

1. From the Render dashboard, click "New +" and select "Web Service"
2. Connect your GitHub repository containing the Micro-CRM code
3. Configure the service with the following settings:

| Setting | Value |
|---------|-------|
| Name | micro-crm |
| Branch | main |
| Build Command | npm install |
| Start Command | npm start |
| Plan | Free |

4. Click "Advanced" and add environment variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Generate a random string (at least 32 characters)

To generate a secure JWT secret, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Configure Persistent Disk

SQLite requires a persistent disk to store the database file:

1. In the advanced settings, find the "Disks" section
2. Click "Add Disk"
3. Configure:
   - **Name:** `micro-crm-data`
   - **Mount Path:** `/workspace/micro-crm`
   - **Size:** 1GB

4. Click "Create Disk" then "Create Web Service"

### Step 5: Configure Environment Variables

Add the following required environment variables in the "Environment Variables" section:

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `JWT_SECRET` | Yes | Secret key for JWT tokens (min 32 chars) |
| `ADMIN_EMAIL` | No | Admin email (default: admin@microcrm.com) |
| `ADMIN_PASSWORD` | Yes (production) | Admin password (strongly recommended for production) |
| `ALLOWED_ORIGINS` | No | Comma-separated list of allowed CORS origins |
| `SMTP_HOST` | No | SMTP server for emails |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | From email address |
| `DATABASE_URL` | No | PostgreSQL connection string (optional) |

To generate a secure JWT secret, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment to Railway.app

Railway.app provides another excellent option for free hosting with easy deployment.

### Step 1: Prepare and Push to GitHub

Follow the same steps as Render.com to push your code to GitHub.

### Step 2: Create Railway Account

1. Go to [Railway.app](https://railway.app) and sign up with GitHub
2. Authorize Railway to access your repositories

### Step 3: Deploy from GitHub

1. Click "New Project" on the Railway dashboard
2. Select "Deploy from GitHub repo"
3. Choose your Micro-CRM repository
4. Railway will automatically detect it's a Node.js project
5. Click "Deploy Now"

### Step 4: Configure Environment

1. Go to the "Variables" tab in your Railway project
2. Add the following variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Your generated secret key

### Step 5: Add Persistent Storage

1. Go to the "Storage" tab
2. Click "New Database" and select "PostgreSQL" or "MySQL"
3. Note: For SQLite, Railway doesn't offer direct persistent disk. Consider using the PostgreSQL add-on and updating the database configuration, or use Render.com for SQLite persistence.

### Step 6: Access Your Application

Once deployed, Railway provides a URL for your application. The deployment process typically takes 3-5 minutes.

## Deployment to DigitalOcean App Platform

DigitalOcean offers a free tier for app hosting with good performance.

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

### Render.com Updates

Render automatically deploys when changes are pushed to the connected branch:

1. Push your changes to GitHub
2. Render detects the new commit automatically
3. Watch the deployment logs in the Render dashboard
4. Once complete, your live application is updated

### Manual Redeploy on Render

If automatic deployment doesn't trigger:

1. Go to your service in the Render dashboard
2. Click the "Deployments" tab
3. Click "Deploy latest commit" at the top
4. Wait for deployment to complete

### Rollback on Render

To revert to a previous version:

1. Go to the "Deployments" tab
2. Find the previous deployment you want to restore
3. Click the three-dot menu and select "Deploy to"
4. Confirm the rollback

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

## Default Credentials

The application creates a default admin account on first run. Credentials can be configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_EMAIL` | admin@microcrm.com | Admin email address |
| `ADMIN_PASSWORD` | auto-generated | Admin password (printed to console) |
| `ADMIN_NAME` | System Administrator | Admin display name |

**Production:** Set `ADMIN_PASSWORD` environment variable to ensure secure default credentials.

**Important:** Change these credentials immediately after first login for security purposes.

## Troubleshooting

### Application Won't Start

**Problem:** `Error: listen EADDRINUSE: address already in use 3000`

**Solution:** Another process is using port 3000. Either stop the other process or run:
```bash
PORT=3001 npm start
```

### Database Errors

**Problem:** `Error: SQLITE_ERROR: no such table: users`

**Solution:** The database hasn't been initialized. Ensure the application has write permissions to its directory. On Render.com, verify the persistent disk is properly mounted.

### Login Failures

> **Note (v1.0.1):** A critical bug causing login to not work has been fixed in the latest version. If you have an older deployment, please pull the latest code.

**Problem:** Login returns "Invalid credentials" even with correct password

**Solution:**
1. Clear browser cookies and cache
2. Try in incognito/private mode
3. Check that JWT_SECRET is correctly set in environment variables
4. Verify the database contains the user record

### Static Files Not Loading

**Problem:** CSS or JavaScript files return 404 or 500 errors

**Solution:** Ensure all files are committed and pushed to GitHub. Verify the `public` directory and its contents are present in the deployed code.

### Can't Create Projects, Tasks, or Invoices

**Problem:** Unable to create new projects, tasks, or invoices

**Solution:**
1. Ensure you're logged in (authentication required)
2. Check that required fields are filled (e.g., project name, task title, client for invoice)
3. For invoices, at least one item is required
4. Restart the server to apply route configuration changes

### Session Not Persisting

**Problem:** Logged out after refreshing the page

**Solution:** Check that cookies are enabled in the browser. The application uses HTTP-only cookies which require cookies to be enabled. Also verify CORS configuration if using a custom domain.

### Performance Issues

**Problem:** Slow page loads or timeouts

**Solution:**
- Check the application isn't exceeding free tier memory limits
- Optimize database queries by adding indexes
- Consider upgrading to a paid plan for better performance
- Monitor usage patterns to identify bottlenecks

## Security Considerations

### Built-in Security Features

1. **JWT Authentication** - Token-based auth with secure HTTP-only cookies
2. **Rate Limiting** - 10 requests/15min on auth endpoints, 100 requests/15min general
3. **Password Validation** - Minimum 8 chars with uppercase, lowercase, and number
4. **Input Sanitization** - Server-side XSS protection via HTML escaping
5. **Token Blacklist** - Logged out tokens are invalidated
6. **CORS Configuration** - Configurable allowed origins for production
7. **bcrypt Hashing** - Passwords hashed with cost factor 12

### Production Recommendations

1. **Environment Variables:** Set all security-related env vars:
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-secure-random-string
   ADMIN_PASSWORD=your-secure-admin-password
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

2. **HTTPS Only:** In production, ensure SSL/TLS is enabled. Render.com provides automatic HTTPS for custom domains.

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

2. **Database Backups:** While Render's persistent disk provides durability, consider regular backups for critical data.

3. **Monitor Logs:** Regularly review application logs for suspicious activity or errors.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository or contact the development team.

---

Built with ❤️ for freelancers everywhere.
