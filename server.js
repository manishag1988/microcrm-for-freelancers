const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3000;
const USE_PG = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;

const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for rate limiting and headers when behind a reverse proxy (e.g., Railway)
app.set('trust proxy', 1);

const allowedOrigins = isProduction 
  ? (process.env.ALLOWED_ORIGINS?.split(',') || [])
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: isProduction 
    ? (allowedOrigins.length > 0 ? allowedOrigins : false)
    : true,
  credentials: true
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skipSuccessfulRequests: false,
  message: { error: 'Too many login attempts, please try again later' }
});

app.use(generalLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const { initEmail, setupNotificationRoutes } = require('./server/utils/email');
initEmail();

app.use((req, res, next) => {
  if (isProduction && process.env.LOG_REQUESTS !== 'true') {
    return next();
  }
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000 || res.statusCode >= 400) {
      console.log(`[${res.statusCode}] ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
});

let db;
let initDatabase;

if (USE_PG) {
  console.log('🗄️  Using PostgreSQL database...');
  const { initPostgresDatabase, pgOperations } = require('./server/models/database-pg');
  db = pgOperations;
  initDatabase = initPostgresDatabase;
} else {
  console.log('🗄️  Using SQLite database...');
  const { initDatabase: initSqlite, ...sqliteDb } = require('./server/models/database');
  db = sqliteDb;
  initDatabase = initSqlite;
}

global.db = db;

const authRoutes = require('./server/routes/auth');
const clientRoutes = require('./server/routes/clients');
const projectRoutes = require('./server/routes/projects');
const taskRoutes = require('./server/routes/tasks');
const invoiceRoutes = require('./server/routes/invoices');
const timeLogRoutes = require('./server/routes/timelogs');
const recurringInvoiceRoutes = require('./server/routes/recurring-invoices');
const clientPortalRoutes = require('./server/routes/client-portal');
const backupRestoreRoutes = require('./server/routes/backup-restore');
const adminRoutes = require('./server/routes/admin');

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/timelogs', timeLogRoutes);
app.use('/api/recurring-invoices', recurringInvoiceRoutes);
app.use('/api/portal', clientPortalRoutes);
app.use('/api/backup', backupRestoreRoutes);
app.use('/api/admin', adminRoutes);

setupNotificationRoutes(app);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: USE_PG ? 'postgresql' : 'sqlite'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  if (err.code === 'SQLITE_CANTOPEN' || err.code === 'ECONNREFUSED') {
    return res.status(503).json({ error: 'Database connection failed' });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

async function processRecurringInvoices() {
  try {
    if (!db || !db.recurringInvoice) return;
    
    const users = db.user.getAll();
    for (const user of users) {
      try {
        const dueInvoices = db.recurringInvoice.getDue(user.id);
        for (const recurring of dueInvoices) {
          const items = typeof recurring.items === 'string' ? JSON.parse(recurring.items) : recurring.items;
          const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
          const taxAmount = subtotal * (recurring.tax_rate || 0) / 100;
          const total = subtotal + taxAmount;
          
          const invoiceId = 'invoice-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          const invoiceNumber = db.invoice.getNextInvoiceNumber(user.id);
          
          db.invoice.create({
            id: invoiceId,
            user_id: user.id,
            client_id: recurring.client_id,
            project_id: recurring.project_id,
            invoice_number: invoiceNumber,
            items,
            subtotal,
            tax_rate: recurring.tax_rate || 0,
            tax_amount: taxAmount,
            total,
            status: 'draft',
            notes: recurring.notes
          });
          
          db.recurringInvoice.updateNextDate(recurring.id, user.id, recurring.frequency);
          console.log(`📄 Generated invoice ${invoiceNumber} from recurring template for user ${user.email}`);
        }
      } catch (err) {
        console.error(`Error processing recurring invoices for user ${user.id}:`, err);
      }
    }
  } catch (err) {
    console.error('Error in recurring invoice cron:', err);
  }
}

let cronInterval;
function startCronJobs() {
  cronInterval = setInterval(processRecurringInvoices, 60 * 60 * 1000);
  console.log('⏰ Cron jobs started - checking recurring invoices every hour');
}

async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Database initialized successfully');

    startCronJobs();

    app.listen(PORT, () => {
      console.log(`🚀 Micro-CRM Server running at http://localhost:${PORT}`);
      console.log('📊 Admin panel available at /admin (requires admin role)');
      if (USE_PG) {
        console.log('🗄️  Database: PostgreSQL');
      } else {
        console.log('🗄️  Database: SQLite (development mode)');
      }
      if (isProduction) {
        console.log('🔒 Running in PRODUCTION mode');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
