// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // DB-Verbindung

// Admin: Alle Nutzer abrufen
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, first_name, last_name, role FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Nutzer:', err);
    res.status(500).send('Serverfehler');
  }
});

// Admin: Neuen Termin anlegen
router.post('/appointments', async (req, res) => {
  const { user_id, staff_id, start_time, end_time, title, location } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO appointments (user_id, staff_id, start_time, end_time, title, location)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, staff_id, start_time, end_time, title, location]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Fehler beim Erstellen des Termins:', err);
    res.status(500).send('Serverfehler');
  }
});

// Admin: Termin aktualisieren
router.put('/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { start_time, end_time, title, location, user_id, staff_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE appointments
       SET start_time = $1, end_time = $2, title = $3, location = $4, user_id = $5, staff_id = $6
       WHERE id = $7 RETURNING *`,
      [start_time, end_time, title, location, user_id, staff_id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Fehler beim Aktualisieren:', err);
    res.status(500).send('Fehler beim Aktualisieren');
  }
});

// Admin: Termin löschen
router.delete('/appointments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Fehler beim Löschen:', err);
    res.status(500).send('Fehler beim Löschen');
  }
});

module.exports = router;
