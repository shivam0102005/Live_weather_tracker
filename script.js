// ============================================================
//  WeatherLens - script.js
//  Author: Shivam Upadhyay (improved version)
// ============================================================

const apiKey = "29287945dd86c2ab7a0e530889eacaeb";   // 🔒 Keep this private in production

const resultDiv     = document.getElementById("weatherResult");
const forecastPanel = document.getElementById("forecastPanel");
const statsPanel    = document.getElementById("statsPanel");
const cityInput     = document.getElementById("cityInput");

/* ============================================================
   THEME
============================================================ */
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  document.body.classList.toggle("light", !isDark);
  document.getElementById("themeBtn").textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// Restore saved theme on load
(function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  document.body.className = saved;
  document.getElementById("themeBtn").textContent = saved === "dark" ? "☀️" : "🌙";
})();

/* ============================================================
   LIVE CLOCK
============================================================ */
function updateClock() {
  const now = new Date();
  document.getElementById("liveClock").textContent = now.toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}
setInterval(updateClock, 1000);
updateClock();

/* ============================================================
   SEARCH HISTORY  (localStorage)
============================================================ */
function getHistory() {
  return JSON.parse(localStorage.getItem("weatherHistory") || "[]");
}

function saveToHistory(city) {
  let history = getHistory();
  history = [city, ...history.filter(c => c.toLowerCase() !== city.toLowerCase())].slice(0, 6);
  localStorage.setItem("weatherHistory", JSON.stringify(history));
  renderHistory();
}

function clearHistory() {
  localStorage.removeItem("weatherHistory");
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById("recentSearches");
  const history   = getHistory();
  if (!history.length) { container.innerHTML = ""; return; }

  container.innerHTML = history.map(city =>
    `<span class="recent-tag" onclick="quickSearch('${city}')">${city}</span>`
  ).join("");
}

function quickSearch(city) {
  cityInput.value = city;
  searchCity();
}

renderHistory(); // on page load

/* ============================================================
   ENTER KEY SUPPORT
============================================================ */
cityInput.addEventListener("keypress", e => {
  if (e.key === "Enter") searchCity();
});

/* ============================================================
   SEARCH CITY
============================================================ */
function searchCity() {
  const city = cityInput.value.trim();
  if (!city) { showError("Please enter a city name."); return; }
  fetchWeather(`q=${encodeURIComponent(city)}`);
}

/* ============================================================
   GEOLOCATION
============================================================ */
function getLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    pos => fetchWeather(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
    err => showError(geoErrorMessage(err))
  );
}

function geoErrorMessage(error) {
  const msgs = {
    [error.PERMISSION_DENIED]:    "Location access denied.",
    [error.POSITION_UNAVAILABLE]: "Location unavailable.",
    [error.TIMEOUT]:               "Location request timed out."
  };
  return msgs[error.code] || "Unknown location error.";
}

