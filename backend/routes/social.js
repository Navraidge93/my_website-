const router = require('express').Router();
const pool = require('../config/database');

// --- AMIS ---

// 1. Envoyer une demande d'ami (avec notif)
router.post('/friends/request', async (req, res) => {
  const { userId, friendEmail } = req.body;

  try {
    const friendCheck = await pool.query('SELECT * FROM users WHERE email = $1', [friendEmail]);
    if (friendCheck.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable." });

    const friendId = friendCheck.rows[0].id;
    if (friendId == userId) return res.status(400).json({ error: "Impossible de s'ajouter soi-même." });

    // Vérifier si lien existe déjà (dans un sens ou l'autre)
    const linkCheck = await pool.query(
        'SELECT * FROM friends WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)',
        [userId, friendId]
    );

    if (linkCheck.rows.length > 0) return res.status(400).json({ error: "Demande déjà envoyée ou vous êtes déjà amis." });

    // Créer la demande
    await pool.query('INSERT INTO friends (user_id_1, user_id_2, status) VALUES ($1, $2, $3)', [userId, friendId, 'pending']);

    // Créer la notification pour l'ami
    await pool.query(
        'INSERT INTO notifications (user_id, type, content, from_user_id) VALUES ($1, $2, $3, $4)',
        [friendId, 'friend_request', 'veut être ton ami', userId]
    );

    res.json({ success: true, message: "Demande envoyée !" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Accepter une demande d'ami
router.post('/friends/accept', async (req, res) => {
    const { userId, friendId } = req.body; // userId = celui qui accepte
    try {
        await pool.query(
            'UPDATE friends SET status = $1 WHERE user_id_1 = $2 AND user_id_2 = $3',
            ['accepted', friendId, userId]
        );
        
        // Notif retour
        await pool.query(
            'INSERT INTO notifications (user_id, type, content, from_user_id) VALUES ($1, $2, $3, $4)',
            [friendId, 'friend_accept', 'a accepté ta demande', userId]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Liste des amis (seulement ceux acceptés)
router.get('/friends', async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.last_active
      FROM users u
      JOIN friends f ON (u.id = f.user_id_1 OR u.id = f.user_id_2)
      WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1) 
      AND f.status = 'accepted'
      AND u.id != $1
    `, [userId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- NOTIFICATIONS ---

// 4. Récupérer mes notifications
router.get('/notifications', async (req, res) => {
    const { userId } = req.query;
    try {
        const result = await pool.query(`
            SELECT n.*, u.name as from_name 
            FROM notifications n
            JOIN users u ON n.from_user_id = u.id
            WHERE n.user_id = $1 
            ORDER BY n.created_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CHAT PRIVÉ ---

// 5. Envoyer un message privé
router.post('/messages', async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  try {
    const newMessage = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [senderId, receiverId, content]
    );
    res.json(newMessage.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. Lire la conversation avec un ami
router.get('/messages', async (req, res) => {
    const { userId, friendId } = req.query;
    try {
        const result = await pool.query(`
            SELECT * FROM messages 
            WHERE (sender_id = $1 AND receiver_id = $2) 
               OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
        `, [userId, friendId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
