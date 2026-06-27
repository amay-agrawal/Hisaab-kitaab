import { useState, useMemo, useEffect } from "react";
import {
  Target, Plus, Trash2, Utensils, Car, ShoppingBag, BookOpen,
  Film, Heart, Zap, Wallet, AlertTriangle, CheckCircle,
  LayoutDashboard, Receipt, BarChart3, Trophy, User, Settings,
  LogOut, X, Menu,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import axios from "axios";

/* ─── Constants ──────────────────────────────────────────────── */

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Receipt, label: "Transactions", path: "/transactions" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: Target, label: "Budget", path: "/budget" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const CATEGORY_CONFIG = {
  Food:          { icon: Utensils,    color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20",   bar: "bg-orange-500" },
  Travel:        { icon: Car,         color: "text-sky-500",    bg: "bg-sky-50 dark:bg-sky-900/20",         bar: "bg-sky-500"    },
  Shopping:      { icon: ShoppingBag, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20",   bar: "bg-violet-500" },
  Education:     { icon: BookOpen,    color: "text-emerald-500",bg: "bg-emerald-50 dark:bg-emerald-900/20", bar: "bg-emerald-500"},
  Entertainment: { icon: Film,        color: "text-pink-500",   bg: "bg-pink-50 dark:bg-pink-900/20",       bar: "bg-pink-500"   },
  Health:        { icon: Heart,       color: "text-red-500",    bg: "bg-red-50 dark:bg-red-900/20",         bar: "bg-red-500"    },
  Utilities:     { icon: Zap,         color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20",   bar: "bg-yellow-500" },
  Other:         { icon: Wallet,      color: "text-slate-500",  bg: "bg-slate-100 dark:bg-slate-700",       bar: "bg-slate-400"  },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG);

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function Budget() {
  const { user, updateUser, transactions } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [budgets, setBudgets] = useState({});
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("Food");
  const [newAmount, setNewAmount] = useState("");

  // Populate state when user load completes
  useEffect(() => {
    if (user?.budgets) {
      // Clone as a plain javascript object to strip Map serialization headers if any
      setBudgets(JSON.parse(JSON.stringify(user.budgets)));
    }
  }, [user]);

  // Current month's expenses per category
  const thisMonth = useMemo(() => {
    const now = new Date();
    const map = {};
    transactions
      .filter((t) => {
        if (t.type !== "expense") return false;
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return map;
  }, [transactions]);

  const totalBudget = Object.values(budgets).reduce((s, v) => s + Number(v), 0);
  const totalSpent = Object.keys(budgets).reduce((s, cat) => s + (thisMonth[cat] || 0), 0);

  const availableCategories = CATEGORIES.filter((c) => !budgets[c]);

  // Trigger modal and set dynamic default category selection
  const handleOpenAddForm = () => {
    if (availableCategories.length > 0) {
      setNewCategory(availableCategories[0]);
      setAdding(true);
    }
  };

  const handleSave = async () => {
    if (!newAmount || Number(newAmount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    const updated = JSON.parse(JSON.stringify(budgets || {}));
    updated[newCategory] = Number(newAmount);

    try {
      await axios.patch(
        "http://localhost:8000/api/v1/users/update-budgets",
        { budgets: updated },
        { withCredentials: true }
      );
      setBudgets(updated);
      updateUser({ budgets: updated });
      showToast(`Budget set for ${newCategory}!`);
      setAdding(false);
      setNewAmount("");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save budget", "error");
    }
  };

  const handleDelete = async (cat) => {
    const updated = JSON.parse(JSON.stringify(budgets || {}));
    delete updated[cat];
    try {
      await axios.patch(
        "http://localhost:8000/api/v1/users/update-budgets",
        { budgets: updated },
        { withCredentials: true }
      );
      setBudgets(updated);
      updateUser({ budgets: updated });
      showToast(`Budget removed for ${cat}`, "info");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete budget", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8000/api/v1/users/logout", {}, { withCredentials: true });
      navigate("/");
    } catch (err) { showToast(err.response?.data?.message || "Logout Failed", "error"); }
  };

  const avatarSrc = user?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName || "U"}&backgroundColor=2563eb&textColor=ffffff`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 p-6 z-50 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center"><Wallet size={15} className="text-white" /></div>
            <span className="text-base font-bold text-slate-800 dark:text-white">Hisaab-Kitab</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={18} className="text-slate-400" /></button>
        </div>
        {user && (
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-8 border border-slate-100 dark:border-slate-700/50">
            <img src={avatarSrc} alt="avatar" className="w-10 h-10 rounded-xl object-cover border-2 border-blue-500" />
            <div className="min-w-0"><p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.fullName}</p><p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p></div>
          </div>
        )}
        <nav className="flex-1 space-y-1">
          {MENU_ITEMS.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <button key={path} onClick={() => { navigate(path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"}`}>
                <Icon size={17} />{label}
              </button>
            );
          })}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium mt-4"><LogOut size={17} />Logout</button>
      </aside>

      <main className="p-5 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Menu size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Budget Goals</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Set and track monthly spending limits</p>
            </div>
          </div>
          {availableCategories.length > 0 && (
            <button onClick={handleOpenAddForm}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-200 dark:shadow-none">
              <Plus size={16} />Add Budget
            </button>
          )}
        </header>

        {/* Overall summary */}
        {Object.keys(budgets).length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Monthly Overview</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{formatINR(totalSpent)} <span className="text-base font-medium text-slate-400">/ {formatINR(totalBudget)}</span></p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${totalSpent / totalBudget > 0.8 ? "bg-red-50 dark:bg-red-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"}`}>
                {totalSpent / totalBudget > 0.8
                  ? <AlertTriangle size={22} className="text-red-500" />
                  : <CheckCircle size={22} className="text-emerald-500" />}
              </div>
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${totalSpent / totalBudget > 0.9 ? "bg-red-500" : totalSpent / totalBudget > 0.7 ? "bg-orange-400" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of total budget used this month</p>
          </div>
        )}

        {/* Add Budget Form */}
        {adding && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-800/50 p-5 mb-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">New Budget Limit</h3>
            <div className="flex gap-3 flex-wrap">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 min-w-[140px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex items-center gap-2 flex-1 min-w-[140px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5">
                <span className="text-slate-400 text-sm font-bold">₹</span>
                <input
                  type="number" min="1" placeholder="Monthly limit"
                  value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                  className="bg-transparent outline-none text-sm text-slate-800 dark:text-white w-full placeholder:text-slate-400"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
              </div>
              <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">Save</button>
              <button onClick={() => { setAdding(false); setNewAmount(""); }} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Budget Cards */}
        {Object.keys(budgets).length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target size={28} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">No budgets set</p>
            <p className="text-sm text-slate-400 mb-5">Set monthly spending limits per category to track your goals.</p>
            <button onClick={handleOpenAddForm} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors mx-auto">
              <Plus size={15} />Set First Budget
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(budgets).map(([cat, limit]) => {
              const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Other;
              const Icon = cfg.icon;
              const spent = thisMonth[cat] || 0;
              const pct = Math.min(100, limit > 0 ? (spent / limit) * 100 : 0);
              const isOver = pct >= 100;
              const isWarning = pct >= 80 && pct < 100;
              const remaining = Math.max(0, limit - spent);

              return (
                <div key={cat} className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 transition-all ${isOver ? "border-red-200 dark:border-red-800/40" : isWarning ? "border-orange-200 dark:border-orange-800/40" : "border-slate-200 dark:border-slate-700/50"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${cfg.bg} ${cfg.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{cat}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatINR(spent)} spent · {formatINR(remaining)} left
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOver && <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">Over budget!</span>}
                      {isWarning && <span className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-full">⚠ 80%+ used</span>}
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatINR(limit)}</span>
                      <button onClick={() => handleDelete(cat)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isOver ? "bg-red-500" : isWarning ? "bg-orange-400" : cfg.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{Math.round(pct)}% of monthly limit</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
