const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = global.db;
const { authenticateToken } = require('../middleware/auth');

function safeJsonParse(str, defaultValue = []) {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('JSON parse error:', e);
    return defaultValue;
  }
}

// Get all invoices
router.get('/', authenticateToken, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    
    const invoices = db.invoice.getAllByUser(req.user.id, limit, offset);
    const total = db.invoice.getCountByUser(req.user.id);
    
    res.json({
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get invoice stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const stats = db.invoice.getStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get next invoice number
router.get('/next-number', authenticateToken, (req, res) => {
  try {
    const nextNumber = db.invoice.getNextInvoiceNumber(req.user.id);
    res.json({ invoice_number: nextNumber });
  } catch (error) {
    console.error('Get next invoice number error:', error);
    res.status(500).json({ error: 'Failed to generate invoice number' });
  }
});

// Get single invoice
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const invoice = db.invoice.getById(req.params.id, req.user.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    invoice.items = safeJsonParse(invoice.items);
    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create invoice
router.post('/', authenticateToken, (req, res) => {
  try {
    const { client_id, project_id, items, tax_rate, due_date, notes } = req.body;

    if (!client_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Client and at least one item are required' });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * (tax_rate || 0) / 100;
    const total = subtotal + taxAmount;

    let invoice = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!invoice && attempts < maxAttempts) {
      try {
        const invoiceId = 'invoice-' + uuidv4();
        const invoiceNumber = db.invoice.getNextInvoiceNumber(req.user.id);

        db.invoice.create({
          id: invoiceId,
          user_id: req.user.id,
          client_id,
          project_id,
          invoice_number: invoiceNumber,
          items,
          subtotal,
          tax_rate: tax_rate || 0,
          tax_amount: taxAmount,
          total,
          due_date,
          notes
        });

        invoice = db.invoice.getById(invoiceId, req.user.id);
        invoice.items = safeJsonParse(invoice.items);
      } catch (err) {
        if (err.message?.includes('UNIQUE constraint failed') || attempts >= maxAttempts - 1) {
          throw err;
        }
        attempts++;
      }
    }

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice: ' + error.message });
  }
});

// Update invoice
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { client_id, project_id, items, tax_rate, due_date, notes, status } = req.body;

    const existing = db.invoice.getById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * (tax_rate || 0) / 100;
    const total = subtotal + taxAmount;

    db.invoice.update(req.params.id, req.user.id, {
      client_id,
      project_id,
      items,
      subtotal,
      tax_rate: tax_rate || 0,
      tax_amount: taxAmount,
      total,
      status: status || existing.status || 'draft',
      due_date,
      notes
    });

    const invoice = db.invoice.getById(req.params.id, req.user.id);
    invoice.items = safeJsonParse(invoice.items);
    res.json(invoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice: ' + (error.message || error.stack || 'Unknown error') });
  }
});

// Update invoice status (quick update)
router.patch('/:id/status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    db.invoice.updateStatus(req.params.id, req.user.id, status);
    const invoice = db.invoice.getById(req.params.id, req.user.id);
    invoice.items = safeJsonParse(invoice.items);
    res.json(invoice);
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete invoice
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const existing = db.invoice.getById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    db.invoice.delete(req.params.id, req.user.id);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;
