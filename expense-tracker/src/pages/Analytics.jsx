import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, LayoutDashboard, Receipt,
  BarChart3, Trophy, User, Settings, LogOut, X, Menu,
  CalendarDays, PiggyBank, Target,
} from "lucide-react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import Shimmer from "../components/Shimmer";

/* ─── Constants ──────────────────────────────────────────────── */

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",    path: "/dashboard" },
  { icon: Receipt,         label: "Transactions", path: "/transactions" },
  { icon: BarChart3,       label: "Analytics",    path: "/analytics" },
  { icon: Trophy,          label: "Leaderboard",  path: "/leaderboard" },
  { icon: Target,          label: "Budget",        path: "/budget" },
  { icon: User,            label: "Profile",       path: "/profile" },
  { icon: Settings,        label: "Settings",      path: "/settings" },
];

const PIE_COLORS  = ["#3b82f6","#8b5cf6","#f97316","#10b981","#ec4899","#eab308","#ef4444"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ─── Helpers ────────────────────────────────────────────────── */

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
function formatINRShort(v) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}

function buildMonthlyData(transactions, granularity = "monthly") {
  const map = {};
  transactions.forEach((t) => {
    const d = new Date(t.date);
    let key, label;
    if (granularity === "daily") {
      key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      label = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
    } else {
      key = `${d.getFullYear()}-${d.getMonth()}`;
      label = MONTH_NAMES[d.getMonth()];
    }
    if (!map[key]) map[key] = { month: label, income: 0, expense: 0, year: d.getFullYear(), monthIdx: d.getMonth(), day: d.getDate(), key };
    if (t.type === "income") map[key].income += t.amount;
    else map[key].expense += t.amount;
  });
  return Object.values(map)
    .sort((a, b) => a.key < b.key ? -1 : 1)
    .map((d) => ({ ...d, savings: Math.max(0, d.income - d.expense) }));
}

function buildCategoryData(transactions) {
  const map = {};
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
}

/* ─── Custom Tooltips ───────────────────────────────────────── */

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name.charAt(0).toUpperCase() + p.name.slice(1)}: {formatINR(p.value)}</p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{payload[0].name}</p>
      <p className="font-bold" style={{ color: payload[0].payload.fill }}>{formatINR(payload[0].value)}</p>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

const TIME_RANGES = [
  { label: "Last Week",     value: "7d",  days: 7 },
  { label: "Last Month",    value: "1m",  days: 30 },
  { label: "Last 3 Months", value: "3m",  days: 90 },
  { label: "Last 6 Months", value: "6m",  days: 180 },
];

