import { useAuth } from "@/lib/auth-context";
import { useDb } from "@/lib/dbActions";
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
import {
  DashboardService,
  DashboardStats,
} from "../../services/dashboard-service";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const DB = useDb();

  const navigateToTodos = (filter: string) => {
    router.push({
      pathname: "/(tabs)/Todos/[todo]",
      params: { filter, fromPage: "dashboard" },
    });
  };

  useEffect(() => {
    if (user) {
      const subscription = DB.todo.subscribe((payload) => {
        if (payload.created || payload.updated || payload.deleted) {
          loadDashboardData();
        }
      });
      loadDashboardData();
      return () => {
        subscription();
      };
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const dashboardStats = await DashboardService.getDashboardStats(user.$id);
      setStats(dashboardStats);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load dashboard data</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadDashboardData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <Text style={styles.refreshButton}>{refreshing ? "..." : "🔄"}</Text>
        </TouchableOpacity>
      </View> */}

      {/* Overview Cards */}
      <View style={styles.overviewContainer}>
        <TouchableOpacity
          style={[styles.card, styles.cardPrimary]}
          onPress={() => navigateToTodos("all")}
          activeOpacity={0.7}
        >
          <Text style={styles.cardNumber}>{stats.totalTodos}</Text>
          <Text style={styles.cardLabel}>Total Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardSuccess]}
          onPress={() => navigateToTodos("completed")}
          activeOpacity={0.7}
        >
          <Text style={styles.cardNumber}>{stats.completedTodos}</Text>
          <Text style={styles.cardLabel}>Completed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardWarning]}
          onPress={() => navigateToTodos("pending")}
          activeOpacity={0.7}
        >
          <Text style={styles.cardNumber}>{stats.pendingTodos}</Text>
          <Text style={styles.cardLabel}>Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardDanger]}
          onPress={() => navigateToTodos("overdue")}
          activeOpacity={0.7}
        >
          <Text style={styles.cardNumber}>{stats.overdueTodos}</Text>
          <Text style={styles.cardLabel}>Overdue</Text>
        </TouchableOpacity>
      </View>

      {/* Completion Rate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completion Rate</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${stats.completionRate}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {stats.completionRate.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Time-based Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasks by Period</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.todayTodos}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.thisWeekTodos}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.thisMonthTodos}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>
      </View>

      {/* Priority Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasks by Priority</Text>
        <View style={styles.priorityContainer}>
          <TouchableOpacity
            style={styles.priorityItem}
            onPress={() => navigateToTodos("low")}
            activeOpacity={0.7}
          >
            <View style={[styles.priorityDot, styles.priorityLow]} />
            <Text style={styles.priorityLabel}>Low</Text>
            <Text style={styles.priorityCount}>
              {stats.todosByPriority.low}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.priorityItem}
            onPress={() => navigateToTodos("medium")}
            activeOpacity={0.7}
          >
            <View style={[styles.priorityDot, styles.priorityMedium]} />
            <Text style={styles.priorityLabel}>Medium</Text>
            <Text style={styles.priorityCount}>
              {stats.todosByPriority.medium}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.priorityItem}
            onPress={() => navigateToTodos("high")}
            activeOpacity={0.7}
          >
            <View style={[styles.priorityDot, styles.priorityHigh]} />
            <Text style={styles.priorityLabel}>High</Text>
            <Text style={styles.priorityCount}>
              {stats.todosByPriority.high}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Breakdown */}
      {Object.keys(stats.todosByCategory).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasks by Category</Text>
          {Object.entries(stats.todosByCategory).map(([category, count]) => (
            <View key={category} style={styles.categoryItem}>
              <Text style={styles.categoryName}>{category}</Text>
              <View style={styles.categoryBarContainer}>
                <View
                  style={[
                    styles.categoryBar,
                    {
                      width: `${(count / stats.totalTodos) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.categoryCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2196f3",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  refreshButton: {
    justifyContent: "center",
    alignItems: "center",
    fontSize: 24,
  },
  overviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
  },
  card: {
    width: "48%",
    margin: "1%",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPrimary: {
    backgroundColor: "#2196f3",
  },
  cardSuccess: {
    backgroundColor: "#4CAF50",
  },
  cardWarning: {
    backgroundColor: "#FFC107",
  },
  cardDanger: {
    backgroundColor: "#f44336",
  },
  cardNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  cardLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  section: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 10,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    minWidth: 50,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2196f3",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  priorityContainer: {
    gap: 12,
  },
  priorityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  priorityLow: {
    backgroundColor: "#4CAF50",
  },
  priorityMedium: {
    backgroundColor: "#FFC107",
  },
  priorityHigh: {
    backgroundColor: "#f44336",
  },
  priorityLabel: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  priorityCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryName: {
    width: 100,
    fontSize: 14,
    color: "#333",
  },
  categoryBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  categoryBar: {
    height: "100%",
    backgroundColor: "#2196f3",
    borderRadius: 4,
  },
  categoryCount: {
    width: 40,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
});
