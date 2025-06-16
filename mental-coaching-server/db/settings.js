const db = require('./db'); // falls du z. B. db.query(...) verwendest

// Holt den Wert zu einem bestimmten Key
async function getSetting(key) {
  const res = await db.query('SELECT value FROM settings WHERE key = $1', [key]);
  return res.rows.length > 0 ? res.rows[0].value : null;
}

// Fügt einen Key hinzu oder aktualisiert ihn (Upsert)
async function setSetting(key, value) {
  await db.query(`
    INSERT INTO settings (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `, [key, value]);
}

module.exports = { getSetting, setSetting };
