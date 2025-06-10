const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/appointments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          a.id,
          a.user_id,
          a.staff_id,
          a.start_time,
          a.end_time,
          a.title,
          a.location,
          a.description,
          cn.note AS client_note,
          sn.note AS staff_note,
          u.first_name AS client_first_name,
          u.last_name AS client_last_name,
          u.email AS client_email
       FROM appointments a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN client_notes cn ON cn.appointment_id = a.id 
       LEFT JOIN staff_notes sn ON sn.appointment_id = a.id
       WHERE a.staff_id = $1
       ORDER BY a.start_time ASC`,
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Fehler bei Coach-Terminen (mit Notizen):', err);
    res.status(500).send('Serverfehler beim Laden der Coach-Termine.');
  }
});

// 🧑‍🏫 STAFF: Eigene Notiz bearbeiten
router.put('/appointments/:id/note', async (req, res) => {
  // Ändern von staff_note zu staff_note
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
      // Ändern von staff_note zu staff_note
      'UPDATE appointments SET staff_note = $1 WHERE id = $2 RETURNING *',
      [staff_note, req.params.id]
    );
    res.json(update.rows[0]);
  } catch (err) {
    console.error('❌ Fehler bei Coach-Notiz:', err);
    res.status(500).send('Fehler beim Speichern');
  }
});

// Neu: Endpunkt für Mitarbeiter-Statistiken
router.get('/statistics', async (req, res) => {
  if (!req.session.userId || (req.session.role !== 'staff' && req.session.role !== 'admin')) {
      console.log('❌ Zugriff verweigert für /api/staff/statistics: Nicht autorisiert oder falsche Rolle');
      return res.status(401).json({ error: 'Nicht autorisiert.' });
  }

  const loggedInStaffId = req.session.userId;
  console.log(`✅ /api/staff/statistics Endpunkt erreicht für userId: ${loggedInStaffId}`);

  try {
    const monthlyCompletedSessionsResult = await pool.query(
      `SELECT
          EXTRACT(MONTH FROM start_time) AS month,
          COUNT(*) AS count
      FROM
          appointments
      WHERE
          staff_id = $1 -- Diese Bedingung ist korrekt und sollte Termine für Staff-ID 5 finden
          -- AND EXTRACT(YEAR FROM start_time) = EXTRACT(YEAR FROM CURRENT_DATE) -- <-- DIESE ZEILE AUSKOMMENTIEREN ODER ENTFERNEN!
      GROUP BY
          month
      ORDER BY
          month;
      `,
      [loggedInStaffId]
    );

    res.status(200).json({
      monthlyCompletedSessions: monthlyCompletedSessionsResult.rows,
      message: "Mitarbeiterstatistiken pro Monat geladen."
    });

  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Mitarbeiter-Statistiken pro Monat:', error);
    res.status(500).json({ error: 'Interner Serverfehler beim Laden der Statistiken' });
  }
});

// NEU: Route, um ALLE Termine für einen eingeloggten STAFF abzurufen
router.get('/staff-appointments', async (req, res) => {
  // Stellen Sie sicher, dass der Benutzer eingeloggt und ein Mitarbeiter ist
  if (!req.session.userId || req.session.role !== 'staff') {
    return res.status(403).json({ error: 'Access denied. Staff role required.' });
  }

  const staffId = req.session.userId; // Die eingeloggte userId ist die staff_id

  try {
    const allStaffAppointments = await pool.query(`
      SELECT
          a.id,
          a.user_id,
          a.staff_id,
          a.start_time,
          a.end_time,
          a.title,
          a.location,
          a.client_note,
          a.staff_note,
          u_client.first_name AS client_first_name,
          u_client.last_name AS client_last_name,
          u_client.email AS client_email,
          u_staff.first_name AS staff_first_name,
          u_staff.last_name AS staff_last_name
      FROM appointments a
      JOIN users u_client ON a.user_id = u_client.id
      JOIN users u_staff ON a.staff_id = u_staff.id
      WHERE a.staff_id = $1
      ORDER BY a.start_time DESC;
    `, [staffId]);

    // Optional: Hier könnten wir die Termine in zukünftige und vergangene aufteilen
    // Oder das Frontend macht das nach Erhalt der Daten.
    // Fürs Erste senden wir einfach alle.
    res.json(allStaffAppointments.rows);

  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Mitarbeiter-Termine:', error);
    res.status(500).json({ error: 'Serverfehler beim Laden der Mitarbeiter-Termine.' });
  }
});

// NEU: 🧑‍🏫 STAFF: Kundenliste des eingeloggten Mitarbeiters
router.get('/my-clients', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'staff') {
    return res.status(403).json({ error: 'Zugriff verweigert. Staff-Rolle erforderlich.' });
  }

  const staffId = req.session.userId;

  try {
    const clientsResult = await pool.query(`
      SELECT DISTINCT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.street,       -- WICHTIG: Ändern von u.address zu u.street
          u.street_nr,    -- Hinzugefügt
          u.zip,          -- Hinzugefügt
          u.city,         -- Hinzugefügt
          u.birthdate,    -- Dies sollte jetzt funktionieren, da Sie es hinzugefügt haben
          u.created_at
      FROM users u
      JOIN appointments a ON u.id = a.user_id
      WHERE a.staff_id = $1
      ORDER BY u.last_name, u.first_name;
    `, [staffId]);

    res.json(clientsResult.rows);
  } catch (err) {
    console.error('❌ Fehler beim Abrufen der Mitarbeiter-Kundenliste:', err); // Hier würde die genaue SQL-Fehlermeldung stehen
    res.status(500).send('Serverfehler beim Laden der Kundenliste.');
  }
});


module.exports = router;
