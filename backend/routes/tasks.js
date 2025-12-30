const router = require('express').Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "ID manquant" });

  try {
    const result = await pool.query(
      'SELECT * FROM pl_tasks WHERE user_id = $1 ORDER BY id ASC', 
      [userId]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { userId, title, time, category } = req.body;
  try {
    const newTask = await pool.query(
      'INSERT INTO pl_tasks (user_id, title, time, category, done) VALUES ($1, $2, $3, $4, false) RETURNING *',
      [userId, title, time, category]
    );
    res.json(newTask.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await pool.query(
      'UPDATE pl_tasks SET done = NOT done WHERE id = $1 RETURNING *',
      [id]
    );
    res.json(updated.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM pl_tasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
