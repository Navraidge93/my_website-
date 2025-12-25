const db = require('../config/database');

class Task {
  static async create({ planningId, title, time, category, icon, notes, durationEstimate, date, position }) {
    const result = await db.query(
      `INSERT INTO tasks (planning_id, title, time, category, icon, notes, duration_estimate, date, position) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [planningId, title, time || null, category || 'general', icon || 'circle', notes || '', durationEstimate || null, date, position || 0]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByPlanningId(planningId) {
    const result = await db.query(
      'SELECT * FROM tasks WHERE planning_id = $1 ORDER BY position ASC, time ASC',
      [planningId]
    );
    return result.rows;
  }

  static async findByDate(planningId, date) {
    const result = await db.query(
      'SELECT * FROM tasks WHERE planning_id = $1 AND date = $2 ORDER BY position ASC, time ASC',
      [planningId, date]
    );
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['title', 'time', 'category', 'icon', 'notes', 'duration_estimate', 'date', 'position', 'completed'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return await Task.findById(id);
    }

    // Handle completed_at timestamp
    if (updates.completed !== undefined) {
      if (updates.completed) {
        fields.push(`completed_at = CURRENT_TIMESTAMP`);
      } else {
        fields.push(`completed_at = NULL`);
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(
      `UPDATE tasks SET ${fields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
  }

  static async toggleComplete(id) {
    const task = await Task.findById(id);
    if (!task) return null;

    return await Task.update(id, { completed: !task.completed });
  }

  static async getCompletionStats(planningId, startDate, endDate) {
    const result = await db.query(
      `SELECT 
        date,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE completed = true) as completed_tasks,
        ROUND(COUNT(*) FILTER (WHERE completed = true)::numeric / COUNT(*)::numeric * 100, 2) as completion_rate
       FROM tasks 
       WHERE planning_id = $1 AND date >= $2 AND date <= $3
       GROUP BY date
       ORDER BY date`,
      [planningId, startDate, endDate]
    );
    return result.rows;
  }

  static async updatePositions(tasks) {
    // tasks is an array of {id, position}
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const task of tasks) {
        await client.query(
          'UPDATE tasks SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [task.position, task.id]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Task;
