const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Planning = require('../models/Planning');
const { authenticate } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validation');
const db = require('../config/database');

// Get tasks for a planning
router.get('/planning/:planningId', authenticate, async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.planningId);
    
    if (!planning) {
      return res.status(404).json({ error: 'Planning not found' });
    }

    if (planning.user_id !== req.user.id && !planning.is_public) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await Task.findByPlanningId(req.params.planningId);
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get tasks by date
router.get('/planning/:planningId/date/:date', authenticate, async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.planningId);
    
    if (!planning) {
      return res.status(404).json({ error: 'Planning not found' });
    }

    if (planning.user_id !== req.user.id && !planning.is_public) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await Task.findByDate(req.params.planningId, req.params.date);
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks by date error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', authenticate, validate(validationRules.task), async (req, res) => {
  try {
    const { planning_id, title, time, category, icon, notes, duration_estimate, date, position } = req.body;

    // Verify planning ownership
    const planning = await Planning.findById(planning_id);
    if (!planning || planning.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const task = await Task.create({
      planningId: planning_id,
      title,
      time,
      category,
      icon,
      notes,
      durationEstimate: duration_estimate,
      date,
      position
    });

    // Update stats
    await updateDailyStats(req.user.id, date);

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify ownership through planning
    const planning = await Planning.findById(task.planning_id);
    if (!planning || planning.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {};
    const allowedFields = ['title', 'time', 'category', 'icon', 'notes', 'duration_estimate', 'date', 'position', 'completed'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedTask = await Task.update(req.params.id, updates);

    // Update stats if completed status changed
    if (updates.completed !== undefined) {
      await updateDailyStats(req.user.id, updatedTask.date);
      
      // Check for achievements
      if (updates.completed) {
        await checkAchievements(req.user.id);
      }
    }

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Toggle task completion
router.post('/:id/toggle', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify ownership through planning
    const planning = await Planning.findById(task.planning_id);
    if (!planning || planning.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedTask = await Task.toggleComplete(req.params.id);

    // Update stats and check achievements
    await updateDailyStats(req.user.id, updatedTask.date);
    await checkAchievements(req.user.id);

    res.json({
      message: 'Task toggled successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

// Delete task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify ownership through planning
    const planning = await Planning.findById(task.planning_id);
    if (!planning || planning.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Task.delete(req.params.id);

    // Update stats
    await updateDailyStats(req.user.id, task.date);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Update task positions (drag & drop)
router.put('/reorder', authenticate, async (req, res) => {
  try {
    const { tasks } = req.body; // Array of {id, position}

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Invalid tasks array' });
    }

    // Verify all tasks belong to user's plannings
    for (const taskUpdate of tasks) {
      const task = await Task.findById(taskUpdate.id);
      if (!task) continue;
      
      const planning = await Planning.findById(task.planning_id);
      if (!planning || planning.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await Task.updatePositions(tasks);

    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

// Helper function to update daily stats
async function updateDailyStats(userId, date) {
  try {
    // Get all user's plannings
    const plannings = await Planning.findByUserId(userId);
    const planningIds = plannings.map(p => p.id);

    if (planningIds.length === 0) return;

    // Get tasks for this date
    const tasksResult = await db.query(
      `SELECT COUNT(*) as total, 
              COUNT(*) FILTER (WHERE completed = true) as completed
       FROM tasks 
       WHERE planning_id = ANY($1) AND date = $2`,
      [planningIds, date]
    );

    const { total, completed } = tasksResult.rows[0];
    const completionRate = total > 0 ? (completed / total * 100).toFixed(2) : 0;

    // Calculate streak
    const streak = await calculateStreak(userId);

    // Upsert stats
    await db.query(
      `INSERT INTO stats (user_id, date, completion_rate, streak, total_tasks, completed_tasks)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET 
         completion_rate = $3,
         streak = $4,
         total_tasks = $5,
         completed_tasks = $6`,
      [userId, date, completionRate, streak, total, completed]
    );

    // Update user points
    await db.query(
      `UPDATE user_points 
       SET current_streak = $1,
           longest_streak = GREATEST(longest_streak, $1),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [streak, userId]
    );
  } catch (error) {
    console.error('Update daily stats error:', error);
  }
}

// Helper function to calculate streak
async function calculateStreak(userId) {
  try {
    const result = await db.query(
      `SELECT date, completion_rate 
       FROM stats 
       WHERE user_id = $1 AND completion_rate >= 70
       ORDER BY date DESC 
       LIMIT 365`,
      [userId]
    );

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date(today);

    for (let i = 0; i < result.rows.length; i++) {
      const statDate = result.rows[i].date.toISOString().split('T')[0];
      const expectedDate = checkDate.toISOString().split('T')[0];

      if (statDate === expectedDate) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Calculate streak error:', error);
    return 0;
  }
}

// Helper function to check and award achievements
async function checkAchievements(userId) {
  try {
    const pointsResult = await db.query(
      'SELECT * FROM user_points WHERE user_id = $1',
      [userId]
    );

    if (pointsResult.rows.length === 0) return;

    const points = pointsResult.rows[0];

    // Check streak achievements
    const streakAchievements = [
      { streak: 7, type: 'streak_7', name: 'Week Warrior', description: '7 day streak!' },
      { streak: 30, type: 'streak_30', name: 'Month Master', description: '30 day streak!' },
      { streak: 100, type: 'streak_100', name: 'Century Champion', description: '100 day streak!' }
    ];

    for (const achievement of streakAchievements) {
      if (points.current_streak >= achievement.streak) {
        await db.query(
          `INSERT INTO achievements (user_id, badge_type, badge_name, badge_description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, badge_type) DO NOTHING`,
          [userId, achievement.type, achievement.name, achievement.description]
        );
      }
    }

    // Check task completion achievements
    const tasksResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM tasks t
       JOIN plannings p ON t.planning_id = p.id
       WHERE p.user_id = $1 AND t.completed = true`,
      [userId]
    );

    const completedCount = parseInt(tasksResult.rows[0].count);

    const taskAchievements = [
      { count: 10, type: 'tasks_10', name: 'Getting Started', description: 'Completed 10 tasks' },
      { count: 100, type: 'tasks_100', name: 'Centurion', description: 'Completed 100 tasks' },
      { count: 1000, type: 'tasks_1000', name: 'Productivity Legend', description: 'Completed 1000 tasks' }
    ];

    for (const achievement of taskAchievements) {
      if (completedCount >= achievement.count) {
        await db.query(
          `INSERT INTO achievements (user_id, badge_type, badge_name, badge_description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, badge_type) DO NOTHING`,
          [userId, achievement.type, achievement.name, achievement.description]
        );
      }
    }
  } catch (error) {
    console.error('Check achievements error:', error);
  }
}

module.exports = router;
