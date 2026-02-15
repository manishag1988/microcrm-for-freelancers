const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
let db = null;
let SQL = null;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@microcrm.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'System Administrator';

if (!ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  WARNING: ADMIN_PASSWORD environment variable not set for production!');
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}

async function initSql() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

function getDb() {
  return db;
}

async function loadDatabase() {
  const SQL = await initSql();
  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
  } catch (err) {
    console.log('Creating new database...');
    db = new SQL.Database();
  }
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function queryAll(sql, params = []) {
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function run(sql, params = []) {
  const processedParams = params.map(p => p === undefined ? null : p);
  db.run(sql, processedParams);
  saveDatabase();
}

async function initDatabase() {
  await loadDatabase();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      company_name TEXT,
      settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  db.run(`
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      UNIQUE(user_id, invoice_number)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS timelogs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      description TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration INTEGER DEFAULT 0,
      billable INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);

  // Recurring invoices table
  db.run(`
    CREATE TABLE IF NOT EXISTS recurring_invoices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      client_id TEXT,
      project_id TEXT,
      items TEXT NOT NULL,
      tax_rate REAL DEFAULT 0,
      frequency TEXT NOT NULL,
      next_invoice_date DATE NOT NULL,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);

  const adminExists = queryOne('SELECT * FROM users WHERE role = ?', ['admin']);
  if (!adminExists) {
    const defaultPassword = ADMIN_PASSWORD || 'Admin123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    const adminId = 'admin-' + Date.now();
    db.run(
      'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
      [adminId, ADMIN_EMAIL, hashedPassword, ADMIN_NAME, 'admin']
    );
    console.log(`✅ Default admin user created (email: ${ADMIN_EMAIL}, password: ${defaultPassword})`);
    if (!ADMIN_PASSWORD) {
      console.log('⚠️  WARNING: Set ADMIN_PASSWORD env var in production for security!');
    }
  }

  saveDatabase();
  return db;
}

const userOps = {
  findByEmail: (email) => {
    return queryOne('SELECT * FROM users WHERE email = ?', [email]);
  },
  findById: (id) => {
    return queryOne('SELECT id, email, name, role, company_name, settings, created_at FROM users WHERE id = ?', [id]);
  },
  create: (userData) => {
    run(
      'INSERT INTO users (id, email, password, name, role, company_name, settings) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userData.id, userData.email, userData.password, userData.name, userData.role || 'user', userData.company_name, '{}']
    );
    return { changes: 1 };
  },
  update: (id, data) => {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'password') {
        fields.push(`${key} = ?`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return { changes: 1 };
  },
  getAll: () => {
    return queryAll('SELECT id, email, name, role, company_name, created_at FROM users ORDER BY created_at DESC');
  },
  updateRole: (id, role) => {
    run('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, id]);
    return { changes: 1 };
  },
  delete: (id) => {
    run('DELETE FROM users WHERE id = ?', [id]);
    return { changes: 1 };
  }
};

const clientOps = {
  getAllByUser: (userId, limit = null, offset = 0) => {
    if (limit) {
      return queryAll('SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [userId, limit, offset]);
    }
    return queryAll('SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  },
  getCountByUser: (userId) => {
    const result = queryOne('SELECT COUNT(*) as count FROM clients WHERE user_id = ?', [userId]);
    return result?.count || 0;
  },
  getById: (id, userId) => {
    return queryOne('SELECT * FROM clients WHERE id = ? AND user_id = ?', [id, userId]);
  },
  create: (clientData) => {
    run(
      'INSERT INTO clients (id, user_id, name, email, phone, company, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [clientData.id, clientData.user_id, clientData.name, clientData.email, clientData.phone, clientData.company, clientData.address, clientData.notes]
    );
    return { changes: 1 };
  },
  update: (id, userId, data) => {
    run(
      'UPDATE clients SET name = ?, email = ?, phone = ?, company = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [data.name, data.email, data.phone, data.company, data.address, data.notes, id, userId]
    );
    return { changes: 1 };
  },
  delete: (id, userId) => {
    run('DELETE FROM clients WHERE id = ? AND user_id = ?', [id, userId]);
    return { changes: 1 };
  },
  getStats: (userId) => {
    const result = queryOne('SELECT COUNT(*) as total FROM clients WHERE user_id = ?', [userId]);
    return result || { total: 0 };
  }
};

const projectOps = {
  getAllByUser: (userId, limit = null, offset = 0) => {
    if (limit) {
      return queryAll(`
        SELECT p.*, c.name as client_name
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);
    }
    return queryAll(`
      SELECT p.*, c.name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId]);
  },
  getCountByUser: (userId) => {
    const result = queryOne('SELECT COUNT(*) as count FROM projects WHERE user_id = ?', [userId]);
    return result?.count || 0;
  },
  getById: (id, userId) => {
    return queryOne(`
      SELECT p.*, c.name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = ? AND p.user_id = ?
    `, [id, userId]);
  },
  create: (projectData) => {
    run(
      'INSERT INTO projects (id, user_id, client_id, name, description, status, budget, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [projectData.id, projectData.user_id, projectData.client_id, projectData.name, projectData.description, projectData.status || 'active', projectData.budget || 0, projectData.deadline]
    );
    return { changes: 1 };
  },
  update: (id, userId, data) => {
    run(
      'UPDATE projects SET client_id = ?, name = ?, description = ?, status = ?, budget = ?, deadline = ?, progress = COALESCE(?, progress), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [data.client_id, data.name, data.description, data.status, data.budget, data.deadline, data.progress ?? null, id, userId]
    );
    return { changes: 1 };
  },
  delete: (id, userId) => {
    run('DELETE FROM projects WHERE id = ? AND user_id = ?', [id, userId]);
    return { changes: 1 };
  },
  getStats: (userId) => {
    const active = queryOne("SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status = 'active'", [userId]);
    const completed = queryOne("SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status = 'completed'", [userId]);
    const totalBudget = queryOne("SELECT SUM(budget) as total FROM projects WHERE user_id = ?", [userId]);
    return { active: active?.count || 0, completed: completed?.count || 0, totalBudget: totalBudget?.total || 0 };
  }
};

const taskOps = {
  getAllByUser: (userId, limit = null, offset = 0) => {
    if (limit) {
      return queryAll(`
        SELECT t.*, p.name as project_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);
    }
    return queryAll(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [userId]);
  },
  getCountByUser: (userId) => {
    const result = queryOne('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [userId]);
    return result?.count || 0;
  },
  getByProject: (projectId, userId) => {
    return queryAll('SELECT * FROM tasks WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC', [projectId, userId]);
  },
  getById: (id, userId) => {
    return queryOne('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
  },
  create: (taskData) => {
    run(
      'INSERT INTO tasks (id, user_id, project_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [taskData.id, taskData.user_id, taskData.project_id, taskData.title, taskData.description, taskData.status || 'todo', taskData.priority || 'medium', taskData.due_date]
    );
    return { changes: 1 };
  },
  update: (id, userId, data) => {
    run(
      'UPDATE tasks SET project_id = ?, title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [data.project_id, data.title, data.description, data.status, data.priority, data.due_date, id, userId]
    );
    return { changes: 1 };
  },
  updateStatus: (id, userId, status) => {
    run('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [status, id, userId]);
    return { changes: 1 };
  },
  delete: (id, userId) => {
    run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
    return { changes: 1 };
  },
  getStats: (userId) => {
    const todo = queryOne("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'todo'", [userId]);
    const inProgress = queryOne("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'in_progress'", [userId]);
    const done = queryOne("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'done'", [userId]);
    return { todo: todo?.count || 0, inProgress: inProgress?.count || 0, done: done?.count || 0 };
  }
};

const invoiceOps = {
  getAllByUser: (userId, limit = null, offset = 0) => {
    if (limit) {
      return queryAll(`
        SELECT i.*, c.name as client_name
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.user_id = ?
        ORDER BY i.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);
    }
    return queryAll(`
      SELECT i.*, c.name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `, [userId]);
  },
  getCountByUser: (userId) => {
    const result = queryOne('SELECT COUNT(*) as count FROM invoices WHERE user_id = ?', [userId]);
    return result?.count || 0;
  },
  getById: (id, userId) => {
    return queryOne(`
      SELECT i.*, c.name as client_name, c.email as client_email, c.company as client_company, c.address as client_address
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = ? AND i.user_id = ?
    `, [id, userId]);
  },
  create: (invoiceData) => {
    run(
      'INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, items, subtotal, tax_rate, tax_amount, total, status, due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [invoiceData.id, invoiceData.user_id, invoiceData.client_id, invoiceData.project_id, invoiceData.invoice_number, JSON.stringify(invoiceData.items), invoiceData.subtotal, invoiceData.tax_rate || 0, invoiceData.tax_amount || 0, invoiceData.total, invoiceData.status || 'draft', invoiceData.due_date, invoiceData.notes]
    );
    return { changes: 1 };
  },
  update: (id, userId, data) => {
    try {
      const itemsJson = JSON.stringify(data.items);
      console.log('Updating invoice:', { id, userId, items: itemsJson });
      run(
        'UPDATE invoices SET client_id = ?, project_id = ?, items = ?, subtotal = ?, tax_rate = ?, tax_amount = ?, total = ?, status = ?, due_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [data.client_id, data.project_id, itemsJson, data.subtotal, data.tax_rate, data.tax_amount, data.total, data.status, data.due_date, data.notes, id, userId]
      );
      return { changes: 1 };
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },
  updateStatus: (id, userId, status) => {
    run('UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [status, id, userId]);
    return { changes: 1 };
  },
  delete: (id, userId) => {
    run('DELETE FROM invoices WHERE id = ? AND user_id = ?', [id, userId]);
    return { changes: 1 };
  },
  getStats: (userId) => {
    const total = queryOne("SELECT COUNT(*) as count FROM invoices WHERE user_id = ?", [userId]);
    const paid = queryOne("SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount FROM invoices WHERE user_id = ? AND status = 'paid'", [userId]);
    const pending = queryOne("SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount FROM invoices WHERE user_id = ? AND status IN ('sent', 'draft')", [userId]);
    const overdue = queryOne("SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount FROM invoices WHERE user_id = ? AND status = 'overdue'", [userId]);
    return { 
      total: total?.count || 0, 
      paid: paid?.count || 0, 
      paidAmount: paid?.amount || 0, 
      pending: pending?.count || 0, 
      pendingAmount: pending?.amount || 0, 
      overdue: overdue?.count || 0, 
      overdueAmount: overdue?.amount || 0 
    };
  },
  getNextInvoiceNumber: (userId) => {
    const result = queryOne('SELECT MAX(CAST(SUBSTR(invoice_number, 5) AS INTEGER)) as maxNum FROM invoices WHERE user_id = ? AND invoice_number LIKE "INV-%"', [userId]);
    const nextNum = (result?.maxNum || 0) + 1;
    return `INV-${String(nextNum).padStart(5, '0')}`;
  }
};

const timeLogOps = {
  getAllByUser: (userId, limit = null, offset = 0) => {
    if (limit) {
      return queryAll(`
        SELECT tl.*, p.name as project_name
        FROM timelogs tl
        LEFT JOIN projects p ON tl.project_id = p.id
        WHERE tl.user_id = ?
        ORDER BY tl.start_time DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);
    }
    return queryAll(`
      SELECT tl.*, p.name as project_name
      FROM timelogs tl
      LEFT JOIN projects p ON tl.project_id = p.id
      WHERE tl.user_id = ?
      ORDER BY tl.start_time DESC
    `, [userId]);
  },
  getCountByUser: (userId) => {
    const result = queryOne('SELECT COUNT(*) as count FROM timelogs WHERE user_id = ?', [userId]);
    return result?.count || 0;
  },
  getByProject: (projectId, userId) => {
    return queryAll('SELECT * FROM timelogs WHERE project_id = ? AND user_id = ? ORDER BY start_time DESC', [projectId, userId]);
  },
  getActive: (userId) => {
    return queryOne('SELECT * FROM timelogs WHERE user_id = ? AND end_time IS NULL', [userId]);
  },
  create: (timeLogData) => {
    run(
      'INSERT INTO timelogs (id, user_id, project_id, description, start_time, billable) VALUES (?, ?, ?, ?, ?, ?)',
      [timeLogData.id, timeLogData.user_id, timeLogData.project_id, timeLogData.description, timeLogData.start_time, timeLogData.billable !== false ? 1 : 0]
    );
    return { changes: 1 };
  },
  stop: (id, userId) => {
    try {
      const log = queryOne('SELECT * FROM timelogs WHERE id = ? AND user_id = ?', [id, userId]);
      if (!log) return null;
      const endTime = new Date();
      const startTime = new Date(log.start_time);
      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid start_time in timelog');
      }
      const duration = Math.floor((endTime - startTime) / 1000);
      run('UPDATE timelogs SET end_time = ?, duration = ? WHERE id = ? AND user_id = ?', [endTime.toISOString(), duration, id, userId]);
      return { ...log, end_time: endTime, duration };
    } catch (error) {
      console.error('Error stopping timelog:', error);
      throw error;
    }
  },
  update: (id, userId, data) => {
    run(
      'UPDATE timelogs SET project_id = ?, description = ?, duration = ?, billable = ? WHERE id = ? AND user_id = ?',
      [data.project_id, data.description, data.duration, data.billable ? 1 : 0, id, userId]
    );
    return { changes: 1 };
  },
  delete: (id, userId) => {
    run('DELETE FROM timelogs WHERE id = ? AND user_id = ?', [id, userId]);
    return { changes: 1 };
  },
  getStats: (userId) => {
    const total = queryOne("SELECT COALESCE(SUM(duration), 0) as total FROM timelogs WHERE user_id = ?", [userId]);
    const thisWeek = queryOne("SELECT COALESCE(SUM(duration), 0) as total FROM timelogs WHERE user_id = ? AND start_time >= datetime('now', '-7 days')", [userId]);
    const billable = queryOne("SELECT COALESCE(SUM(duration), 0) as total FROM timelogs WHERE user_id = ? AND billable = 1", [userId]);
    return { total: total?.total || 0, thisWeek: thisWeek?.total || 0, billable: billable?.total || 0 };
  }
};

const recurringInvoiceOps = {
  getAllByUser: (userId) => {
    return queryAll(`
      SELECT r.*, c.name as client_name 
      FROM recurring_invoices r
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.user_id = ?
      ORDER BY r.next_invoice_date ASC
    `, [userId]);
  },
  getById: (id, userId) => {
    return queryOne(`
      SELECT r.*, c.name as client_name 
      FROM recurring_invoices r
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.id = ? AND r.user_id = ?
    `, [id, userId]);
  },
  create: (data) => {
    run(
      'INSERT INTO recurring_invoices (id, user_id, client_id, project_id, items, tax_rate, frequency, next_invoice_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.user_id, data.client_id, data.project_id, JSON.stringify(data.items), data.tax_rate || 0, data.frequency, data.next_invoice_date, data.status || 'active', data.notes]
    );
    return { changes: 1 };
  },
  update: (id, userId, data) => {
    run(
      'UPDATE recurring_invoices SET client_id = ?, project_id = ?, items = ?, tax_rate = ?, frequency = ?, next_invoice_date = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [data.client_id, data.project_id, JSON.stringify(data.items), data.tax_rate, data.frequency, data.next_invoice_date, data.status, data.notes, id, userId]
    );
    return { changes: 1 };
  },
  delete: (id, userId) => {
    run('DELETE FROM recurring_invoices WHERE id = ? AND user_id = ?', [id, userId]);
    return { changes: 1 };
  },
  getDue: (userId) => {
    return queryAll(`
      SELECT r.*, c.name as client_name 
      FROM recurring_invoices r
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.user_id = ? AND r.status = 'active' AND r.next_invoice_date <= date('now')
      ORDER BY r.next_invoice_date ASC
    `, [userId]);
  },
  updateNextDate: (id, userId, frequency) => {
    // Calculate next date based on frequency
    let nextDate = new Date();
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    run(
      'UPDATE recurring_invoices SET next_invoice_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [nextDate.toISOString().split('T')[0], id, userId]
    );
    return { changes: 1 };
  }
};

module.exports = {
  getDb,
  initDatabase,
  user: userOps,
  client: clientOps,
  project: projectOps,
  task: taskOps,
  invoice: invoiceOps,
  timelog: timeLogOps,
  recurringInvoice: recurringInvoiceOps
};
