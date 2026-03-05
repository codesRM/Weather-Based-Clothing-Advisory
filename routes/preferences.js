const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(verifyToken);

// ─── GET /api/preferences ─────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      // Return defaults if no row exists yet
      return res.json({
        user_id:          req.user.id,
        default_city:     null,
        temp_unit:        'celsius',
        style_preference: 'casual',
        cold_threshold:   15,
        hot_threshold:    28,
      });
    }

    res.json(data);
  } catch (err) { next(err); }
});

// ─── PUT /api/preferences ─────────────────────────────────────────────────────
router.put('/', async (req, res, next) => {
  try {
    const {
      default_city,
      temp_unit        = 'celsius',
      style_preference = 'casual',
      cold_threshold   = 15,
      hot_threshold    = 28,
    } = req.body;

    const { error } = await supabaseAdmin
      .from('user_preferences')
      .upsert({
        user_id: req.user.id,
        default_city,
        temp_unit,
        style_preference,
        cold_threshold,
        hot_threshold,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) throw error;

    res.json({ message: 'Preferences saved successfully.' });
  } catch (err) { next(err); }
});

// ─── GET /api/preferences/history ────────────────────────────────────────────
router.get('/history', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('search_history')
      .select('city, country, temp, condition, searched_at')
      .eq('user_id', req.user.id)
      .order('searched_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
