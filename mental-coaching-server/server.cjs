
require('dotenv').config();
console.log('*** server.cjs wird tatsachlich ausgefuhrt! ***');
const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const staffRoutes = require('./routes/staffRoutes');



const app = express();
const port = process.env.PORT || 3000;

// Datenbankverbindung
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

// CORS-Konfiguration
const corsOptions = {
  origin: [
    'https://kilchi555.github.io',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // wichtig!
  optionsSuccessStatus: 200 // nötig für ältere Browser
};
app.use(cors(corsOptions));

// Middleware in der korrekten Reihenfolge
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'einZufaelligerUndSichererStringFuerLocalhost',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax', // 'lax' ist sicherer als 'strict' für Cross-Origin-Anfragen
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/staff', staffRoutes);


console.log('*** Vor dem Definieren von buildPath ***');
// Definiere den Pfad zu deinem Frontend-Build-Verzeichnis
const buildPath = path.join(__dirname, '..', 'mental-coaching-react', 'dist');
console.log('*** buildPath definiert als:', buildPath, '***');

console.log('*** Vor dem Servieren statischer Dateien ***');
app.use(express.static(buildPath));
console.log('*** Nach dem Servieren statischer Dateien ***');

// // **API-Endpunkte**
// // Handler fur die Registration
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  console.log('>>> /api/register wurde aufgerufen!');

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' });
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Ungultiges E-Mail-Format.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
  }

  try {
    console.log('Vor der Abfrage nach existingUser');
    const existingUser = await pool.query('SELECT email FROM users WHERE email = $1', [email]);
    console.log('Nach der Abfrage nach existingUser');

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' });
    }

    console.log('Vor dem Hashing des Passworts');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Nach dem Hashing des Passworts');

    console.log('Vor dem Einfugen des neuen Benutzers');
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at, role',
      [email, hashedPassword]
    );
    console.log('Nach dem Einfugen des neuen Benutzers');

    return res.status(201).json({ message: 'Registrierung erfolgreich!', userId: newUser.rows[0].id, email: newUser.rows[0].email, role: newUser.rows[0].role });

  } catch (error) {
    console.error('Fehler bei der Registrierung:', error);
    return res.status(500).json({ error: 'Fehler bei der Registrierung.' });
  }
});

// Handler furs Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('>>> /api/login wurde aufgerufen!');
  console.log('Request Body:', req.body);

  if (!email || !password) {
    console.log('Fehler: E-Mail oder Passwort fehlt.');
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' });
  }

  try {
    console.log('Suche Benutzer in der Datenbank mit E-Mail:', email);
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      console.log('Fehler: Benutzer nicht gefunden fur E-Mail:', email);
      return res.status(401).json({ error: 'Ungultige Anmeldeinformationen.' });
    }

    console.log('Benutzer gefunden:', user);
    console.log('Vergleiche Passwort mit Hash:', user.password_hash);
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log('Passwort stimmt uberein:', passwordMatch);

    if (passwordMatch) {
      req.session.userId = user.id;
      req.session.role = user.role; // <--- THIS IS THE CRUCIAL CORRECTION!
      req.session.userName = user.first_name; // Optional: Store the user's first name if available and needed for display

      console.log('Login erfolgreich. Session-ID gesetzt fur Benutzer-ID:', user.id);
      console.log('Session-Inhalt nach Login (NACH KORREKTUR):', req.session); // VERIFY THIS LOG IN YOUR TERMINAL!

      return res.status(200).json({ message: 'Login erfolgreich!', userId: user.id, email: user.email, role: user.role });
    } else {
      console.log('Fehler: Passwort stimmt nicht uberein fur Benutzer-ID:', user.id);
      return res.status(401).json({ error: 'Ungultige Anmeldeinformationen.' });
    }

  } catch (error) {
    console.error('Fehler beim Login:', error);
    return res.status(500).json({ error: 'Fehler beim Login.' });
  }
});

