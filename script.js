const apiKey = "29287945dd86c2ab7a0e530889eacaeb";

function toggleTheme() {
  document.body.classList.toggle("dark");
}

function searchCity() {
  const city = document.getElementById("cityInput").value;
  if (!city) {
    alert("Please enter a city name.");
    return;
  }
  getWeatherData(city);
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        document.getElementById("weatherResult").innerText = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const apiKey = '29287945dd86c2ab7a0e530889eacaeb'; // key
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const temperature = data.main.temp;
            const humidity = data.main.humidity;
            const windSpeed = data.wind.speed;
            const weatherDescription = data.weather[0].description;
            const cityName = data.name;

            document.getElementById("weatherResult").innerHTML = `
                📍 Location: ${cityName} <br>
                🌡️ Temperature: ${temperature} °C <br>
                💧 Humidity: ${humidity}% <br>
                🌬️ Wind Speed: ${windSpeed} m/s <br>
                🌥️ Weather: ${weatherDescription} <br>
      
            `;
        })
        .catch(error => {
            document.getElementById("weatherResult").innerText = "Error fetching weather data.";
            console.error(error);
        });
}

function showError(error) {
    let message = "";
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            message = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            message = "An unknown error occurred.";
            break;
    }
    document.getElementById("weatherResult").innerText = message;
}






function getWeatherData(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => displayWeather(data))
    .catch((error) => {
      document.getElementById("weatherResult").innerHTML = "City not found!";
    });
}

function displayWeather(data) {
  if (data.cod !== 200) {
    document.getElementById("weatherResult").innerHTML = "Error: " + data.message;
    return;
  }

  const resultDiv = document.getElementById("weatherResult");
  resultDiv.innerHTML = `
    <h3>${data.name}, ${data.sys.country}</h3>
    <p>🌡 Temperature: ${data.main.temp} °C</p>
    <p>💧 Humidity: ${data.main.humidity}%</p>
    <p>🌬 Wind Speed: ${data.wind.speed} m/s</p>
    <p>⛅ Weather: ${data.weather[0].description}</p>
  `;
}
