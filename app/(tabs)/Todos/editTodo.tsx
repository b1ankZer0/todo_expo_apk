import { useDb } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";
// import { Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type Priority = "low" | "medium" | "high";
type Status = "pending" | "completed";

export default function AddTodo() {
  const router = useRouter();
  const theme = useTheme();
  const DB = useDb();
  const { user } = useAuth();

  const { date, id } = useLocalSearchParams();

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    date ? new Date(date as string) : new Date()
  );
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<Status>("pending");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>("");

  const priorities: Priority[] = ["low", "medium", "high"];
  const statuses: Status[] = ["pending", "completed"];

  useEffect(() => {
    getTodo();
  }, []);

  const getTodo = async () => {
    const fetchedTodo = await DB.todo.get(`${id}`);
    setTitle(fetchedTodo.title);
    setDetails(fetchedTodo.details);
    setPriority(fetchedTodo.priority);
    setStatus(fetchedTodo.status);
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }

    if (!selectedDate) {
      Alert.alert("Error", "Date is required");
      return;
    }

    setLoading(true);

    try {
      console.log("Submitting todo:", selectedDate);
      // TODO: Replace with your actual API call
      const todoData = {
        user_id: user?.$id, // Replace with actual user ID from your auth system
        title: title.trim(),
        details: details.trim() || null,
        date: selectedDate.toISOString(), // Format: YYYY-MM-DD
        priority: priority,
        status: status,
      };

      await DB.todo.update(`${id}`, todoData);

      Alert.alert("Success", "Todo updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
      router.back();
    } catch (error) {
      console.error("Error creating todo:", error);
      Alert.alert("Error", "Failed to create todo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case "low":
        return "#4CAF50";
      case "medium":
        return "#FFC107";
      case "high":
        return "#F44336";
    }
  };

  const getStatusColor = (s: Status) => {
    switch (s) {
      case "pending":
        return "#FFC107";
      case "completed":
        return "#4CAF50";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Todo</Text>
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter todo title"
            value={title}
            onChangeText={setTitle}
            maxLength={300}
          />
          <Text style={styles.charCount}>{title.length}/300</Text>
        </View>

        {/* Details Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter todo details (optional)"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={4}
            maxLength={3000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{details.length}/3000</Text>
        </View>

        {/* Date Field */}
        {/* <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Date <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.dateDisplay}>
            <Ionicons name="calendar" size={20} color="#2196F3" />
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </View>
        </View> */}

        {/* Priority Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Priority <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.optionsContainer}>
            {priorities.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.optionButton,
                  priority === p && {
                    backgroundColor: getPriorityColor(p),
                    borderColor: getPriorityColor(p),
                  },
                ]}
                onPress={() => setPriority(p)}
              >
                <Text
                  style={[
                    styles.optionText,
                    priority === p && styles.optionTextSelected,
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.optionsContainer}>
            {statuses.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.optionButton,
                  status === s && {
                    backgroundColor: getStatusColor(s),
                    borderColor: getStatusColor(s),
                  },
                ]}
                onPress={() => setStatus(s)}
              >
                <Text
                  style={[
                    styles.optionText,
                    status === s && styles.optionTextSelected,
                  ]}
                >
                  {s
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {err && (
          <Text style={{ color: theme.colors.error, marginBottom: 8 }}>
            {err}
          </Text>
        )}
        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Updating..." : "Update Todo"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  required: {
    color: "#F44336",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  optionsContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
