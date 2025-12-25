const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ username, email, password }) {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, username, email, avatar, bio, settings, created_at`,
      [username, email, passwordHash]
    );

    // Initialize user points
    await db.query(
      'INSERT INTO user_points (user_id) VALUES ($1)',
      [result.rows[0].id]
    );

    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT id, username, email, avatar, bio, settings, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await db.query(
      'SELECT id, username, email, avatar, bio, created_at FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  static async updateProfile(userId, { avatar, bio, settings }) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (avatar !== undefined) {
      updates.push(`avatar = $${paramCount++}`);
      values.push(avatar);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    if (settings !== undefined) {
      updates.push(`settings = $${paramCount++}`);
      values.push(JSON.stringify(settings));
    }

    if (updates.length === 0) {
      return await User.findById(userId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING id, username, email, avatar, bio, settings, created_at`,
      values
    );

    return result.rows[0];
  }

  static async updateLastLogin(userId) {
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  static async search(query, limit = 20) {
    const result = await db.query(
      `SELECT id, username, email, avatar, bio, created_at 
       FROM users 
       WHERE username ILIKE $1 OR email ILIKE $1 
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  }

  static async getStats(userId) {
    const pointsResult = await db.query(
      'SELECT * FROM user_points WHERE user_id = $1',
      [userId]
    );

    const achievementsResult = await db.query(
      'SELECT COUNT(*) as count FROM achievements WHERE user_id = $1',
      [userId]
    );

    const followersResult = await db.query(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = $1',
      [userId]
    );

    const followingResult = await db.query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = $1',
      [userId]
    );

    const planningsResult = await db.query(
      'SELECT COUNT(*) as count FROM plannings WHERE user_id = $1',
      [userId]
    );

    return {
      points: pointsResult.rows[0] || { total_points: 0, level: 1, current_streak: 0, longest_streak: 0 },
      achievements: parseInt(achievementsResult.rows[0].count),
      followers: parseInt(followersResult.rows[0].count),
      following: parseInt(followingResult.rows[0].count),
      plannings: parseInt(planningsResult.rows[0].count)
    };
  }
}

module.exports = User;
