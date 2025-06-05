// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Nur eigene Termine sehen
router.get('/appointments', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM appointments WHERE user_id = $1 ORDER BY start_time ASC',
    [req.session.userId]
  );
  res.json(result.rows);
});

// Eigene Notiz bearbeiten
router.put('/appointments/:id/note', async (req, res) => {
  const { client_note } = req.body;
  const result = await pool.query(
    'SELECT user_id FROM appointments WHERE id = $1',
    [req.params.id]
  );
  const a = result.rows[0];
  if (!a) return res.status(404).json({ error: 'Termin nicht gefunden' });
  if (a.user_id !== req.session.userId) {
    return res.status(403).json({ error: 'Zugriff verweigert' });
  }

  const update = await pool.query(
    'UPDATE appointments SET client_note = $1 WHERE id = $2 RETURNING *',
    [client_note, req.params.id]
  );
  res.json(update.rows[0]);
});

module.exports = router;

// Alle eigenen Staff-Termine sehen
router.get('/appointments', async (req, res) => {
  const result = await pool.query(
    `SELECT a.*, u.first_name AS customer_first_name, u.last_name AS customer_last_name
     FROM appointments a
     LEFT JOIN users u ON a.user_id = u.id
     WHERE a.staff_id = $1
     ORDER BY a.start_time ASC`,
    [req.session.userId]
  );
  res.json(result.rows);
});

// Nur eigene Staff-Notizen bearbeiten
router.put('/appointments/:id/note', async (req, res) => {
  const { employee_note } = req.body;
  const result = await pool.query(
    'SELECT staff_id FROM appointments WHERE id = $1',
    [req.params.id]
  );
  const a = result.rows[0];
  if (!a) return res.status(404).json({ error: 'Termin nicht gefunden' });
  if (a.staff_id !== req.session.userId) {
    return res.status(403).json({ error: 'Zugriff verweigert' });
  }

  const update = await pool.query(
    'UPDATE appointments SET employee_note = $1 WHERE id = $2 RETURNING *',
    [employee_note, req.params.id]
  );
  res.json(update.rows[0]);
});

module.exports = router;
