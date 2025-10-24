import * as Location from "expo-location";
import { localStorages } from "./localStorage";

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface CitySearchResult {
  name: string;
  lat: number;
  lng: number;
  admin1?: string;
  city?: string;
}

export const POPULAR_CITIES: CitySearchResult[] = [
  { city: "Dhaka", name: "Dhaka, Bangladesh", lat: 23.8103, lng: 90.4125 },
  { city: "New York", name: "New York, USA", lat: 40.7128, lng: -74.006 },
  { city: "London", name: "London, UK", lat: 51.5074, lng: -0.1278 },
  { city: "Tokyo", name: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
  { city: "Paris", name: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { city: "Dubai", name: "Dubai, UAE", lat: 25.2048, lng: 55.2708 },
  { city: "Sydney", name: "Sydney, Australia", lat: -33.8688, lng: 151.2093 },
  { city: "Singapore", name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { city: "Mumbai", name: "Mumbai, India", lat: 19.076, lng: 72.8777 },
  {
    city: "Los Angeles",
    name: "Los Angeles, USA",
    lat: 34.0522,
    lng: -118.2437,
  },
  { city: "Toronto", name: "Toronto, Canada", lat: 43.6532, lng: -79.3832 },
  { city: "Berlin", name: "Berlin, Germany", lat: 52.52, lng: 13.405 },
  { city: "Beijing", name: "Beijing, China", lat: 39.9042, lng: 116.4074 },
  { city: "Moscow", name: "Moscow, Russia", lat: 55.7558, lng: 37.6173 },
  { city: "Istanbul", name: "Istanbul, Turkey", lat: 41.0082, lng: 28.9784 },
  { city: "Bangkok", name: "Bangkok, Thailand", lat: 13.7563, lng: 100.5018 },
  { city: "Hong Kong", name: "Hong Kong", lat: 22.3193, lng: 114.1694 },
  { city: "Seoul", name: "Seoul, South Korea", lat: 37.5665, lng: 126.978 },
  {
    city: "Mexico City",
    name: "Mexico City, Mexico",
    lat: 19.4326,
    lng: -99.1332,
  },
  {
    city: "São Paulo",
    name: "São Paulo, Brazil",
    lat: -23.5505,
    lng: -46.6333,
  },
];

/**
 * Request location permissions and get current location
 */

interface SavedLocation {
  location: LocationCoords;
  locationName: string;
  timestamp: number;
}

const LOCATION_STORAGE_KEY = "saved_location";

/**
 * Check if location services are enabled and permission is granted
 */
export const isGPSEnabled = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      return false;
    }

    // Check if location services are actually enabled
    const isEnabled = await Location.hasServicesEnabledAsync();
    return isEnabled;
  } catch (error) {
    console.error("Error checking GPS status:", error);
    return false;
  }
};

/**
 * Get current location without requesting permission (only if already granted)
 */
export const getCurrentLocationIfEnabled = async (): Promise<{
  location: LocationCoords | null;
  locationName: string;
  error?: string;
}> => {
  try {
    const gpsEnabled = await isGPSEnabled();

    if (!gpsEnabled) {
      // GPS not enabled, return cached location
      const savedLocation = await localStorages.getData(LOCATION_STORAGE_KEY);
      if (savedLocation) {
        return {
          location: savedLocation.location,
          locationName: savedLocation.locationName,
        };
      }
      return {
        location: null,
        locationName: "",
        error: "GPS not enabled",
      };
    }

    // GPS is enabled, get current location
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const location: LocationCoords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      const address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const locationName =
        address && address[0]
          ? address[0].city || address[0].region || "Current Location"
          : "Current Location";

      // Save the location for future use
      const locationData: SavedLocation = {
        location,
        locationName,
        timestamp: Date.now(),
      };
      await localStorages.saveData(LOCATION_STORAGE_KEY, locationData);

      return { location, locationName };
    } catch (locationError) {
      // GPS error, use saved location
      console.log("GPS error, using saved location:", locationError);
      const savedLocation = await localStorages.getData(LOCATION_STORAGE_KEY);

      if (savedLocation) {
        return {
          location: savedLocation.location,
          locationName: savedLocation.locationName,
        };
      }

      throw locationError;
    }
  } catch (error) {
    console.error("Error getting location:", error);

    // Last resort: try saved location
    const savedLocation = await localStorages.getData(LOCATION_STORAGE_KEY);
    if (savedLocation) {
      return {
        location: savedLocation.location,
        locationName: savedLocation.locationName,
        error: "Using saved location (GPS unavailable)",
      };
    }

    return {
      location: null,
      locationName: "",
      error: "Failed to get current location",
    };
  }
};

