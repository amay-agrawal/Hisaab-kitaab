import { useState, useEffect, useCallback, useMemo } from "react";
import {
  User, Mail, AtSign, Camera, Save, Lock, Eye, EyeOff,
  Wallet, LayoutDashboard, Receipt, BarChart3, Trophy,
  Settings, LogOut, X, Menu, Shield, Bell, CheckCircle, Target, Users, Flame, Trash2
} from "lucide-react";
import axios from "axios";
import { useNavigate, useLocation, useParams } from "react-router-dom";
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

const CATEGORY_COLORS = {
  Food: "bg-orange-500 text-orange-500",
  Travel: "bg-sky-500 text-sky-500",
  Shopping: "bg-violet-500 text-violet-500",
  Education: "bg-emerald-500 text-emerald-500",
  Entertainment: "bg-pink-500 text-pink-500",
  Health: "bg-red-500 text-red-500",
  Utilities: "bg-yellow-500 text-yellow-500",
  Other: "bg-slate-400 text-slate-500"
};

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
        <Icon size={14} className="text-slate-400" />{label}
      </label>
      {children}
    </div>
  );
}

function InputBox({ ...props }) {
  return (
    <input
      {...props}
      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    />
  );
}

export default function Profile() {
  const { user, loading: selfLoading, updateUser } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams();

  const isPublicMode = !!username;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Self Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [userProfileUsername, setUserProfileUsername] = useState("");

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Public profile state
  const [publicUser, setPublicUser] = useState(null);

  // Social List Modal state
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [showListModal, setShowListModal] = useState(false);
  const [modalType, setModalType] = useState("followers"); // followers | following

  // Lightbox view state
  const [showLightbox, setShowLightbox] = useState(false);

  // Fetch Public Profile details
  const fetchPublicProfile = useCallback(async () => {
    if (!isPublicMode) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/users/p/${username}`, { withCredentials: true });
      setPublicUser(res.data.profile);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load profile", "error");
      navigate("/leaderboard");
    } finally {
      setLoading(false);
    }
  }, [isPublicMode, username, navigate, showToast]);

  useEffect(() => {
    if (isPublicMode) {
      fetchPublicProfile();
    } else {
      setLoading(selfLoading);
    }
  }, [isPublicMode, fetchPublicProfile, selfLoading]);

  // Synchronize form values for self-mode
  useEffect(() => {
    if (user && !isPublicMode) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setUserProfileUsername(user.username || "");
    }
  }, [user, isPublicMode]);

  // Fetch follower / following details
  const fetchFollows = useCallback(async () => {
    const targetUserId = isPublicMode ? publicUser?._id : user?._id;
    if (!targetUserId) return;
    try {
      const [followersRes, followingRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/v1/follow/followers/${targetUserId}`, { withCredentials: true }),
        axios.get(`http://localhost:8000/api/v1/follow/following/${targetUserId}`, { withCredentials: true })
      ]);
      setFollowersList(followersRes.data.followers || []);
      setFollowingList(followingRes.data.following || []);
    } catch (err) {
      console.error("Failed to fetch followers/following list:", err);
    }
  }, [isPublicMode, publicUser?._id, user?._id]);

  useEffect(() => {
    fetchFollows();
  }, [fetchFollows]);

  const handleToggleFollow = async () => {
    if (!isPublicMode || !publicUser) return;
    try {
      const res = await axios.post(
        `http://localhost:8000/api/v1/follow/toggle/${publicUser._id}`,
        {},
        { withCredentials: true }
      );
      const { isFollowing } = res.data;
      showToast(isFollowing ? "User followed!" : "User unfollowed!", isFollowing ? "success" : "info");
      
      // Update public user follow status dynamically
      setPublicUser(prev => ({
        ...prev,
        isFollowing,
        followersCount: isFollowing ? prev.followersCount + 1 : prev.followersCount - 1
      }));
      fetchFollows();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to toggle follow status", "error");
    }
  };

  const handleUnfollowFromList = async (targetUserId) => {
    try {
      await axios.post(
        `http://localhost:8000/api/v1/follow/toggle/${targetUserId}`,
        {},
        { withCredentials: true }
      );
      fetchFollows();
      showToast("Unfollowed successfully!", "info");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unfollow", "error");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      showToast("Uploading profile picture...", "info");
      const res = await axios.patch(
        "http://localhost:8000/api/v1/users/update-avatar",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true
        }
      );
      updateUser({ avatar: res.data.user.avatar });
      showToast("Profile picture uploaded successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to upload avatar", "error");
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm("Are you sure you want to remove your profile picture?")) return;
    try {
      showToast("Removing profile picture...", "info");
      await axios.delete("http://localhost:8000/api/v1/users/remove-avatar", { withCredentials: true });
      updateUser({ avatar: "" });
      showToast("Profile picture removed successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove avatar", "error");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch(
        "http://localhost:8000/api/v1/users/update-profile",
        { fullName, email, username: userProfileUsername },
        { withCredentials: true }
      );
      updateUser({ fullName, email, username: userProfileUsername });
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setSaving(true);
    try {
      await axios.post(
        "http://localhost:8000/api/v1/users/change-password",
        { currentPassword, newPassword },
        { withCredentials: true }
      );
      showToast("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordSection(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8000/api/v1/users/logout", {}, { withCredentials: true });
      navigate("/");
    } catch (err) { showToast(err.response?.data?.message || "Logout Failed", "error"); }
  };

  // Determine avatar and metadata source
  const profileData = isPublicMode ? publicUser : user;
  const avatarSrc = profileData?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${profileData?.fullName || "U"}&backgroundColor=2563eb&textColor=ffffff`;

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

      <main className="p-5 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setSidebarOpen(true)} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Menu size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              {isPublicMode ? "Public Profile" : "Profile"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isPublicMode ? `Viewing @${username}'s profile` : "Manage your account information"}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50" />
            <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50" />
          </div>
        ) : (
          <div className="space-y-5">

            {/* Avatar section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="w-20 h-20 rounded-2xl object-cover border-3 border-blue-500 shadow-lg cursor-zoom-in hover:opacity-90 transition-opacity"
                      onClick={() => setShowLightbox(true)}
                      title="Click to view full image"
                    />
                    
                    {!isPublicMode && profileData?.avatar && (
                      <button
                        onClick={handleRemoveAvatar}
                        className="absolute -bottom-1.5 -left-1.5 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-xl flex items-center justify-center shadow-md transition-colors"
                        title="Remove profile picture"
                      >
                        <Trash2 size={14} className="text-white" />
                      </button>
                    )}

                    {!isPublicMode && (
                      <label className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center shadow-md transition-colors cursor-pointer" title="Change avatar">
                        <Camera size={14} className="text-white" />
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                      </label>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{profileData?.fullName}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">@{profileData?.username}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                        <CheckCircle size={11} /> Verified Account
                      </span>
                      <button
                        onClick={() => { setModalType("followers"); setShowListModal(true); }}
                        className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        <span className="text-slate-800 dark:text-white font-bold text-sm mr-1">{followersList.length}</span> followers
                      </button>
                      <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                      <button
                        onClick={() => { setModalType("following"); setShowListModal(true); }}
                        className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        <span className="text-slate-800 dark:text-white font-bold text-sm mr-1">{followingList.length}</span> following
                      </button>
                    </div>
                  </div>
                </div>

                {isPublicMode && (
                  <button
                    onClick={handleToggleFollow}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      publicUser?.isFollowing
                        ? "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        : "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
                    }`}
                  >
                    {publicUser?.isFollowing ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            {isPublicMode ? (
              /* Public mode user overview */
              <div className="space-y-5">
                {/* Financial Health Scores */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Financial Score</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">{publicUser?.points} pts</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-500">
                      <Flame size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Streak</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-white">
                        {Math.round((publicUser?.points || 0) / 25) || 3} days
                      </p>
                    </div>
                  </div>
                </div>

                {/* Spending Category Percentages Chart (Privacy-Safe) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                    <BarChart3 size={18} className="text-blue-500" />
                    Spending Breakdown (Percentages)
                  </h3>
                  {publicUser?.categoryPercentages && publicUser.categoryPercentages.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No spending data recorded yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {publicUser?.categoryPercentages?.map((item) => {
                        const style = CATEGORY_COLORS[item.category] || "bg-slate-400 text-slate-500";
                        const barColor = style.split(" ")[0];
                        return (
                          <div key={item.category}>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{item.category}</span>
                              <span className="font-semibold text-slate-500 dark:text-slate-400">{item.percentage}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${item.percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Self Mode UI (Forms and edit preferences) */
              <div className="space-y-5">
                {/* Edit profile form */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <User size={15} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white">Personal Information</h3>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <Field label="Full Name" icon={User}>
                      <InputBox type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Email Address" icon={Mail}>
                        <InputBox type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                      </Field>
                      <Field label="Username" icon={AtSign}>
                        <InputBox type="text" value={userProfileUsername} onChange={(e) => setUserProfileUsername(e.target.value)} placeholder="your_username" required />
                      </Field>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button type="submit" disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-200 dark:shadow-none">
                        <Save size={15} />
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Change password */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                  <button onClick={() => setShowPasswordSection((p) => !p)} className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center">
                        <Shield size={15} className="text-violet-600 dark:text-violet-400" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-800 dark:text-white">Change Password</h3>
                    </div>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{showPasswordSection ? "Cancel" : "Update"}</span>
                  </button>

                  {showPasswordSection && (
                    <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                      <Field label="Current Password" icon={Lock}>
                        <div className="relative">
                          <InputBox type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" required />
                          <button type="button" onClick={() => setShowCurrent((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </Field>
                      <Field label="New Password" icon={Lock}>
                        <div className="relative">
                          <InputBox type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" required />
                          <button type="button" onClick={() => setShowNew((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </Field>
                      <div className="flex justify-end">
                        <button type="submit" disabled={saving}
                          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                          <Lock size={15} />
                          {saving ? "Updating..." : "Update Password"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Notification preferences */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                      <Bell size={15} className="text-orange-500" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white">Notification Preferences</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Weekly spending summary", sub: "Get a summary every Monday", defaultOn: true },
                      { label: "Budget alerts", sub: "Alert when spending exceeds limit", defaultOn: true },
                      { label: "Leaderboard updates", sub: "When your rank changes", defaultOn: false },
                      { label: "New community milestones", sub: "Friend activity and achievements", defaultOn: false },
                    ].map(({ label, sub, defaultOn }) => (
                      <label key={label} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors">
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                        </div>
                        <div className="relative flex-shrink-0">
                          <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
                          <div className="w-10 h-5.5 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-blue-600 transition-colors cursor-pointer" style={{ height: "22px" }} />
                          <div className="absolute left-0.5 top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow peer-checked:translate-x-4.5 transition-transform" style={{ width: "18px", height: "18px", top: "2px", left: "2px" }} />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Danger zone */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800/40 p-6">
                  <h3 className="text-base font-semibold text-red-600 dark:text-red-400 mb-3">Danger Zone</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                  <button className="px-4 py-2.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Followers / Following List Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                {modalType === "followers" ? "Followers" : "Following"}
              </h3>
              <button
                onClick={() => setShowListModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {modalType === "followers" ? (
                followersList.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No followers yet</div>
                ) : (
                  followersList.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => {
                        setShowListModal(false);
                        navigate(item._id === user?._id ? "/profile" : `/profile/${item.username}`);
                      }}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <img
                        src={item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.fullName}&backgroundColor=64748b&textColor=ffffff`}
                        alt={item.fullName}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{item.fullName}</p>
                        <p className="text-xs text-slate-400">@{item.username}</p>
                      </div>
                    </div>
                  ))
                )
              ) : (
                followingList.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Not following anyone yet</div>
                ) : (
                  followingList.map((item) => (
                    <div key={item._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div
                        onClick={() => {
                          setShowListModal(false);
                          navigate(item._id === user?._id ? "/profile" : `/profile/${item.username}`);
                        }}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        <img
                          src={item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.fullName}&backgroundColor=64748b&textColor=ffffff`}
                          alt={item.fullName}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{item.fullName}</p>
                          <p className="text-xs text-slate-400">@{item.username}</p>
                        </div>
                      </div>
                      {!isPublicMode && (
                        <button
                          onClick={() => handleUnfollowFromList(item._id)}
                          className="px-3 py-1 bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-950/60 dark:hover:text-red-400 rounded-xl text-xs font-bold transition-all"
                        >
                          Unfollow
                        </button>
                      )}
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Glassmorphism Avatar Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-5 right-5 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all shadow-lg hover:scale-105"
            title="Close image viewer"
          >
            <X size={20} />
          </button>
          <img
            src={avatarSrc}
            alt="Avatar Lightbox"
            className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}