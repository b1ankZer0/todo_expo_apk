import { useAuth } from "@/lib/auth-context";
import { useDb } from "@/lib/dbActions";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

// Interface based on your database schema
export interface Todo {
  $id: string;
  user_id: string;
  title: string;
  details: string;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
  date: string;
  $createdAt: string;
  $updatedAt: string;
}

export default function TodoDetail() {
  const { date } = useLocalSearchParams();
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const parsedDate = new Date(date as string);
  const formattedDate = parsedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const subscription = Db.todo.subscribe((payload) => {
      if (payload.created || payload.updated || payload.deleted) {
        fetchTodos();
      }
    });
    fetchTodos();
    return () => {
      subscription();
    };
  }, [date]);

  const Db = useDb();

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const todos = await Db.todo.getAll([
        Query.equal("user_id", user.$id),
        Query.equal("date", date),
      ]);

      setTodos(todos.documents);
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = () => {
    router.push({
      pathname: "/Todos/addTodo",
      params: { date: date as string },
    });
  };

  const handleTodoPress = (todoId: string) => {
    router.push({
      pathname: "/Todos/editTodo",
      params: { id: todoId, date },
    });
  };

  const toggleTodoStatus = async (todoId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";

    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.$id === todoId
          ? { ...todo, status: newStatus as Todo["status"] }
          : todo
      )
    );
    try {
      await Db.todo.update(todoId, { status: newStatus });
    } catch (error) {
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.$id === todoId
            ? { ...todo, status: currentStatus as Todo["status"] }
            : todo
        )
      );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "in-progress":
        return "time";
      default:
        return "ellipse-outline";
    }
  };

  const renderTodoItem = ({ item }: { item: Todo }) => (
    <TouchableOpacity
      style={[
        styles.todoItem,
        item.status === "completed" && styles.todoItemCompleted,
      ]}
      onPress={() => handleTodoPress(item.$id)}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        onPress={() => toggleTodoStatus(item.$id, item.status)}
        style={styles.statusButton}
      >
        <Ionicons
          name={getStatusIcon(item.status)}
          size={28}
          color={item.status === "completed" ? "#10b981" : "#9ca3af"}
        />
      </TouchableOpacity>

      <View style={styles.todoContent}>
        <View style={styles.todoHeader}>
          <Text
            style={[
              styles.todoTitle,
              item.status === "completed" && styles.todoTitleCompleted,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.priority) },
            ]}
          >
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>
        </View>

        {item.details && (
          <Text
            style={[
              styles.todoDetails,
              item.status === "completed" && styles.todoDetailsCompleted,
            ]}
            numberOfLines={2}
          >
            {item.details}
          </Text>
        )}

        <View style={styles.todoFooter}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkbox-outline" size={80} color="#d1d5db" />
      <Text style={styles.emptyStateTitle}>No todos yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Tap the + button to add your first todo
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Todos</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <FlatList
          data={todos}
          renderItem={renderTodoItem}
          keyExtractor={(item) => item.$id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddTodo}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  dateText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  todoItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  todoItemCompleted: {
    opacity: 0.6,
  },
  statusButton: {
    marginRight: 12,
    justifyContent: "center",
  },
  todoContent: {
    flex: 1,
  },
  todoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  todoTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
  },
  todoDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  todoDetailsCompleted: {
    color: "#9ca3af",
  },
  todoFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
});
