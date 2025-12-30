const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const pool = require('./config/database');

// Initialize database on startup
async function initDatabase() {
  try {
    console.log('🔧 Creating database tables...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

initDatabase();

// Railway fournit le port via process.env.PORT, sinon 3001
const PORT = process.env.PORT || 3001;

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const planningsRoutes = require('./routes/plannings');
const tasksRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const statsRoutes = require('./routes/stats');

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Mis à * pour faciliter le test, à restreindre plus tard
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// --- ZONES DES ROUTES DE TEST (AJOUTÉ ICI) ---
// C'est cette route qui manquait pour ton test React
app.get('/api/hello', (req, res) => {
    console.log("Test de connexion reçu sur /api/hello");
    res.json({
        message: "Coucou depuis le backend complet ! 🎉",
        heure: new Date().toLocaleTimeString(),
        status: "success"
    });
});
// ---------------------------------------------

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/plannings', planningsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stats', statsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   🚀 Planning Platform Server Running     ║
║                                           ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}        ║
║   Time: ${new Date().toLocaleString()}    ║
╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
