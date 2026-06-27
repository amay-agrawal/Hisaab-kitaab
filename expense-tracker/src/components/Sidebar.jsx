import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Trophy,
  User,
  Settings,
  LogOut,
} from "lucide-react";

import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Receipt, label: "Transactions", path: "/transactions" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Sidebar() {

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {

    try {

      await axios.post(
        "http://localhost:8000/api/v1/users/logout",
        {},
        {
          withCredentials: true,
        }
      );

      alert("Logged Out Successfully");

      navigate("/");

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Logout Failed"
      );

    }

  };

  return (
    <div className="w-72 bg-white shadow-xl h-screen p-6 flex flex-col">

      <h1 className="text-3xl font-bold text-blue-600">
        Hisaab-Kitab
      </h1>

      <div className="mt-10 space-y-2 flex-1">

        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all text-sm font-medium ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "hover:bg-blue-50 text-slate-700"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}

      </div>

      <div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 text-red-500 cursor-pointer hover:bg-red-50 rounded-xl transition"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>

      </div>

    </div>
  );
}