/* ============================================================
   FETCH WEATHER + FORECAST
============================================================ */
function fetchWeather(query) {
  showLoading();

  const currentURL  = `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=metric`;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?${query}&appid=${apiKey}&units=metric`;

  Promise.all([
    fetch(currentURL).then(r => r.json()),
    fetch(forecastURL).then(r => r.json())
  ])
    .then(([current, forecast]) => {
      if (current.cod !== 200) { showError(`⚠ ${current.message}`); return; }
      displayWeather(current);
      displayForecast(forecast);
      displayStats(current);
      saveToHistory(current.name);
    })
    .catch(() => showError("⚠ Could not fetch weather data. Check your connection."));
}

/* ============================================================
   DISPLAY — CURRENT WEATHER
============================================================ */
function displayWeather(d) {
  const iconURL     = `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`;
  const sunrise     = formatTime(d.sys.sunrise);
  const sunset      = formatTime(d.sys.sunset);
  const windDir     = degreesToCompass(d.wind.deg);

  resultDiv.classList.remove("hidden");
  resultDiv.innerHTML = `
    <div class="weather-main">
      <div class="weather-icon-wrap">
        <img src="${iconURL}" alt="${d.weather[0].description}">
      </div>
      <div class="weather-info">
        <div class="city-name">${d.name}, ${d.sys.country}</div>
        <div class="description">${d.weather[0].description}</div>
        <div class="temp-large">${Math.round(d.main.temp)}°C</div>
        <div class="feels-like">Feels like ${Math.round(d.main.feels_like)}°C</div>
      </div>
    </div>
    <div class="weather-pills">
      <div class="pill">💧 <span class="label">Humidity</span>&nbsp; ${d.main.humidity}%</div>
      <div class="pill">🌬 <span class="label">Wind</span>&nbsp; ${d.wind.speed} m/s ${windDir}</div>
      <div class="pill">🔭 <span class="label">Visibility</span>&nbsp; ${(d.visibility / 1000).toFixed(1)} km</div>
      <div class="pill">🌅 <span class="label">Sunrise</span>&nbsp; ${sunrise}</div>
      <div class="pill">🌇 <span class="label">Sunset</span>&nbsp; ${sunset}</div>
      <div class="pill">📊 <span class="label">Pressure</span>&nbsp; ${d.main.pressure} hPa</div>
    </div>
  `;
}

/* ============================================================
   DISPLAY — 5-DAY FORECAST
============================================================ */
function displayForecast(data) {
  if (!data || data.cod !== "200") return;

  // Pick one entry per day (around noon)
  const daily = {};
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day  = date.toDateString();
    if (!daily[day]) daily[day] = item;
  });

  const days = Object.values(daily).slice(0, 5);

  forecastPanel.classList.remove("hidden");
  document.getElementById("forecastCards").innerHTML = days.map(item => {
    const date    = new Date(item.dt * 1000);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const iconURL = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
    return `
      <div class="forecast-card">
        <div class="fc-day">${dayName}</div>
        <img src="${iconURL}" alt="${item.weather[0].description}">
        <div class="fc-temp">${Math.round(item.main.temp)}°C</div>
        <div class="fc-desc">${item.weather[0].description}</div>
      </div>
    `;
  }).join("");
}

/* ============================================================
   DISPLAY — DETAILED STATS
============================================================ */
function displayStats(d) {
  statsPanel.classList.remove("hidden");
  const stats = [
    { icon: "🌡", label: "Min Temp",      value: `${Math.round(d.main.temp_min)}°C` },
    { icon: "🌡", label: "Max Temp",      value: `${Math.round(d.main.temp_max)}°C` },
    { icon: "☁️", label: "Cloud Cover",   value: `${d.clouds.all}%` },
    { icon: "👁", label: "Visibility",    value: `${(d.visibility / 1000).toFixed(1)} km` },
    { icon: "💨", label: "Wind Gust",     value: d.wind.gust ? `${d.wind.gust} m/s` : "N/A" },
    { icon: "📍", label: "Coordinates",   value: `${d.coord.lat.toFixed(2)}, ${d.coord.lon.toFixed(2)}` },
    { icon: "🕐", label: "Local Time",    value: formatLocalTime(d.timezone) },
    { icon: "🌐", label: "Timezone",      value: tzOffsetLabel(d.timezone) },
  ];

  document.getElementById("statsGrid").innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
    </div>
  `).join("");
}

/* ============================================================
   LOADING & ERROR STATES
============================================================ */
function showLoading() {
  resultDiv.classList.remove("hidden");
  forecastPanel.classList.add("hidden");
  statsPanel.classList.add("hidden");
  resultDiv.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <span>Fetching weather…</span>
    </div>
  `;
}

function showError(msg) {
  resultDiv.classList.remove("hidden");
  forecastPanel.classList.add("hidden");
  statsPanel.classList.add("hidden");
  resultDiv.innerHTML = `<div class="error-msg">${msg}</div>`;
}

/* ============================================================
   HELPERS
============================================================ */
function formatTime(unix) {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLocalTime(timezoneOffset) {
  const utc  = Date.now() + new Date().getTimezoneOffset() * 60000;
  const local = new Date(utc + timezoneOffset * 1000);
  return local.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function tzOffsetLabel(seconds) {
  const h = Math.floor(Math.abs(seconds) / 3600);
  const m = Math.floor((Math.abs(seconds) % 3600) / 60);
  const sign = seconds >= 0 ? "+" : "-";
  return `UTC${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function degreesToCompass(deg) {
  if (deg === undefined) return "";
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}
