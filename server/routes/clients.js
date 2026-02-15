const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = global.db;
const { authenticateToken } = require('../middleware/auth');

function paginate(req, res, getDataFn) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const data = getDataFn(limit, offset);
  const total = data.length > 0 && req.query.total !== 'false' 
    ? db.client.getCountByUser(req.user.id) 
    : 0;

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

// Get all clients
router.get('/', authenticateToken, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    
    const clients = db.client.getAllByUser(req.user.id, limit, offset);
    const total = db.client.getCountByUser(req.user.id);
    
    res.json({
      data: clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get client stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const stats = db.client.getStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get single client
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const client = db.client.getById(req.params.id, req.user.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create client
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, email, phone, company, address, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const clientId = 'client-' + uuidv4();
    db.client.create({
      id: clientId,
      user_id: req.user.id,
      name,
      email,
      phone,
      company,
      address,
      notes
    });

    const client = db.client.getById(clientId, req.user.id);
    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { name, email, phone, company, address, notes } = req.body;

    const existing = db.client.getById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    db.client.update(req.params.id, req.user.id, { name, email, phone, company, address, notes });
    const client = db.client.getById(req.params.id, req.user.id);
    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete client
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const existing = db.client.getById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    db.client.delete(req.params.id, req.user.id);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;
