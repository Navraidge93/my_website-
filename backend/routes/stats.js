const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');
const Planning = require('../models/Planning');

// Get dashboard stats
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = parseInt(period);

    // Get user's plannings
    const plannings = await Planning.findByUserId(req.user.id);
    const planningIds = plannings.map(p => p.id);

    if (planningIds.length === 0) {
      return res.json({
        stats: [],
        summary: {
          totalTasks: 0,
          completedTasks: 0,
          completionRate: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      });
    }

    // Get daily stats
    const statsResult = await db.query(
      `SELECT * FROM stats 
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '1 days' * $2
       ORDER BY date ASC`,
      [req.user.id, daysAgo]
    );

    // Get summary
    const summaryResult = await db.query(
      `SELECT 
        SUM(total_tasks) as total_tasks,
        SUM(completed_tasks) as completed_tasks,
        AVG(completion_rate) as avg_completion_rate
       FROM stats 
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '1 days' * $2`,
      [req.user.id, daysAgo]
    );

    // Get points
    const pointsResult = await db.query(
      'SELECT * FROM user_points WHERE user_id = $1',
      [req.user.id]
    );

    const points = pointsResult.rows[0] || { 
      current_streak: 0, 
      longest_streak: 0, 
      total_points: 0, 
      level: 1 
    };

    const summary = summaryResult.rows[0];

    res.json({
      stats: statsResult.rows,
      summary: {
        totalTasks: parseInt(summary.total_tasks || 0),
        completedTasks: parseInt(summary.completed_tasks || 0),
        completionRate: parseFloat(summary.avg_completion_rate || 0).toFixed(2),
        currentStreak: points.current_streak,
        longestStreak: points.longest_streak,
        totalPoints: points.total_points,
        level: points.level
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get completion rate by category
router.get('/by-category', authenticate, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = parseInt(period);

    const plannings = await Planning.findByUserId(req.user.id);
    const planningIds = plannings.map(p => p.id);

    if (planningIds.length === 0) {
      return res.json({ categories: [] });
    }

    const result = await db.query(
      `SELECT 
        category,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE completed = true) as completed,
        ROUND(COUNT(*) FILTER (WHERE completed = true)::numeric / COUNT(*)::numeric * 100, 2) as completion_rate
       FROM tasks 
       WHERE planning_id = ANY($1) AND date >= CURRENT_DATE - INTERVAL '1 days' * $2
       GROUP BY category
       ORDER BY total DESC`,
      [planningIds, daysAgo]
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ error: 'Failed to fetch category stats' });
  }
});

// Get heatmap data
router.get('/heatmap', authenticate, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const result = await db.query(
      `SELECT date, completion_rate 
       FROM stats 
       WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
       ORDER BY date ASC`,
      [req.user.id, year]
    );

    res.json({ heatmap: result.rows });
  } catch (error) {
    console.error('Get heatmap error:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// Get productivity by hour
router.get('/by-hour', authenticate, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = parseInt(period);

    const plannings = await Planning.findByUserId(req.user.id);
    const planningIds = plannings.map(p => p.id);

    if (planningIds.length === 0) {
      return res.json({ hours: [] });
    }

    const result = await db.query(
      `SELECT 
        EXTRACT(HOUR FROM time::time) as hour,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE completed = true) as completed
       FROM tasks 
       WHERE planning_id = ANY($1) 
         AND date >= CURRENT_DATE - INTERVAL '1 days' * $2
         AND time IS NOT NULL
       GROUP BY hour
       ORDER BY hour`,
      [planningIds, daysAgo]
    );

    res.json({ hours: result.rows });
  } catch (error) {
    console.error('Get hour stats error:', error);
    res.status(500).json({ error: 'Failed to fetch hourly stats' });
  }
});

// Get weekly report
router.get('/weekly-report', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        date,
        total_tasks,
        completed_tasks,
        completion_rate,
        streak
       FROM stats 
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY date ASC`,
      [req.user.id]
    );

    // Get achievements from last week
    const achievementsResult = await db.query(
      `SELECT * FROM achievements 
       WHERE user_id = $1 AND unlocked_at >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY unlocked_at DESC`,
      [req.user.id]
    );

    // Calculate weekly totals
    const weeklyStats = result.rows.reduce((acc, day) => {
      acc.totalTasks += day.total_tasks;
      acc.completedTasks += day.completed_tasks;
      return acc;
    }, { totalTasks: 0, completedTasks: 0 });

    weeklyStats.completionRate = weeklyStats.totalTasks > 0
      ? (weeklyStats.completedTasks / weeklyStats.totalTasks * 100).toFixed(2)
      : 0;

    res.json({
      dailyStats: result.rows,
      weeklyStats,
      achievements: achievementsResult.rows
    });
  } catch (error) {
    console.error('Get weekly report error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly report' });
  }
});

// Get leaderboard (optional)
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await db.query(
      `SELECT 
        u.id,
        u.username,
        u.avatar,
        up.total_points,
        up.level,
        up.current_streak,
        up.longest_streak
       FROM user_points up
       JOIN users u ON up.user_id = u.id
       ORDER BY up.total_points DESC, up.current_streak DESC
       LIMIT $1`,
      [limit]
    );

    res.json({ leaderboard: result.rows });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
