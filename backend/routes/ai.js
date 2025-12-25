const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const db = require('../config/database');

// Generate planning suggestion
router.post('/generate-planning', authenticate, async (req, res) => {
  try {
    const { goals, constraints, energyLevel } = req.body;

    // Get user's history
    const stats = await User.getStats(req.user.id);
    
    const userContext = {
      goals,
      constraints,
      energyLevel,
      history: `${stats.points.current_streak} day streak, Level ${stats.points.level}`
    };

    const tasks = await AIService.generatePlanningSuggestion(userContext);

    res.json({
      message: 'Planning generated successfully',
      tasks
    });
  } catch (error) {
    console.error('Generate planning error:', error);
    res.status(500).json({ 
      error: 'Failed to generate planning',
      details: error.message 
    });
  }
});

// Get motivational message
router.get('/motivation', authenticate, async (req, res) => {
  try {
    // Get recent stats
    const statsResult = await db.query(
      `SELECT 
        AVG(completion_rate) as avg_completion_rate,
        MAX(streak) as max_streak,
        SUM(completed_tasks) as total_completed
       FROM stats 
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'`,
      [req.user.id]
    );

    const stats = statsResult.rows[0];
    const userStats = {
      completionRate: parseFloat(stats.avg_completion_rate || 0).toFixed(1),
      streak: stats.max_streak || 0,
      totalTasks: stats.total_completed || 0
    };

    const message = await AIService.getMotivationalMessage(userStats);

    res.json({ message });
  } catch (error) {
    console.error('Get motivation error:', error);
    res.status(500).json({ 
      error: 'Failed to get motivational message',
      message: 'You\'re doing amazing! Keep it up!' 
    });
  }
});

// Analyze planning effectiveness
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array required' });
    }

    const analysis = await AIService.analyzePlanningEffectiveness(tasks);

    res.json({
      message: 'Analysis complete',
      analysis
    });
  } catch (error) {
    console.error('Analyze planning error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze planning',
      details: error.message 
    });
  }
});

module.exports = router;
