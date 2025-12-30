const router = require('express').Router();
const pool = require('../config/database');

router.post('/login', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email requis" });

  try {
    const userCheck = await pool.query('SELECT * FROM pl_users WHERE email = $1', [email]);

    let user;

    if (userCheck.rows.length > 0) {
      user = userCheck.rows[0];
    } else {
      const name = email.split('@')[0];
      const newUser = await pool.query(
        'INSERT INTO pl_users (email, name) VALUES ($1, $2) RETURNING *',
        [email, name]
      );
      user = newUser.rows[0];
    }

    res.json({ success: true, user });

  } catch (err) {
    console.error("Erreur Auth:", err);
    res.status(500).json({ error: "Erreur serveur (DB)" });
  }
});

module.exports = router;
