const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const pool = require('./config/database');

// --- FIX RAILWAY (CRUCIAL) ---
app.set('trust proxy', 1);

// --- INITIALISATION BDD ---
async function initDatabase() {
  try {
    console.log('🔧 Mise à jour de la base de données...');
    
    // 1. Utilisateurs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. Tâches
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        time VARCHAR(10) NOT NULL,
        category VARCHAR(50) NOT NULL,
        done BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Amis (Mise à jour pour gérer le statut)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_id_1 INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user_id_2 INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending', -- pending, accepted
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id_1, user_id_2)
      );
    `);

    // 4. Messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- Ajout destinataire
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Notifications (NOUVEAU)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- friend_request, message
        content TEXT,
        from_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Base de données V4 prête (Users, Tasks, Friends, Messages, Notifs)');
  } catch (error) {
    console.error('❌ Erreur Init DB:', error);
  }
}

initDatabase();

const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// --- ROUTES ---
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const socialRoutes = require('./routes/social');

// Test de vie
app.get('/api/hello', (req, res) => {
    res.json({ status: 'online', message: 'Backend V4 (Social Pro) Opérationnel 🚀' });
});

// Branchement des routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/social', socialRoutes);

// Gestion 404
app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));

app.listen(PORT, () => {
  console.log(`🚀 Serveur V4 lancé sur le port ${PORT}`);
});