// Handler fur Benutzer-Daten
app.get('/api/user', async (req, res) => {
  console.log('>>> /api/user wurde aufgerufen!');
  if (req.session.userId) {
    console.log('Benutzer-ID in Session gefunden:', req.session.userId);
    console.log('Inhalt von req.session:', req.session);
    try {
      const userResult = await pool.query(
        `SELECT id, email, role, created_at,
                first_name, last_name, street, street_nr, zip, city, phone
         FROM users WHERE id = $1`,
        [req.session.userId]
      );      

      console.log('Benutzer-ID aus Session:', req.session.userId);
      const user = userResult.rows[0];

      console.log('Benutzerdaten aus der Datenbank:', user);

      if (user) {
        return res.status(200).json({
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          first_name: user.first_name,
          last_name: user.last_name,
          street: user.street,
          street_nr: user.street_nr,
          zip: user.zip,
          city: user.city,
          phone: user.phone
        });
              } else {
        return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzerdaten:', error);
      return res.status(500).json({ error: 'Fehler beim Abrufen der Benutzerdaten.' });
    }
  } else {
    console.log('Keine Benutzer-ID in der Session gefunden.');
    return res.status(401).json({ error: 'Nicht authentifiziert.' });
  }
});

// Handler fur vergangene Termine
app.get('/api/past-appointments', async (req, res) => {
  console.log('>>> /api/past-appointments aufgerufen!');
  console.log('Aktuelle Serverzeit:', new Date());

  if (!req.session.userId) {
    return res.status(401).json({ error: 'Nicht authentifiziert.' });
  }

  const userId = req.session.userId;

  try {
    const result = await pool.query(`
      SELECT
      a.id,
      a.title,
      a.start_time,
      a.end_time,
      a.location,
      u.email AS customer_email,
      u.first_name AS customer_first_name,
      u.last_name AS customer_last_name,
      s.email AS staff_email,
      s.first_name AS staff_first_name,
      s.last_name AS staff_last_name,
      cn.note AS client_note,
      sn.note AS staff_note
      FROM appointments a
      LEFT JOIN users u ON u.id = a.user_id
      LEFT JOIN users s ON s.id = a.staff_id
      LEFT JOIN client_notes cn ON cn.appointment_id = a.id
      LEFT JOIN staff_notes sn ON sn.appointment_id = a.id
      WHERE a.start_time < NOW()
        AND (a.user_id = $1 OR a.staff_id = $1)
      ORDER BY a.start_time ASC
    `, [req.session.userId]);
    console.log('Abgerufene Termine mit Startzeiten:', result.rows.map(row => row.start_time));
    console.log('Rohdaten aus DB (past-appointments):', JSON.stringify(result.rows, null, 2));

    const rawAppointments = result.rows;

    const calendarEvents = rawAppointments.map(row => ({
      id: row.id,
      title: row.title || 'Termin',
      start: row.start_time,
      end: row.end_time,
      extendedProps: {
        thema: row.title,
        ort: row.location,
        kunde: {
          email: row.customer_email,
          name: `${row.customer_first_name} ${row.customer_last_name}`
        },
        mitarbeiter: {
          email: row.staff_email,
          name: `${row.staff_first_name} ${row.staff_last_name}`
        },
        notizen: {
          kunde: row.client_note,
          staff: row.staff_note
        }
      },
      isPast: true
    }));

    console.log('🔥 result.rows Dump:');
    console.log(JSON.stringify(result.rows, null, 2));

    return res.status(200).json({ calendarEvents: calendarEvents, listData: rawAppointments });

  } catch (error) {
    console.error('Fehler beim Abrufen vergangener Termine:', error);
    return res.status(500).json({ error: 'Fehler beim Abrufen der vergangenen Termine.' });
  }
});

// Handler fur zukunftige Termine
app.get('/api/future-appointments', async (req, res) => {
  console.log('>>> /api/future-appointments aufgerufen!');
  console.log('Aktuelle Serverzeit:', new Date());

  if (!req.session.userId) {
    return res.status(401).json({ error: 'Nicht authentifiziert.' });
  }

  const userId = req.session.userId;

  try {
    const result = await pool.query(`
    SELECT
    a.id,
    a.title,
    a.start_time,
    a.end_time,
    a.location,
    u.email AS customer_email,
    u.first_name AS customer_first_name,
    u.last_name AS customer_last_name,
    s.email AS staff_email,
    s.first_name AS staff_first_name,
    s.last_name AS staff_last_name,
    cn.note AS client_note,
    sn.note AS staff_note  
  FROM appointments a
  LEFT JOIN users u ON u.id = a.user_id
  LEFT JOIN users s ON s.id = a.staff_id
  LEFT JOIN client_notes cn ON cn.appointment_id = a.id
  LEFT JOIN staff_notes sn ON sn.appointment_id = a.id
  WHERE a.start_time >= NOW()
    AND (a.user_id = $1 OR a.staff_id = $1)
  ORDER BY a.start_time ASC
    `, [req.session.userId]);
    console.log('Abgerufene Termine mit Startzeiten:', result.rows.map(row => row.start_time));
    console.log('Rohdaten aus DB (future-appointments):', JSON.stringify(result.rows, null, 2));

    const rawAppointments = result.rows;

    const calendarEvents = rawAppointments.map(row => ({
      id: row.id,
      title: row.title || 'Termin',
      start: row.start_time,
      end: row.end_time,
      extendedProps: {
        thema: row.title,
        ort: row.location,
        kunde: {
          email: row.customer_email,
          name: `${row.customer_first_name} ${row.customer_last_name}`
        },
        mitarbeiter: {
          email: row.staff_email,
          name: `${row.staff_first_name} ${row.staff_last_name}`
        },
        notizen: {
          kunde: row.client_note,
          staff: row.staff_note
        }
      },
      isPast: new Date(row.end_time) < new Date()
    }));

    return res.status(200).json({ calendarEvents: calendarEvents, listData: rawAppointments });

  } catch (error) {
    console.error('Fehler beim Abrufen zukunftiger Termine:', error);
    return res.status(500).json({ error: 'Fehler beim Abrufen der zukunftigen Termine.' });
  }
});

// Handler fur termingebundene Kunden-Notizen
app.get('/api/client-notes/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;
  console.log(`>>> /api/client-notes/${appointmentId} wurde aufgerufen!`);

  if (!req.session.userId) {
      return res.status(401).json({ error: 'Nicht authentifiziert.' });
  }

  try {
      const notesResult = await pool.query(
          'SELECT * FROM client_notes WHERE appointment_id = $1',
          [appointmentId]
      );
      const notes = notesResult.rows;
      console.log('Klienten-Notizen:', notes);
      return res.status(200).json(notes);
  } catch (error) {
      console.error('Fehler beim Abrufen der Klienten-Notizen:', error);
      return res.status(500).json({ error: 'Fehler beim Abrufen der Klienten-Notizen.' });
  }
});

