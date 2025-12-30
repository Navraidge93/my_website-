const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const pool = require('./config/database');

// --- FIX RAILWAY (CRUCIAL) ---
// Permet à Railway de gérer correctement les requêtes sécurisées
app.set('trust proxy', 1);

// --- INITIALISATION BDD AUTOMATIQUE ---
async function initDatabase() {
  try {
    console.log('🔧 Vérification des tables...');
    
    // 1. Table Utilisateurs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. Table Tâches (Spéciale pour Planning OS V9)
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
    
    console.log('✅ Base de données prête (Users + Tasks)');
  } catch (error) {
    console.error('❌ Erreur Init DB:', error);
  }
}

// On lance l'initialisation au démarrage
initDatabase();

const PORT = process.env.PORT || 3001;

// --- CONFIGURATION ---
app.use(helmet());
app.use(cors({ origin: '*' })); // Autorise tout le monde (Vercel)
app.use(express.json());
app.use(morgan('dev'));

// --- IMPORT DES ROUTES ---
// (Assure-toi que ces fichiers existent ou crée-les vides pour l'instant)
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');

// Route de Test (Ping)
app.get('/api/hello', (req, res) => {
    res.json({ status: 'online', message: 'Backend V9 Connecté 🚀' });
});

// Branchement des routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);

// Gestion 404
app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
