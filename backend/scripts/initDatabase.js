const db = require('../config/database');

const createTables = async () => {
  try {
    console.log('🔧 Creating database tables...');

    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(500),
        bio TEXT,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        email_verified BOOLEAN DEFAULT false,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP
      );
    `);
    console.log('✅ Users table created');

    // Plannings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS plannings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT false,
        template_type VARCHAR(50),
        visibility VARCHAR(20) DEFAULT 'private',
        share_token VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Plannings table created');

    // Tasks table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        planning_id INTEGER REFERENCES plannings(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        time VARCHAR(10),
        category VARCHAR(50),
        icon VARCHAR(50),
        completed BOOLEAN DEFAULT false,
        notes TEXT,
        duration_estimate INTEGER,
        position INTEGER DEFAULT 0,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);
    console.log('✅ Tasks table created');

    // Follows table
    await db.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id),
        CHECK (follower_id != following_id)
      );
    `);
    console.log('✅ Follows table created');

    // Likes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        planning_id INTEGER REFERENCES plannings(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, planning_id)
      );
    `);
    console.log('✅ Likes table created');

    // Comments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        planning_id INTEGER REFERENCES plannings(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Comments table created');

    // Stats table
    await db.query(`
      CREATE TABLE IF NOT EXISTS stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        completion_rate DECIMAL(5,2),
        streak INTEGER DEFAULT 0,
        total_tasks INTEGER DEFAULT 0,
        completed_tasks INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      );
    `);
    console.log('✅ Stats table created');

    // Achievements table
    await db.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        badge_type VARCHAR(50) NOT NULL,
        badge_name VARCHAR(100) NOT NULL,
        badge_description TEXT,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, badge_type)
      );
    `);
    console.log('✅ Achievements table created');

    // Notifications table
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        data JSONB DEFAULT '{}',
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Notifications table created');

    // User points/XP table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_points (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        total_points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ User points table created');

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_plannings_user_id ON plannings(user_id);
      CREATE INDEX IF NOT EXISTS idx_plannings_is_public ON plannings(is_public);
      CREATE INDEX IF NOT EXISTS idx_tasks_planning_id ON tasks(planning_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
      CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
      CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
      CREATE INDEX IF NOT EXISTS idx_likes_planning ON likes(planning_id);
      CREATE INDEX IF NOT EXISTS idx_comments_planning ON comments(planning_id);
      CREATE INDEX IF NOT EXISTS idx_stats_user_date ON stats(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    `);
    console.log('✅ Indexes created');

    console.log('🎉 Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

createTables();