// Handler fur termingebundene Mitarbeiter-Notizen
app.get('/api/staff-notes/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;
  console.log(`>>> /api/staff-notes/${appointmentId} wurde aufgerufen!`);

  if (!req.session.userId) {
      return res.status(401).json({ error: 'Nicht authentifiziert.' });
  }

  try {
      const notesResult = await pool.query(
          'SELECT * FROM staff_notes WHERE appointment_id = $1',
          [appointmentId]
      );
      const notes = notesResult.rows;
      console.log('Mitarbeiter-Notizen:', notes);
      return res.status(200).json(notes);
  } catch (error) {
      console.error('Fehler beim Abrufen der Mitarbeiter-Notizen:', error);
      return res.status(500).json({ error: 'Fehler beim Abrufen der Mitarbeiter-Notizen' });
  }
});

// Handler fur allgemeine Kunden-Notizen (nicht an einen Termin gebunden)
app.get('/api/user-notes', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Nicht authentifiziert.' });
  }

  try {
    const notesResult = await pool.query(
      'SELECT * FROM user_notes WHERE user_id = $1',
      [req.session.userId]
    );
    const notes = notesResult.rows;
    console.log('Allgemeine Benutzer-Notizen:', notes);
    return res.status(200).json(notes);
  } catch (error) {
    console.error('Fehler beim Abrufen der allgemeinen Benutzer-Notizen:', error);
    return res.status(500).json({ error: 'Fehler beim Abrufen der allgemeinen Benutzer-Notizen.' });
  }
});

