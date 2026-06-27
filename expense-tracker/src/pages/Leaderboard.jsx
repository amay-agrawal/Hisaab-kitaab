import { useState, useEffect } from "react";
import {
    Trophy, Medal, Crown, TrendingUp, Users, Search,
    Wallet, LayoutDashboard, Receipt, BarChart3, User,
    Settings, LogOut, X, Menu, Flame, Star,
} from "lucide-react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

const MENU_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Receipt, label: "Transactions", path: "/transactions" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Settings, label: "Settings", path: "/settings" },
];

function formatINR(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR", maximumFractionDigits: 0,
    }).format(amount);
}

function getRankStyle(rank) {
    if (rank === 1) return { bg: "bg-gradient-to-r from-yellow-400 to-amber-500", text: "text-white", medal: "🥇" };
    if (rank === 2) return { bg: "bg-gradient-to-r from-slate-300 to-slate-400", text: "text-white", medal: "🥈" };
    if (rank === 3) return { bg: "bg-gradient-to-r from-amber-600 to-orange-600", text: "text-white", medal: "🥉" };
    return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300", medal: null };
}

export default function Leaderboard() {
    const { user: currentUser, leaderboard, fetchLeaderboard } = useApp();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(currentUser);
    const [leaderboardFilter, setLeaderboardFilter] = useState("global"); // global | following
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setUser(currentUser);
    }, [currentUser]);

    useEffect(() => {
        setLoading(true);
        fetchLeaderboard(leaderboardFilter).then(() => setLoading(false));
    }, [leaderboardFilter, fetchLeaderboard]);

    const handleLogout = async () => {
        try {
            await axios.post("http://localhost:8000/api/v1/users/logout", {}, { withCredentials: true });
            navigate("/");
        } catch (err) {
            console.error("Logout Failed:", err);
        }
    };

    const handleToggleFollow = async (targetUserId) => {
        try {
            const res = await axios.post(
                `http://localhost:8000/api/v1/follow/toggle/${targetUserId}`,
                {},
                { withCredentials: true }
            );
            const { isFollowing } = res.data;
            showToast(isFollowing ? "User followed!" : "User unfollowed!", isFollowing ? "success" : "info");
            fetchLeaderboard(leaderboardFilter);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to follow/unfollow user", "error");
        }
    };

    // Filter by search name or username
    const filtered = leaderboard.filter(
        (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase())
    );

    const myRank = leaderboard.find((u) => u.isMe);

    // Secure Podium users handling
    const top1 = leaderboard[0] || { name: "No User", username: "none", points: 0, streak: 0, badge: "👑" };
    const top2 = leaderboard[1] || { name: "No User", username: "none", points: 0, streak: 0, badge: "🔥" };
    const top3 = leaderboard[2] || { name: "No User", username: "none", points: 0, streak: 0, badge: "⭐" };
    const podiumList = [top2, top1, top3];

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
                        <img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.fullName}&backgroundColor=2563eb&textColor=ffffff`} alt="avatar" className="w-10 h-10 rounded-xl object-cover border-2 border-blue-500" />
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
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <Menu size={20} className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white">🏆 Leaderboard</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Compete, save, and rise the ranks</p>
                        </div>
                    </div>
                </header>

                {/* My rank card */}
                {myRank && !loading && (
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 mb-6 text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
                                #{myRank.rank}
                            </div>
                            <div>
                                <p className="text-blue-100 text-xs font-medium">Your Current Rank</p>
                                <p className="text-xl font-bold">{myRank.name}</p>
                                <p className="text-blue-200 text-xs mt-0.5">🔥 {myRank.streak}-day streak</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-blue-100 text-xs">Financial Score</p>
                            <p className="text-2xl font-bold">{myRank.points} pts</p>
                            <p className="text-blue-200 text-xs mt-0.5">
                                {myRank.savings !== null ? `Savings: ${formatINR(myRank.savings)}` : ""}
                            </p>
                        </div>
                    </div>
                )}

                {/* Top 3 Podium */}
                {!loading && leaderboard.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {podiumList.map((u, i) => {
                            const podiumRank = [2, 1, 3][i];
                            const heights = ["h-24", "h-32", "h-20"];
                            const colors = [
                                "border-slate-300 dark:border-slate-500",
                                "border-yellow-400",
                                "border-amber-600",
                            ];
                            const avatarUrl = u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}&backgroundColor=${u.isMe ? "2563eb" : "64748b"}&textColor=ffffff`;
                            return (
                                <div key={i} className="flex flex-col items-center">
                                    <div className="text-3xl mb-2">{getRankStyle(podiumRank).medal}</div>
                                    <img
                                        src={avatarUrl}
                                        alt={u.name}
                                        className={`w-14 h-14 rounded-2xl border-4 mb-2 ${colors[i]} ${u.isMe ? "ring-4 ring-blue-400 ring-offset-2 dark:ring-offset-slate-950" : ""}`}
                                    />
                                    <p className="text-sm font-bold text-slate-800 dark:text-white text-center truncate max-w-full px-1">
                                        {u.name.split(" ")[0]}{u.isMe && " (You)"}
                                    </p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{u.points} pts</p>
                                    <div className={`w-full rounded-t-xl mt-3 ${heights[i]} ${i === 1 ? "bg-yellow-400/20 dark:bg-yellow-400/10 border-t-2 border-yellow-400" : i === 0 ? "bg-slate-200/50 dark:bg-slate-700/30 border-t-2 border-slate-300 dark:border-slate-500" : "bg-amber-100/50 dark:bg-amber-900/10 border-t-2 border-amber-500"}`} />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Filter Info + Search */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 mb-5 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl flex-1 min-w-[180px]">
                        <Search size={15} className="text-slate-400 flex-shrink-0" />
                        <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 w-full" />
                    </div>
                    
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                        <button
                            onClick={() => setLeaderboardFilter("global")}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                leaderboardFilter === "global"
                                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                        >
                            🌍 Global
                        </button>
                        <button
                            onClick={() => setLeaderboardFilter("following")}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                leaderboardFilter === "following"
                                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                        >
                            👥 Following
                        </button>
                        <button
                            onClick={() => setLeaderboardFilter("followers")}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                leaderboardFilter === "followers"
                                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                        >
                            👥 Followers
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 px-4 py-2.5 rounded-xl">
                        <Trophy size={14} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Ranked by Financial Score</span>
                    </div>
                </div>

                {/* Full list */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading Leaderboard...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">No users found</div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
                            {filtered.map((u) => {
                                const { bg, text, medal } = getRankStyle(u.rank);
                                const maxVal = filtered[0]?.points || 1;
                                const pct = Math.round((u.points / maxVal) * 100);
                                const avatarUrl = u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}&backgroundColor=${u.isMe ? "2563eb" : "64748b"}&textColor=ffffff`;
                                return (
                                    <div key={u.username} className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${u.isMe ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
                                        {/* Rank badge */}
                                        <div className={`w-9 h-9 ${bg} ${text} rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                                            {medal || `#${u.rank}`}
                                        </div>

                                        {/* Avatar and Name clickable */}
                                        <div
                                            onClick={() => navigate(u.isMe ? "/profile" : `/profile/${u.username}`)}
                                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                                        >
                                            {/* Avatar */}
                                            <img
                                                src={avatarUrl}
                                                alt={u.name}
                                                className={`w-10 h-10 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform ${u.isMe ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900" : ""}`}
                                            />

                                            {/* Name + bar */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                                                        {u.name}{u.isMe && <span className="ml-1.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">YOU</span>}
                                                    </p>
                                                    <span className="text-lg">{u.badge}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Follow Action */}
                                        {!u.isMe && (
                                            <button
                                                onClick={() => handleToggleFollow(u._id)}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                                    u.isFollowing
                                                        ? "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                        : "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
                                                }`}
                                            >
                                                {u.isFollowing ? "Unfollow" : "Follow"}
                                            </button>
                                        )}

                                        {/* Stats */}
                                        <div className="text-right flex-shrink-0 hidden sm:block">
                                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                {u.points} pts
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {u.isMe && u.savings !== null ? `Saved ${formatINR(u.savings)}` : "🔒 Private"}
                                            </p>
                                        </div>

                                        {/* Streak badge */}
                                        <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1.5 rounded-xl flex-shrink-0">
                                            <Flame size={13} className="text-orange-500" />
                                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{u.streak}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}