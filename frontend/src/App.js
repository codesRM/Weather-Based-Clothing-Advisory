import { useState, useCallback, useEffect, useRef } from "react";

const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || "";
const QUICK_SUGGESTIONS = ["Manila", "London", "Tokyo", "New York", "Sydney"];
const PRECISE_CITY_TARGETS = [
  { name: "Manila", state: "Metro Manila", country: "PH", lat: 14.5995, lon: 120.9842, aliases: ["manila", "manilaph"] },
  { name: "London", state: "England", country: "GB", lat: 51.5072, lon: -0.1276, aliases: ["london", "londongb", "londonuk"] },
  { name: "Tokyo", state: "", country: "JP", lat: 35.6764, lon: 139.65, aliases: ["tokyo", "tokyojp"] },
  { name: "New York", state: "New York", country: "US", lat: 40.7128, lon: -74.006, aliases: ["newyork", "newyorkcity", "newyorkus", "nyc"] },
  { name: "Sydney", state: "New South Wales", country: "AU", lat: -33.8688, lon: 151.2093, aliases: ["sydney", "sydneyau"] },
];
const FALLBACK_CITY_SUGGESTIONS = [
  { name: "Manila", state: "Metro Manila", country: "PH", lat: 14.5995, lon: 120.9842 },
  { name: "Makati", state: "Metro Manila", country: "PH" },
  { name: "Quezon City", state: "Metro Manila", country: "PH" },
  { name: "London", state: "England", country: "GB", lat: 51.5072, lon: -0.1276 },
  { name: "New York", state: "New York", country: "US", lat: 40.7128, lon: -74.006 },
  { name: "Los Angeles", state: "California", country: "US" },
  { name: "San Francisco", state: "California", country: "US" },
  { name: "Tokyo", state: "", country: "JP", lat: 35.6764, lon: 139.65 },
  { name: "Kyoto", state: "", country: "JP" },
  { name: "Sydney", state: "New South Wales", country: "AU", lat: -33.8688, lon: 151.2093 },
  { name: "Melbourne", state: "Victoria", country: "AU" },
  { name: "Singapore", state: "", country: "SG" },
  { name: "Seoul", state: "", country: "KR" },
  { name: "Paris", state: "", country: "FR" },
];

const CLOTHING_IMAGES = {
  "Heavy Winter Coat": "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=300&q=80",
  "Thermal Underlayer": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&q=80",
  "Warm Boots": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80",
  "Gloves & Scarf": "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&q=80",
  "Beanie / Winter Hat": "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=300&q=80",
  "Winter Jacket": "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=300&q=80",
  Sweater: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&q=80",
  "Jeans / Trousers": "/pesce-huang-nC4-PXzKZcI-unsplash.jpg",
  "Closed Shoes": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80",
  "Light Jacket": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80",
  "Long-Sleeve Shirt": "https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=300&q=80",
  "Chinos / Jeans": "/pesce-huang-nC4-PXzKZcI-unsplash.jpg",
  Sneakers: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80",
  "T-Shirt / Polo": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80",
  "Shorts / Skirt": "/mike-von-nXpdguzAZ2w-unsplash.jpg",
  "Sneakers / Flats": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80",
  "Lightweight T-Shirt": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80",
  "Shorts / Summer Dress": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&q=80",
  Sandals: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=300&q=80",
  "Sunhat / Cap": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&q=80",
  "Waterproof Jacket": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80",
  Umbrella: "/umbrella.jpg",
  "Waterproof Boots": "/waterproof%20boots.jpg",
  "Snow Boots": "/snowboots.jpg",
  Sunglasses: "/Sunglasses.jpg",
  Sunscreen: "/Sunscreen.jpg",
  Windbreaker: "/Windbreaker.jpg",
};

function formatCityLabel({ name, state, country }) {
  return [name, state, country].filter(Boolean).join(", ");
}

function normalizeCityKey(value = "") {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function getPreciseCityTarget(input = "") {
  const key = normalizeCityKey(input);
  if (!key) return null;

  return PRECISE_CITY_TARGETS.find((city) => city.aliases.some((alias) => key === alias || key.startsWith(alias))) || null;
}

function getFallbackSuggestions(query, limit = 6) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return FALLBACK_CITY_SUGGESTIONS
    .filter((city) => formatCityLabel(city).toLowerCase().includes(q))
    .slice(0, limit)
    .map((city) => ({ ...city, label: formatCityLabel(city) }));
}

