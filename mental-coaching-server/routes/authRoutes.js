// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Benutzer nicht gefunden' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(403).json({ error: 'Falsches Passwort' });

    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ message: 'Login erfolgreich' });
  } catch (err) {
    console.error('Login-Fehler:', err);
    res.status(500).send('Serverfehler');
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.sendStatus(200);
  });
});

// Aktuellen Benutzer abrufen
router.get('/user', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Nicht eingeloggt' });

  try {
    const result = await pool.query(
      'SELECT id, email, role, first_name, last_name FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = result.rows[0];
    res.json(user);
  } catch (err) {
    console.error('Fehler beim Abrufen des Nutzers:', err);
    res.status(500).send('Fehler beim Abrufen');
  }
});

module.exports = router;
