import { useState, useMemo, useCallback } from "react";
import {
  Menu, X, LayoutDashboard, Receipt, BarChart3, Trophy,
  User, Settings, LogOut, TrendingUp, TrendingDown, Wallet,
  Utensils, Car, ShoppingBag, BookOpen, Film, Heart, Zap,
  Plus, ArrowUpRight, Target, RefreshCw, Percent,
} from "lucide-react";
import Navbar from "../components/Navbar";
import AddExpenseModal from "../components/AddExpenseModal";
import StatCard from "../components/StatCard";
import Shimmer from "../components/Shimmer";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import useKeyboardShortcut from "../hooks/useKeyboardShortcut";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

/* ─── Constants ──────────────────────────────────────────────── */

const CATEGORY_CONFIG = {
  Food:          { icon: Utensils,    color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
  Travel:        { icon: Car,         color: "text-sky-500",    bg: "bg-sky-50 dark:bg-sky-900/20" },
  Shopping:      { icon: ShoppingBag, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
  Education:     { icon: BookOpen,    color: "text-emerald-500",bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  Entertainment: { icon: Film,        color: "text-pink-500",   bg: "bg-pink-50 dark:bg-pink-900/20" },
  Health:        { icon: Heart,       color: "text-red-500",    bg: "bg-red-50 dark:bg-red-900/20" },
  Utilities:     { icon: Zap,         color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
  default:       { icon: Wallet,      color: "text-slate-500",  bg: "bg-slate-100 dark:bg-slate-700" },
};

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",    path: "/dashboard" },
  { icon: Receipt,         label: "Transactions", path: "/transactions" },
  { icon: BarChart3,       label: "Analytics",    path: "/analytics" },
  { icon: Trophy,          label: "Leaderboard",  path: "/leaderboard" },
  { icon: Target,          label: "Budget",        path: "/budget" },
  { icon: User,            label: "Profile",       path: "/profile" },
  { icon: Settings,        label: "Settings",      path: "/settings" },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Nishtha S.", savings: 85000, medal: "🥇" },
  { rank: 2, name: "Amay A.",   savings: 72000, medal: "🥈" },
  { rank: 3, name: "Rahul M.",  savings: 61000, medal: "🥉" },
  { rank: 4, name: "Priya K.",  savings: 54000, medal: "🏅" },
];

const BAR_COLORS = ["bg-blue-500", "bg-violet-500", "bg-orange-500", "bg-emerald-500", "bg-pink-500"];

/* ─── Helpers ────────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getThisMonthRange() {
  const now = new Date();
  return (d) => {
    const date = new Date(d);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };
}

function getLastMonthRange() {
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return (d) => {
    const date = new Date(d);
    return date.getMonth() === lastMonth && date.getFullYear() === lastYear;
  };
}

/* ─── Sub-components ─────────────────────────────────────────── */

function CategoryBreakdown({ transactions }) {
  const expenses = transactions.filter((t) => t.type === "expense");
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const byCategory = {};
  expenses.forEach((t) => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (sorted.length === 0) return <p className="text-sm text-slate-400 text-center py-6">No expense data yet</p>;

  return (
    <div className="space-y-3.5">
      {sorted.map(([cat, amount], i) => (
        <div key={cat}>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">{cat}</span>
            <span className="text-slate-500 dark:text-slate-400">{formatINR(amount)}</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full ${BAR_COLORS[i % BAR_COLORS.length]} rounded-full transition-all duration-700`}
              style={{ width: `${total ? (amount / total) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TransactionSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Shimmer className="w-11 h-11 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-3.5 w-28" />
            <Shimmer className="h-3 w-20" />
          </div>
          <Shimmer className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function BudgetWidget({ transactions }) {
  const { user } = useApp();
  const budgets = useMemo(() => {
    return user?.budgets || {};
  }, [user?.budgets]);

  const thisMonthFilter = getThisMonthRange();
  const spent = {};
  transactions.filter((t) => t.type === "expense" && thisMonthFilter(t.date))
    .forEach((t) => { spent[t.category] = (spent[t.category] || 0) + t.amount; });

  const entries = Object.entries(budgets).slice(0, 3);
  if (entries.length === 0) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-800 dark:text-white">Budget Goals</h2>
        <a href="/budget" className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
          Manage <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="space-y-3.5">
        {entries.map(([cat, limit]) => {
          const spentAmt = spent[cat] || 0;
          const pct = Math.min(100, limit > 0 ? (spentAmt / limit) * 100 : 0);
          const isOver = pct >= 100;
          const isWarn = pct >= 80;
          return (
            <div key={cat}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                <span className={`font-semibold ${isOver ? "text-red-500" : isWarn ? "text-orange-500" : "text-slate-500 dark:text-slate-400"}`}>
                  {formatINR(spentAmt)} / {formatINR(Number(limit))}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${isOver ? "bg-red-500" : isWarn ? "bg-orange-400" : "bg-blue-500"}`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UpcomingWidget({ transactions }) {
  const recurring = transactions.filter((t) => t.isRecurring);
  if (recurring.length === 0) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
      <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <RefreshCw size={16} className="text-blue-500" /> Recurring Transactions
      </h2>
      <div className="space-y-2">
        {recurring.slice(0, 4).map((tx) => {
          const cfg = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG.default;
          const Icon = cfg.icon;
          return (
            <div key={tx._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div className={`w-8 h-8 ${cfg.bg} ${cfg.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{tx.title}</p>
                <p className="text-xs text-slate-400">{tx.frequency || "Monthly"}</p>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                {tx.type === "income" ? "+" : "−"}{formatINR(tx.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function Dashboard() {
  const { user, transactions, stats, leaderboard, loading, addTransaction } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  /* Keyboard shortcut: N → open modal */
  useKeyboardShortcut("n", useCallback(() => setModalOpen(true), []));
  useKeyboardShortcut("Escape", useCallback(() => { setSidebarOpen(false); }, []));

  /* Derived stats */
  const isThisMonth = getThisMonthRange();
  const isLastMonth = getLastMonthRange();

  const totalIncome  = stats?.totalIncome || 0;
  const totalExpense = stats?.totalExpense || 0;
  const balance = stats?.balance || 0;
  const savingsRate = stats?.savingsRate !== undefined ? Math.round(stats.savingsRate) : 0;

  /* Month-over-month savings rate change */
  const lastMonthIncome  = transactions.filter((t) => t.type === "income"  && isLastMonth(t.date)).reduce((s, t) => s + t.amount, 0);
  const lastMonthExpense = transactions.filter((t) => t.type === "expense" && isLastMonth(t.date)).reduce((s, t) => s + t.amount, 0);
  const lastMonthRate = lastMonthIncome > 0 ? Math.round(((lastMonthIncome - lastMonthExpense) / lastMonthIncome) * 100) : 0;
  const rateChange = savingsRate - lastMonthRate;

  const recentTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8000/api/v1/users/logout", {}, { withCredentials: true });
      navigate("/");
    } catch (err) { showToast(err.response?.data?.message || "Logout Failed", "error"); }
  };

  const handleAddTransaction = async (data) => {
    try {
      const res = await axios.post("http://localhost:8000/api/v1/transactions", data, { withCredentials: true });
      addTransaction(res.data.transaction);
      showToast("Transaction added!");
    } catch {
      addTransaction({ ...data, _id: Date.now().toString() });
      showToast("Transaction added (offline)!", "info");
    }
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 p-6 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <Wallet size={15} className="text-white" />
            </div>
            <span className="text-base font-bold text-slate-800 dark:text-white">Hisaab-Kitab</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {user && (
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-8 border border-slate-100 dark:border-slate-700/50">
            <img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.fullName}&backgroundColor=2563eb&textColor=ffffff`} alt="avatar" className="w-10 h-10 rounded-xl object-cover border-2 border-blue-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1">
          {MENU_ITEMS.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <button key={path} onClick={() => { navigate(path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-none" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"}`}>
                <Icon size={17} />{label}
              </button>
            );
          })}
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium mt-4">
          <LogOut size={17} />Logout
        </button>
      </aside>

      {/* Main */}
      <main className="p-5 lg:p-8 max-w-screen-xl mx-auto">

        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setSidebarOpen(true)}
            className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
            <Menu size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
              {loading ? "Dashboard" : `${getGreeting()}, ${user?.fullName?.split(" ")[0] || "there"} 👋`}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Here's what's happening with your finances
              <span className="ml-2 text-slate-300 dark:text-slate-600">· Press <kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500 font-mono text-[10px]">N</kbd> to add</span>
            </p>
          </div>
          <Navbar onAddExpense={() => setModalOpen(true)} user={user} />
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Income"    value={formatINR(totalIncome)}  icon={<TrendingUp size={20} />}   color="green"  change="This month" positive={true}  loading={loading} />
          <StatCard title="Total Expenses"  value={formatINR(totalExpense)} icon={<TrendingDown size={20} />} color="red"    change="This month" positive={false} loading={loading} />
          <StatCard title="Balance"         value={formatINR(balance)}      icon={<Wallet size={20} />}       color="blue"   change="Available"  loading={loading} />
          <StatCard
            title="Savings Rate"
            value={loading ? "—" : `${savingsRate}%`}
            icon={<Percent size={20} />}
            color="purple"
            change={rateChange === 0 ? "vs last month" : `${rateChange > 0 ? "+" : ""}${rateChange}% vs last month`}
            positive={rateChange >= 0}
            loading={loading}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Recent Transactions */}
          <section className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">Recent Transactions</h2>
              <button onClick={() => navigate("/transactions")}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                View all <ArrowUpRight size={14} />
              </button>
            </div>

            {loading ? <TransactionSkeleton /> : recentTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                  <Receipt size={28} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="font-medium text-slate-600 dark:text-slate-300 text-sm">No transactions yet</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Add your first transaction to get started</p>
                <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  <Plus size={15} />Add Transaction
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTx.map((tx) => {
                  const cfg = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG.default;
                  const Icon = cfg.icon;
                  return (
                    <div key={tx._id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                      onClick={() => navigate("/transactions")}
                    >
                      <div className={`w-11 h-11 ${cfg.bg} ${cfg.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate flex items-center gap-1.5">
                          {tx.title}
                          {tx.isRecurring && <RefreshCw size={11} className="text-blue-400 flex-shrink-0" />}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{tx.category} · {formatDate(tx.date)}</p>
                      </div>
                      <span className={`text-sm font-semibold flex-shrink-0 ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {tx.type === "income" ? "+" : "−"}{formatINR(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right column */}
          <div className="space-y-5">

            {/* Spending Breakdown */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-5">Spending Breakdown</h2>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1.5"><Shimmer className="h-3 w-20" /><Shimmer className="h-3 w-14" /></div>
                      <Shimmer className="h-1.5 w-full" />
                    </div>
                  ))}
                </div>
              ) : <CategoryBreakdown transactions={transactions} />}
            </section>

            {/* Budget Goals Widget */}
            {!loading && <BudgetWidget transactions={transactions} />}

            {/* Recurring Transactions */}
            {!loading && <UpcomingWidget transactions={transactions} />}

            {/* Leaderboard Preview */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">🏆 Leaderboard</h2>
                <button onClick={() => navigate("/leaderboard")}
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  View all <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {leaderboard.slice(0, 4).map((entry) => {
                  const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : "🏅";
                  return (
                    <div key={entry._id || entry.username} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg w-6 text-center">{medal}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">
                            {entry.name}{entry.isMe && " (You)"}
                          </p>
                          <p className="text-xs text-slate-400">Rank #{entry.rank}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{entry.points} pts</span>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        </div>
      </main>

      <AddExpenseModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAddTransaction} />
    </div>
  );
}