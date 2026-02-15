const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = global.db;
const { authenticateToken } = require('../middleware/auth');

// Get all recurring invoices
router.get('/', authenticateToken, (req, res) => {
  try {
    const recurringInvoices = db.recurringInvoice.getAllByUser(req.user.id);
    res.json(recurringInvoices.map(inv => ({
      ...inv,
      items: JSON.parse(inv.items || '[]')
    })));
  } catch (error) {
    console.error('Get recurring invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch recurring invoices' });
  }
});

// Get recurring invoice by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const invoice = db.recurringInvoice.getById(req.params.id, req.user.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Recurring invoice not found' });
    }
    invoice.items = JSON.parse(invoice.items || '[]');
    res.json(invoice);
  } catch (error) {
    console.error('Get recurring invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch recurring invoice' });
  }
});

// Create recurring invoice
router.post('/', authenticateToken, (req, res) => {
  try {
    const { client_id, project_id, items, tax_rate, frequency, next_invoice_date, notes } = req.body;

    if (!client_id || !items || items.length === 0 || !frequency || !next_invoice_date) {
      return res.status(400).json({ error: 'Client, items, frequency, and next invoice date are required' });
    }

    const invoiceId = 'recurring-' + uuidv4();
    db.recurringInvoice.create({
      id: invoiceId,
      user_id: req.user.id,
      client_id,
      project_id,
      items,
      tax_rate: tax_rate || 0,
      frequency,
      next_invoice_date,
      notes
    });

    const invoice = db.recurringInvoice.getById(invoiceId, req.user.id);
    invoice.items = JSON.parse(invoice.items || '[]');
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create recurring invoice error:', error);
    res.status(500).json({ error: 'Failed to create recurring invoice' });
  }
});

// Update recurring invoice
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { client_id, project_id, items, tax_rate, frequency, next_invoice_date, status, notes } = req.body;

    const existing = db.recurringInvoice.getById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Recurring invoice not found' });
    }

    db.recurringInvoice.update(req.params.id, req.user.id, {
      client_id,
      project_id,
      items,
      tax_rate: tax_rate || 0,
      frequency,
      next_invoice_date,
      status,
      notes
    });

    const invoice = db.recurringInvoice.getById(req.params.id, req.user.id);
    invoice.items = JSON.parse(invoice.items || '[]');
    res.json(invoice);
  } catch (error) {
    console.error('Update recurring invoice error:', error);
    res.status(500).json({ error: 'Failed to update recurring invoice' });
  }
});

// Delete recurring invoice
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const existing = db.recurringInvoice.getById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Recurring invoice not found' });
    }

    db.recurringInvoice.delete(req.params.id, req.user.id);
    res.json({ message: 'Recurring invoice deleted successfully' });
  } catch (error) {
    console.error('Delete recurring invoice error:', error);
    res.status(500).json({ error: 'Failed to delete recurring invoice' });
  }
});

// Get due recurring invoices (for cron job)
router.get('/due', authenticateToken, (req, res) => {
  try {
    const dueInvoices = db.recurringInvoice.getDue(req.user.id);
    res.json(dueInvoices.map(inv => ({
      ...inv,
      items: JSON.parse(inv.items || '[]')
    })));
  } catch (error) {
    console.error('Get due recurring invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch due invoices' });
  }
});

// Generate invoice from recurring template
router.post('/:id/generate', authenticateToken, (req, res) => {
  try {
    const recurring = db.recurringInvoice.getById(req.params.id, req.user.id);
    if (!recurring) {
      return res.status(404).json({ error: 'Recurring invoice not found' });
    }

    if (recurring.status !== 'active') {
      return res.status(400).json({ error: 'This recurring invoice is not active' });
    }

    // Generate invoice number
    const invoiceNumber = db.invoice.getNextInvoiceNumber(req.user.id);
    const items = JSON.parse(recurring.items || '[]');
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * (recurring.tax_rate || 0) / 100;
    const total = subtotal + taxAmount;

    // Create invoice
    const invoiceId = 'invoice-' + uuidv4();
    db.invoice.create({
      id: invoiceId,
      user_id: req.user.id,
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

    // Update next invoice date
    db.recurringInvoice.updateNextDate(req.params.id, req.user.id, recurring.frequency);

    const invoice = db.invoice.getById(invoiceId, req.user.id);
    invoice.items = JSON.parse(invoice.items || '[]');
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

module.exports = router;
