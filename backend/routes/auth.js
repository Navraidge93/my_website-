const router = require('express').Router();
const pool = require('../config/database');

// ROUTE: Connexion / Inscription (Mode Simplifié)
// Cette route est appelée quand tu cliques sur "Envoyer le code" ou "Valider"
router.post('/login', async (req, res) => {
  const { email } = req.body;

  // Sécurité de base
  if (!email) return res.status(400).json({ error: "Email requis" });

  try {
    // 1. Est-ce que cet email existe déjà dans ta base de données ?
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    let user;

    if (userCheck.rows.length > 0) {
      // OUI -> C'est un ancien, on le connecte
      user = userCheck.rows[0];
    } else {
      // NON -> C'est un nouveau, on le crée (Inscription automatique)
      const name = email.split('@')[0]; // On prend le début de l'email comme pseudo (ex: "nathan")
      
      const newUser = await pool.query(
        'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
        [email, name]
      );
      user = newUser.rows[0];
    }

    // 2. On renvoie les infos de l'utilisateur au site (Frontend)
    // Le site va utiliser l'ID reçu pour charger LES BONNES TÂCHES
    res.json({ success: true, user });

  } catch (err) {
    console.error("Erreur Auth:", err);
    res.status(500).json({ error: "Erreur serveur lors de la connexion" });
  }
});

module.exports = router;
