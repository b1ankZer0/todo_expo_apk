import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import {
  CitySearchResult,
  filterCities,
  getCurrentLocationIfEnabled,
  LocationCoords,
  POPULAR_CITIES,
  saveSelectedLocation,
  searchCitiesFromAPI,
} from "../services/locationService";

interface CitySelectProps {
  visible: boolean;
  onClose: () => void;
  onSelectCity: (location: LocationCoords, locationName: string) => void;
  currentLocation: LocationCoords | null;
}

export default function CitySelect({
  visible,
  onClose,
  onSelectCity,
  currentLocation,
}: CitySelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCities, setFilteredCities] =
    useState<CitySearchResult[]>(POPULAR_CITIES);
  const [searchingAPI, setSearchingAPI] = useState(false);
  const [refreshingGPS, setRefreshingGPS] = useState(false);

  useEffect(() => {
    const filtered = filterCities(searchQuery, POPULAR_CITIES);
    setFilteredCities(filtered);
  }, [searchQuery]);

  const searchCityFromAPI = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a city name");
      return;
    }

    setSearchingAPI(true);
    try {
      const cities = await searchCitiesFromAPI(searchQuery);

      if (cities.length > 0) {
        setFilteredCities(cities);
      } else {
        Alert.alert(
          "Not Found",
          "No cities found. Try a different search term."
        );
        setFilteredCities([]);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to search cities"
      );
    } finally {
      setSearchingAPI(false);
    }
  };

  const selectCity = async (city: CitySearchResult) => {
    const location: LocationCoords = {
      latitude: city.lat,
      longitude: city.lng,
    };
    const locationName = city.city || city.name;

    // Save to cache
    await saveSelectedLocation(location, locationName);

    onSelectCity(location, locationName);
    setSearchQuery("");
  };

  const handleClose = () => {
    if (currentLocation) {
      onClose();
    }
  };

  const useCurrentLocation = async () => {
    setRefreshingGPS(true);
    try {
      const result = await getCurrentLocationIfEnabled();

      if (result.location) {
        // Save to cache
        await saveSelectedLocation(result.location, result.locationName);

        onSelectCity(result.location, result.locationName);
        setSearchQuery("");
      } else {
        Alert.alert(
          "GPS Unavailable",
          "Please enable location services or select a city from the list."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to get current location. Please try again or select a city."
      );
    } finally {
      setRefreshingGPS(false);
    }
  };

  const renderCityItem = ({ item }: { item: CitySearchResult }) => (
    <TouchableOpacity style={styles.cityItem} onPress={() => selectCity(item)}>
      <Text style={styles.cityName}>{item.name}</Text>
      <Text style={styles.cityCoords}>
        {item.lat.toFixed(2)}, {item.lng.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Location</Text>

          <View style={styles.topButtons}>
            <Button
              mode="contained"
              onPress={useCurrentLocation}
              loading={refreshingGPS}
              disabled={refreshingGPS}
              style={styles.gpsButton}
              icon="crosshairs-gps"
            >
              Use Current Location
            </Button>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search city (e.g., Dhaka, Tokyo)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchCityFromAPI}
            />
            <Button
              mode="contained"
              onPress={searchCityFromAPI}
              loading={searchingAPI}
              disabled={searchingAPI}
              style={styles.searchButton}
            >
              Search
            </Button>
          </View>

          <FlatList
            data={filteredCities}
            renderItem={renderCityItem}
            keyExtractor={(item, index) => index.toString()}
            style={styles.cityList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchQuery ? "No cities found" : "Start typing to search"}
              </Text>
            }
          />

          {currentLocation && (
            <Button
              mode="text"
              onPress={handleClose}
              style={styles.closeButton}
            >
              Close
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  topButtons: {
    marginBottom: 15,
  },
  gpsButton: {
    backgroundColor: "#4CAF50",
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  searchButton: {
    justifyContent: "center",
  },
  cityList: {
    maxHeight: 400,
  },
  cityItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cityName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  cityCoords: {
    fontSize: 12,
    color: "#999",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontSize: 14,
  },
  closeButton: {
    marginTop: 10,
  },
});
