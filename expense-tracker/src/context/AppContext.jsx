import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/dashboard/stats", { withCredentials: true });
      setStats(res.data.stats || null);
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/analytics/stats", { withCredentials: true });
      setAnalyticsData(res.data || null);
    } catch (err) {
      console.error("Failed to fetch analytics stats", err);
    }
  }, []);

  const fetchLeaderboard = useCallback(async (filterVal = "") => {
    try {
      const url = filterVal ? `http://localhost:8000/api/v1/leaderboard?filter=${filterVal}` : "http://localhost:8000/api/v1/leaderboard";
      const res = await axios.get(url, { withCredentials: true });
      const mapped = (res.data.leaderboard || []).map((u, i) => ({
        ...u,
        rank: i + 1,
        streak: Math.round(u.points / 25) || 3,
        badge: i === 0 ? "👑" : i === 1 ? "🔥" : i === 2 ? "⭐" : "🎯"
      }));
      setLeaderboard(mapped);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/notifications", { withCredentials: true });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  const markNotifRead = useCallback(async (id) => {
    try {
      await axios.patch(`http://localhost:8000/api/v1/notifications/mark-read/${id}`, {}, { withCredentials: true });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  }, []);

  const markAllNotifsRead = useCallback(async () => {
    try {
      await axios.patch("http://localhost:8000/api/v1/notifications/mark-all-read", {}, { withCredentials: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  }, []);

  const deleteNotif = useCallback(async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/v1/notifications/delete/${id}`, { withCredentials: true });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, txRes, statsRes, analyticsRes, leaderboardRes, notifRes] = await Promise.all([
        axios.get("http://localhost:8000/api/v1/users/current-user", { withCredentials: true }),
        axios.get("http://localhost:8000/api/v1/transactions", { withCredentials: true }),
        axios.get("http://localhost:8000/api/v1/dashboard/stats", { withCredentials: true }),
        axios.get("http://localhost:8000/api/v1/analytics/stats", { withCredentials: true }),
        axios.get("http://localhost:8000/api/v1/leaderboard", { withCredentials: true }),
        axios.get("http://localhost:8000/api/v1/notifications", { withCredentials: true }),
      ]);
      setUser(userRes.data.user);
      setTransactions(txRes.data.transactions || []);
      setStats(statsRes.data.stats || null);
      setAnalyticsData(analyticsRes.data || null);
      setNotifications(notifRes.data.notifications || []);
      
      const mappedLeaderboard = (leaderboardRes.data.leaderboard || []).map((u, i) => ({
        ...u,
        rank: i + 1,
        streak: Math.round(u.points / 25) || 3,
        badge: i === 0 ? "👑" : i === 1 ? "🔥" : i === 2 ? "⭐" : "🎯"
      }));
      setLeaderboard(mappedLeaderboard);
    } catch (err) {
      // Try fetching just user if transactions, stats, analytics, or leaderboard endpoint fails
      try {
        const userRes = await axios.get(
          "http://localhost:8000/api/v1/users/current-user",
          { withCredentials: true }
        );
        setUser(userRes.data.user);
      } catch (userErr) {
        setError(userErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ── Transaction helpers ── */
  const addTransaction = useCallback((tx) => {
    setTransactions((prev) => [tx, ...prev]);
    fetchStats();
    fetchAnalytics();
    fetchLeaderboard();
  }, [fetchStats, fetchAnalytics, fetchLeaderboard]);

  const updateTransaction = useCallback((id, updated) => {
    setTransactions((prev) =>
      prev.map((t) => (t._id === id ? { ...t, ...updated } : t))
    );
    fetchStats();
    fetchAnalytics();
    fetchLeaderboard();
  }, [fetchStats, fetchAnalytics, fetchLeaderboard]);

  const deleteTransaction = useCallback((id) => {
    setTransactions((prev) => prev.filter((t) => t._id !== id));
    fetchStats();
    fetchAnalytics();
    fetchLeaderboard();
  }, [fetchStats, fetchAnalytics, fetchLeaderboard]);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        transactions,
        stats,
        analyticsData,
        leaderboard,
        notifications,
        loading,
        error,
        refetch: fetchAll,
        fetchStats,
        fetchAnalytics,
        fetchLeaderboard,
        fetchNotifications,
        markNotifRead,
        markAllNotifsRead,
        deleteNotif,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateUser,
        setUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
