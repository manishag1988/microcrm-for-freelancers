const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = global.db;
const { authenticateToken, generateToken } = require('../middleware/auth');

// Client portal login (simplified authentication)
router.post('/portal-login', async (req, res) => {
  try {
    const { client_id, client_token } = req.body;

    if (!client_id || !client_token) {
      return res.status(400).json({ error: 'Client ID and token are required' });
    }

    // Find client by ID
    const client = db.client.getById(client_id, client_token);
    if (!client) {
      return res.status(401).json({ error: 'Invalid client credentials' });
    }

    // Generate client token
    const token = generateToken({
      id: client.id,
      email: client.email,
      name: client.name,
      role: 'client',
      user_id: client_token // Store the owner user ID
    });

    res.json({
      token,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company
      }
    });
  } catch (error) {
    console.error('Client portal login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get client portal data
router.get('/portal/data', authenticateToken, (req, res) => {
  try {
    // Only clients can access this
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const userId = req.user.user_id; // The owner user's ID
    const clientId = req.user.id; // The client's ID

    // Get projects for this client
    const projects = db.project.getAllByUser(userId).filter(p => p.client_id === clientId);
    
    // Get tasks for this client's projects
    const allTasks = db.task.getAllByUser(userId);
    const projectIds = projects.map(p => p.id);
    const tasks = allTasks.filter(t => t.project_id && projectIds.includes(t.project_id));
    
    // Get invoices for this client
    const allInvoices = db.invoice.getAllByUser(userId);
    const invoices = allInvoices.filter(i => i.client_id === clientId);
    
    // Get time logs for this client's projects
    const allTimeLogs = db.timelog.getAllByUser(userId);
    const timeLogs = allTimeLogs.filter(tl => tl.project_id && projectIds.includes(tl.project_id));

    res.json({
      client: {
        id: clientId,
        name: req.user.name,
        email: req.user.email
      },
      projects,
      tasks,
      invoices,
      timeLogs
    });
  } catch (error) {
    console.error('Get client portal data error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Generate client access token (for clients to use)
router.post('/portal/generate-token/:clientId', authenticateToken, (req, res) => {
  try {
    const client = db.client.getById(req.params.clientId, req.user.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Generate a simple access token
    const clientToken = uuidv4();
    
    // Update client with portal access
    db.client.update(client.id, req.user.id, {
      ...client,
      settings: JSON.stringify({ ...JSON.parse(client.settings || '{}'), portal_token: clientToken })
    });

    res.json({ 
      client_token: clientToken,
      portal_url: `${process.env.APP_URL || 'http://localhost:3000'}/portal?client=${client.id}&token=${clientToken}`
    });
  } catch (error) {
    console.error('Generate client token error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Revoke client portal access
router.post('/portal/revoke-token/:clientId', authenticateToken, (req, res) => {
  try {
    const client = db.client.getById(req.params.clientId, req.user.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const settings = JSON.parse(client.settings || '{}');
    delete settings.portal_token;
    
    db.client.update(client.id, req.user.id, {
      ...client,
      settings: JSON.stringify(settings)
    });

    res.json({ message: 'Portal access revoked' });
  } catch (error) {
    console.error('Revoke client token error:', error);
    res.status(500).json({ error: 'Failed to revoke access' });
  }
});

module.exports = router;
