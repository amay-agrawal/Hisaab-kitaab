import { useState, useEffect, useRef } from "react";
import { Bell, Search, Plus, Sun, Moon, CheckCheck, X, Info, User, Target, TrendingDown } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const NOTIF_CONFIGS = {
  follow: { icon: User, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  budget: { icon: Target, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
  trend: { icon: TrendingDown, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
  info: { icon: Info, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" }
};

function formatNotifTime(dateStr) {
  const diffMs = new Date() - new Date(dateStr);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function Navbar({ onAddExpense }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const { notifications, markNotifRead, markAllNotifsRead, deleteNotif } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* Close notif dropdown when clicking outside */
  useEffect(() => {
    function handler(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDismiss = (id, e) => {
    e.stopPropagation();
    deleteNotif(id);
  };

  /* Search: navigate to transactions with query */
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/transactions?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 px-4 py-3 ml-4">

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl flex-1 max-w-xs">
        <Search size={16} className="text-slate-400 flex-shrink-0 cursor-pointer" onClick={handleSearch} />
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transactions... (Enter)"
          className="bg-transparent outline-none w-full text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
            <X size={13} />
          </button>
        )}
      </form>

      {/* Right Side */}
      <div className="flex items-center gap-2.5 ml-4">

        {/* Add Expense */}
        <button
          onClick={onAddExpense}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-200 dark:shadow-none"
          title="Add expense (press N)"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Expense</span>
        </button>

        {/* Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-500" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Notifications"
          >
            <Bell size={18} className="text-slate-500 dark:text-slate-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/60 z-50 overflow-hidden"
              style={{ animation: "slideDown 0.15s ease-out" }}>

              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllNotifsRead} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    <CheckCheck size={13} />Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-3">
                      <Bell size={20} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">All caught up!</p>
                    <p className="text-xs text-slate-400 mt-1">No notifications right now.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const config = NOTIF_CONFIGS[notif.type] || NOTIF_CONFIGS.info;
                    const Icon = config.icon;
                    return (
                      <div key={notif._id} onClick={() => markNotifRead(notif._id)}
                        className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 group ${!notif.read ? "bg-blue-50/40 dark:bg-blue-900/10" : ""}`}>
                        <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon size={16} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-semibold truncate ${!notif.read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>{notif.title}</p>
                            {!notif.read && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatNotifTime(notif.createdAt)}</p>
                        </div>
                        <button onClick={(e) => handleDismiss(notif._id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all">
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}