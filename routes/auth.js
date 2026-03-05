const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      if (error.message.includes('already registered'))
        return res.status(409).json({ error: 'Email already registered.' });
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Account created successfully. Check your email to confirm.',
      token: data.session?.access_token || null,
      user: { id: data.user.id, name, email: data.user.email },
    });
  } catch (err) { next(err); }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const name = data.user.user_metadata?.name || email.split('@')[0];

    res.json({
      message: 'Login successful.',
      token: data.session.access_token,
      user: { id: data.user.id, name, email: data.user.email },
    });
  } catch (err) { next(err); }
});

// ─── GET /api/auth/me (protected) ────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !data)
      return res.status(404).json({ error: 'User not found.' });

    res.json(data);
  } catch (err) { next(err); }
});

// ─── POST /api/auth/logout (protected) ───────────────────────────────────────
router.post('/logout', verifyToken, async (req, res, next) => {
  try {
    await supabase.auth.signOut();
    res.json({ message: 'Logged out successfully.' });
  } catch (err) { next(err); }
});

module.exports = router;
