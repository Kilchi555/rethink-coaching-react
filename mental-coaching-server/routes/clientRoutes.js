const express = require('express');
const router = express.Router();
const pool = require('../db');

// 🧍 client: Eigene Termine laden
router.get('/client/appointments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u2.first_name AS staff_first_name, u2.last_name AS staff_last_name
       FROM appointments a
       LEFT JOIN users u2 ON a.staff_id = u2.id
       WHERE a.user_id = $1
       ORDER BY a.start_time ASC`,
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Fehler bei Kundenterminen:', err);
    res.status(500).send('Serverfehler');
  }
});

// 🧍 client: Eigene Notiz bearbeiten
router.put('/client/appointments/:id/note', async (req, res) => {
  const { client_note } = req.body;
  try {
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
  } catch (err) {
    console.error('❌ Fehler bei Kundennotiz:', err);
    res.status(500).send('Fehler beim Speichern');
  }
});

// 🧑‍🏫 STAFF: Eigene Termine laden
router.get('/staff/appointments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.first_name AS client_first_name, u.last_name AS client_last_name
       FROM appointments a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.staff_id = $1
       ORDER BY a.start_time ASC`,
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Fehler bei Coach-Terminen:', err);
    res.status(500).send('Serverfehler');
  }
});

// 🧑‍🏫 STAFF: Eigene Notiz bearbeiten
router.put('/staff/appointments/:id/note', async (req, res) => {
  const { staff_note } = req.body;
  try {
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
      'UPDATE appointments SET staff_note = $1 WHERE id = $2 RETURNING *',
      [staff_note, req.params.id]
    );
    res.json(update.rows[0]);
  } catch (err) {
    console.error('❌ Fehler bei Coach-Notiz:', err);
    res.status(500).send('Fehler beim Speichern');
  }
});

module.exports = router;
