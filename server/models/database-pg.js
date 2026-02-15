const { Pool } = require('pg');

let pool = null;

async function initPostgresDatabase() {
  const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL or PG_CONNECTION_STRING environment variable is required for PostgreSQL');
  }

  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Test connection
  const client = await pool.connect();
  console.log('PostgreSQL connected successfully');
  client.release();

  // Create tables
  await createTables();
  
  // Seed admin user if not exists
  await seedAdminUser();
  
  return pool;
}

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        company_name TEXT,
        settings TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        client_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        budget REAL DEFAULT 0,
        deadline DATE,
        progress INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        client_id TEXT,
        project_id TEXT,
        invoice_number TEXT NOT NULL,
        items TEXT NOT NULL,
        subtotal REAL NOT NULL,
        tax_rate REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        total REAL NOT NULL,
        status TEXT DEFAULT 'draft',
        issue_date DATE DEFAULT CURRENT_DATE,
        due_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS timelogs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_id TEXT,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration INTEGER,
        billable INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      )
    `);

    console.log('PostgreSQL tables created successfully');
  } finally {
    client.release();
  }
}

async function seedAdminUser() {
  const { v4: uuidv4 } = require('uuid');
  const bcrypt = require('bcryptjs');
  
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@microcrm.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_NAME = process.env.ADMIN_NAME || 'System Administrator';
  
  if (!ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: ADMIN_PASSWORD environment variable not set for production!');
  }
  
  const client = await pool.connect();
  try {
    const existingAdmin = await client.query('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);
    
    if (existingAdmin.rows.length === 0) {
      const adminId = 'user-' + uuidv4();
      const defaultPassword = ADMIN_PASSWORD || 'admin' + Date.now().toString().slice(-4);
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      await client.query(`
        INSERT INTO users (id, email, password, name, role, company_name)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [adminId, ADMIN_EMAIL, hashedPassword, ADMIN_NAME, 'admin', 'Micro-CRM']);
      
      console.log(`Admin user seeded: ${ADMIN_EMAIL} / ${defaultPassword}`);
      if (!ADMIN_PASSWORD) {
        console.log('⚠️  WARNING: Set ADMIN_PASSWORD env var in production for security!');
      }
    }
  } finally {
    client.release();
  }
}

// Helper functions to match SQLite API
function queryOne(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await pool.query(sql, params);
      resolve(result.rows[0] || null);
    } catch (error) {
      console.error('Query error:', error);
      reject(error);
    }
  });
}

function queryAll(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await pool.query(sql, params);
      resolve(result.rows);
    } catch (error) {
      console.error('Query error:', error);
      reject(error);
    }
  });
}

function run(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    try {
      await pool.query(sql, params);
      resolve({ changes: 1 });
    } catch (error) {
      console.error('Run error:', error);
      reject(error);
    }
  });
}

