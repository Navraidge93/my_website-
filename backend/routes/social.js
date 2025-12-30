const router = require('express').Router();
const pool = require('../config/database');

// --- GESTION DES AMIS ---

// 1. Ajouter un ami par email
// POST /api/social/friends/add
router.post('/friends/add', async (req, res) => {
  const { userId, friendEmail } = req.body;

  try {
    // Trouver l'ID de l'ami
    const friendCheck = await pool.query('SELECT * FROM users WHERE email = $1', [friendEmail]);
    
    if (friendCheck.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable avec cet email." });
    }

    const friendId = friendCheck.rows[0].id;

    if (friendId == userId) {
      return res.status(400).json({ error: "Tu ne peux pas t'ajouter toi-même !" });
    }

    // Créer le lien d'amitié
    await pool.query(
      'INSERT INTO friends (user_id_1, user_id_2) VALUES ($1, $2)',
      [userId, friendId]
    );

    res.json({ success: true, message: "Ami ajouté !" });

  } catch (err) {
    res.status(500).json({ error: "Erreur ou ami déjà ajouté." });
  }
});

// 2. Voir mes amis
// GET /api/social/friends?userId=123
router.get('/friends', async (req, res) => {
  const { userId } = req.query;
  try {
    // On cherche les amis où je suis soit user_1 soit user_2
    const result = await pool.query(`
      SELECT u.id, u.name, u.email 
      FROM users u
      JOIN friends f ON (u.id = f.user_id_1 OR u.id = f.user_id_2)
      WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1) AND u.id != $1
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GESTION DU CHAT (Global pour l'instant) ---

// 3. Envoyer un message
// POST /api/social/messages
router.post('/messages', async (req, res) => {
  const { senderId, senderName, content } = req.body;
  try {
    const newMessage = await pool.query(
      'INSERT INTO messages (sender_id, sender_name, content) VALUES ($1, $2, $3) RETURNING *',
      [senderId, senderName, content]
    );
    res.json(newMessage.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Lire les messages
// GET /api/social/messages
router.get('/messages', async (req, res) => {
  try {
    // On récupère les 50 derniers messages
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at ASC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
