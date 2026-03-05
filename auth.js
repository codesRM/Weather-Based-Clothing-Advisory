const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET  = process.env.JWT_SECRET  || 'change_this_secret_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const db = req.app.locals.db;

    // Check duplicate email
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [name, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId, email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: result.insertId, name, email },
    });
  } catch (err) { next(err); }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db = req.app.locals.db;
    const [rows] = await db.execute(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update last login
    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) { next(err); }
});

// ─── GET /api/auth/me  (protected) ───────────────────────────────────────────
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const [rows] = await db.execute(
      'SELECT id, name, email, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', verifyToken, (req, res) => {
  // JWT is stateless; client simply discards the token
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
