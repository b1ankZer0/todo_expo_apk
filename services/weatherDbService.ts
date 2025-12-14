import { Query } from "react-native-appwrite";
import { WeatherDb } from "@/lib/dbActions";
import { WeatherDataDay } from "./weatherService";

export interface WeatherDbRecord {
  date: string;
  latitude: number;
  longitude: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
  lastUpdated: string;
}

/**
 * Save or update weather data in Appwrite
 */
export const saveWeatherData = async (
  weatherData: WeatherDataDay,
  latitude: number,
  longitude: number
): Promise<void> => {
  try {
    // Check if weather data already exists for this date and location
    const existingRecords = await WeatherDb.getAll([
      Query.equal("date", weatherData.date),
      Query.equal("latitude", latitude.toFixed(4)),
      Query.equal("longitude", longitude.toFixed(4)),
    ]);

    const weatherRecord = {
      date: weatherData.date,
      latitude: parseFloat(latitude.toFixed(4)),
      longitude: parseFloat(longitude.toFixed(4)),
      tempMax: weatherData.tempMax,
      tempMin: weatherData.tempMin,
      precipitation: weatherData.precipitation,
      weatherCode: weatherData.weatherCode,
      lastUpdated: new Date().toISOString(),
    };

    if (existingRecords.documents.length > 0) {
      // Update existing record
      const existingRecord = existingRecords.documents[0];
      
      // Check if data has changed
      const hasChanged =
        existingRecord.tempMax !== weatherData.tempMax ||
        existingRecord.tempMin !== weatherData.tempMin ||
        existingRecord.precipitation !== weatherData.precipitation ||
        existingRecord.weatherCode !== weatherData.weatherCode;

      if (hasChanged) {
        await WeatherDb.update(existingRecord.$id, weatherRecord);
        console.log(`Weather data updated for ${weatherData.date}`);
      } else {
        console.log(`Weather data unchanged for ${weatherData.date}`);
      }
    } else {
      // Create new record
      await WeatherDb.create(weatherRecord);
      console.log(`Weather data saved for ${weatherData.date}`);
    }
  } catch (error) {
    console.error("Error saving weather data:", error);
    throw error;
  }
};

/**
 * Save multiple weather data records
 */
export const saveWeatherDataBatch = async (
  weatherDataArray: WeatherDataDay[],
  latitude: number,
  longitude: number
): Promise<void> => {
  try {
    const promises = weatherDataArray.map((data) =>
      saveWeatherData(data, latitude, longitude)
    );
    await Promise.all(promises);
    console.log(`Saved ${weatherDataArray.length} weather records`);
  } catch (error) {
    console.error("Error saving batch weather data:", error);
    throw error;
  }
};

/**
 * Get weather data from Appwrite for a specific date
 */
export const getWeatherDataFromDb = async (
  date: string,
  latitude: number,
  longitude: number
): Promise<WeatherDbRecord | null> => {
  try {
    const records = await WeatherDb.getAll([
      Query.equal("date", date),
      Query.equal("latitude", latitude.toFixed(4)),
      Query.equal("longitude", longitude.toFixed(4)),
    ]);

    if (records.documents.length > 0) {
      return records.documents[0] as WeatherDbRecord;
    }
    return null;
  } catch (error) {
    console.error("Error getting weather data from DB:", error);
    return null;
  }
};

/**
 * Get weather data for a date range
 */
export const getWeatherDataRangeFromDb = async (
  startDate: string,
  endDate: string,
  latitude: number,
  longitude: number
): Promise<WeatherDbRecord[]> => {
  try {
    const records = await WeatherDb.getAll([
      Query.greaterThanEqual("date", startDate),
      Query.lessThanEqual("date", endDate),
      Query.equal("latitude", latitude.toFixed(4)),
      Query.equal("longitude", longitude.toFixed(4)),
    ]);

    return records.documents as WeatherDbRecord[];
  } catch (error) {
    console.error("Error getting weather range from DB:", error);
    return [];
  }
};
