const express = require('express');
const router = express.Router();
const pool = require('../db');

// 🧑‍🏫 STAFF: Eigene Termine sehen
router.get('/appointments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.first_name AS customer_first_name, u.last_name AS customer_last_name
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
router.put('/appointments/:id/note', async (req, res) => {
  const { employee_note } = req.body;
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
      'UPDATE appointments SET employee_note = $1 WHERE id = $2 RETURNING *',
      [employee_note, req.params.id]
    );
    res.json(update.rows[0]);
  } catch (err) {
    console.error('❌ Fehler bei Coach-Notiz:', err);
    res.status(500).send('Fehler beim Speichern');
  }
});

// Neu: Endpunkt für Mitarbeiter-Statistiken
router.get('/statistics', async (req, res) => {
  // Optionale Autorisierungsprüfung: Nur Staff und Admins sollten das sehen
  // Die Haupt-app.use('/api/staff', staffRoutes) könnte bereits eine Middleware haben,
  // aber eine explizite Prüfung hier schadet nicht.
  if (!req.session.userId || (req.session.role !== 'staff' && req.session.role !== 'admin')) {
      console.log('❌ Zugriff verweigert für /api/staff/statistics: Nicht autorisiert oder falsche Rolle');
      return res.status(401).json({ error: 'Nicht autorisiert.' });
  }

  console.log('✅ /api/staff/statistics Endpunkt erreicht!');
  try {
    // Beispiel für Statistikdaten. Passen Sie die Abfrage an Ihre DB an.
    // Z.B. Anzahl der Mitarbeiter, Anzahl der Termine, etc.
    const totalStaffResult = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'staff'");
    const totalAppointmentsResult = await pool.query("SELECT COUNT(*) FROM appointments");

    res.status(200).json({
      totalStaff: parseInt(totalStaffResult.rows[0].count),
      totalAppointments: parseInt(totalAppointmentsResult.rows[0].count),
      message: "Mitarbeiterstatistiken geladen."
    });
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Mitarbeiter-Statistiken:', error);
    res.status(500).json({ error: 'Interner Serverfehler beim Laden der Statistiken' });
  }
});


module.exports = router;
