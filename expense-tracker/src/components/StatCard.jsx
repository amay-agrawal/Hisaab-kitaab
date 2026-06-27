export default function StatCard({
  title,
  value,
  icon,
  color = "blue",
  change,
  positive,
  loading = false,
}) {
  const colorMap = {
    green: {
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    red: {
      iconBg: "bg-red-50 dark:bg-red-900/20",
      iconColor: "text-red-500 dark:text-red-400",
    },
    blue: {
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    purple: {
      iconBg: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    yellow: {
      iconBg: "bg-yellow-50 dark:bg-yellow-900/20",
      iconColor: "text-yellow-500 dark:text-yellow-400",
    },
  };

  const c = colorMap[color] || colorMap.blue;

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-24" />
            <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded-lg w-32" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
          </div>
          <div className="w-11 h-11 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="text-2xl font-bold mt-2 text-slate-800 dark:text-white truncate">
            {value}
          </p>
          {change && (
            <p
              className={`text-xs font-medium mt-2 ${
                positive === true
                  ? "text-emerald-600 dark:text-emerald-400"
                  : positive === false
                  ? "text-red-500 dark:text-red-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {positive === true ? "↑ " : positive === false ? "↓ " : ""}
              {change}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={`w-11 h-11 ${c.iconBg} ${c.iconColor} rounded-xl flex items-center justify-center flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}