// PostgreSQL operations - matches SQLite API
const pgOperations = {
  // User operations
  user: {
    findByEmail: (email) => queryOne('SELECT * FROM users WHERE email = $1', [email]),
    findById: (id) => queryOne('SELECT * FROM users WHERE id = $1', [id]),
    create: (userData) => run(
      'INSERT INTO users (id, email, password, name, role, company_name) VALUES ($1, $2, $3, $4, $5, $6)',
      [userData.id, userData.email, userData.password, userData.name, userData.role || 'user', userData.company_name]
    ),
    update: (id, data) => {
      const fields = [];
      const values = [];
      let idx = 1;
      
      if (data.name) { fields.push(`name = $${idx++}`); values.push(data.name); }
      if (data.email) { fields.push(`email = $${idx++}`); values.push(data.email); }
      if (data.password) { fields.push(`password = $${idx++}`); values.push(data.password); }
      if (data.role) { fields.push(`role = $${idx++}`); values.push(data.role); }
      if (data.company_name !== undefined) { fields.push(`company_name = $${idx++}`); values.push(data.company_name); }
      if (data.settings) { fields.push(`settings = $${idx++}`); values.push(JSON.stringify(data.settings)); }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      return run(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    },
    getAll: () => queryAll('SELECT * FROM users ORDER BY created_at DESC')
  },

  // Client operations
  client: {
    getAllByUser: (userId) => queryAll('SELECT * FROM clients WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    getById: (id, userId) => queryOne('SELECT * FROM clients WHERE id = $1 AND user_id = $2', [id, userId]),
    create: (clientData) => run(
      'INSERT INTO clients (id, user_id, name, email, phone, company, address, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [clientData.id, clientData.user_id, clientData.name, clientData.email, clientData.phone, clientData.company, clientData.address, clientData.notes]
    ),
    update: (id, userId, data) => run(
      'UPDATE clients SET name = $1, email = $2, phone = $3, company = $4, address = $5, notes = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND user_id = $8',
      [data.name, data.email, data.phone, data.company, data.address, data.notes, id, userId]
    ),
    delete: (id, userId) => run('DELETE FROM clients WHERE id = $1 AND user_id = $2', [id, userId]),
    stats: (userId) => queryOne('SELECT COUNT(*) as total FROM clients WHERE user_id = $1', [userId])
  },

  // Project operations
  project: {
    getAllByUser: (userId) => queryAll(`
      SELECT p.*, c.name as client_name 
      FROM projects p 
      LEFT JOIN clients c ON p.client_id = c.id 
      WHERE p.user_id = $1 
      ORDER BY p.created_at DESC`, [userId]),
    getById: (id, userId) => queryOne(`
      SELECT p.*, c.name as client_name 
      FROM projects p 
      LEFT JOIN clients c ON p.client_id = c.id 
      WHERE p.id = $1 AND p.user_id = $2`, [id, userId]),
    create: (projectData) => run(
      'INSERT INTO projects (id, user_id, client_id, name, description, status, budget, deadline, progress) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [projectData.id, projectData.user_id, projectData.client_id, projectData.name, projectData.description, projectData.status || 'active', projectData.budget, projectData.deadline, projectData.progress || 0]
    ),
    update: (id, userId, data) => run(
      'UPDATE projects SET name = $1, client_id = $2, description = $3, status = $4, budget = $5, deadline = $6, progress = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 AND user_id = $9',
      [data.name, data.client_id, data.description, data.status, data.budget, data.deadline, data.progress, id, userId]
    ),
    delete: (id, userId) => run('DELETE FROM projects WHERE id = $1 AND user_id = $2', [id, userId]),
    stats: (userId) => queryOne(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM projects WHERE user_id = $1`, [userId])
  },

  // Task operations
  task: {
    getAllByUser: (userId) => queryAll(`
      SELECT t.*, p.name as project_name 
      FROM tasks t 
      LEFT JOIN projects p ON t.project_id = p.id 
      WHERE t.user_id = $1 
      ORDER BY t.created_at DESC`, [userId]),
    getById: (id, userId) => queryOne(`
      SELECT t.*, p.name as project_name 
      FROM tasks t 
      LEFT JOIN projects p ON t.project_id = p.id 
      WHERE t.id = $1 AND t.user_id = $2`, [id, userId]),
    create: (taskData) => run(
      'INSERT INTO tasks (id, user_id, project_id, title, description, status, priority, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [taskData.id, taskData.user_id, taskData.project_id, taskData.title, taskData.description, taskData.status || 'todo', taskData.priority || 'medium', taskData.due_date]
    ),
    update: (id, userId, data) => run(
      'UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, project_id = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND user_id = $8',
      [data.title, data.description, data.status, data.priority, data.due_date, data.project_id, id, userId]
    ),
    updateStatus: (id, userId, status) => run(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
      [status, id, userId]
    ),
    delete: (id, userId) => run('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]),
    stats: (userId) => queryOne(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as inProgress,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as done
      FROM tasks WHERE user_id = $1`, [userId])
  },

  // Invoice operations
  invoice: {
    getAllByUser: (userId) => queryAll(`
      SELECT i.*, c.name as client_name 
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id 
      WHERE i.user_id = $1 
      ORDER BY i.created_at DESC`, [userId]),
    getById: (id, userId) => queryOne(`
      SELECT i.*, c.name as client_name, c.email as client_email, c.company as client_company, c.address as client_address
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id 
      WHERE i.id = $1 AND i.user_id = $2`, [id, userId]),
    create: (invoiceData) => run(
      'INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, items, subtotal, tax_rate, tax_amount, total, status, due_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
      [invoiceData.id, invoiceData.user_id, invoiceData.client_id, invoiceData.project_id, invoiceData.invoice_number, JSON.stringify(invoiceData.items), invoiceData.subtotal, invoiceData.tax_rate || 0, invoiceData.tax_amount || 0, invoiceData.total, invoiceData.status || 'draft', invoiceData.due_date, invoiceData.notes]
    ),
    update: (id, userId, data) => run(
      'UPDATE invoices SET client_id = $1, project_id = $2, items = $3, subtotal = $4, tax_rate = $5, tax_amount = $6, total = $7, status = $8, due_date = $9, notes = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11 AND user_id = $12',
      [data.client_id, data.project_id, JSON.stringify(data.items), data.subtotal, data.tax_rate, data.tax_amount, data.total, data.status, data.due_date, data.notes, id, userId]
    ),
    updateStatus: (id, userId, status) => run(
      'UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
      [status, id, userId]
    ),
    delete: (id, userId) => run('DELETE FROM invoices WHERE id = $1 AND user_id = $2', [id, userId]),
    getStats: (userId) => queryOne(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
        COUNT(CASE WHEN status IN ('sent', 'draft') THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total END), 0) as paidAmount,
        COALESCE(SUM(CASE WHEN status IN ('sent', 'draft') THEN total END), 0) as pendingAmount,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN total END), 0) as overdueAmount
      FROM invoices WHERE user_id = $1`, [userId]),
    getNextInvoiceNumber: (userId) => {
      return new Promise(async (resolve, reject) => {
        try {
          const result = await pool.query(
            "SELECT invoice_number FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
            [userId]
          );
          if (result.rows.length === 0) {
            resolve('INV-0001');
          } else {
            const last = result.rows[0].invoice_number;
            const match = last.match(/^INV-(\d+)/);
            const num = match ? parseInt(match[1]) : 0;
            resolve(`INV-${String(num + 1).padStart(4, '0')}`);
          }
        } catch (error) {
          reject(error);
        }
      });
    }
  },

  // Timelog operations
  timelog: {
    getAllByUser: (userId) => queryAll(`
      SELECT tl.*, p.name as project_name 
      FROM timelogs tl 
      LEFT JOIN projects p ON tl.project_id = p.id 
      WHERE tl.user_id = $1 
      ORDER BY tl.start_time DESC`, [userId]),
    getById: (id, userId) => queryOne('SELECT * FROM timelogs WHERE id = $1 AND user_id = $2', [id, userId]),
    getActive: (userId) => queryOne('SELECT * FROM timelogs WHERE user_id = $1 AND end_time IS NULL', [userId]),
    create: (timeLogData) => run(
      'INSERT INTO timelogs (id, user_id, project_id, description, start_time, billable) VALUES ($1, $2, $3, $4, $5, $6)',
      [timeLogData.id, timeLogData.user_id, timeLogData.project_id, timeLogData.description, timeLogData.start_time, timeLogData.billable !== false ? 1 : 0]
    ),
    stop: (id, userId) => {
      return new Promise(async (resolve, reject) => {
        try {
          const log = await queryOne('SELECT * FROM timelogs WHERE id = $1 AND user_id = $2', [id, userId]);
          if (!log) return resolve(null);
          const endTime = new Date();
          const startTime = new Date(log.start_time);
          const duration = Math.floor((endTime - startTime) / 1000);
          await run('UPDATE timelogs SET end_time = $1, duration = $2 WHERE id = $3 AND user_id = $4', [endTime, duration, id, userId]);
          resolve({ ...log, end_time: endTime, duration });
        } catch (error) {
          reject(error);
        }
      });
    },
    update: (id, userId, data) => run(
      'UPDATE timelogs SET project_id = $1, description = $2, duration = $3, billable = $4 WHERE id = $5 AND user_id = $6',
      [data.project_id, data.description, data.duration, data.billable ? 1 : 0, id, userId]
    ),
    delete: (id, userId) => run('DELETE FROM timelogs WHERE id = $1 AND user_id = $2', [id, userId]),
    getStats: (userId) => queryOne(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(duration), 0) as totalDuration,
        COALESCE(SUM(CASE WHEN billable = 1 THEN duration END), 0) as billableDuration
      FROM timelogs WHERE user_id = $1`, [userId])
  }
};

module.exports = {
  initPostgresDatabase,
  pgOperations,
  getPool: () => pool
};
