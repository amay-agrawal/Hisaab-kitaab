import { useState, useEffect, useMemo, useCallback } from "react";
import CSVImportModal from "../components/CSVImportModal";
import {
  Search, SlidersHorizontal, TrendingUp, TrendingDown, Wallet,
  Utensils, Car, ShoppingBag, BookOpen, Film, Heart, Zap, Receipt,
  Plus, ChevronDown, ArrowUpDown, Trash2, Edit3, LayoutDashboard,
  BarChart3, Trophy, User, Settings, LogOut, X, Menu, Upload,
  Target, RefreshCw,
} from "lucide-react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import AddExpenseModal from "../components/AddExpenseModal";
import Shimmer from "../components/Shimmer";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

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

const CATEGORIES = ["All", "Food", "Travel", "Shopping", "Education", "Entertainment", "Health", "Utilities", "Other"];
const SORT_OPTIONS = [
  { label: "Newest first",    value: "date-desc" },
  { label: "Oldest first",    value: "date-asc" },
  { label: "Highest amount",  value: "amount-desc" },
  { label: "Lowest amount",   value: "amount-asc" },
];

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",    path: "/dashboard" },
  { icon: Receipt,         label: "Transactions", path: "/transactions" },
  { icon: BarChart3,       label: "Analytics",    path: "/analytics" },
  { icon: Trophy,          label: "Leaderboard",  path: "/leaderboard" },
  { icon: Target,          label: "Budget",        path: "/budget" },
  { icon: User,            label: "Profile",       path: "/profile" },
  { icon: Settings,        label: "Settings",      path: "/settings" },
];

