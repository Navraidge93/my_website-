const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Planning = require('../models/Planning');
const { authenticate, optionalAuth } = require('../middleware/auth');
const db = require('../config/database');

// Get user profile by username
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const user = await User.findByUsername(req.params.username);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = await User.getStats(user.id);

    // Check if current user follows this user
    let isFollowing = false;
    if (req.user) {
      const followResult = await db.query(
        'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
        [req.user.id, user.id]
      );
      isFollowing = followResult.rows.length > 0;
    }

    // Get public plannings
    const plannings = await Planning.findByUserId(user.id, false);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        created_at: user.created_at
      },
      stats,
      isFollowing,
      plannings
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const users = await User.search(q);
    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Follow user
router.post('/:userId/follow', authenticate, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);

    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollow = await db.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.id, targetUserId]
    );

    if (existingFollow.rows.length > 0) {
      // Unfollow
      await db.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [req.user.id, targetUserId]
      );
      res.json({ message: 'User unfollowed', following: false });
    } else {
      // Follow
      await db.query(
        'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
        [req.user.id, targetUserId]
      );

      // Create notification
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, data) 
         VALUES ($1, 'follow', 'New follower', $2, $3)`,
        [
          targetUserId,
          `${req.user.username} started following you`,
          JSON.stringify({ from_user: req.user.username, from_user_id: req.user.id })
        ]
      );

      res.json({ message: 'User followed', following: true });
    }
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow/unfollow user' });
  }
});

// Get followers
router.get('/:userId/followers', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.avatar, u.bio 
       FROM follows f 
       JOIN users u ON f.follower_id = u.id 
       WHERE f.following_id = $1 
       ORDER BY f.created_at DESC`,
      [req.params.userId]
    );

    res.json({ followers: result.rows });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// Get following
router.get('/:userId/following', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.avatar, u.bio 
       FROM follows f 
       JOIN users u ON f.following_id = u.id 
       WHERE f.follower_id = $1 
       ORDER BY f.created_at DESC`,
      [req.params.userId]
    );

    res.json({ following: result.rows });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// Get user achievements
router.get('/:userId/achievements', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC',
      [req.params.userId]
    );

    res.json({ achievements: result.rows });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Get user notifications
router.get('/me/notifications', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );

    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/me/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

module.exports = router;
