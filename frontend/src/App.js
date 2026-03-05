import { useState, useCallback } from "react";

// ─── Mock weather fetch (replace with real API call to your backend) ──────────
const BACKEND_URL = "http://localhost:5000";

async function fetchWeatherFromBackend(city) {
  const res = await fetch(`${BACKEND_URL}/api/weather?city=${encodeURIComponent(city)}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("wa_token") || ""}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch weather.");
  }
  return res.json();
}

// Demo data for artifact preview (remove when connecting to real backend)
function getDemoData(city) {
  const demos = {
    manila: {
      weather: { city: "Manila", country: "PH", temp: 33, feelsLike: 38, humidity: 82, windSpeed: 14, condition: "Clouds", description: "broken clouds", icon: "04d", sunrise: 1700000000, sunset: 1700043600 },
      recommendations: [
        { item: "Lightweight T-Shirt", icon: "👕", reason: "Stay cool in the heat" },
        { item: "Shorts / Summer Dress", icon: "🩳", reason: "Maximum breathability" },
        { item: "Sandals", icon: "🩴", reason: "Open footwear for hot days" },
        { item: "Sunhat / Cap", icon: "🧢", reason: "Sun protection essential" },
        { item: "Sunglasses", icon: "🕶️", reason: "UV protection for eyes" },
      ],
      tips: ["Stay hydrated and wear SPF-protective clothing.", "High humidity — choose moisture-wicking fabrics."],
    },
    london: {
      weather: { city: "London", country: "GB", temp: 9, feelsLike: 6, humidity: 74, windSpeed: 22, condition: "Rain", description: "light rain", icon: "10d", sunrise: 1700000000, sunset: 1700043600 },
      recommendations: [
        { item: "Winter Jacket", icon: "🧥", reason: "Cold weather protection" },
        { item: "Sweater", icon: "👕", reason: "Insulating middle layer" },
        { item: "Jeans / Trousers", icon: "👖", reason: "Leg coverage essential" },
        { item: "Waterproof Jacket", icon: "🌂", reason: "Rain protection" },
        { item: "Umbrella", icon: "☂️", reason: "Stay dry on the go" },
        { item: "Waterproof Boots", icon: "🥾", reason: "Keep feet dry" },
        { item: "Windbreaker", icon: "🌬️", reason: "Wind speed: 22 km/h" },
      ],
      tips: ["Wear layers you can remove indoors.", "Rain expected — waterproof gear is a must!", "Strong winds today — a windbreaker will help."],
    },
    tokyo: {
      weather: { city: "Tokyo", country: "JP", temp: 18, feelsLike: 17, humidity: 55, windSpeed: 8, condition: "Clear", description: "clear sky", icon: "01d", sunrise: 1700000000, sunset: 1700043600 },
      recommendations: [
        { item: "Light Jacket", icon: "🧣", reason: "Mild cool breeze" },
        { item: "Long-Sleeve Shirt", icon: "👔", reason: "Comfortable coverage" },
        { item: "Chinos / Jeans", icon: "👖", reason: "Relaxed fit for mild weather" },
        { item: "Sneakers", icon: "👟", reason: "Comfortable all-day footwear" },
        { item: "Sunglasses", icon: "🕶️", reason: "UV protection for eyes" },
        { item: "Sunscreen", icon: "🧴", reason: "Protect skin from UV rays" },
      ],
      tips: ["A light layer is all you need today.", "Don't forget SPF — UV index may be high!"],
    },
    "new york": {
      weather: { city: "New York", country: "US", temp: 7, feelsLike: 4, humidity: 62, windSpeed: 18, condition: "Clouds", description: "overcast clouds", icon: "04d", sunrise: 1700000000, sunset: 1700043600 },
      recommendations: [
        { item: "Winter Jacket", icon: "🧥", reason: "Cold weather protection" },
        { item: "Sweater", icon: "👕", reason: "Insulating middle layer" },
        { item: "Jeans / Trousers", icon: "👖", reason: "Leg coverage essential" },
        { item: "Closed Shoes", icon: "👟", reason: "Warmth and comfort" },
        { item: "Windbreaker", icon: "🌬️", reason: "Wind speed: 18 km/h" },
      ],
      tips: ["Wear layers you can remove indoors.", "Strong winds today — a windbreaker will help."],
    },
    sydney: {
      weather: { city: "Sydney", country: "AU", temp: 26, feelsLike: 27, humidity: 68, windSpeed: 12, condition: "Clear", description: "clear sky", icon: "01d", sunrise: 1700000000, sunset: 1700043600 },
      recommendations: [
        { item: "Lightweight T-Shirt", icon: "👕", reason: "Stay cool in the warmth" },
        { item: "Shorts / Summer Dress", icon: "🩳", reason: "Comfortable in the heat" },
        { item: "Sandals", icon: "🩴", reason: "Open footwear for warm days" },
        { item: "Sunglasses", icon: "🕶️", reason: "UV protection for eyes" },
        { item: "Sunscreen", icon: "🧴", reason: "Protect skin from UV rays" },
        { item: "Windbreaker", icon: "🌬️", reason: "Light breeze: 12 km/h" },
      ],
      tips: ["Great weather for light, breathable fabrics!", "Don't forget SPF — UV index may be high!"],
    },
  };
  const key = city.toLowerCase().trim();
  return demos[key] || demos.london;
}

// ─── Weather condition → visual config ───────────────────────────────────────
function getWeatherTheme(condition, temp) {
  const c = condition?.toLowerCase() || "";
  if (c.includes("snow") || c.includes("blizzard")) return { bg: "from-slate-800 via-blue-900 to-slate-900", accent: "#a5c8f0", particle: "❄️", label: "Snowy" };
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return { bg: "from-slate-700 via-blue-800 to-slate-900", accent: "#7ab3d4", particle: "🌧️", label: "Rainy" };
  if (c.includes("thunder") || c.includes("storm")) return { bg: "from-gray-900 via-purple-900 to-gray-900", accent: "#c4a7e7", particle: "⛈️", label: "Stormy" };
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return { bg: "from-gray-600 via-gray-700 to-gray-800", accent: "#c8c8c8", particle: "🌫️", label: "Misty" };
  if (c.includes("cloud")) return { bg: "from-slate-500 via-slate-600 to-blue-800", accent: "#90b4ce", particle: "☁️", label: "Cloudy" };
  if (temp > 30) return { bg: "from-orange-700 via-rose-800 to-amber-900", accent: "#fbbf24", particle: "☀️", label: "Hot & Sunny" };
  if (temp > 20) return { bg: "from-sky-600 via-blue-700 to-indigo-800", accent: "#fde68a", particle: "🌤️", label: "Warm & Clear" };
  return { bg: "from-blue-700 via-indigo-800 to-blue-900", accent: "#93c5fd", particle: "🌥️", label: "Cool & Clear" };
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatPill({ label, value, icon }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}
      className="rounded-2xl px-4 py-3 flex flex-col items-center gap-1 min-w-0">
      <span className="text-xl">{icon}</span>
      <span className="text-white font-bold text-lg leading-none">{value}</span>
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.68rem", letterSpacing: "0.08em" }}
        className="uppercase font-medium text-center">{label}</span>
    </div>
  );
}

const CLOTHING_IMAGES = {
  'Heavy Winter Coat':     'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=300&q=80',
  'Thermal Underlayer':    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&q=80',
  'Warm Boots':            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
  'Gloves & Scarf':        'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&q=80',
  'Beanie / Winter Hat':   'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=300&q=80',
  'Winter Jacket':         'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=300&q=80',
  'Sweater':               'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&q=80',
  'Jeans / Trousers':      '/pesce-huang-nC4-PXzKZcI-unsplash.jpg',
  'Closed Shoes':          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
  'Light Jacket':          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80',
  'Long-Sleeve Shirt':     'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=300&q=80',
  'Chinos / Jeans':        '/pesce-huang-nC4-PXzKZcI-unsplash.jpg',
  'Sneakers':              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
  'T-Shirt / Polo':        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80',
  'Shorts / Skirt':        '/mike-von-nXpdguzAZ2w-unsplash',
  'Sneakers / Flats':      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
  'Lightweight T-Shirt':   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80',
  'Shorts / Summer Dress': 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&q=80',
  'Sandals':               'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=300&q=80',
  'Sunhat / Cap':          'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&q=80',
  'Waterproof Jacket':     'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80',
  'Umbrella':              '/umbrella.jpg',
  'Waterproof Boots':      '/waterproof%20boots.jpg',
  'Snow Boots':            '/snowboots.jpg',
  'Sunglasses':            '/Sunglasses.jpg',
  'Sunscreen':             '/Sunscreen.jpg',
  'Windbreaker':           '/Windbreaker.jpg',
};

function ClothingCard({ item, icon, reason, index }) {
  const [err, setErr] = useState(false);
  const image = CLOTHING_IMAGES[item];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105"
      style={{
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.12)",
        animationDelay: `${index * 60}ms`,
        animation: "slideUp 0.5s ease both",
      }}>
      <div style={{ height: 140, overflow: "hidden", background: "rgba(0,0,0,0.35)", position: "relative" }}>
        {image && !err
          ? <img src={image} alt={item} onError={() => setErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
          : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42 }}>
              {icon}
            </div>
        }
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50,
          background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }} />
      </div>
      <div className="p-3">
        <p className="text-white font-semibold text-sm leading-tight">{item}</p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem" }} className="mt-1">{reason}</p>
      </div>
    </div>
  );
}

function TipBadge({ tip }) {
  return (
    <div className="flex items-start gap-2 rounded-xl px-4 py-3"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <span className="text-base flex-shrink-0">💡</span>
      <span className="text-white text-sm" style={{ opacity: 0.8 }}>{tip}</span>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ onClose, onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("wa_token", data.token);
      onAuth(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="rounded-3xl p-8 w-full max-w-sm mx-4"
        style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.15)" }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <button onClick={onClose} className="text-white opacity-50 hover:opacity-100 text-xl">×</button>
        </div>

        {mode === "register" && (
          <input className="w-full rounded-xl px-4 py-3 mb-3 text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            placeholder="Full name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        )}
        <input className="w-full rounded-xl px-4 py-3 mb-3 text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
          placeholder="Email address" type="email" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <input className="w-full rounded-xl px-4 py-3 mb-4 text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
          placeholder="Password" type="password" value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && handleSubmit()} />

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
          style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "white", opacity: loading ? 0.6 : 1 }}>
          {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <p className="text-center mt-4 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          {mode === "login" ? "Don't have an account? " : "Already have one? "}
          <button onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-blue-400 hover:underline">
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function WeatherAdvisor() {
  const [city, setCity] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(true);

  const theme = result ? getWeatherTheme(result.weather.condition, result.weather.temp)
    : { bg: "from-slate-800 via-blue-900 to-slate-900", accent: "#93c5fd", particle: "🌤️" };

  const handleSearch = useCallback(async (searchCity) => {
    const q = (searchCity || city).trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      let data;
      if (useDemoMode) {
        await new Promise(r => setTimeout(r, 800)); // simulate network
        data = getDemoData(q);
      } else {
        data = await fetchWeatherFromBackend(q);
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [city, useDemoMode]);

  const handleGeoLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLoading(true);
        setError("");
        try {
          if (useDemoMode) {
            await new Promise(r => setTimeout(r, 800));
            setResult(getDemoData("tokyo"));
          } else {
            const res = await fetch(`${BACKEND_URL}/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
            if (!res.ok) throw new Error("Could not fetch weather for your location.");
            setResult(await res.json());
          }
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
      },
      () => setError("Location permission denied.")
    );
  };

  const suggestions = ["Manila", "London", "Tokyo", "New York", "Sydney"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .orb { animation: pulse-slow 4s ease-in-out infinite; }
        .search-input::placeholder { color: rgba(255,255,255,0.35); }
        .search-input:focus { outline: none; border-color: rgba(255,255,255,0.4) !important; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 12px; }
        @media (max-width: 480px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>

      <div className={`min-h-screen bg-gradient-to-br ${theme.bg} transition-all duration-1000 relative overflow-hidden`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Decorative orbs */}
        <div className="orb absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${theme.accent}22, transparent 70%)` }} />
        <div className="orb absolute bottom-[-5%] right-[-5%] w-80 h-80 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${theme.accent}18, transparent 70%)`, animationDelay: "2s" }} />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
          <div>
            <h1 className="text-white font-bold text-xl" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
              🌤️ WeatherWear
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", letterSpacing: "0.05em" }}
              className="uppercase font-medium">Clothing Advisor</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className={`w-2 h-2 rounded-full ${useDemoMode ? "bg-yellow-400" : "bg-green-400"}`}
                style={{ boxShadow: `0 0 6px ${useDemoMode ? "#fbbf24" : "#4ade80"}` }} />
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.7rem" }}>
                {useDemoMode ? "Demo" : "Live"}
              </span>
              <button onClick={() => setUseDemoMode(m => !m)}
                style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem" }} className="hover:opacity-100">
                {useDemoMode ? "Switch to live →" : "← Use demo"}
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: theme.accent + "44", color: theme.accent }}>
                  {user.name[0].toUpperCase()}
                </div>
                <button onClick={() => { localStorage.removeItem("wa_token"); setUser(null); }}
                  style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>
                  Sign out
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
                Sign in
              </button>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="relative z-10 max-w-4xl mx-auto px-6 pb-16">

          {/* Hero search */}
          <div className="text-center mb-10" style={{ animation: "slideUp 0.6s ease both" }}>
            <h2 className="text-white mb-3"
              style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(1.8rem, 5vw, 3rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              What should I wear<br />
              <span style={{ color: theme.accent }}>today?</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>
              Enter a city, neighborhood, or address for real-time weather & outfit recommendations
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-xl mx-auto mb-6" style={{ animation: "slideUp 0.6s 0.1s ease both" }}>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                <input
                  className="search-input w-full pl-11 pr-4 py-4 rounded-2xl text-white font-medium"
                  style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", fontSize: "0.95rem" }}
                  placeholder="City, neighborhood, street address…"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />
              </div>
              <button onClick={handleGeoLocation} title="Use my location"
                className="w-14 rounded-2xl flex items-center justify-center transition-all hover:opacity-90 flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <span className="text-xl">📍</span>
              </button>
              <button onClick={() => handleSearch()} disabled={loading || !city.trim()}
                className="px-6 py-4 rounded-2xl font-semibold text-sm transition-all hover:opacity-90 flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${theme.accent}cc, ${theme.accent})`, color: "#0f172a", opacity: (loading || !city.trim()) ? 0.5 : 1 }}>
                {loading ? "…" : "Search"}
              </button>
            </div>

            {/* Quick suggestions */}
            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              {suggestions.map(s => (
                <button key={s} onClick={() => { setCity(s); handleSearch(s); }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="max-w-xl mx-auto mb-6 rounded-2xl px-5 py-4 flex items-center gap-3"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <span className="text-xl">⚠️</span>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Loading spinner */}
          {loading && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="w-14 h-14 rounded-full border-2 border-transparent flex items-center justify-center text-3xl"
                style={{ borderTopColor: theme.accent, animation: "spin-slow 1s linear infinite" }}>
                {theme.particle}
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Fetching weather data…</p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div style={{ animation: "slideUp 0.5s ease both" }}>

              {/* Weather card */}
              <div className="rounded-3xl p-6 mb-6"
                style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl">{theme.particle}</span>
                      <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase"
                        style={{ background: theme.accent + "33", color: theme.accent, letterSpacing: "0.06em" }}>
                        {theme.label}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-3xl" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
                      {result.weather.city}
                      <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, fontSize: "1.2rem" }}>
                        {" "}/ {result.weather.country}
                      </span>
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }} className="text-sm mt-1">
                      {result.weather.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black"
                      style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(3rem, 8vw, 5rem)", lineHeight: 1, letterSpacing: "-0.04em", color: theme.accent }}>
                      {result.weather.temp}°
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>
                      Feels {result.weather.feelsLike}°C
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <StatPill label="Humidity"   value={`${result.weather.humidity}%`}     icon="💧" />
                  <StatPill label="Wind"       value={`${result.weather.windSpeed} km/h`} icon="🌬️" />
                  <StatPill label="Feels Like" value={`${result.weather.feelsLike}°C`}   icon="🌡️" />
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {/* Clothing recommendations — full width, shown first */}
                <div>
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2"
                    style={{ fontFamily: "'Sora', sans-serif", fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
                    <span style={{ color: theme.accent }}>👗</span> Outfit Recommendations
                  </h4>
                  <div className="card-grid">
                    {result.recommendations.map((r, i) => (
                      <ClothingCard key={r.item} {...r} index={i} />
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div>
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2"
                    style={{ fontFamily: "'Sora', sans-serif", fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
                    <span style={{ color: theme.accent }}>💡</span> Style Tips
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {result.tips.map((tip, i) => <TipBadge key={i} tip={tip} />)}
                  </div>

                  {/* Demo mode notice */}
                  {useDemoMode && (
                    <div className="mt-4 rounded-xl px-4 py-3"
                      style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                      <p className="text-yellow-300 text-xs font-medium">⚡ Demo Mode</p>
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem" }} className="mt-0.5">
                        Connect to your Node.js backend for live weather data.
                        Toggle "Live" in the header after starting the server.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && !error && (
            <div className="text-center py-16" style={{ animation: "slideUp 0.6s 0.2s ease both" }}>
              <div className="text-6xl mb-4">👔</div>
              <p className="text-white font-semibold mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                Ready when you are
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                Try searching a city, neighborhood, or street address
              </p>
            </div>
          )}
        </main>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={setUser} />}
    </>
  );
}
