const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = global.db;
const { authenticateToken } = require('../middleware/auth');

// Get all time logs
router.get('/', authenticateToken, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    
    const timeLogs = db.timelog.getAllByUser(req.user.id, limit, offset);
    const total = db.timelog.getCountByUser(req.user.id);
    
    res.json({
      data: timeLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get time logs error:', error);
    res.status(500).json({ error: 'Failed to fetch time logs' });
  }
});

// Get time log stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const stats = db.timelog.getStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Get time log stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get active timer
router.get('/active', authenticateToken, (req, res) => {
  try {
    const activeLog = db.timelog.getActive(req.user.id);
    res.json(activeLog);
  } catch (error) {
    console.error('Get active timer error:', error);
    res.status(500).json({ error: 'Failed to fetch active timer' });
  }
});

// Get time logs by project
router.get('/project/:projectId', authenticateToken, (req, res) => {
  try {
    const timeLogs = db.timelog.getByProject(req.params.projectId, req.user.id);
    res.json(timeLogs);
  } catch (error) {
    console.error('Get project time logs error:', error);
    res.status(500).json({ error: 'Failed to fetch time logs' });
  }
});

// Start timer
router.post('/start', authenticateToken, (req, res) => {
  try {
    const { project_id, description, billable } = req.body;

    // Stop any existing timer
    const existingActive = db.timelog.getActive(req.user.id);
    if (existingActive) {
      db.timelog.stop(existingActive.id, req.user.id);
    }

    const timeLogId = 'timelog-' + uuidv4();
    db.timelog.create({
      id: timeLogId,
      user_id: req.user.id,
      project_id,
      description,
      start_time: new Date().toISOString(),
      billable: billable !== false
    });

    const timeLog = db.timelog.getActive(req.user.id);
    res.status(201).json(timeLog);
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// Stop timer
router.post('/stop/:id', authenticateToken, (req, res) => {
  try {
    const timeLog = db.timelog.stop(req.params.id, req.user.id);
    if (!timeLog) {
      return res.status(404).json({ error: 'Time log not found' });
    }
    res.json(timeLog);
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ error: 'Failed to stop timer: ' + error.message });
  }
});

// Create manual time entry
router.post('/', authenticateToken, (req, res) => {
  try {
    const { project_id, description, duration, start_time, billable } = req.body;

    if (!duration) {
      return res.status(400).json({ error: 'Duration is required' });
    }

    const timeLogId = 'timelog-' + uuidv4();
    db.timelog.create({
      id: timeLogId,
      user_id: req.user.id,
      project_id,
      description,
      start_time: start_time || new Date().toISOString(),
      billable: billable !== false
    });

    // Update duration for manual entry
    db.timelog.update(timeLogId, req.user.id, { duration });

    const timeLogs = db.timelog.getAllByUser(req.user.id);
    res.status(201).json(timeLogs.find(t => t.id === timeLogId));
  } catch (error) {
    console.error('Create time log error:', error);
    res.status(500).json({ error: 'Failed to create time log' });
  }
});

// Update time log
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { project_id, description, duration, billable } = req.body;

    db.timelog.update(req.params.id, req.user.id, { project_id, description, duration, billable });
    const timeLogs = db.timelog.getAllByUser(req.user.id);
    res.json(timeLogs.find(t => t.id === req.params.id));
  } catch (error) {
    console.error('Update time log error:', error);
    res.status(500).json({ error: 'Failed to update time log' });
  }
});

// Delete time log
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    db.timelog.delete(req.params.id, req.user.id);
    res.json({ message: 'Time log deleted successfully' });
  } catch (error) {
    console.error('Delete time log error:', error);
    res.status(500).json({ error: 'Failed to delete time log' });
  }
});

module.exports = router;
