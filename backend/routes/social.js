const router = require('express').Router();
const pool = require('../config/database');

// --- AMIS ---
router.post('/friends/request', async (req, res) => {
  const { userId, friendEmail } = req.body;

  try {
    const friendCheck = await pool.query('SELECT * FROM pl_users WHERE email = $1', [friendEmail]);
    if (friendCheck.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable." });

    const friendId = friendCheck.rows[0].id;
    if (friendId == userId) return res.status(400).json({ error: "Tu ne peux pas t'ajouter toi-même." });

    const linkCheck = await pool.query(
        'SELECT * FROM pl_friends WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)',
        [userId, friendId]
    );
    if (linkCheck.rows.length > 0) return res.status(400).json({ error: "Déjà amis ou demande en cours." });

    await pool.query('INSERT INTO pl_friends (user_id_1, user_id_2, status) VALUES ($1, $2, $3)', [userId, friendId, 'pending']);

    await pool.query(
        'INSERT INTO pl_notifications (user_id, type, content, from_user_id) VALUES ($1, $2, $3, $4)',
        [friendId, 'friend_request', 'veut rejoindre ta Squad', userId]
    );

    res.json({ success: true, message: "Demande envoyée !" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/friends', async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, 
      CASE WHEN u.last_active > NOW() - INTERVAL '5 minutes' THEN 'online' ELSE 'offline' END as status
      FROM pl_users u
      JOIN pl_friends f ON (u.id = f.user_id_1 OR u.id = f.user_id_2)
      WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1) 
      AND f.status = 'accepted'
      AND u.id != $1
    `, [userId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- NOTIFICATIONS ---
router.get('/notifications', async (req, res) => {
    const { userId } = req.query;
    try {
        const result = await pool.query(`
            SELECT n.*, u.name as from_name 
            FROM pl_notifications n
            JOIN pl_users u ON n.from_user_id = u.id
            WHERE n.user_id = $1 ORDER BY n.created_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CHAT ---
router.post('/messages', async (req, res) => {
  const { senderId, senderName, content } = req.body;
  try {
    const newMessage = await pool.query(
      'INSERT INTO pl_messages (sender_id, sender_name, content) VALUES ($1, $2, $3) RETURNING *',
      [senderId, senderName, content]
    );
    res.json(newMessage.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pl_messages ORDER BY created_at ASC LIMIT 50');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