async function fetchCitySuggestions(query, signal) {
  const q = query.trim();
  if (!q) return [];

  if (!OPENWEATHER_API_KEY) {
    return getFallbackSuggestions(q);
  }

  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=6&appid=${OPENWEATHER_API_KEY}`;
    const res = await fetch(url, { signal });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data)) return getFallbackSuggestions(q);

    const seen = new Set();
    let suggestions = data
      .map((item) => {
        const city = {
          name: item.name || "",
          state: item.state || "",
          country: item.country || "",
          lat: item.lat,
          lon: item.lon,
        };
        return { ...city, label: formatCityLabel(city) };
      })
      .filter((item) => item.name)
      .filter((item) => {
        if (seen.has(item.label)) return false;
        seen.add(item.label);
        return true;
      });

    const precise = getPreciseCityTarget(q);
    if (precise) {
      const preciseLabel = formatCityLabel(precise);
      const exactIndex = suggestions.findIndex((item) => item.country === precise.country && normalizeCityKey(item.name) === normalizeCityKey(precise.name));

      if (exactIndex > 0) {
        const [exactMatch] = suggestions.splice(exactIndex, 1);
        suggestions = [exactMatch, ...suggestions];
      } else if (exactIndex === -1) {
        const canonical = { ...precise, label: preciseLabel };
        suggestions = [canonical, ...suggestions.filter((item) => item.label !== preciseLabel)];
      }
    }

    return suggestions.length ? suggestions : getFallbackSuggestions(q);
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return getFallbackSuggestions(q);
  }
}

function pickProfileForWeather(weather) {
  const c = weather.condition.toLowerCase();
  if (c.includes("snow")) return "new york";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "london";
  if (weather.temp >= 28) return "manila";
  if (weather.temp >= 22) return "sydney";
  if (weather.temp >= 15) return "tokyo";
  return "new york";
}

function mapApiWeatherToResult(data) {
  const weather = {
    city: data.name,
    country: data.sys?.country || "",
    temp: Math.round(data.main?.temp ?? 0),
    feelsLike: Math.round(data.main?.feels_like ?? 0),
    humidity: data.main?.humidity ?? 0,
    windSpeed: Math.round((data.wind?.speed ?? 0) * 3.6),
    condition: data.weather?.[0]?.main || "Clear",
    description: data.weather?.[0]?.description || "clear sky",
    icon: data.weather?.[0]?.icon || "01d",
    sunrise: data.sys?.sunrise,
    sunset: data.sys?.sunset,
  };

  const profile = getDemoData(pickProfileForWeather(weather));
  return { weather, recommendations: profile.recommendations, tips: profile.tips };
}

async function fetchWeatherFromBackend(city) {
  if (!OPENWEATHER_API_KEY) {
    throw new Error("Missing REACT_APP_OPENWEATHER_API_KEY in your frontend environment.");
  }

  const q = city.trim();
  if (!q) throw new Error("Please enter a city.");

  const preciseCity = getPreciseCityTarget(q);
  if (preciseCity) {
    return fetchWeatherFromCoords(preciseCity.lat, preciseCity.lon);
  }

  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (geoRes.ok && Array.isArray(geoData) && geoData.length > 0) {
      return fetchWeatherFromCoords(geoData[0].lat, geoData[0].lon);
    }
  } catch {
    // Fallback to q-based lookup below.
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch live weather.");

  return mapApiWeatherToResult(data);
}

async function fetchWeatherFromCoords(lat, lon) {
  if (!OPENWEATHER_API_KEY) {
    throw new Error("Missing REACT_APP_OPENWEATHER_API_KEY in your frontend environment.");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch weather for your location.");

  return mapApiWeatherToResult(data);
}

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
      tips: ["Stay hydrated and wear SPF-protective clothing.", "High humidity - choose moisture-wicking fabrics."],
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
      tips: ["Wear layers you can remove indoors.", "Rain expected - waterproof gear is a must!", "Strong winds today - a windbreaker will help."],
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
      tips: ["A light layer is all you need today.", "Don't forget SPF - UV index may be high!"],
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
      tips: ["Wear layers you can remove indoors.", "Strong winds today - a windbreaker will help."],
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
      tips: ["Great weather for light, breathable fabrics!", "Don't forget SPF - UV index may be high!"],
    },
  };

  const key = city.toLowerCase().trim();
  return demos[key] || demos.london;
}

/*
function getLegacyWeatherTheme(weather) {
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
*/

function buildBeforeYouGoNotes(weather, recommendations = []) {
  const notes = [];
  const condition = (weather?.condition || "").toLowerCase();
  const temp = weather?.temp ?? 0;
  const feelsLike = weather?.feelsLike ?? temp;
  const windSpeed = weather?.windSpeed ?? 0;
  const humidity = weather?.humidity ?? 0;
  const items = recommendations.map((r) => r.item.toLowerCase());

  const hasUmbrella = items.some((item) => item.includes("umbrella"));
  const hasWaterproof = items.some((item) => item.includes("waterproof"));
  const hasLayer = items.some((item) => item.includes("jacket") || item.includes("sweater") || item.includes("windbreaker"));
  const hasSunProtection = items.some((item) => item.includes("sunglasses") || item.includes("sunscreen") || item.includes("sunhat"));

  if (feelsLike >= temp + 3) {
    notes.push(`It may feel hotter than ${temp}°C. Dress lighter and avoid heavy fabrics.`);
  } else if (feelsLike <= temp - 3) {
    notes.push(`It may feel colder than ${temp}°C. Add one extra layer before leaving.`);
  }

  if (temp >= 33) {
    notes.push("Very hot outside. Drink water before leaving and stay in shade when possible.");
  } else if (temp <= 10) {
    notes.push("Cold weather. Keep your core warm and limit long exposure outdoors.");
  }

  if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("shower")) {
    if (!hasUmbrella) notes.push("Rain is likely. Bring an umbrella for short outdoor walks.");
    if (!hasWaterproof) notes.push("Consider waterproof shoes or a rain jacket to stay dry.");
  }

  if (condition.includes("storm") || condition.includes("thunder")) {
    notes.push("Thunderstorm conditions possible. Avoid open areas and delay travel if you can.");
  }

  if (windSpeed >= 20 && !hasLayer) {
    notes.push(`Wind is around ${windSpeed} km/h. A light outer layer can improve comfort.`);
  }

  if (condition.includes("clear") && temp >= 24 && !hasSunProtection) {
    notes.push("Clear and warm weather. Add sunscreen or sunglasses before heading out.");
  }

  if (humidity >= 80 && temp >= 25) {
    notes.push("High humidity expected. Choose breathable fabrics and hydrate early.");
  }

  notes.push("Check weather again before you leave in case conditions change.");

  return notes.slice(0, 5);
}

function StatPill({ label, value, icon }) {
  return (
    <div
      style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}
      className="rounded-2xl px-4 py-3 flex flex-col items-center gap-1 min-w-0"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-white font-bold text-lg leading-none">{value}</span>
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.68rem", letterSpacing: "0.08em" }} className="uppercase font-medium text-center">
        {label}
      </span>
    </div>
  );
}

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
      }}
    >
      <div style={{ height: 140, overflow: "hidden", background: "rgba(0,0,0,0.35)", position: "relative" }}>
        {image && !err ? (
          <img src={image} alt={item} onError={() => setErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42 }}>{icon}</div>
        )}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }} />
      </div>
      <div className="p-3">
        <p className="text-white font-semibold text-sm leading-tight">{item}</p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem" }} className="mt-1">
          {reason}
        </p>
      </div>
    </div>
  );
}

function TipBadge({ tip }) {
  return (
    <div className="flex items-start gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <span className="text-base flex-shrink-0">💡</span>
      <span className="text-white text-sm" style={{ opacity: 0.8 }}>
        {tip}
      </span>
    </div>
  );
}

function isNightIcon(icon = "") {
  return typeof icon === "string" && icon.endsWith("n");
}

function getWeatherScene(weather = {}) {
  const condition = (weather.condition || "").toLowerCase();
  const description = (weather.description || "").toLowerCase();
  const icon = weather.icon || "";

  if (condition.includes("thunder") || condition.includes("storm") || description.includes("thunder")) return "thunderstorm";
  if (condition.includes("snow") || condition.includes("blizzard") || condition.includes("sleet")) return "snowy";
  if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("shower")) return "rainy";

  if (
    condition.includes("fog") ||
    condition.includes("mist") ||
    condition.includes("haze") ||
    condition.includes("smoke") ||
    condition.includes("dust") ||
    condition.includes("sand") ||
    condition.includes("ash")
  ) {
    return "foggy";
  }

  if (condition.includes("cloud")) {
    if (description.includes("few") || description.includes("scattered") || icon.startsWith("02") || icon.startsWith("03")) {
      return "partly-cloudy";
    }
    return "cloudy";
  }

  if (condition.includes("clear") || description.includes("clear") || description.includes("sun")) {
    return isNightIcon(icon) ? "night-clear" : "sunny";
  }

  if (isNightIcon(icon)) return "night-clear";
  return "partly-cloudy";
}

function getWeatherTheme(weather) {
  const scene = getWeatherScene(weather);
  const themes = {
    sunny: {
      scene,
      bg: "from-sky-400 via-blue-500 to-blue-800",
      background:
        "radial-gradient(circle at 22% 22%, rgba(255, 220, 140, 0.30), transparent 35%), linear-gradient(160deg, #22c1ff 0%, #2f86ff 48%, #1e3a8a 100%)",
      accent: "#ffd166",
      particle: "☀️",
      label: "Sunny",
    },
    "partly-cloudy": {
      scene,
      bg: "from-sky-500 via-blue-600 to-slate-700",
      background:
        "radial-gradient(circle at 20% 24%, rgba(255, 209, 127, 0.22), transparent 34%), linear-gradient(170deg, #67a5ff 0%, #4f8bc8 46%, #334f86 100%)",
      accent: "#ffe08a",
      particle: "🌤️",
      label: "Partly Cloudy",
    },
    cloudy: {
      scene,
      bg: "from-slate-400 via-slate-500 to-slate-700",
      background: "linear-gradient(170deg, #8aa0bf 0%, #5c6f86 45%, #334155 100%)",
      accent: "#c6d2e5",
      particle: "☁️",
      label: "Cloudy",
    },
    rainy: {
      scene,
      bg: "from-slate-600 via-slate-700 to-slate-900",
      background:
        "radial-gradient(circle at 75% 0%, rgba(122, 176, 214, 0.16), transparent 45%), linear-gradient(160deg, #3c5b7f 0%, #26384f 50%, #16202f 100%)",
      accent: "#8dc6ec",
      particle: "🌧️",
      label: "Rainy",
    },
    thunderstorm: {
      scene,
      bg: "from-slate-800 via-gray-900 to-black",
      background:
        "radial-gradient(circle at 80% 2%, rgba(255, 255, 255, 0.10), transparent 42%), linear-gradient(160deg, #2f3344 0%, #1a1f33 52%, #0d1121 100%)",
      accent: "#c0c6ff",
      particle: "⛈️",
      label: "Thunderstorm",
    },
    snowy: {
      scene,
      bg: "from-slate-500 via-blue-700 to-slate-900",
      background:
        "radial-gradient(circle at 70% 12%, rgba(245, 250, 255, 0.16), transparent 42%), linear-gradient(165deg, #8ea7bf 0%, #5e738d 46%, #30435a 100%)",
      accent: "#e2f1ff",
      particle: "❄️",
      label: "Snowy",
    },
    foggy: {
      scene,
      bg: "from-gray-400 via-gray-500 to-gray-700",
      background:
        "radial-gradient(circle at 50% 15%, rgba(230, 236, 243, 0.18), transparent 35%), linear-gradient(160deg, #8893a2 0%, #697381 48%, #505864 100%)",
      accent: "#d7dee8",
      particle: "🌫️",
      label: "Foggy",
    },
    "night-clear": {
      scene,
      bg: "from-indigo-900 via-slate-900 to-black",
      background:
        "radial-gradient(circle at 82% 18%, rgba(197, 217, 255, 0.18), transparent 32%), linear-gradient(165deg, #1f2b4f 0%, #17203a 46%, #0a1020 100%)",
      accent: "#dbeafe",
      particle: "🌙",
      label: "Night Clear",
    },
  };

  return themes[scene] || themes["partly-cloudy"];
}

function WeatherEffects({ scene, accent }) {
  const cloudCount = scene === "cloudy" ? 7 : scene === "partly-cloudy" ? 5 : scene === "rainy" || scene === "snowy" || scene === "thunderstorm" ? 6 : 0;
  const rainCount = scene === "thunderstorm" ? 70 : scene === "rainy" ? 46 : 0;
  const snowCount = scene === "snowy" ? 34 : 0;
  const starCount = scene === "night-clear" ? 65 : 0;
  const showSun = scene === "sunny" || scene === "partly-cloudy";
  const showFog = scene === "foggy";
  const showLightning = scene === "thunderstorm";

  return (
    <div className="weather-effects" aria-hidden="true">
      <div className="grain-layer" />

      {showSun && (
        <>
          <div className="sun-core" style={{ boxShadow: `0 0 80px ${accent}88, 0 0 140px ${accent}44` }} />
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={`ray-${i}`}
              className="sun-ray"
              style={{
                transform: `translate(-50%, -50%) rotate(${i * 36}deg)`,
                animationDelay: `${i * -0.22}s`,
              }}
            />
          ))}
        </>
      )}

      {starCount > 0 && (
        <>
          <div className="moon-core" />
          {Array.from({ length: starCount }).map((_, i) => (
            <span
              key={`star-${i}`}
              className="star-dot"
              style={{
                left: `${(i * 23) % 100}%`,
                top: `${(i * 29) % 68}%`,
                animationDelay: `${(i % 9) * -0.55}s`,
                animationDuration: `${1.8 + (i % 5) * 0.45}s`,
              }}
            />
          ))}
        </>
      )}

      {Array.from({ length: cloudCount }).map((_, i) => (
        <span
          key={`cloud-${i}`}
          className={`cloud-band ${scene === "thunderstorm" ? "storm-cloud" : ""}`}
          style={{
            top: `${8 + (i % 4) * 11}%`,
            left: `${(i * 17) % 100 - 18}%`,
            width: `${160 + (i % 3) * 65}px`,
            height: `${48 + (i % 3) * 18}px`,
            opacity: scene === "thunderstorm" ? 0.34 : 0.28 + (i % 4) * 0.07,
            animationDuration: `${22 + (i % 4) * 7}s`,
            animationDelay: `${i * -3.4}s`,
          }}
        />
      ))}

      {rainCount > 0 &&
        Array.from({ length: rainCount }).map((_, i) => (
          <span
            key={`rain-${i}`}
            className="rain-drop"
            style={{
              left: `${(i * 19) % 104}%`,
              animationDelay: `${(i % 13) * -0.25}s`,
              animationDuration: `${0.75 + (i % 5) * 0.18}s`,
              opacity: 0.22 + (i % 4) * 0.1,
              transform: `scale(${0.75 + (i % 3) * 0.22})`,
            }}
          />
        ))}

      {snowCount > 0 &&
        Array.from({ length: snowCount }).map((_, i) => (
          <span
            key={`snow-${i}`}
            className="snow-flake"
            style={{
              left: `${(i * 13) % 102}%`,
              animationDelay: `${(i % 11) * -0.45}s`,
              animationDuration: `${5 + (i % 6) * 1.2}s`,
              width: `${3 + (i % 3) * 1.5}px`,
              height: `${3 + (i % 3) * 1.5}px`,
            }}
          />
        ))}

      {showFog &&
        Array.from({ length: 5 }).map((_, i) => (
          <span
            key={`fog-${i}`}
            className="fog-band"
            style={{
              top: `${15 + i * 14}%`,
              opacity: 0.12 + i * 0.03,
              animationDelay: `${i * -2.5}s`,
              animationDuration: `${16 + i * 2.6}s`,
            }}
          />
        ))}

      {showLightning && (
        <>
          <div className="lightning-flash" />
          <span className="bolt bolt-a" />
          <span className="bolt bolt-b" />
        </>
      )}
    </div>
  );
}

export default function WeatherAdvisor() {
  const [city, setCity] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const suggestionAbortRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  const theme = result
    ? getWeatherTheme(result.weather)
    : { bg: "from-slate-800 via-blue-900 to-slate-900", accent: "#93c5fd", particle: "🌤️", label: "Weather" };
  const beforeYouGoNotes = result ? buildBeforeYouGoNotes(result.weather, result.recommendations) : [];
  const isResultView = Boolean(result && !loading);
  const shouldShowSuggestions = isSearchFocused && city.trim();

  const handleSearch = useCallback(
    async (searchInput) => {
      const q =
        typeof searchInput === "string"
          ? searchInput.trim()
          : (searchInput?.name || searchInput?.label || city).trim();
      if (!q) return;

      setIsSearchFocused(false);
      setLoading(true);
      setError("");
      setResult(null);

      try {
        const hasCoords =
          searchInput &&
          typeof searchInput === "object" &&
          Number.isFinite(searchInput.lat) &&
          Number.isFinite(searchInput.lon);

        const data = hasCoords ? await fetchWeatherFromCoords(searchInput.lat, searchInput.lon) : await fetchWeatherFromBackend(q);
        setResult(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [city]
  );

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
          const data = await fetchWeatherFromCoords(pos.coords.latitude, pos.coords.longitude);
          setResult(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      () => setError("Location permission denied.")
    );
  };

  const selectSuggestion = useCallback(
    (suggestion) => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      setCity(suggestion.label || suggestion.name);
      setIsSearchFocused(false);
      handleSearch(suggestion);
    },
    [handleSearch]
  );

  useEffect(() => {
    const q = city.trim();
    if (!q || !isSearchFocused) {
      if (!q) setCitySuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      suggestionAbortRef.current?.abort();
      const controller = new AbortController();
      suggestionAbortRef.current = controller;

      setSuggestionsLoading(true);
      try {
        const matches = await fetchCitySuggestions(q, controller.signal);
        setCitySuggestions(matches);
      } catch (err) {
        if (err?.name !== "AbortError") {
          const fallbackMatches = getFallbackSuggestions(q);
          setCitySuggestions(fallbackMatches);
        }
      } finally {
        setSuggestionsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [city, isSearchFocused]);

  useEffect(() => {
    return () => {
      suggestionAbortRef.current?.abort();
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

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
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes drift-cloud {
          from { transform: translateX(-24vw); }
          to { transform: translateX(124vw); }
        }
        @keyframes rain-fall {
          0% { transform: translate3d(0, -14vh, 0) rotate(14deg); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate3d(-8vw, 116vh, 0) rotate(14deg); opacity: 0; }
        }
        @keyframes snow-fall {
          0% { transform: translate3d(0, -12vh, 0); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translate3d(8vw, 110vh, 0); opacity: 0; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.3); }
        }
        @keyframes sway-fog {
          0%, 100% { transform: translateX(-8%); }
          50% { transform: translateX(8%); }
        }
        @keyframes solar-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.78; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
        }
        @keyframes ray-sway {
          0%, 100% { opacity: 0.25; transform-origin: center 200px; }
          50% { opacity: 0.62; transform-origin: center 200px; }
        }
        @keyframes flash {
          0%, 74%, 100% { opacity: 0; }
          75% { opacity: 0.18; }
          76% { opacity: 0.02; }
          77% { opacity: 0.28; }
          78% { opacity: 0; }
          88% { opacity: 0.14; }
          89% { opacity: 0; }
        }
        .weather-effects {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }
        .grain-layer {
          position: absolute;
          inset: 0;
          opacity: 0.06;
          background-image: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5) 0.5px, transparent 0.5px);
          background-size: 4px 4px;
        }
        .sun-core {
          position: absolute;
          width: 176px;
          height: 176px;
          border-radius: 999px;
          top: 20%;
          left: 16%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(255,244,214,0.96), rgba(255,200,90,0.66));
          animation: solar-pulse 4.6s ease-in-out infinite;
        }
        .sun-ray {
          position: absolute;
          width: 5px;
          height: 58px;
          top: 20%;
          left: 16%;
          border-radius: 99px;
          background: linear-gradient(to bottom, rgba(255,240,180,0.5), transparent);
          animation: ray-sway 3.4s ease-in-out infinite;
        }
        .moon-core {
          position: absolute;
          width: 118px;
          height: 118px;
          border-radius: 999px;
          top: 18%;
          right: 12%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.98), rgba(202,220,255,0.48));
          box-shadow: 0 0 56px rgba(189, 206, 255, 0.35);
        }
        .star-dot {
          position: absolute;
          width: 2.5px;
          height: 2.5px;
          border-radius: 999px;
          background: rgba(241, 245, 249, 0.92);
          animation: twinkle 2.6s ease-in-out infinite;
        }
        .cloud-band {
          position: absolute;
          border-radius: 999px;
          filter: blur(1px);
          background: linear-gradient(180deg, rgba(255,255,255,0.30), rgba(255,255,255,0.12));
          animation-name: drift-cloud;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .storm-cloud {
          background: linear-gradient(180deg, rgba(203,213,225,0.26), rgba(100,116,139,0.18));
        }
        .rain-drop {
          position: absolute;
          top: -10vh;
          width: 1.8px;
          height: 74px;
          border-radius: 999px;
          background: linear-gradient(to bottom, rgba(191,219,254,0), rgba(147,197,253,0.72));
          animation: rain-fall linear infinite;
        }
        .snow-flake {
          position: absolute;
          top: -8vh;
          border-radius: 999px;
          background: rgba(240,249,255,0.9);
          animation: snow-fall linear infinite;
          box-shadow: 0 0 9px rgba(255,255,255,0.4);
        }
        .fog-band {
          position: absolute;
          left: -10%;
          width: 120%;
          height: 78px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(226,232,240,0), rgba(226,232,240,0.28), rgba(226,232,240,0));
          filter: blur(8px);
          animation: sway-fog ease-in-out infinite;
        }
        .lightning-flash {
          position: absolute;
          inset: 0;
          background: rgba(226,232,240,0.75);
          mix-blend-mode: screen;
          animation: flash 8.4s linear infinite;
        }
        .bolt {
          position: absolute;
          width: 2px;
          background: linear-gradient(to bottom, rgba(248,250,252,0), rgba(241,245,249,0.9), rgba(148,163,184,0));
          filter: drop-shadow(0 0 12px rgba(241,245,249,0.7));
          opacity: 0;
          animation: flash 8.4s linear infinite;
        }
        .bolt-a { height: 190px; left: 73%; top: 10%; transform: rotate(18deg); }
        .bolt-b { height: 150px; left: 66%; top: 16%; transform: rotate(-9deg); animation-delay: 0.28s; }
        .orb { animation: pulse-slow 4s ease-in-out infinite; }
        .search-input::placeholder { color: rgba(255,255,255,0.35); }
        .search-input:focus { outline: none; border-color: rgba(255,255,255,0.4) !important; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 12px; }
        .result-shell { display: grid; gap: 14px; }
        .left-stack { display: grid; gap: 14px; }
        .outfit-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
        .city-suggestion:last-child { border-bottom: none !important; }
        @media (min-width: 1024px) {
          .result-shell { grid-template-columns: minmax(320px, 35%) minmax(0, 65%); height: min(70vh, 760px); }
          .left-stack, .outfit-panel, .outfit-scroll { min-height: 0; }
          .outfit-scroll { overflow-y: auto; padding-right: 4px; }
        }
        @media (max-width: 480px) {
          .card-grid { grid-template-columns: repeat(3, 1fr); }
          .outfit-grid { grid-template-columns: repeat(2, 1fr); }
          .sun-core { width: 120px; height: 120px; top: 19%; left: 20%; }
          .moon-core { width: 88px; height: 88px; right: 10%; top: 16%; }
          .rain-drop { height: 62px; }
        }
      `}</style>

      <div
        className={`min-h-screen bg-gradient-to-br ${theme.bg || "from-slate-800 via-blue-900 to-slate-900"} transition-all duration-1000 relative overflow-hidden`}
        style={{ fontFamily: "'DM Sans', sans-serif", background: theme.background || undefined }}
      >
        <WeatherEffects scene={theme.scene || "partly-cloudy"} accent={theme.accent || "#93c5fd"} />
        <div className="orb absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${theme.accent}22, transparent 70%)` }} />
        <div
          className="orb absolute bottom-[-5%] right-[-5%] w-80 h-80 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${theme.accent}18, transparent 70%)`, animationDelay: "2s" }}
        />

        <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
          <div>
            <h1 className="text-white font-bold text-xl" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
              🌤️ WeatherWear
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", letterSpacing: "0.05em" }} className="uppercase font-medium">
              Clothing Advisor
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px #4ade80" }} />
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.7rem" }}>Live</span>
          </div>
        </header>

        <main className={`relative z-10 mx-auto px-6 ${isResultView ? "max-w-7xl pb-6" : "max-w-4xl pb-16"}`}>
          <div className={`text-center ${isResultView ? "mb-4" : "mb-10"}`} style={{ animation: "slideUp 0.6s ease both" }}>
            <h2
              className="text-white mb-3"
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: isResultView ? "clamp(1.45rem, 3.8vw, 2.2rem)" : "clamp(1.8rem, 5vw, 3rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              What should I wear
              <br />
              <span style={{ color: theme.accent }}>today?</span>
            </h2>
            {!isResultView && (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>
                Enter a city, neighborhood, or address for real-time weather and outfit recommendations
              </p>
            )}
          </div>

          <div className={`${isResultView ? "max-w-6xl mb-4" : "max-w-xl mb-6"} mx-auto`} style={{ animation: "slideUp 0.6s 0.1s ease both" }}>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                <input
                  className="search-input w-full pl-11 pr-4 py-4 rounded-2xl text-white font-medium"
                  style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", fontSize: isResultView ? "1rem" : "0.95rem" }}
                  placeholder="City, neighborhood, street address..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    blurTimeoutRef.current = setTimeout(() => {
                      setIsSearchFocused(false);
                      suggestionAbortRef.current?.abort();
                      setSuggestionsLoading(false);
                    }, 120);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                    if (e.key === "Escape") setIsSearchFocused(false);
                  }}
                />

                {shouldShowSuggestions && (
                  <div
                    className="absolute top-[calc(100%+0.5rem)] left-0 right-0 rounded-2xl overflow-hidden z-20"
                    style={{ background: "rgba(15,23,42,0.96)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)" }}
                  >
                    {suggestionsLoading ? (
                      <p className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        Looking up matching cities...
                      </p>
                    ) : citySuggestions.length > 0 ? (
                      citySuggestions.map((suggestion) => (
                        <button
                          key={suggestion.label}
                          type="button"
                          className="city-suggestion w-full text-left px-4 py-3 transition-colors hover:bg-white/10"
                          style={{ color: "rgba(255,255,255,0.88)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectSuggestion(suggestion)}
                        >
                          {suggestion.label}
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        No matching city found.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleGeoLocation}
                title="Use my location"
                className="w-14 rounded-2xl flex items-center justify-center transition-all hover:opacity-90 flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <span className="text-xl">📍</span>
              </button>

              <button
                onClick={() => handleSearch()}
                disabled={loading || !city.trim()}
                className="px-6 py-4 rounded-2xl font-semibold text-sm transition-all hover:opacity-90 flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${theme.accent}cc, ${theme.accent})`, color: "#0f172a", opacity: loading || !city.trim() ? 0.5 : 1 }}
              >
                {loading ? "..." : "Search"}
              </button>
            </div>

            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setCity(s);
                    handleSearch(s);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="max-w-xl mx-auto mb-6 rounded-2xl px-5 py-4 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <span className="text-xl">⚠️</span>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div
                className="w-14 h-14 rounded-full border-2 border-transparent flex items-center justify-center text-3xl"
                style={{ borderTopColor: theme.accent, animation: "spin-slow 1s linear infinite" }}
              >
                {theme.particle}
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Fetching weather data...</p>
            </div>
          )}

          {result && !loading && (
            <div className="result-shell" style={{ animation: "slideUp 0.5s ease both" }}>
              <div className="left-stack">
                <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <div className="flex items-start justify-between mb-5 flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-3xl">{theme.particle}</span>
                        <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase" style={{ background: `${theme.accent}33`, color: theme.accent, letterSpacing: "0.06em" }}>
                          {theme.label}
                        </span>
                      </div>
                      <h3 className="text-white font-bold text-3xl" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
                        {result.weather.city}
                        <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, fontSize: "1rem" }}> / {result.weather.country}</span>
                      </h3>
                      <p style={{ color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }} className="text-sm mt-1">
                        {result.weather.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-white font-black"
                        style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(3.5rem, 10vw, 6.4rem)", lineHeight: 1, letterSpacing: "-0.04em", color: theme.accent }}
                      >
                        {result.weather.temp}°
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem" }}>Feels {result.weather.feelsLike}°C</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <StatPill label="Humidity" value={`${result.weather.humidity}%`} icon="💧" />
                    <StatPill label="Wind" value={`${result.weather.windSpeed} km/h`} icon="🌬️" />
                    <StatPill label="Feels Like" value={`${result.weather.feelsLike}°C`} icon="🌡️" />
                  </div>
                </div>

                <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif", fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
                    <span style={{ color: theme.accent }}>🚶</span> Before You Go Notes
                  </h4>
                  <div className="grid gap-2 mb-4">
                    {beforeYouGoNotes.map((note, i) => (
                      <TipBadge key={`before-${i}`} tip={note} />
                    ))}
                  </div>
                  <h5 className="text-white font-semibold mb-2 flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif", fontSize: "0.85rem", letterSpacing: "-0.01em" }}>
                    <span style={{ color: theme.accent }}>💡</span> Quick Style Tips
                  </h5>
                  <div className="grid gap-2">
                    {result.tips.slice(0, 2).map((tip, i) => (
                      <TipBadge key={i} tip={tip} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="outfit-panel rounded-3xl p-5 flex flex-col" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif", fontSize: "1rem", letterSpacing: "-0.01em" }}>
                    <span style={{ color: theme.accent }}>👗</span> Outfit Recommendations
                  </h4>
                  <span className="text-xs font-semibold rounded-full px-3 py-1" style={{ background: `${theme.accent}22`, color: theme.accent }}>
                    {result.recommendations.length} items
                  </span>
                </div>

                <div className="outfit-scroll flex-1">
                  <div className="outfit-grid">
                    {result.recommendations.map((r, i) => (
                      <ClothingCard key={r.item} {...r} index={i} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="text-center py-16" style={{ animation: "slideUp 0.6s 0.2s ease both" }}>
              <div className="text-6xl mb-4">👔</div>
              <p className="text-white font-semibold mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                Ready when you are
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Try searching a city, neighborhood, or street address</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
