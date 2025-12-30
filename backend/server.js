const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const pool = require('./config/database');

app.set('trust proxy', 1);

async function initDatabase() {
  try {
    console.log('🔧 Mise à jour des tables (V5 - Fresh Start)...');
    
    // 1. Utilisateurs (Table propre)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pl_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. Tâches
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pl_tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES pl_users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        time VARCHAR(10) NOT NULL,
        category VARCHAR(50) NOT NULL,
        done BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Amis
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pl_friends (
        id SERIAL PRIMARY KEY,
        user_id_1 INTEGER REFERENCES pl_users(id) ON DELETE CASCADE,
        user_id_2 INTEGER REFERENCES pl_users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id_1, user_id_2)
      );
    `);

    // 4. Messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pl_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES pl_users(id) ON DELETE CASCADE,
        sender_name VARCHAR(255),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Notifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pl_notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES pl_users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        content TEXT,
        from_user_id INTEGER REFERENCES pl_users(id) ON DELETE CASCADE,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Base de données V5 prête (Tables pl_*)');
  } catch (error) {
    console.error('❌ Erreur Init DB:', error);
  }
}

initDatabase();

const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Middleware Active Status
app.use(async (req, res, next) => {
  if (req.body.userId || req.query.userId) {
    const uid = req.body.userId || req.query.userId;
    pool.query('UPDATE pl_users SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [uid]).catch(() => {});
  }
  next();
});

const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const socialRoutes = require('./routes/social');

app.get('/api/hello', (req, res) => res.json({ status: 'online', mode: 'Social V5 Fresh' }));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/social', socialRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));

app.listen(PORT, () => {
  console.log(`🚀 Serveur V5 lancé sur le port ${PORT}`);
});
