const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = global.db;
const { authenticateToken } = require('../middleware/auth');

// Get all tasks
router.get('/', authenticateToken, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    
    const tasks = db.task.getAllByUser(req.user.id, limit, offset);
    const total = db.task.getCountByUser(req.user.id);
    
    res.json({
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get task stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const stats = db.task.getStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get tasks by project
router.get('/project/:projectId', authenticateToken, (req, res) => {
  try {
    const tasks = db.task.getByProject(req.params.projectId, req.user.id);
    res.json(tasks);
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const task = db.task.getById(req.params.id, req.user.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create task
router.post('/', authenticateToken, (req, res) => {
  try {
    const { project_id, title, description, status, priority, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const taskId = 'task-' + uuidv4();
    db.task.create({
      id: taskId,
      user_id: req.user.id,
      project_id,
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      due_date
    });

    const task = db.task.getById(taskId, req.user.id);
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { project_id, title, description, status, priority, due_date } = req.body;

    const existing = db.task.getById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.task.update(req.params.id, req.user.id, {
      project_id,
      title,
      description,
      status,
      priority,
      due_date
    });

    const task = db.task.getById(req.params.id, req.user.id);
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Update task status (quick update)
router.patch('/:id/status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    db.task.updateStatus(req.params.id, req.user.id, status);
    const task = db.task.getById(req.params.id, req.user.id);
    res.json(task);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const existing = db.task.getById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.task.delete(req.params.id, req.user.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
