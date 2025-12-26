const db = require('../config/database');

class Planning {
  static async create({ userId, title, description, isPublic, templateType, visibility }) {
    const result = await db.query(
      `INSERT INTO plannings (user_id, title, description, is_public, template_type, visibility) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, title, description || '', isPublic || false, templateType || 'custom', visibility || 'private']
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT p.*, u.username, u.avatar 
       FROM plannings p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(userId, includePrivate = true) {
    const query = includePrivate
      ? 'SELECT * FROM plannings WHERE user_id = $1 ORDER BY created_at DESC'
      : 'SELECT * FROM plannings WHERE user_id = $1 AND is_public = true ORDER BY created_at DESC';
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async update(id, { title, description, isPublic, visibility }) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (isPublic !== undefined) {
      updates.push(`is_public = $${paramCount++}`);
      values.push(isPublic);
    }
    if (visibility !== undefined) {
      updates.push(`visibility = $${paramCount++}`);
      values.push(visibility);
    }

    if (updates.length === 0) {
      return await Planning.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(
      `UPDATE plannings SET ${updates.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM plannings WHERE id = $1', [id]);
  }

  static async getPublic(limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT p.*, u.username, u.avatar,
       (SELECT COUNT(*) FROM likes WHERE planning_id = p.id) as likes_count,
       (SELECT COUNT(*) FROM comments WHERE planning_id = p.id) as comments_count
       FROM plannings p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.is_public = true 
       ORDER BY p.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async duplicate(planningId, newUserId) {
    // Get original planning
    const originalPlanning = await Planning.findById(planningId);
    if (!originalPlanning || !originalPlanning.is_public) {
      throw new Error('Planning not found or not public');
    }

    // Create new planning
    const newPlanning = await Planning.create({
      userId: newUserId,
      title: `${originalPlanning.title} (Copy)`,
      description: originalPlanning.description,
      isPublic: false,
      templateType: originalPlanning.template_type,
      visibility: 'private'
    });

    // Copy tasks
    const tasksResult = await db.query(
      'SELECT * FROM tasks WHERE planning_id = $1',
      [planningId]
    );

    for (const task of tasksResult.rows) {
      await db.query(
        `INSERT INTO tasks (planning_id, title, time, category, icon, notes, duration_estimate, position, date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)`,
        [newPlanning.id, task.title, task.time, task.category, task.icon, task.notes, task.duration_estimate, task.position]
      );
    }

    return newPlanning;
  }

  static async search(query, limit = 20) {
    const result = await db.query(
      `SELECT p.*, u.username, u.avatar 
       FROM plannings p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.is_public = true AND (p.title ILIKE $1 OR p.description ILIKE $1) 
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  }
}

module.exports = Planning;