export default function Analytics() {
  const { user, transactions: allTransactions, loading } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [filterMode,  setFilterMode]  = useState("rolling");  // "rolling" | "calendar"
  const [timeRange,   setTimeRange]   = useState("6m");
  // calendarMonth stored as "YYYY-M" (month is 0-indexed)
  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(`${now.getFullYear()}-${now.getMonth()}`);

  // Build last-12-month options for the calendar picker
  const calendarOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      value: `${d.getFullYear()}-${d.getMonth()}`,
      year:  d.getFullYear(),
      month: d.getMonth(),
    };
  });

  // ── Compute filtered transactions ──────────────────────────────
  let transactions = allTransactions || [];
  let rangeLabel = "";

  if (filterMode === "rolling") {
    const selectedDays = TIME_RANGES.find(r => r.value === timeRange)?.days || 180;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - selectedDays);
    transactions = transactions.filter(t => new Date(t.date) >= cutoff);
    rangeLabel = TIME_RANGES.find(r => r.value === timeRange)?.label || "Last 6 Months";
  } else {
    // Calendar mode: filter to exact calendar month
    const [y, m] = calendarMonth.split("-").map(Number);
    const start = new Date(y, m, 1);
    const end   = new Date(y, m + 1, 1); // exclusive
    transactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d < end;
    });
    rangeLabel = calendarOptions.find(o => o.value === calendarMonth)?.label || "";
  }

  // Derive KPI values from filtered set
  const totalIncome  = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savings      = Math.max(0, totalIncome - totalExpense);
  const savingsRate  = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

  // Derive chart data (calendar mode → always daily; rolling 7d/1m → daily; else monthly)
  const granularity = (filterMode === "calendar" || timeRange === "7d" || timeRange === "1m") ? "daily" : "monthly";
  const monthlyData  = buildMonthlyData(transactions, granularity);
  const categoryData = buildCategoryData(transactions);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8000/api/v1/users/logout", {}, { withCredentials: true });
      navigate("/");
    } catch (err) { showToast(err.response?.data?.message || "Logout Failed", "error"); }
  };

  const ChartSkeleton = ({ h = "h-64" }) => (
    <div className={`${h} flex items-end gap-2 p-4`}>
      {[40, 65, 50, 80, 60, 75].map((pct, i) => (
        <Shimmer key={i} className="flex-1 rounded-t-lg" style={{ height: `${pct}%` }} />
      ))}
    </div>
  );

  const avatarSrc = user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName || "U"}&backgroundColor=2563eb&textColor=ffffff`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 p-6 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
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

      <main className="p-5 lg:p-8 max-w-screen-xl mx-auto">

        {/* Header */}
        <header className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Menu size={20} className="text-slate-600 dark:text-slate-300" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Analytics</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your financial insights · {rangeLabel}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 p-1 rounded-xl gap-1">
              {["overview", "trend", "income", "expense"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Mode Toggle + Selectors */}
          <div className="flex flex-wrap items-center gap-3">

            {/* Mode toggle: Rolling | Calendar */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 p-1 rounded-xl gap-1">
              {[{ v: "rolling", label: "Rolling" }, { v: "calendar", label: "📅 Calendar" }].map(({ v, label }) => (
                <button key={v} onClick={() => setFilterMode(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === v
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Rolling: show 7d / 1m / 3m / 6m pills */}
            {filterMode === "rolling" && (
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 p-1 rounded-xl gap-1">
                {TIME_RANGES.map((r) => (
                  <button key={r.value} onClick={() => setTimeRange(r.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      timeRange === r.value
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* Calendar: show last 12 months as scrollable pills */}
            {filterMode === "calendar" && (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 max-w-full">
                {calendarOptions.map((o) => (
                  <button key={o.value} onClick={() => setCalendarMonth(o.value)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      calendarMonth === o.value
                        ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Income",   value: formatINR(totalIncome),  icon: <TrendingUp size={18} />,   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Total Expenses", value: formatINR(totalExpense), icon: <TrendingDown size={18} />, color: "text-red-500 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20" },
            { label: "Net Savings",    value: formatINR(savings),      icon: <PiggyBank size={18} />,    color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Savings Rate",   value: `${savingsRate}%`,       icon: <CalendarDays size={18} />, color: "text-violet-600 dark:text-violet-400",   bg: "bg-violet-50 dark:bg-violet-900/20" },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <div className={`w-8 h-8 ${bg} ${color} rounded-lg flex items-center justify-center`}>{icon}</div>
              </div>
              {loading ? <Shimmer className="h-7 w-24" /> : <p className={`text-xl font-bold ${color}`}>{value}</p>}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{rangeLabel}</p>
            </div>
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <>
              {/* Cash Flow Area */}
              <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Cash Flow</h2>
                <p className="text-xs text-slate-400 mb-6">Income vs expenses · {rangeLabel}</p>
                {loading ? <ChartSkeleton h="h-64" /> : monthlyData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <BarChart3 size={36} className="opacity-30 mb-3" /><p className="text-sm">No data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={formatINRShort} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={48} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                      <Area type="monotone" dataKey="income"  stroke="#10b981" strokeWidth={2.5} fill="url(#incomeGrad)"  dot={{ r: 4, fill: "#10b981" }} activeDot={{ r: 5 }} />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} fill="url(#expenseGrad)" dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Category Pie */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Expense Categories</h2>
                <p className="text-xs text-slate-400 mb-4">Where your money goes</p>
                {loading ? <Shimmer className="h-48 w-full" /> : categoryData.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400"><PiggyBank size={32} className="opacity-30 mb-2" /><p className="text-sm">No expenses yet</p></div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                          {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {categoryData.slice(0, 5).map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-xs text-slate-600 dark:text-slate-300">{d.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{formatINR(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Monthly Savings Bar */}
              <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Monthly Savings</h2>
                <p className="text-xs text-slate-400 mb-6">How much you saved each month</p>
                {loading ? <ChartSkeleton h="h-52" /> : monthlyData.length === 0 ? (
                  <div className="h-52 flex flex-col items-center justify-center text-slate-400"><BarChart3 size={36} className="opacity-30 mb-3" /><p className="text-sm">No data yet</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={formatINRShort} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={48} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="savings" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Top spending */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Top Spending</h2>
                <p className="text-xs text-slate-400 mb-5">Your biggest expense categories</p>
                {loading ? (
                  <div className="space-y-4">{[...Array(4)].map((_, i) => <Shimmer key={i} className="h-10 w-full" />)}</div>
                ) : categoryData.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {categoryData.slice(0, 5).map((d, i) => {
                      const pct = totalExpense > 0 ? Math.round((d.value / totalExpense) * 100) : 0; // uses filtered totalExpense
                      return (
                        <div key={d.name} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}>{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{d.name}</span>
                              <span className="text-slate-500 dark:text-slate-400">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── TREND TAB — Line Chart ── */}
          {activeTab === "trend" && (
            <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Income vs Expense Trend</h2>
              <p className="text-xs text-slate-400 mb-6">Month-by-month comparison · {rangeLabel}</p>
              {loading ? <ChartSkeleton h="h-80" /> : monthlyData.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center text-slate-400"><BarChart3 size={40} className="opacity-20 mb-3" /><p className="text-sm">Add transactions to see trends</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={monthlyData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatINRShort} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                    <Line type="monotone" dataKey="income"  stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7 }} name="Income" />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7 }} name="Expense" />
                    <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={3} strokeDasharray="6 3" dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7 }} name="Savings" />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {monthlyData.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/40">
                  {[
                    { label: "Avg Monthly Income",  value: formatINR(monthlyData.reduce((s,d)=>s+d.income,0)/monthlyData.length), color: "text-emerald-600" },
                    { label: "Avg Monthly Expense", value: formatINR(monthlyData.reduce((s,d)=>s+d.expense,0)/monthlyData.length), color: "text-red-500" },
                    { label: "Avg Monthly Savings", value: formatINR(monthlyData.reduce((s,d)=>s+d.savings,0)/monthlyData.length), color: "text-blue-600" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <p className="text-xs text-slate-400 mb-1">{label}</p>
                      <p className={`text-lg font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── INCOME TAB ── */}
          {activeTab === "income" && (
            <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Income Over Time</h2>
              <p className="text-xs text-slate-400 mb-6">Your earnings · {rangeLabel}</p>
              {loading ? <ChartSkeleton h="h-72" /> : monthlyData.length === 0 ? (
                <div className="h-72 flex flex-col items-center justify-center text-slate-400"><TrendingUp size={40} className="opacity-20 mb-3" /><p className="text-sm">No income data yet</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="incomeTabGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatINRShort} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fill="url(#incomeTabGrad)" dot={{ r: 5, fill: "#10b981" }} activeDot={{ r: 7 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* ── EXPENSE TAB ── */}
          {activeTab === "expense" && (
            <div className="xl:col-span-3 space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Expense Over Time</h2>
                <p className="text-xs text-slate-400 mb-6">Your spending · {rangeLabel}</p>
                {loading ? <ChartSkeleton h="h-72" /> : monthlyData.length === 0 ? (
                  <div className="h-72 flex flex-col items-center justify-center text-slate-400"><TrendingDown size={40} className="opacity-20 mb-3" /><p className="text-sm">No expense data yet</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData} barSize={32} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={formatINRShort} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={48} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expense" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* Category breakdown */}
              {!loading && categoryData.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                  <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-5">Category Breakdown</h2>
                  <div className="space-y-3">
                    {categoryData.map((d, i) => {
                      const pct = totalExpense > 0 ? Math.round((d.value / totalExpense) * 100) : 0;
                      return (
                        <div key={d.name} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}>{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{d.name}</span>
                              <span className="text-slate-500 dark:text-slate-400">{formatINR(d.value)} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}