// Handler fur allgemeine Mitarbeiter-Notizen (nicht an einen Termin gebunden)
app.get('/api/staff-user-notes', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Nicht authentifiziert.' });
    }

    try {
        const notesResult = await pool.query(
            'SELECT * FROM staff_user_notes WHERE staff_id = $1',
            [req.session.userId]
        );
        const notes = notesResult.rows;
        console.log('Allgemeine Mitarbeiter-Notizen:', notes);
        return res.status(200).json(notes);
    } catch (error) {
        console.error('Fehler beim Abrufen der allgemeinen Mitarbeiter-Notizen:', error);
        return res.status(500).json({ error: 'Fehler beim Abrufen der allgemeinen Mitarbeiter-Notizen.' });
    }
});

app.post('/api/update-note', async (req, res) => {
  const { appointmentId, note, type } = req.body;
  const userId = req.session.userId;

  console.log('>>> /api/update-note wurde aufgerufen!');

  if (!userId) {
    return res.status(401).json({ error: 'Nicht authentifiziert.' });
  }

  if (!appointmentId || !note || !type) {
    return res.status(400).json({ error: 'Termin-ID, Notiz und Typ sind erforderlich.' });
  }

  try {
    const appointmentResult = await pool.query(
      'SELECT * FROM appointments WHERE id = $1 AND (user_id = $2 OR staff_id = $2)',
      [appointmentId, userId]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(403).json({ error: 'Du bist nicht berechtigt, diese Notiz zu bearbeiten.' });
    }

    let updateQuery;
    let params;

    if (type === 'customer') {
      updateQuery = 'UPDATE appointments SET customer_note = $1 WHERE id = $2 AND user_id = $3';
      params = [note, appointmentId, userId];
    } else if (type === 'employee') {
      updateQuery = 'UPDATE appointments SET employee_note = $1 WHERE id = $2 AND staff_id = $3';
      params = [note, appointmentId, userId];
    } else {
      return res.status(400).json({ error: 'Ungultiger Notiztyp.' });
    }

    const result = await pool.query(updateQuery, params);

    if (result.rowCount > 0) {
      return res.status(200).json({ message: 'Notiz erfolgreich gespeichert.' });
    } else {
      return res.status(500).json({ error: 'Fehler beim Speichern der Notiz.' });
    }

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Notiz:', error);
    return res.status(500).json({ error: 'Fehler beim Aktualisieren der Notiz.' });
  }
});

// Handler zum Speichern/Aktualisieren der Kundennotiz fur einen bestimmten Termin
app.post('/api/appointment/:appointmentId/note', async (req, res) => {
  const { appointmentId } = req.params;
  const { clientNote } = req.body;
  const userId = req.session.userId;

  console.log(`>>> POST /api/appointment/${appointmentId}/note aufgerufen!`);
  console.log('Request Body:', req.body);
  console.log('Benutzer-ID aus Session:', userId);

  if (!userId) {
    return res.status(401).json({ error: 'Nicht authentifiziert.' });
  }

  if (!clientNote) {
    return res.status(400).json({ error: 'Die Notiz darf nicht leer sein.' });
  }

  try {
    const appointmentCheck = await pool.query(
      'SELECT id FROM appointments WHERE id = $1 AND user_id = $2',
      [appointmentId, userId]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Sie sind nicht berechtigt, Notizen zu diesem Termin zu speichern.' });
    }

    const existingNote = await pool.query(
      'SELECT id FROM client_notes WHERE appointment_id = $1',
      [appointmentId]
    );

    if (existingNote.rows.length > 0) {
      const result = await pool.query(
        'UPDATE client_notes SET note = $1 WHERE appointment_id = $2',
        [clientNote, appointmentId]
      );

      if (result.rowCount > 0) {
        return res.status(200).json({ message: 'Notiz erfolgreich aktualisiert.' });
      } else {
        return res.status(500).json({ error: 'Fehler beim Aktualisieren der Notiz.' });
      }
    } else {
      const result = await pool.query(
        'INSERT INTO client_notes (appointment_id, note) VALUES ($1, $2)',
        [appointmentId, clientNote]
      );

      if (result.rowCount > 0) {
        return res.status(201).json({ message: 'Notiz erfolgreich gespeichert.' });
      } else {
        return res.status(500).json({ error: 'Fehler beim Speichern der Notiz.' });
      }
    }
  } catch (error) {
    console.error('Fehler beim Speichern/Aktualisieren der Kundennotiz:', error);
    return res.status(500).json({ error: 'Fehler beim Speichern der Notiz.' });
  }
});

