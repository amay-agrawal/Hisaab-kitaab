import { useState, useEffect } from "react";
import {
  Settings, Sun, Moon, Bell, Shield, Palette, Globe,
  Wallet, LayoutDashboard, Receipt, BarChart3,
  Trophy, User, LogOut, X, Menu, Check,
  Lock, Eye, EyeOff, Smartphone, Monitor, Download, Trash2, Target, Plus, Upload
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",    path: "/dashboard" },
  { icon: Receipt,         label: "Transactions", path: "/transactions" },
  { icon: BarChart3,       label: "Analytics",    path: "/analytics" },
  { icon: Trophy,          label: "Leaderboard",  path: "/leaderboard" },
  { icon: Target,          label: "Budget",        path: "/budget" },
  { icon: User,            label: "Profile",       path: "/profile" },
  { icon: Settings,        label: "Settings",      path: "/settings" },
];

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
];

function SectionHeader({ icon: Icon, color, bg, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, id }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 ${
        checked ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingRow({ label, subtitle, children }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="min-w-0 pr-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, transactions, refetch, updateUser } = useApp();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("appearance");

  /* Settings state */
  const [currency, setCurrency] = useState("INR");
  const [language, setLanguage] = useState("en");
  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  /* Notification toggles */
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifBudget, setNotifBudget] = useState(true);
  const [notifLeaderboard, setNotifLeaderboard] = useState(false);
  const [notifMilestones, setNotifMilestones] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);

  /* Privacy toggles */
  const [profilePublic, setProfilePublic] = useState(true);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [shareAnalytics, setShareAnalytics] = useState(false);

  /* Security */
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  // Load backend configurations into states on user fetch resolution
  useEffect(() => {
    if (user?.settings) {
      const s = user.settings;
      if (s.currency) setCurrency(s.currency);
      if (s.language) setLanguage(s.language);
      if (s.compactMode !== undefined) setCompactMode(s.compactMode);
      if (s.animationsEnabled !== undefined) setAnimationsEnabled(s.animationsEnabled);
      if (s.dateFormat) setDateFormat(s.dateFormat);
      if (s.notifWeekly !== undefined) setNotifWeekly(s.notifWeekly);
      if (s.notifBudget !== undefined) setNotifBudget(s.notifBudget);
      if (s.notifLeaderboard !== undefined) setNotifLeaderboard(s.notifLeaderboard);
      if (s.notifMilestones !== undefined) setNotifMilestones(s.notifMilestones);
      if (s.notifEmail !== undefined) setNotifEmail(s.notifEmail);
      if (s.notifPush !== undefined) setNotifPush(s.notifPush);
      if (s.profilePublic !== undefined) setProfilePublic(s.profilePublic);
      if (s.showOnLeaderboard !== undefined) setShowOnLeaderboard(s.showOnLeaderboard);
      if (s.shareAnalytics !== undefined) setShareAnalytics(s.shareAnalytics);
      if (s.sessionTimeout) setSessionTimeout(s.sessionTimeout);
    }
  }, [user]);

  const saveSettings = async () => {
    try {
      const settingsData = {
        currency,
        language,
        compactMode,
        animationsEnabled,
        dateFormat,
        notifWeekly,
        notifBudget,
        notifLeaderboard,
        notifMilestones,
        notifEmail,
        notifPush,
        profilePublic,
        showOnLeaderboard,
        shareAnalytics,
        sessionTimeout
      };

      await axios.patch(
        "http://localhost:8000/api/v1/users/update-settings",
        { settings: settingsData },
        { withCredentials: true }
      );

      // Keep localStorage synchronized
      localStorage.setItem("currency", currency);
      localStorage.setItem("language", language);
      localStorage.setItem("compactMode", compactMode);
      localStorage.setItem("animations", animationsEnabled);
      localStorage.setItem("dateFormat", dateFormat);

      updateUser({ settings: settingsData });
      showToast("Settings saved successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save settings", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8000/api/v1/users/logout", {}, { withCredentials: true });
      navigate("/");
    } catch (err) { showToast(err.response?.data?.message || "Logout Failed", "error"); }
  };

  /* Data management actions */
  const exportCSV = () => {
    if (transactions.length === 0) {
      showToast("No transactions to export", "info");
      return;
    }
    const headers = ["Date", "Description", "Amount", "Type", "Category"];
    const rows = transactions.map(t => [
      t.date ? new Date(t.date).toISOString().split("T")[0] : "",
      `"${(t.title || t.description || "").replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      t.category
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV exported successfully!");
  };

  const exportJSON = () => {
    if (transactions.length === 0) {
      showToast("No transactions to export", "info");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "transactions.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("JSON exported successfully!");
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;

        // Proper RFC-4180 CSV row splitter — preserves EMPTY fields
        const splitCSVRow = (row) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch === '"') {
              if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
              else inQuotes = !inQuotes;
            } else if (ch === "," && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += ch;
            }
          }
          result.push(current.trim());
          return result;
        };

        const rawLines = text.split(/\r?\n/);
        const lines = rawLines.map(l => l.trim()).filter(Boolean);

        if (lines.length <= 1) {
          showToast("CSV is empty or lacks headers", "error");
          return;
        }

        // Find header row by scoring — scan up to 50 lines
        let headerLineIdx = 0;
        let maxScore = -1;
        const scanLimit = Math.min(50, lines.length);

        for (let i = 0; i < scanLimit; i++) {
          const cols = splitCSVRow(lines[i]).map(h => h.toLowerCase());
          let score = 0;
          if (cols.some(h => /date|time|timestamp/i.test(h))) score += 3;
          if (cols.some(h => /desc|narrat|particular|title|memo|detail/i.test(h))) score += 3;
          if (cols.some(h => /amount|debit|credit|withdrawal|deposit|dr|cr/i.test(h))) score += 3;
          if (cols.filter(h => h !== "").length >= 4) score += 1; // prefer rows with many columns
          if (score > maxScore) { maxScore = score; headerLineIdx = i; }
        }

        const headers = splitCSVRow(lines[headerLineIdx]).map(h => h.toLowerCase().trim());

        // Map columns — exact or partial match
        const findCol = (...patterns) => headers.findIndex(h => patterns.some(p => p.test(h)));

        const dateIdx    = findCol(/date|time|timestamp|when/);
        const descIdx    = findCol(/desc|narrat|particular|detail|info|memo|title/);
        const amountIdx  = findCol(/^amount$|^total$|^value$|^sum$|^rs$|^rupee$/);
        const debitIdx   = findCol(/debit|withdrawal|spent|^dr amount$|^dr$/);
        const creditIdx  = findCol(/credit|deposit|received|^cr amount$|^cr$/);
        const typeIdx    = findCol(/type|dr_cr|drcr|mode|dr\/cr/);
        const balanceIdx = findCol(/balance/);

        const finalDateIdx   = dateIdx   !== -1 ? dateIdx   : 0;
        const finalDescIdx   = descIdx   !== -1 ? descIdx   : 1;
        const finalAmountIdx = amountIdx !== -1 ? amountIdx : 2;

        // Robust date parser — handles DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.
        const parseRobustDate = (dateStr) => {
          if (!dateStr) return new Date();
          const s = dateStr.trim();
          // DD/MM/YYYY or DD-MM-YYYY
          const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}|\d{2})$/);
          if (dmy) {
            let [, d, m, y] = dmy;
            if (y.length === 2) y = "20" + y;
            const dt = new Date(+y, +m - 1, +d);
            if (!isNaN(dt)) return dt;
          }
          // YYYY-MM-DD
          const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
          if (ymd) {
            const dt = new Date(+ymd[1], +ymd[2] - 1, +ymd[3]);
            if (!isNaN(dt)) return dt;
          }
          const fallback = new Date(s);
          return isNaN(fallback) ? new Date() : fallback;
        };

        const parseAmount = (str) => {
          if (!str) return NaN;
          const n = parseFloat(str.replace(/[^\d.-]/g, ""));
          return isNaN(n) ? NaN : n;
        };

        const parsedTx = [];
        const dataRows = lines.slice(headerLineIdx + 1);

        for (const row of dataRows) {
          const cols = splitCSVRow(row);
          if (cols.length < 2) continue;

          // Skip footer/summary rows (e.g. "*** Generated through PNB ONE ***")
          const firstCell = (cols[0] || "").trim();
          if (/^\*|^-+$|^total|^opening|^closing|^balance/i.test(firstCell)) continue;

          const rawDate = cols[finalDateIdx] || "";
          const date = parseRobustDate(rawDate);

          const description = (cols[finalDescIdx] || "").trim();

          let amount = 0;
          let type = "expense";

          if (debitIdx !== -1 || creditIdx !== -1) {
            // PNB-style: separate Dr Amount / Cr Amount columns
            const drVal = debitIdx  !== -1 ? parseAmount(cols[debitIdx])  : NaN;
            const crVal = creditIdx !== -1 ? parseAmount(cols[creditIdx]) : NaN;

            if (!isNaN(drVal) && drVal > 0) {
              amount = drVal;
              type = "expense";
            } else if (!isNaN(crVal) && crVal > 0) {
              amount = crVal;
              type = "income";
            }
          } else {
            const raw = parseAmount(cols[finalAmountIdx] || "");
            if (!isNaN(raw)) {
              if (raw < 0) { amount = Math.abs(raw); type = "expense"; }
              else {
                amount = raw;
                const t = typeIdx !== -1 ? (cols[typeIdx] || "").toLowerCase() : "";
                type = /cr|credit|deposit|received|income/i.test(t) ? "income" : "expense";
              }
            }
          }

          // Skip if amount invalid or below DB minimum
          if (isNaN(amount) || amount < 1) continue;

          // Smart category detection from narration text
          let category = "Other";
          const desc = description.toLowerCase();
          if (/swiggy|zomato|restaurant|food|cafe|pizza|burger|grocery|supermarket|eats|bakery|canteen/i.test(desc)) category = "Food";
          else if (/uber|ola|taxi|flight|train|ticket|petrol|fuel|diesel|toll|metro|irctc|airline|cab/i.test(desc)) category = "Travel";
          else if (/amazon|flipkart|myntra|zara|clothing|shopping|shoe|apparel|mall/i.test(desc)) category = "Shopping";
          else if (/course|udemy|book|school|college|tuition|fees|education|library/i.test(desc)) category = "Education";
          else if (/netflix|spotify|movie|cinema|game|steam|disney|hotstar|youtube|prime/i.test(desc)) category = "Entertainment";
          else if (/hospital|pharmacy|doctor|clinic|dental|health|chemist/i.test(desc)) category = "Health";
          else if (/bill|recharge|mobile|electricity|water|wifi|internet|rent|telecom/i.test(desc)) category = "Utilities";

          parsedTx.push({
            date,
            title: description || "Imported transaction",
            amount,
            type,
            category,
          });
        }

        if (parsedTx.length === 0) {
          showToast("No valid transactions found in CSV — check your file format", "error");
          return;
        }

        const res = await axios.post("http://localhost:8000/api/v1/transactions/bulk", { transactions: parsedTx }, { withCredentials: true });
        refetch();
        showToast(`${res.data.inserted.length} transactions imported successfully!`, "success");
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
        showToast(`Import failed: ${errorMsg}`, "error");
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete all transaction data? This cannot be undone.")) return;
    try {
      await axios.delete("http://localhost:8000/api/v1/transactions/clear-all", { withCredentials: true });
      refetch();
      showToast("All transactions cleared successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to clear data", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("WARNING: Are you absolutely sure you want to delete your account? This will permanently erase your profile, social connections, notifications, and all financial data. This action is irreversible.")) return;
    try {
      await axios.delete("http://localhost:8000/api/v1/users/delete-account", { withCredentials: true });
      showToast("Account deleted successfully.", "info");
      navigate("/");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete account", "error");
    }
  };

  const avatarSrc = user?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName || "U"}&backgroundColor=2563eb&textColor=ffffff`;

  const TABS = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "security", label: "Security", icon: Lock },
    { id: "data", label: "Data", icon: Download },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 p-6 z-50 flex flex-col transform transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
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
            <img src={avatarSrc} alt="avatar" className="w-10 h-10 rounded-xl object-cover border-2 border-blue-500" />
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
                }`}>
                <Icon size={17} />{label}
              </button>
            );
          })}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium mt-4">
          <LogOut size={17} />Logout
        </button>
      </aside>

      <main className="p-5 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setSidebarOpen(true)} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Menu size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Settings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customize your experience</p>
          </div>
        </header>

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Tab Navigation */}
          <nav className="lg:w-52 flex-shrink-0">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full text-left ${
                    activeTab === id
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-none"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* ── Appearance ── */}
            {activeTab === "appearance" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                <SectionHeader icon={Palette} color="text-violet-600 dark:text-violet-400" bg="bg-violet-50 dark:bg-violet-900/20" title="Appearance" subtitle="Customize how the app looks" />

                {/* Theme */}
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Theme</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Light Mode", icon: Sun, value: false },
                      { label: "Dark Mode", icon: Moon, value: true },
                    ].map(({ label, icon: Icon, value }) => (
                      <button
                        key={label}
                        onClick={() => { if (darkMode !== value) toggleDarkMode(); }}
                        className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${
                          darkMode === value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <Icon size={22} />
                        <span className="text-sm font-medium">{label}</span>
                        {darkMode === value && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display options */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Display Options</p>
                  <SettingRow label="Compact Mode" subtitle="Reduce padding and spacing throughout the app">
                    <Toggle id="compactMode" checked={compactMode} onChange={setCompactMode} />
                  </SettingRow>
                  <SettingRow label="Animations" subtitle="Enable smooth transitions and micro-animations">
                    <Toggle id="animations" checked={animationsEnabled} onChange={setAnimationsEnabled} />
                  </SettingRow>
                </div>

                {/* Device theme */}
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Optimized For</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Desktop", icon: Monitor },
                      { label: "Mobile", icon: Smartphone },
                    ].map(({ label, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <Icon size={16} className="text-slate-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === "notifications" && (
              <div className="space-y-5">
                {/* Alert Types */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                  <SectionHeader icon={Bell} color="text-orange-500" bg="bg-orange-50 dark:bg-orange-900/20" title="Notification Alerts" subtitle="Choose what you want to be notified about" />
                  <SettingRow label="Weekly Spending Summary" subtitle="Get a detailed summary every Monday">
                    <Toggle id="notifWeekly" checked={notifWeekly} onChange={(v) => { setNotifWeekly(v); saveSettings(); }} />
                  </SettingRow>
                  <SettingRow label="Budget Alerts" subtitle="Alert when spending exceeds your set limit">
                    <Toggle id="notifBudget" checked={notifBudget} onChange={(v) => { setNotifBudget(v); saveSettings(); }} />
                  </SettingRow>
                  <SettingRow label="Leaderboard Updates" subtitle="When your rank changes on the leaderboard">
                    <Toggle id="notifLeaderboard" checked={notifLeaderboard} onChange={(v) => { setNotifLeaderboard(v); saveSettings(); }} />
                  </SettingRow>
                  <SettingRow label="Community Milestones" subtitle="Friend activity and achievements">
                    <Toggle id="notifMilestones" checked={notifMilestones} onChange={(v) => { setNotifMilestones(v); saveSettings(); }} />
                  </SettingRow>
                </div>

                {/* Delivery Channels */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                  <SectionHeader icon={Smartphone} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" title="Delivery Channels" subtitle="How you receive notifications" />
                  <SettingRow label="Email Notifications" subtitle={`Receive important alerts to ${user?.email || "your email"}`}>
                    <Toggle id="notifEmail" checked={notifEmail} onChange={(v) => { setNotifEmail(v); saveSettings(); }} />
                  </SettingRow>
                  <SettingRow label="Push Notifications" subtitle="Browser push notifications (requires permission)">
                    <Toggle
                      id="notifPush"
                      checked={notifPush}
                      onChange={async (v) => {
                        if (v && "Notification" in window) {
                          const permission = await Notification.requestPermission();
                          if (permission !== "granted") {
                            showToast("Push notification permission denied by browser", "error");
                            return;
                          }
                        }
                        setNotifPush(v);
                        saveSettings();
                      }}
                    />
                  </SettingRow>
                  {notifPush && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                      <Bell size={13} />
                      <span>Push notifications are active for this browser session</span>
                    </div>
                  )}
                  {!notifPush && notifEmail && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                      <Smartphone size={13} />
                      <span>Alerts will be sent via email only</span>
                    </div>
                  )}
                  {!notifPush && !notifEmail && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-xs text-red-700 dark:text-red-300">
                      <Bell size={13} />
                      <span>All delivery channels are off — you won't receive any alerts</span>
                    </div>
                  )}
                </div>

                {/* Save Button + Test Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const res = await axios.post("http://localhost:8000/api/v1/users/send-test-email", {}, { withCredentials: true });
                          showToast(res.data.message, "success");
                        } catch (err) {
                          showToast(err.response?.data?.message || "Failed to send test email", "error");
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all"
                    >
                      <Bell size={14} />
                      Send Test Email
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await axios.post("http://localhost:8000/api/v1/users/send-weekly-summary", {}, { withCredentials: true });
                          showToast(res.data.message, "success");
                        } catch (err) {
                          showToast(err.response?.data?.message || "Failed to send summary", "error");
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all"
                    >
                      <Smartphone size={14} />
                      Send Weekly Summary
                    </button>
                  </div>
                  <button
                    onClick={saveSettings}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
                  >
                    <Check size={15} />
                    Save Notification Settings
                  </button>
                </div>
              </div>
            )}

            {/* ── Privacy ── */}
            {activeTab === "privacy" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                <SectionHeader icon={Shield} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" title="Privacy" subtitle="Control your data visibility" />
                <SettingRow label="Public Profile" subtitle="Allow others to see your profile and display name">
                  <Toggle id="profilePublic" checked={profilePublic} onChange={setProfilePublic} />
                </SettingRow>
                <SettingRow label="Show on Leaderboard" subtitle="Appear in the community savings leaderboard">
                  <Toggle id="showOnLeaderboard" checked={showOnLeaderboard} onChange={setShowOnLeaderboard} />
                </SettingRow>
                <SettingRow label="Share Anonymous Analytics" subtitle="Help improve the app with anonymized usage data">
                  <Toggle id="shareAnalytics" checked={shareAnalytics} onChange={setShareAnalytics} />
                </SettingRow>

                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Your Data</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your financial data is encrypted at rest and never sold to third parties.
                    We are committed to keeping your data private and secure.
                  </p>
                </div>
              </div>
            )}

            {/* ── Security ── */}
            {activeTab === "security" && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                  <SectionHeader icon={Lock} color="text-slate-600 dark:text-slate-400" bg="bg-slate-100 dark:bg-slate-800" title="Security" subtitle="Keep your account safe" />
                  <SettingRow label="Two-Factor Authentication" subtitle="Add an extra layer of security to your account">
                    <Toggle id="twoFactor" checked={twoFactor} onChange={setTwoFactor} />
                  </SettingRow>
                  <SettingRow label="Session Timeout" subtitle="Automatically log out after inactivity">
                    <select
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="never">Never</option>
                    </select>
                  </SettingRow>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Active Sessions</p>
                  <div className="space-y-3">
                    {[
                      { device: "Chrome on Windows", location: "Current session", time: "Active now", current: true },
                      { device: "Safari on iPhone", location: "Mumbai, India", time: "2 hours ago", current: false },
                    ].map((session) => (
                      <div key={session.device} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{session.device}</p>
                          <p className="text-xs text-slate-400">{session.location} · {session.time}</p>
                        </div>
                        {session.current ? (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">Current</span>
                        ) : (
                          <button className="text-xs text-red-500 hover:underline font-medium">Revoke</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Data ── */}
            {activeTab === "data" && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                  <SectionHeader icon={Download} color="text-sky-600 dark:text-sky-400" bg="bg-sky-50 dark:bg-sky-900/20" title="Data Management" subtitle="Export or manage your financial data" />

                  <div className="space-y-3">
                    {/* Export CSV Row */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">Export as CSV</p>
                        <p className="text-xs text-slate-400 mt-0.5">Download all transactions as a spreadsheet</p>
                      </div>
                      <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                        <Download size={13} />
                        Export CSV
                      </button>
                    </div>

                    {/* Export JSON Row */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">Export as JSON</p>
                        <p className="text-xs text-slate-400 mt-0.5">Download a full backup of your data</p>
                      </div>
                      <button onClick={exportJSON} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                        <Download size={13} />
                        Export JSON
                      </button>
                    </div>

                    {/* Import CSV Row */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">Import from CSV</p>
                        <p className="text-xs text-slate-400 mt-0.5">Upload a CSV file containing your transaction history</p>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer">
                        <Upload size={13} />
                        Import CSV
                        <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Danger zone */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800/40 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                      <Trash2 size={18} className="text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Irreversible actions — proceed with caution</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">Clear All Transactions</p>
                        <p className="text-xs text-slate-400 mt-0.5">Permanently delete all your transaction history</p>
                      </div>
                      <button onClick={handleClearData} className="text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 px-3 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        Clear Data
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">Delete Account</p>
                        <p className="text-xs text-slate-400 mt-0.5">Permanently delete your account and all data</p>
                      </div>
                      <button onClick={handleDeleteAccount} className="text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 px-3 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button (not on data/danger tab) */}
            {activeTab !== "data" && (
              <div className="flex justify-end mt-5">
                <button
                  onClick={saveSettings}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-200 dark:shadow-none"
                >
                  <Check size={16} />
                  Save Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
