const express = require('express');
const router = express.Router();
const db = global.db;
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Get full database backup
router.get('/backup', authenticateToken, (req, res) => {
  try {
    // Get all data
    const users = db.user.getAll();
    const clients = db.client.getAllByUser(req.user.id);
    const projects = db.project.getAllByUser(req.user.id);
    const tasks = db.task.getAllByUser(req.user.id);
    const invoices = db.invoice.getAllByUser(req.user.id);
    const timelogs = db.timelog.getAllByUser(req.user.id);
    
    // Parse items JSON for invoices
    const parsedInvoices = invoices.map(inv => ({
      ...inv,
      items: JSON.parse(inv.items || '[]')
    }));

    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      },
      data: {
        clients,
        projects,
        tasks,
        invoices: parsedInvoices,
        timelogs
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="micro-crm-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(backup);
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Restore data from backup
router.post('/restore', authenticateToken, (req, res) => {
  try {
    const { clients, projects, tasks, invoices, timelogs } = req.body;

    if (!clients || !Array.isArray(clients)) {
      return res.status(400).json({ error: 'Invalid backup data' });
    }

    const { v4: uuidv4 } = require('uuid');
    const results = {
      clients: 0,
      projects: 0,
      tasks: 0,
      invoices: 0,
      timelogs: 0
    };

    // Import clients
    if (clients && Array.isArray(clients)) {
      for (const client of clients) {
        const existing = db.client.getById(client.id, req.user.id);
        if (!existing) {
          db.client.create({
            id: client.id || 'client-' + uuidv4(),
            user_id: req.user.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            company: client.company,
            address: client.address,
            notes: client.notes
          });
          results.clients++;
        }
      }
    }

    // Import projects
    if (projects && Array.isArray(projects)) {
      for (const project of projects) {
        const existing = db.project.getById(project.id, req.user.id);
        if (!existing) {
          db.project.create({
            id: project.id || 'project-' + uuidv4(),
            user_id: req.user.id,
            client_id: project.client_id,
            name: project.name,
            description: project.description,
            status: project.status,
            budget: project.budget,
            deadline: project.deadline,
            progress: project.progress
          });
          results.projects++;
        }
      }
    }

    // Import tasks
    if (tasks && Array.isArray(tasks)) {
      for (const task of tasks) {
        const existing = db.task.getById(task.id, req.user.id);
        if (!existing) {
          db.task.create({
            id: task.id || 'task-' + uuidv4(),
            user_id: req.user.id,
            project_id: task.project_id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            due_date: task.due_date
          });
          results.tasks++;
        }
      }
    }

    // Import invoices
    if (invoices && Array.isArray(invoices)) {
      for (const invoice of invoices) {
        const existing = db.invoice.getById(invoice.id, req.user.id);
        if (!existing) {
          db.invoice.create({
            id: invoice.id || 'invoice-' + uuidv4(),
            user_id: req.user.id,
            client_id: invoice.client_id,
            project_id: invoice.project_id,
            invoice_number: invoice.invoice_number,
            items: invoice.items,
            subtotal: invoice.subtotal,
            tax_rate: invoice.tax_rate,
            tax_amount: invoice.tax_amount,
            total: invoice.total,
            status: invoice.status,
            due_date: invoice.due_date,
            notes: invoice.notes
          });
          results.invoices++;
        }
      }
    }

    // Import time logs
    if (timelogs && Array.isArray(timelogs)) {
      for (const timelog of timelogs) {
        const existing = db.timelog.getById(timelog.id, req.user.id);
        if (!existing) {
          db.timelog.create({
            id: timelog.id || 'timelog-' + uuidv4(),
            user_id: req.user.id,
            project_id: timelog.project_id,
            description: timelog.description,
            start_time: timelog.start_time,
            billable: timelog.billable
          });
          results.timelogs++;
        }
      }
    }

    res.json({
      message: 'Restore completed',
      results
    });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Failed to restore data: ' + error.message });
  }
});

// Upload and restore from file
router.post('/restore/upload', authenticateToken, (req, res) => {
  try {
    const { backupData } = req.body;
    
    if (!backupData) {
      return res.status(400).json({ error: 'No backup data provided' });
    }

    // Re-use the restore logic
    req.body = backupData;
    return router.stack
      .find(r => r.path === '/restore' && r.methods.post)
      .route.stack[0].handle(req, res);
  } catch (error) {
    console.error('Upload restore error:', error);
    res.status(500).json({ error: 'Failed to restore from file' });
  }
});

module.exports = router;
