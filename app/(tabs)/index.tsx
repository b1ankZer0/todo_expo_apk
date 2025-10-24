import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import "react-native-url-polyfill/auto";

// Import services
import { useAuth } from "@/lib/auth-context";
import { useDb } from "@/lib/dbActions";
import {
  fetchWeatherForMonth,
  getWeatherEmoji,
  WeatherMap,
} from "@/services/weatherService";
import { DashboardService } from "../../services/dashboard-service";
import {
  getCurrentLocation,
  getCurrentLocationIfEnabled,
  getSavedLocation,
  isGPSEnabled,
  LocationCoords,
} from "../../services/locationService";

// Import the new CitySelect component
import CitySelect from "../../lib/CitySelect";

export default function Index() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weatherData, setWeatherData] = useState<WeatherMap>({});
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [todos, setTodos] = useState({});
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const route = useRouter();

  const loadTodoData = async () => {
    if (!user) return;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    try {
      setLoading(true);
      const dashboardStats = await DashboardService.getTodosForMonth(
        user.$id,
        year,
        month
      );
      setTodos(dashboardStats);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const DB = useDb();

  useEffect(() => {
    if (user) {
      const subscription = DB.todo.subscribe((payload) => {
        if (payload.created || payload.updated || payload.deleted) {
          loadTodoData();
        }
      });
      loadTodoData();
      return () => {
        subscription();
      };
    }
  }, [user]);

  useEffect(() => {
    loadTodoData();
    getLocationAndWeather();
  }, []);

  useEffect(() => {
    loadTodoData();

    if (location) {
      fetchWeatherForMonth(location, setLoading, setWeatherData);
    }
  }, [currentMonth, location]);

  const getLocationAndWeather = async () => {
    // Check if GPS is already enabled
    const gpsEnabled = await isGPSEnabled();

    if (gpsEnabled) {
      // GPS is on, use it directly without asking
      const result = await getCurrentLocationIfEnabled();

      if (result.location) {
        setLocation(result.location);
        setLocationName(result.locationName);
        setLoading(false);
        return;
      }
    }

    // GPS not enabled, try to get saved location
    const savedLocation = await getSavedLocation();
    if (savedLocation) {
      setLocation(savedLocation.location);
      setLocationName(savedLocation.locationName);
      setLoading(false);
      return;
    }

    // No GPS and no cached location, request GPS permission
    const result = await getCurrentLocation();

    if (result.error || !result.location) {
      setLoading(false);
      setShowLocationModal(true);
      return;
    }

    setLocation(result.location);
    setLocationName(result.locationName);
  };

  const handleCitySelect = (
    newLocation: LocationCoords,
    newLocationName: string
  ) => {
    setLocation(newLocation);
    setLocationName(newLocationName);
    setShowLocationModal(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const formatDate = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = [];

    const goToTodo = (date: string) => {
      route.push({
        pathname: "/Todos/[todo]",
        params: { date: date },
      });
    };

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDate(year, month, day);
      const weather = weatherData[dateKey];
      const todo = todos[dateKey] || { total: 0, completed: 0, due: 0 };
      const isToday =
        new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell, isToday && styles.today]}
          onPress={() => goToTodo(new Date(dateKey).toISOString())}
        >
          <Text style={[styles.dayNumber, isToday && styles.todayText]}>
            {day}
          </Text>

          {weather ? (
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherEmoji}>
                {getWeatherEmoji(weather.weatherCode)}
              </Text>
              <Text style={styles.temp}>{weather.tempMax}°</Text>
              {weather.precipitation > 0 && (
                <Text style={styles.precipitation}>
                  💧{weather.precipitation}%
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.noData}>-</Text>
          )}

          {/* Todo Indicators with colored numbers */}
          {todo.total > 0 && (
            <View style={styles.todoContainer}>
              <Text style={styles.todoTotal}>{todo.total}</Text>
              <Text style={styles.todoCompleted}>{todo.completed}</Text>
              <Text style={styles.todoDue}>{todo.due}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.monthSelector}>
            <Button onPress={() => changeMonth(-1)} mode="text">
              {"<"}
            </Button>
            <Text style={styles.monthText}>
              {currentMonth.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </Text>
            <Button onPress={() => changeMonth(1)} mode="text">
              {">"}
            </Button>
          </View>

          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => setShowLocationModal(true)}
            >
              <Text style={styles.location}>📍 {locationName || "Dhaka"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.weekDays}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <View key={day} style={styles.weekDayContainer}>
              <Text style={styles.weekDay}>{day}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={styles.loader}
          />
        ) : (
          <View style={styles.calendarContainer}>
            <View style={styles.calendar}>{renderCalendar()}</View>
          </View>
        )}

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Weather Legend:</Text>
          <Text style={styles.legendItem}>
            ☀️ Clear ⛅ Partly Cloudy ☁️ Cloudy
          </Text>
          <Text style={styles.legendItem}>🌧️ Rain 🌨️ Snow ⛈️ Thunderstorm</Text>
          <Text style={styles.legendNote}>💧 = Precipitation probability</Text>

          <View style={styles.todoLegend}>
            <Text style={styles.legendTitle}>Task Legend:</Text>
            <View style={styles.todoLegendItem}>
              <Text style={styles.todoTotal}>●</Text>
              <Text style={styles.legendItem}> Total Tasks</Text>
            </View>
            <View style={styles.todoLegendItem}>
              <Text style={styles.todoCompleted}>●</Text>
              <Text style={styles.legendItem}> Completed Tasks</Text>
            </View>
            <View style={styles.todoLegendItem}>
              <Text style={styles.todoDue}>●</Text>
              <Text style={styles.legendItem}> Due/Pending Tasks</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <CitySelect
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectCity={handleCitySelect}
        currentLocation={location}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: "white",
    justifyContent: "space-between",
    flexDirection: "row",
    padding: 15,
    paddingBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    width: "100%",
    zIndex: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
  },
  locationButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2196f3",
  },
  location: {
    fontSize: 14,
    color: "#2196f3",
    fontWeight: "500",
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  weekDays: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 6,
    marginHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  weekDayContainer: {
    flex: 1,
    alignItems: "center",
  },
  weekDay: {
    fontWeight: "600",
    color: "#666",
    fontSize: 12,
  },
  calendarContainer: {
    marginHorizontal: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  calendar: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#fff",
  },
  dayCell: {
    width: "14.285714%",
    height: 100,
    padding: 2,
    alignItems: "center",
    justifyContent: "flex-start",
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  today: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
    borderWidth: 1.5,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 1,
  },
  todayText: {
    color: "#2196f3",
  },
  weatherInfo: {
    alignItems: "center",
    marginBottom: 2,
  },
  weatherEmoji: {
    fontSize: 16,
    marginBottom: 1,
  },
  temp: {
    fontSize: 9,
    color: "#666",
    fontWeight: "500",
  },
  precipitation: {
    fontSize: 7,
    color: "#1976d2",
  },
  noData: {
    fontSize: 10,
    color: "#ccc",
  },
  todoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  todoTotal: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000",
  },
  todoCompleted: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  todoDue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFC107",
  },
  loader: {
    marginTop: 50,
  },
  legend: {
    marginTop: 10,
    marginBottom: 30,
    marginHorizontal: 8,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  legendItem: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  legendNote: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  todoLegend: {
    marginTop: 5,
  },
  todoLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
});
