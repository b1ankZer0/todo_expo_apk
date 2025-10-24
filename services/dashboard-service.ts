import { TodoDb } from "@/lib/dbActions";
import { Query } from "react-native-appwrite";

// Types for your todos
export interface Todo {
  $id: string;
  title: string;
  status: string;
  date: string; // ISO date string
  priority?: "low" | "medium" | "high";
  category?: string;
  userId: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface DashboardStats {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  overdueTodos: number;
  todayTodos: number;
  thisWeekTodos: number;
  thisMonthTodos: number;
  completionRate: number;
  todosByDate: { [date: string]: TodoDateStats };
  todosByPriority: {
    low: number;
    medium: number;
    high: number;
  };
  todosByCategory: { [category: string]: number };
}

export interface TodoDateStats {
  total: number;
  completed: number;
  due: number;
  overdue?: number;
}

// Since Appwrite doesn't have built-in aggregation, we'll do client-side aggregation
export class DashboardService {
  /**
   * Fetch all todos and calculate dashboard statistics
   */
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      // Fetch all todos for the user
      const response = await TodoDb.getAll([
        Query.equal("user_id", userId),
        Query.limit(10000), // Adjust based on your needs
      ]);

      const todos: Todo[] = response.documents;
      // Calculate statistics
      const stats = this.calculateStats(todos);
      //   console.log(stats);
      return stats;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }

  /**
   * Get todos grouped by date for calendar view
   */
  static async getTodosByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ [date: string]: TodoDateStats }> {
    try {
      const response = await TodoDb.getAll([
        Query.equal("user_id", userId),
        Query.greaterThanEqual("date", startDate),
        Query.lessThanEqual("date", endDate),
        Query.limit(1000),
      ]);

      const todos: Todo[] = response.documents;
      return this.groupTodosByDate(todos);
    } catch (error) {
      console.error("Error fetching todos by date range:", error);
      throw error;
    }
  }

  /**
   * Get todos for a specific month (for calendar)
   */
  static async getTodosForMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<{ [date: string]: TodoDateStats }> {
    const startDate = new Date(year, month, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

    return this.getTodosByDateRange(userId, startDate, endDate);
  }

  /**
   * Calculate all dashboard statistics
   */
  private static calculateStats(todos: Todo[]): DashboardStats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalTodos = todos.length;
    let completedTodos = 0;
    let pendingTodos = 0;
    let overdueTodos = 0;
    let todayTodos = 0;
    let thisWeekTodos = 0;
    let thisMonthTodos = 0;

    const todosByDate: { [date: string]: TodoDateStats } = {};
    const todosByPriority = { low: 0, medium: 0, high: 0 };
    const todosByCategory: { [category: string]: number } = {};

    todos.forEach((todo) => {
      const dueDate = new Date(todo.date); // Adjust for timezone
      // dueDate.setDate(dueDate.getDate() + 1);
      const dateKey = todo.date.split("T")[0];

      // Count completed vs pending
      if (todo.status == "completed") {
        completedTodos++;
      } else {
        pendingTodos++;

        // Check if overdue
        if (dueDate < today) {
          overdueTodos++;
        }
      }

      // Count by time period
      if (dueDate >= today && dueDate < new Date(today.getTime() + 86400000)) {
        todayTodos++;
      }
      if (dueDate >= weekStart) {
        thisWeekTodos++;
      }
      if (dueDate >= monthStart) {
        thisMonthTodos++;
      }

      // Group by date
      if (!todosByDate[dateKey]) {
        todosByDate[dateKey] = { total: 0, completed: 0, due: 0, overdue: 0 };
      }
      todosByDate[dateKey].total++;
      if (todo.status == "completed") {
        todosByDate[dateKey].completed++;
      } else {
        todosByDate[dateKey].due++;
        if (dueDate < today) {
          todosByDate[dateKey].overdue!++;
        }
      }

      // Group by priority
      if (todo.priority) {
        todosByPriority[todo.priority]++;
      }

      // Group by category
      if (todo.category) {
        todosByCategory[todo.category] =
          (todosByCategory[todo.category] || 0) + 1;
      }
    });

    const completionRate =
      totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    return {
      totalTodos,
      completedTodos,
      pendingTodos,
      overdueTodos,
      todayTodos,
      thisWeekTodos,
      thisMonthTodos,
      completionRate,
      todosByDate,
      todosByPriority,
      todosByCategory,
    };
  }

  /**
   * Group todos by date
   */
  private static groupTodosByDate(todos: Todo[]): {
    [date: string]: TodoDateStats;
  } {
    const grouped: { [date: string]: TodoDateStats } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    todos.forEach((todo) => {
      const dateKey = todo.date.split("T")[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = { total: 0, completed: 0, due: 0 };
      }

      grouped[dateKey].total++;

      if (todo.status == "completed") {
        grouped[dateKey].completed++;
      } else {
        grouped[dateKey].due++;
      }
    });

    return grouped;
  }

  /**
   * Get overdue todos count
   */
  static async getOverdueTodosCount(userId: string): Promise<number> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await TodoDb.getAll([
        Query.equal("userId", userId),
        Query.equal("completed", false),
        Query.lessThan("dueDate", today),
      ]);

      return response.total;
    } catch (error) {
      console.error("Error fetching overdue todos:", error);
      return 0;
    }
  }

  /**
   * Get today's todos
   */
  static async getTodayTodos(userId: string): Promise<Todo[]> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000)
        .toISOString()
        .split("T")[0];

      const response = await TodoDb.getAll([
        Query.equal("user_id", userId),
        Query.greaterThanEqual("date", today),
        Query.lessThan("date", tomorrow),
      ]);

      return response.documents;
    } catch (error) {
      console.error("Error fetching today's todos:", error);
      return [];
    }
  }

  /**
   * Get completion trend for the last N days
   */
  static async getCompletionTrend(
    userId: string,
    days: number = 7
  ): Promise<{ date: string; completed: number; total: number }[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await TodoDb.getAll([
        Query.equal("user_id", userId),
        Query.greaterThanEqual("date", startDate.toISOString().split("T")[0]),
        Query.lessThanEqual("date", endDate.toISOString().split("T")[0]),
      ]);

      const todos: Todo[] = response.documents;
      const trendData: {
        [date: string]: { completed: number; total: number };
      } = {};

      // Initialize all dates
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split("T")[0];
        trendData[dateKey] = { completed: 0, total: 0 };
      }

      // Count todos
      todos.forEach((todo) => {
        const dateKey = todo.date.split("T")[0];
        if (trendData[dateKey]) {
          trendData[dateKey].total++;
          if (todo.status == "completed") {
            trendData[dateKey].completed++;
          }
        }
      });

      // Convert to array
      return Object.keys(trendData)
        .sort()
        .map((date) => ({
          date,
          ...trendData[date],
        }));
    } catch (error) {
      console.error("Error fetching completion trend:", error);
      return [];
    }
  }
}
