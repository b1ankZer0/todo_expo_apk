import * as Location from "expo-location";

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
export const getCurrentLocation = async (): Promise<{
  location: LocationCoords | null;
  locationName: string;
  error?: string;
}> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      return {
        location: null,
        locationName: "",
        error: "Location permission not granted",
      };
    }

    const loc = await Location.getCurrentPositionAsync({});
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

    return { location, locationName };
  } catch (error) {
    console.error("Error getting location:", error);
    return {
      location: null,
      locationName: "",
      error: "Failed to get current location",
    };
  }
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
