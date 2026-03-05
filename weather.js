const express = require('express');
const axios = require('axios');
const { supabaseAdmin } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const OWM_BASE = 'https://api.openweathermap.org/data/2.5';
const API_KEY  = process.env.OPENWEATHER_API_KEY;

// ── Clothing image map (Unsplash) ─────────────────────────────────────────────
const CLOTHING_IMAGES = {
  'Heavy Winter Coat':      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=300&q=80',
  'Thermal Underlayer':     'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&q=80',
  'Warm Boots':             'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
  'Gloves & Scarf':         'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&q=80',
  'Beanie / Winter Hat':    'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=300&q=80',
  'Winter Jacket':          'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=300&q=80',
  'Sweater':                'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&q=80',
  'Jeans / Trousers':       'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=300&q=80',
  'Closed Shoes':           'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
  'Light Jacket':           'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80',
  'Long-Sleeve Shirt':      'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=300&q=80',
  'Chinos / Jeans':         'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=300&q=80',
  'Sneakers':               'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
  'T-Shirt / Polo':         'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80',
  'Shorts / Skirt':         'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=300&q=80',
  'Sneakers / Flats':       'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
  'Lightweight T-Shirt':    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80',
  'Shorts / Summer Dress':  'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&q=80',
  'Sandals':                'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=300&q=80',
  'Sunhat / Cap':           'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&q=80',
  'Waterproof Jacket':      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80',
  'Umbrella':               'https://images.unsplash.com/photo-1601084881623-cdf9a8ea242c?w=300&q=80',
  'Waterproof Boots':       'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
  'Snow Boots':             'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
  'Sunglasses':             'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&q=80',
  'Sunscreen':              'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&q=80',
  'Windbreaker':            'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80',
};

function getClothingRecommendations(weather) {
  const { temp, humidity, condition, windSpeed, feelsLike } = weather;
  const recs = [], tips = [];

  if (feelsLike < 0) {
    recs.push(
      { item:'Heavy Winter Coat', icon:'🧥', reason:'Freezing temperatures' },
      { item:'Thermal Underlayer', icon:'🧣', reason:'Extra insulation needed' },
      { item:'Warm Boots', icon:'🥾', reason:'Protect feet from cold' },
      { item:'Gloves & Scarf', icon:'🧤', reason:'Protect extremities' },
      { item:'Beanie / Winter Hat', icon:'🎩', reason:'Prevent heat loss' },
    );
    tips.push('Layer up! The real-feel is below freezing.');
  } else if (feelsLike < 10) {
    recs.push(
      { item:'Winter Jacket', icon:'🧥', reason:'Cold weather protection' },
      { item:'Sweater', icon:'👕', reason:'Insulating middle layer' },
      { item:'Jeans / Trousers', icon:'👖', reason:'Leg coverage essential' },
      { item:'Closed Shoes', icon:'👟', reason:'Warmth and comfort' },
    );
    tips.push('Wear layers you can remove indoors.');
  } else if (feelsLike < 18) {
    recs.push(
      { item:'Light Jacket', icon:'🧣', reason:'Mild cool breeze' },
      { item:'Long-Sleeve Shirt', icon:'👔', reason:'Comfortable coverage' },
      { item:'Chinos / Jeans', icon:'👖', reason:'Relaxed fit for mild weather' },
      { item:'Sneakers', icon:'👟', reason:'Comfortable all-day footwear' },
    );
    tips.push('A light layer is all you need today.');
  } else if (feelsLike < 25) {
    recs.push(
      { item:'T-Shirt / Polo', icon:'👕', reason:'Perfect warm weather top' },
      { item:'Shorts / Skirt', icon:'🩳', reason:'Stay cool and comfortable' },
      { item:'Sneakers / Flats', icon:'👟', reason:'Breathable footwear' },
    );
    tips.push('Great weather for light, breathable fabrics!');
  } else {
    recs.push(
      { item:'Lightweight T-Shirt', icon:'👕', reason:'Stay cool in the heat' },
      { item:'Shorts / Summer Dress', icon:'🩳', reason:'Maximum breathability' },
      { item:'Sandals', icon:'🩴', reason:'Open footwear for hot days' },
      { item:'Sunhat / Cap', icon:'🧢', reason:'Sun protection essential' },
    );
    tips.push('Stay hydrated and wear SPF-protective clothing.');
  }

  const cond = condition.toLowerCase();
  if (cond.includes('rain') || cond.includes('drizzle'))
    recs.push(
      { item:'Waterproof Jacket', icon:'🌂', reason:'Rain protection' },
      { item:'Umbrella', icon:'☂️', reason:'Stay dry on the go' },
      { item:'Waterproof Boots', icon:'🥾', reason:'Keep feet dry' },
    ), tips.push('Rain expected — waterproof gear is a must!');

  if (cond.includes('snow'))
    recs.push({ item:'Snow Boots', icon:'🥾', reason:'Grip & waterproofing' });

  if (cond.includes('sun') || cond.includes('clear'))
    recs.push(
      { item:'Sunglasses', icon:'🕶️', reason:'UV eye protection' },
      { item:'Sunscreen', icon:'🧴', reason:'Protect skin from UV' },
    ), tips.push('Don\'t forget SPF!');

  if (windSpeed > 10)
    recs.push({ item:'Windbreaker', icon:'🌬️', reason:`Wind speed: ${windSpeed} km/h` }),
    tips.push('Strong winds — a windbreaker will help.');

  if (humidity > 75) tips.push('High humidity — choose moisture-wicking fabrics.');

  // Add image URLs + deduplicate
  const seen = new Set();
  const unique = recs
    .filter(r => { if(seen.has(r.item)) return false; seen.add(r.item); return true; })
    .map(r => ({ ...r, image: CLOTHING_IMAGES[r.item] || null }));

  return { recommendations: unique, tips };
}

// GET /api/weather?city=Manila
router.get('/', async (req, res, next) => {
  try {
    const { city, lat, lon } = req.query;
    if (!API_KEY) return res.status(500).json({ error: 'Weather API key not configured.' });

    let url;
    if (lat && lon) url = `${OWM_BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    else if (city)  url = `${OWM_BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    else return res.status(400).json({ error: 'Provide city or lat/lon.' });

    const { data } = await axios.get(url);
    const weather = {
      city: data.name, country: data.sys.country,
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    };

    const { recommendations, tips } = getClothingRecommendations(weather);

    // Save to Supabase if auth header present
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        if (userData?.user) {
          await supabaseAdmin.from('search_history').insert({
            user_id: userData.user.id,
            city: weather.city, country: weather.country,
            temp: weather.temp, condition: weather.condition,
          });
        }
      } catch (_) {}
    }

    res.json({ weather, recommendations, tips });
  } catch (err) {
    if (err.response?.status === 404)
      return res.status(404).json({ error: 'City not found.' });
    next(err);
  }
});

// GET /api/weather/history (protected)
router.get('/history', verifyToken, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('search_history')
      .select('*')
      .eq('user_id', req.user.id)
      .order('searched_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
