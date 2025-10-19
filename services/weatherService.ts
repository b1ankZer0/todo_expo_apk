import { Alert } from "react-native";
import { LocationCoords } from "./locationService";

export interface WeatherData {
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
}

export interface WeatherMap {
  [date: string]: WeatherData;
}

export interface WeatherDataDay {
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
  date: string;
}

const fetchWeatherForDate = async (
  latitude: number,
  longitude: number,
  date: Date
): Promise<WeatherDataDay | null> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const formatDate = (d: Date) => {
      return d.toISOString().split("T")[0]; // YYYY-MM-DD
    };

    const dateString = formatDate(targetDate);

    // Check if date is in the past or today
    if (targetDate <= today) {
      // Use Archive API for past dates
      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${dateString}&end_date=${dateString}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto`
      );

      const data = await response.json();

      if (data.daily && data.daily.time.length > 0) {
        return {
          tempMax: Math.round(data.daily.temperature_2m_max[0]),
          tempMin: Math.round(data.daily.temperature_2m_min[0]),
          precipitation: data.daily.precipitation_probability_max?.[0] || 0,
          weatherCode: data.daily.weathercode[0],
          date: dateString,
        };
      }
    } else {
      // Use Forecast API for future dates
      const daysFromNow = Math.ceil(
        (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if within 16-day forecast limit
      if (daysFromNow > 16) {
        console.warn("Date is beyond 16-day forecast limit");
        return null;
      }

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=16`
      );

      const data = await response.json();

      if (data.daily && data.daily.time.length > 0) {
        // Find the index of our target date
        const dateIndex = data.daily.time.findIndex(
          (d: string) => d === dateString
        );

        if (dateIndex !== -1) {
          return {
            tempMax: Math.round(data.daily.temperature_2m_max[dateIndex]),
            tempMin: Math.round(data.daily.temperature_2m_min[dateIndex]),
            precipitation:
              data.daily.precipitation_probability_max[dateIndex] || 0,
            weatherCode: data.daily.weathercode[dateIndex],
            date: dateString,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching weather for date:", error);
    return null;
  }
};

/**
 * Fetch weather data for a month from Open-Meteo API
 */
export const fetchWeatherForMonth = async (
  location: LocationCoords | null,
  setLoading: (loading: boolean) => void,
  setWeatherData: (data: WeatherMap) => void
): Promise<void> => {
  if (!location) return;

  setLoading(true);
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=16`
    );

    const data = await response.json();

    const weatherMap: WeatherMap = {};
    if (data.daily) {
      data.daily.time.forEach((date: string, index: number) => {
        weatherMap[date] = {
          tempMax: Math.round(data.daily.temperature_2m_max[index]),
          tempMin: Math.round(data.daily.temperature_2m_min[index]),
          precipitation: data.daily.precipitation_probability_max[index],
          weatherCode: data.daily.weathercode[index],
        };
      });
    }

    setWeatherData(weatherMap);
  } catch (error) {
    console.error("Error fetching weather:", error);
    Alert.alert("Error", "Failed to fetch weather data");
  } finally {
    setLoading(false);
  }
};

/**
 * Get weather emoji based on weather code
 */
export const getWeatherEmoji = (code: number): string => {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "☁️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  return "⛈️";
};

/**
 * Get weather description based on weather code
 */
export const getWeatherDescription = (code: number): string => {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Cloudy";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain Showers";
  if (code <= 86) return "Snow Showers";
  return "Thunderstorm";
};
