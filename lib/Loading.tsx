import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = "Loading...",
}: LoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Weather Icons */}
        <View style={styles.weatherIcons}>
          <Text style={styles.weatherIcon}>☀️</Text>
          <Text style={styles.weatherIcon}>⛅</Text>
          <Text style={styles.weatherIcon}>🌧️</Text>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Weather Todo</Text>
        <Text style={styles.tagline}>Plan your day with weather</Text>

        {/* Loading Indicator */}
        <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />

        {/* Loading Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  weatherIcons: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 30,
  },
  weatherIcon: {
    fontSize: 50,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 10,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
    fontStyle: "italic",
  },
  loader: {
    marginVertical: 20,
  },
  message: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    fontWeight: "500",
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    marginTop: 30,
    overflow: "hidden",
  },
  progressFill: {
    width: "60%",
    height: "100%",
    backgroundColor: "#2196F3",
  },
});
