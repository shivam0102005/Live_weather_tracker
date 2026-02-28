const apiKey = "29287945dd86c2ab7a0e530889eacaeb";   // 🔒 Always keep key in one place only

const resultDiv = document.getElementById("weatherResult");
const cityInput = document.getElementById("cityInput");

/* ================= DARK MODE ================= */
function toggleTheme() {
  document.body.classList.toggle("dark");
}

/* ================= SEARCH CITY ================= */
function searchCity() {
  const city = cityInput.value.trim();

  if (!city) {
    alert("Please enter a city name.");
    return;
  }

  getWeatherData(`q=${city}`);
}

/* ================= ENTER KEY SUPPORT ================= */
cityInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    searchCity();
  }
});

/* ================= USE MY LOCATION ================= */
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
  } else {
    resultDiv.innerText = "Geolocation not supported.";
  }
}

function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  getWeatherData(`lat=${lat}&lon=${lon}`);
}

/* ================= FETCH WEATHER ================= */
function getWeatherData(query) {
  const url = `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=metric`;

  resultDiv.innerHTML = "Loading... ⏳";

  fetch(url)
    .then(response => response.json())
    .then(data => displayWeather(data))
    .catch(() => {
      resultDiv.innerHTML = "⚠ Error fetching weather data.";
    });
}

/* ================= DISPLAY WEATHER ================= */
function displayWeather(data) {
  if (data.cod !== 200) {
    resultDiv.innerHTML = `⚠ ${data.message}`;
    return;
  }

  const icon = data.weather[0].icon;
  const iconURL = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  resultDiv.innerHTML = `
    <h3>${data.name}, ${data.sys.country}</h3>
    <img src="${iconURL}" alt="Weather Icon">
    <p>🌡 Temperature: ${data.main.temp} °C</p>
    <p>💧 Humidity: ${data.main.humidity}%</p>
    <p>🌬 Wind Speed: ${data.wind.speed} m/s</p>
    <p>⛅ Weather: ${data.weather[0].description}</p>
  `;
}

/* ================= GEOLOCATION ERROR ================= */
function showError(error) {
  let message = "";

  switch (error.code) {
    case error.PERMISSION_DENIED:
      message = "User denied location access.";
      break;
    case error.POSITION_UNAVAILABLE:
      message = "Location unavailable.";
      break;
    case error.TIMEOUT:
      message = "Location request timed out.";
      break;
    default:
      message = "Unknown error occurred.";
  }

  resultDiv.innerText = message;
}
