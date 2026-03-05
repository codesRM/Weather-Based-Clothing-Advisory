const { supabaseAdmin } = require('../config/supabase');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Authentication token required.' });

  const token = authHeader.split(' ')[1];
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user)
      return res.status(401).json({ error: 'Invalid or expired token.' });
    req.user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token verification failed.' });
  }
}

module.exports = { verifyToken };