export const getCurrentLocation = async (
  skipGPSIfCached: boolean = false
): Promise<{
  location: LocationCoords | null;
  locationName: string;
  error?: string;
  isFromCache?: boolean;
}> => {
  try {
    // If skipGPSIfCached is true, check for cached location first
    if (skipGPSIfCached) {
      const savedLocation = await localStorages.getData(LOCATION_STORAGE_KEY);
      if (savedLocation) {
        return {
          location: savedLocation.location,
          locationName: savedLocation.locationName,
          isFromCache: true,
        };
      }
    }

    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      // Try to get saved location if permission not granted
      const savedLocation = await localStorages.getData(LOCATION_STORAGE_KEY);
      if (savedLocation) {
        return {
          location: savedLocation.location,
          locationName: savedLocation.locationName,
          isFromCache: true,
        };
      }
      return {
        location: null,
        locationName: "",
        error: "Location permission not granted",
      };
    }

    // Permission granted, try to get current location
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const location: LocationCoords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      const address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const locationName =
        address && address[0]
          ? address[0].city || address[0].region || "Current Location"
          : "Current Location";

      // Save the location for future use
      const locationData: SavedLocation = {
        location,
        locationName,
        timestamp: Date.now(),
      };
      await localStorages.saveData(LOCATION_STORAGE_KEY, locationData);

      return { location, locationName, isFromCache: false };
    } catch (locationError) {
      // GPS is off or location unavailable, use saved location
      console.log("GPS unavailable, using saved location:", locationError);
      const savedLocation = await localStorages.getData(LOCATION_STORAGE_KEY);

      if (savedLocation) {
        return {
          location: savedLocation.location,
          locationName: savedLocation.locationName,
          isFromCache: true,
        };
      }

      throw locationError;
    }
  } catch (error) {
    console.error("Error getting location:", error);

    // Last resort: try saved location
    const savedLocation = await localStorages.getData(LOCATION_STORAGE_KEY);
    if (savedLocation) {
      return {
        location: savedLocation.location,
        locationName: savedLocation.locationName,
        error: "Using saved location (GPS unavailable)",
        isFromCache: true,
      };
    }

    return {
      location: null,
      locationName: "",
      error: "Failed to get current location",
    };
  }
};

/**
 * Save manually selected location to cache
 */
export const saveSelectedLocation = async (
  location: LocationCoords,
  locationName: string
): Promise<void> => {
  const locationData: SavedLocation = {
    location,
    locationName,
    timestamp: Date.now(),
  };
  await localStorages.saveData(LOCATION_STORAGE_KEY, locationData);
};

/**
 * Get saved location from cache
 */
export const getSavedLocation = async (): Promise<SavedLocation | null> => {
  return await localStorages.getData(LOCATION_STORAGE_KEY);
};

// Optional: Helper function to clear saved location
export const clearSavedLocation = async () => {
  await localStorages.removeData(LOCATION_STORAGE_KEY);
};

// Optional: Helper function to get the age of saved location
export const getSavedLocationAge = async (): Promise<number | null> => {
  const savedLocation = await localStorages.getData(LOCATION_STORAGE_KEY);
  if (savedLocation && savedLocation.timestamp) {
    return Date.now() - savedLocation.timestamp;
  }
  return null;
};

/**
 * Search for cities using the Open-Meteo Geocoding API
 */
export const searchCitiesFromAPI = async (
  searchQuery: string
): Promise<CitySearchResult[]> => {
  if (!searchQuery.trim()) {
    throw new Error("Please enter a city name");
  }

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        searchQuery
      )}&count=10&language=en&format=json`
    );
    const data = await response.json();

    if (data && data.results && data.results.length > 0) {
      return data.results.map((result: any) => ({
        name: `${result.name}, ${result.country}`,
        lat: result.latitude,
        lng: result.longitude,
        admin1: result.admin1 || "",
      }));
    }

    return [];
  } catch (error) {
    console.error("Error searching city:", error);
    throw new Error("Failed to search cities");
  }
};

/**
 * Filter popular cities by search query
 */
export const filterCities = (
  searchQuery: string,
  cities: CitySearchResult[] = POPULAR_CITIES
): CitySearchResult[] => {
  if (!searchQuery.trim()) {
    return cities;
  }

  return cities.filter((city) =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
};
