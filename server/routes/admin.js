const express = require('express');
const router = express.Router();
const db = global.db;
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = db.user.getAll();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    db.user.updateRole(req.params.id, role);
    const user = db.user.findById(req.params.id);
    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.user.delete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get system stats (admin only)
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const dbPath = require('path').join(__dirname, '../../database.sqlite');
    const fs = require('fs');

    const users = db.user.getAll();
    const userCount = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    let dbSize = 0;
    try {
      dbSize = fs.statSync(dbPath).size;
    } catch (e) {
      dbSize = 0;
    }

    res.json({
      totalUsers: userCount,
      adminUsers: adminCount,
      regularUsers: userCount - adminCount,
      databaseSize: dbSize,
      databaseSizeFormatted: formatBytes(dbSize)
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;
