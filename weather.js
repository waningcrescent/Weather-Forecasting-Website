import axios from "axios";

export async function getWeather(lat, lon, timezone) {
  try {
    console.log(`Fetching weather for lat: ${lat}, lon: ${lon}, timezone: ${timezone}`);
    const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: lat,
        longitude: lon,
        current_weather: true,
        hourly: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        daily: "temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,weather_code",
        timezone: timezone
      }
    });
    console.log("API response:", response.data);

    return {
      current: parseCurrentWeather(response.data),
      daily: parseDailyWeather(response.data),
      hourly: parseHourlyWeather(response.data)
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
}

function parseCurrentWeather({ current_weather, daily }) {
  const { temperature: currentTemp, windspeed: windSpeed, weathercode: iconCode } = current_weather;
  const { temperature_2m_max: [maxTemp], temperature_2m_min: [minTemp], apparent_temperature_max: [maxFeelsLike], apparent_temperature_min: [minFeelsLike], precipitation_sum: [precip] } = daily;

  return {
    currentTemp: Math.round(currentTemp),
    highTemp: Math.round(maxTemp),
    lowTemp: Math.round(minTemp),
    highFeelsLike: Math.round(maxFeelsLike),
    lowFeelsLike: Math.round(minFeelsLike),
    windSpeed: Math.round(windSpeed),
    precip: Math.round(precip * 100) / 100,
    iconCode,
  };
}

function parseDailyWeather({ daily }) {
    console.log("Daily data:", daily);
  
    // Corrected field names and added a check for all required fields
    if (!daily || !daily.time || !Array.isArray(daily.weather_code) || !Array.isArray(daily.temperature_2m_max)) {
      console.error("Daily weather data is missing or incomplete.");
      return []; // Return an empty array if data is missing or incomplete
    }
  
    return daily.time.map((time, index) => ({
      timestamp: new Date(time).getTime(),
      iconCode: daily.weather_code[index],
      maxTemp: Math.round(daily.temperature_2m_max[index]),
    }));
}

function parseHourlyWeather({ hourly, current_weather }) {
    if (!hourly || !hourly.time || hourly.time.length === 0) {
      console.error("Hourly weather data is missing or incomplete.");
      return [];
    }
  
    return hourly.time.map((time, index) => ({
      timestamp: new Date(time).getTime(),
      iconCode: hourly.weather_code && hourly.weather_code[index], // Check if weather_code array is defined
      temp: hourly.temperature_2m && Math.round(hourly.temperature_2m[index]), // Check if temperature_2m array is defined
      feelsLike: hourly.apparent_temperature && Math.round(hourly.apparent_temperature[index]), // Check if apparent_temperature array is defined
      windSpeed: hourly.wind_speed_10m && Math.round(hourly.wind_speed_10m[index]), // Check if wind_speed array is defined
      precip: hourly.precipitation && Math.round(hourly.precipitation[index] * 100) / 100, // Check if precipitation array is defined
    })).filter(({ timestamp }) => timestamp >= new Date(current_weather.time).getTime());
  }
  