/* ─── Helpers ────────────────────────────────────────────────── */

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── Skeleton ───────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <Shimmer className="w-11 h-11 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3.5 w-36" />
        <Shimmer className="h-3 w-24" />
      </div>
      <div className="space-y-2 text-right">
        <Shimmer className="h-4 w-20 ml-auto" />
        <Shimmer className="h-3 w-14 ml-auto" />
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function Transactions() {
  const { user, transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // transaction being edited
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  /* Filters */
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  /* Pre-fill search from URL query param (Navbar search) */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) setSearch(q);
  }, [location.search]);

  /* Derived stats */
  const totalIncome  = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  /* Filtered + sorted */
  const filtered = useMemo(() => {
    let list = [...transactions];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q));
    }
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);
    if (categoryFilter !== "All") list = list.filter((t) => t.category === categoryFilter);
    list.sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date) - new Date(a.date);
      if (sortBy === "date-asc")  return new Date(a.date) - new Date(b.date);
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc")  return a.amount - b.amount;
      return 0;
    });
    return list;
  }, [transactions, search, typeFilter, categoryFilter, sortBy]);

  /* Handlers */
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

  const handleEditTransaction = async (id, data) => {
    try {
      const res = await axios.put(`http://localhost:8000/api/v1/transactions/${id}`, data, { withCredentials: true });
      updateTransaction(id, res.data.transaction || data);
    } catch {
      updateTransaction(id, data);
    }
    showToast("Transaction updated!");
    setEditTarget(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/v1/transactions/${id}`, { withCredentials: true });
    } catch (_) {}
    deleteTransaction(id);
    showToast("Transaction deleted", "info");
  };

  const openEdit = useCallback((tx) => {
    setEditTarget(tx);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditTarget(null);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label;
  const avatarSrc = user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName || "U"}&backgroundColor=2563eb&textColor=ffffff`;

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" onClick={() => { setShowSortDropdown(false); setShowCatDropdown(false); }}>

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

      {/* Main */}
      <main className="p-5 lg:p-8 max-w-screen-xl mx-auto">

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Menu size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Transactions</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{loading ? "Loading..." : `${transactions.length} total · ${filtered.length} shown`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCsvModalOpen(true)} className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Upload size={16} /><span className="hidden sm:inline">Import CSV</span>
            </button>
            <button onClick={() => { setEditTarget(null); setModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-200 dark:shadow-none">
              <Plus size={16} /><span className="hidden sm:inline">Add Transaction</span>
            </button>
          </div>
        </header>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Income",  value: formatINR(totalIncome),             color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: <TrendingUp size={16} /> },
            { label: "Total Expenses",value: formatINR(totalExpense),            color: "text-red-500 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20",         icon: <TrendingDown size={16} /> },
            { label: "Net Balance",   value: formatINR(totalIncome - totalExpense), color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20",        icon: <Wallet size={16} /> },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 px-5 py-4 flex items-center gap-3">
              <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>{icon}</div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className={`font-bold text-base truncate ${color}`}>{loading ? "—" : value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 mb-5 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl flex-1 min-w-[180px]">
            <Search size={15} className="text-slate-400 flex-shrink-0" />
            <input type="text" placeholder="Search by title or category..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 w-full" />
            {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={14} /></button>}
          </div>

          {/* Type filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
            {["all", "income", "expense"].map((type) => (
              <button key={type} onClick={() => setTypeFilter(type)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${typeFilter === type ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
                {type === "all" ? "All" : type === "income" ? "💰 Income" : "💸 Expense"}
              </button>
            ))}
          </div>

          {/* Category dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowCatDropdown((p) => !p); setShowSortDropdown(false); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium">
              <SlidersHorizontal size={15} />{categoryFilter === "All" ? "Category" : categoryFilter}
              <ChevronDown size={14} className={`transition-transform ${showCatDropdown ? "rotate-180" : ""}`} />
            </button>
            {showCatDropdown && (
              <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-20 py-1.5 min-w-[160px]">
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => { setCategoryFilter(cat); setShowCatDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${categoryFilter === cat ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowSortDropdown((p) => !p); setShowCatDropdown(false); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium">
              <ArrowUpDown size={15} />{currentSortLabel}
              <ChevronDown size={14} className={`transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
            </button>
            {showSortDropdown && (
              <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-20 py-1.5 min-w-[180px]">
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === opt.value ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transaction list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">{[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <Receipt size={28} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="font-semibold text-slate-600 dark:text-slate-300">{transactions.length === 0 ? "No transactions yet" : "No results found"}</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">{transactions.length === 0 ? "Start by adding your first transaction" : "Try adjusting your filters"}</p>
              {transactions.length === 0 && (
                <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  <Plus size={15} />Add Transaction
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {filtered.map((tx) => {
                const cfg = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG.default;
                const Icon = cfg.icon;
                return (
                  <div key={tx._id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                    <div className={`w-11 h-11 ${cfg.bg} ${cfg.color} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={18} /></div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate flex items-center gap-1.5">
                        {tx.title}
                        {tx.isRecurring && <RefreshCw size={11} className="text-blue-400 flex-shrink-0" title={`Recurring ${tx.frequency}`} />}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{tx.category}</span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-xs text-slate-400">{formatDate(tx.date)}</span>
                        {tx.note && <><span className="text-slate-300 dark:text-slate-600">·</span><span className="text-xs text-slate-400 truncate max-w-[120px]">{tx.note}</span></>}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {tx.type === "income" ? "+" : "−"}{formatINR(tx.amount)}
                      </p>
                      <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${tx.type === "income" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400"}`}>
                        {tx.type}
                      </span>
                    </div>

                    {/* Action buttons (hover reveal) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-1">
                      <button onClick={() => openEdit(tx)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-300 hover:text-blue-500 transition-all" title="Edit">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDelete(tx._id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-all" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700/30">
              <p className="text-xs text-slate-400 text-center">Showing {filtered.length} of {transactions.length} transactions</p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AddExpenseModal
        isOpen={modalOpen}
        onClose={closeModal}
        onAdd={handleAddTransaction}
        initialData={editTarget}
        onEdit={handleEditTransaction}
      />
      <CSVImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onImport={(imported) => { imported.forEach((tx) => addTransaction(tx)); showToast(`${imported.length} transactions imported!`); }}
      />
    </div>
  );
}