app.post('/api/book-appointment', async (req, res) => {
  const staffId = req.session.userId;

  if (!staffId) return res.status(401).json({ error: 'Nicht authentifiziert.' });

  const {
    start_time,
    end_time,
    title,
    thema,
    location,
    user_id
  } = req.body;

  if (!start_time || !end_time || !thema || !location) {
    return res.status(400).json({ error: 'Fehlende Pflichtfelder.' });
  }

  try {
    const roleResult = await pool.query('SELECT role FROM users WHERE id = $1', [staffId]);
    const role = roleResult.rows[0]?.role;

    if (!role) {
      return res.status(403).json({ error: 'Benutzerrolle konnte nicht ermittelt werden.' });
    }

    let customerId = staffId; // Standard: Nutzer ist Kunde selbst
    if (role === 'staff' && user_id) {
      customerId = user_id;
    }

    await pool.query(`
      INSERT INTO appointments (user_id, staff_id, start_time, end_time, title, location)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [customerId, staffId, start_time, end_time, thema, location]);

    console.log(`📅 Neuer Termin: [${thema}] ${start_time} - ${end_time} @ ${location} (Kunde: ${customerId}, Staff: ${staffId})`);

    res.status(200).json({ message: 'Termin erfolgreich gebucht.' });

  } catch (err) {
    console.error('❌ Fehler beim Speichern:', err);
    res.status(500).json({ error: 'Fehler beim Speichern' });
  }
});



app.get('/api/all-customers', async (req, res) => {
  if (!req.session.userId || req.session.role !== 'staff') {
    return res.status(401).json({ error: 'Nicht autorisiert.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email FROM users WHERE role = 'customer' ORDER BY last_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fehler beim Abrufen aller Kunden:', err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Kunden' });
  }
});

// Middleware
const isAdmin = (req, res, next) => {
  if (req.session && req.session.role === 'admin') { // Added req.session check
    return next();
  }
  // Optional: Add a log here to see why it's failing
  console.log('❌ Access denied: Admin role required. Current session:', req.session);
  return res.status(403).json({ error: 'Admin only' });
};

// Fuge diesen Handler zu deinem Express-Server hinzu
app.post('/api/logout', (req, res) => {
    console.log('>>> /api/logout wurde aufgerufen!');
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Fehler beim Zerstoren der Session:', err);
                return res.status(500).json({ error: 'Logout fehlgeschlagen.' });
            }
            console.log('Session erfolgreich beendet.');
            res.clearCookie('connect.sid');
            return res.status(200).json({ message: 'Erfolgreich abgemeldet.' });
        });
    } else {
        return res.status(200).json({ message: 'Bereits abgemeldet.' });
    }
});

// routes/logRoutes.js
app.post('/api/log-unrecognized-role', async (req, res) => {
  const { role, user, timestamp } = req.body;
  console.log('📝 Unrecognized role logged:', { role, user, timestamp });
  res.status(200).json({ success: true });
});

app.use((err, req, res, next) => {
  console.error('Unerwarteter Fehler im Fehler-Handler:', err); // Angepasster Log
  res.status(500).json({ error: 'Interner Serverfehler' });
});


// Starte den Server nur einmal am Ende der Datei
app.listen(port, () => {
  console.log(`Server lauft auf http://localhost:${port}`);
});

// WICHTIGER FALLBACK-HANDLER FUR REACT ROUTER
// Dieser Handler muss der ALLERLETZTE sein, NACH ALLEN API-Endpunkten!
app.get(/^\/(?!api).*/, (req, res) => {
  console.log('*** Fallback-Route ausgelost fuer:', req.url, '***'); // NEUER LOG
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Optional: Fehlerbehandlung fur Datenbankverbindung beim Start
if (pool) {
  pool.connect()
    .then(() => console.log('Datenbankverbindung erfolgreich hergestellt.'))
    .catch(err => {
      console.error('Fehler beim Verbinden mit der Datenbank:', err);
      process.exit(1);
    });
}