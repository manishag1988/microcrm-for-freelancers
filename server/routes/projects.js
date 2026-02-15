const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = global.db;
const { authenticateToken } = require('../middleware/auth');

// Get all projects
router.get('/', authenticateToken, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    
    const projects = db.project.getAllByUser(req.user.id, limit, offset);
    const total = db.project.getCountByUser(req.user.id);
    
    res.json({
      data: projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const stats = db.project.getStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get single project
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const project = db.project.getById(req.params.id, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', authenticateToken, (req, res) => {
  try {
    const { client_id, name, description, status, budget, deadline } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const projectId = 'project-' + uuidv4();
    db.project.create({
      id: projectId,
      user_id: req.user.id,
      client_id,
      name,
      description,
      status: status || 'active',
      budget: budget || 0,
      deadline
    });

    const project = db.project.getById(projectId, req.user.id);
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { client_id, name, description, status, budget, deadline, progress } = req.body;

    const existing = db.project.getById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.project.update(req.params.id, req.user.id, {
      client_id,
      name,
      description,
      status,
      budget,
      deadline,
      progress
    });

    const project = db.project.getById(req.params.id, req.user.id);
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const existing = db.project.getById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.project.delete(req.params.id, req.user.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
