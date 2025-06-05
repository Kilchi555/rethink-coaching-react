const express = require('express');
const router = express.Router();
const pool = require('../db');

// Middleware to check admin
const requireAdmin = async (req, res, next) => {
  const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
  if (result.rows[0]?.role !== 'admin') {
    return res.status(403).json({ error: 'Zugriff verweigert' });
  }
  next();
};

router.get('/users', requireAdmin, async (req, res) => {
  const result = await pool.query('SELECT id, email, first_name, last_name, role FROM users');
  res.json(result.rows);
});

router.put('/users/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body;
  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
  res.json({ success: true });
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

router.get('/appointments', requireAdmin, async (req, res) => {
  const result = await pool.query(`
    SELECT a.*, u1.first_name AS customer_first_name, u2.first_name AS staff_first_name
    FROM appointments a
    LEFT JOIN users u1 ON a.user_id = u1.id
    LEFT JOIN users u2 ON a.staff_id = u2.id
    ORDER BY a.start_time DESC
  `);
  res.json(result.rows);
});

router.get('/stats', requireAdmin, async (req, res) => {
  const userCount = await pool.query('SELECT COUNT(*) FROM users');
  const appointmentCount = await pool.query('SELECT COUNT(*) FROM appointments');
  res.json({ users: userCount.rows[0].count, appointments: appointmentCount.rows[0].count });
});

router.get('/notes', requireAdmin, async (req, res) => {
  const result = await pool.query(`
    SELECT a.id, a.client_note, a.employee_note, u.first_name, u.last_name
    FROM appointments a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.client_note IS NOT NULL OR a.employee_note IS NOT NULL
    ORDER BY a.id DESC LIMIT 30
  `);
  res.json(result.rows);
});

module.exports = router;
