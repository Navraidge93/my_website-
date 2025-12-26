const express = require('express');
const router = express.Router();
const Planning = require('../models/Planning');
const Task = require('../models/Task');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validation');
const db = require('../config/database');

// Get all plannings for authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const plannings = await Planning.findByUserId(req.user.id);
    res.json({ plannings });
  } catch (error) {
    console.error('Get plannings error:', error);
    res.status(500).json({ error: 'Failed to fetch plannings' });
  }
});

// Get public plannings (discover feed)
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const plannings = await Planning.getPublic(limit, offset);
    res.json({ plannings });
  } catch (error) {
    console.error('Get public plannings error:', error);
    res.status(500).json({ error: 'Failed to fetch public plannings' });
  }
});

// Search plannings
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const plannings = await Planning.search(q);
    res.json({ plannings });
  } catch (error) {
    console.error('Search plannings error:', error);
    res.status(500).json({ error: 'Failed to search plannings' });
  }
});

// Get single planning
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.id);
    
    if (!planning) {
      return res.status(404).json({ error: 'Planning not found' });
    }

    // Check access permissions
    if (!planning.is_public && (!req.user || req.user.id !== planning.user_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get tasks for this planning
    const tasks = await Task.findByPlanningId(planning.id);

    // Get likes and comments count
    const likesResult = await db.query(
      'SELECT COUNT(*) as count FROM likes WHERE planning_id = $1',
      [planning.id]
    );

    const commentsResult = await db.query(
      'SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.planning_id = $1 ORDER BY c.created_at DESC',
      [planning.id]
    );

    // Check if current user liked it
    let userLiked = false;
    if (req.user) {
      const likeResult = await db.query(
        'SELECT id FROM likes WHERE user_id = $1 AND planning_id = $2',
        [req.user.id, planning.id]
      );
      userLiked = likeResult.rows.length > 0;
    }

    res.json({
      planning,
      tasks,
      likes_count: parseInt(likesResult.rows[0].count),
      comments: commentsResult.rows,
      user_liked: userLiked
    });
  } catch (error) {
    console.error('Get planning error:', error);
    res.status(500).json({ error: 'Failed to fetch planning' });
  }
});

// Create planning
router.post('/', authenticate, validate(validationRules.planning), async (req, res) => {
  try {
    const { title, description, is_public, template_type, visibility } = req.body;

    const planning = await Planning.create({
      userId: req.user.id,
      title,
      description,
      isPublic: is_public,
      templateType: template_type,
      visibility
    });

    res.status(201).json({
      message: 'Planning created successfully',
      planning
    });
  } catch (error) {
    console.error('Create planning error:', error);
    res.status(500).json({ error: 'Failed to create planning' });
  }
});

// Update planning
router.put('/:id', authenticate, validate(validationRules.planning), async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.id);
    
    if (!planning) {
      return res.status(404).json({ error: 'Planning not found' });
    }

    if (planning.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, description, is_public, visibility } = req.body;

    const updatedPlanning = await Planning.update(req.params.id, {
      title,
      description,
      isPublic: is_public,
      visibility
    });

    res.json({
      message: 'Planning updated successfully',
      planning: updatedPlanning
    });
  } catch (error) {
    console.error('Update planning error:', error);
    res.status(500).json({ error: 'Failed to update planning' });
  }
});

// Delete planning
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.id);
    
    if (!planning) {
      return res.status(404).json({ error: 'Planning not found' });
    }

    if (planning.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Planning.delete(req.params.id);

    res.json({ message: 'Planning deleted successfully' });
  } catch (error) {
    console.error('Delete planning error:', error);
    res.status(500).json({ error: 'Failed to delete planning' });
  }
});

// Duplicate a public planning
router.post('/:id/duplicate', authenticate, async (req, res) => {
  try {
    const newPlanning = await Planning.duplicate(req.params.id, req.user.id);
    res.status(201).json({
      message: 'Planning duplicated successfully',
      planning: newPlanning
    });
  } catch (error) {
    console.error('Duplicate planning error:', error);
    res.status(400).json({ error: error.message || 'Failed to duplicate planning' });
  }
});

// Like a planning
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.id);
    
    if (!planning || !planning.is_public) {
      return res.status(404).json({ error: 'Planning not found' });
    }

    // Check if already liked
    const existingLike = await db.query(
      'SELECT id FROM likes WHERE user_id = $1 AND planning_id = $2',
      [req.user.id, req.params.id]
    );

    if (existingLike.rows.length > 0) {
      // Unlike
      await db.query(
        'DELETE FROM likes WHERE user_id = $1 AND planning_id = $2',
        [req.user.id, req.params.id]
      );
      res.json({ message: 'Planning unliked', liked: false });
    } else {
      // Like
      await db.query(
        'INSERT INTO likes (user_id, planning_id) VALUES ($1, $2)',
        [req.user.id, req.params.id]
      );

      // Create notification for planning owner
      if (planning.user_id !== req.user.id) {
        await db.query(
          `INSERT INTO notifications (user_id, type, title, message, data) 
           VALUES ($1, 'like', 'New like', $2, $3)`,
          [
            planning.user_id,
            `${req.user.username} liked your planning "${planning.title}"`,
            JSON.stringify({ planning_id: planning.id, from_user: req.user.username })
          ]
        );
      }

      res.json({ message: 'Planning liked', liked: true });
    }
  } catch (error) {
    console.error('Like planning error:', error);
    res.status(500).json({ error: 'Failed to like planning' });
  }
});

// Add comment to planning
router.post('/:id/comments', authenticate, validate(validationRules.comment), async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.id);
    
    if (!planning || !planning.is_public) {
      return res.status(404).json({ error: 'Planning not found' });
    }

    const { content } = req.body;

    const result = await db.query(
      `INSERT INTO comments (user_id, planning_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [req.user.id, req.params.id, content]
    );

    // Create notification for planning owner
    if (planning.user_id !== req.user.id) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, data) 
         VALUES ($1, 'comment', 'New comment', $2, $3)`,
        [
          planning.user_id,
          `${req.user.username} commented on your planning "${planning.title}"`,
          JSON.stringify({ planning_id: planning.id, from_user: req.user.username })
        ]
      );
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        ...result.rows[0],
        username: req.user.username,
        avatar: req.user.avatar
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
