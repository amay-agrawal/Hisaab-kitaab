import { useState, useEffect } from "react";
import { X, Plus, Edit3, RefreshCw } from "lucide-react";

const CATEGORIES = [
  "Food", "Travel", "Shopping", "Education",
  "Entertainment", "Health", "Utilities", "Other",
];

const FREQUENCIES = ["Monthly", "Weekly", "Yearly"];

/**
 * AddExpenseModal
 * - Add mode:  pass isOpen + onAdd
 * - Edit mode: pass isOpen + initialData + onEdit (+ onAdd ignored)
 */
export default function AddExpenseModal({ isOpen, onClose, onAdd, initialData = null, onEdit = null }) {
  const isEditing = Boolean(initialData);

  const [type, setType] = useState("expense");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("Monthly");

  /* Pre-fill form when editing */
  useEffect(() => {
    if (initialData) {
      setType(initialData.type || "expense");
      setIsRecurring(initialData.isRecurring || false);
      setFrequency(initialData.frequency || "Monthly");
    } else {
      setType("expense");
      setIsRecurring(false);
      setFrequency("Monthly");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      title: fd.get("title"),
      amount: Number(fd.get("amount")),
      category: fd.get("category"),
      type,
      date: fd.get("date"),
      note: fd.get("note"),
      isRecurring,
      frequency: isRecurring ? frequency : null,
    };

    if (isEditing && onEdit) {
      onEdit(initialData._id, payload);
    } else {
      onAdd(payload);
    }
    onClose();
  };

  const inputClass =
    "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              {isEditing ? <Edit3 size={17} className="text-blue-600 dark:text-blue-400" /> : <Plus size={18} className="text-blue-600 dark:text-blue-400" />}
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              {isEditing ? "Edit Transaction" : "Add Transaction"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {["expense", "income"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`text-center py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  type === t
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                {t === "expense" ? "💸 Expense" : "💰 Income"}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
            <input
              name="title" type="text" placeholder="e.g. Swiggy Order"
              defaultValue={initialData?.title || ""} required className={inputClass}
            />
          </div>

          {/* Amount + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount (₹)</label>
              <input
                name="amount" type="number" min="1" placeholder="0"
                defaultValue={initialData?.amount || ""} required className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
              <select name="category" defaultValue={initialData?.category || "Food"} className={inputClass + " cursor-pointer"}>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
            <input
              name="date" type="date" required
              defaultValue={initialData?.date ? initialData.date.split("T")[0] : new Date().toISOString().split("T")[0]}
              className={inputClass}
            />
          </div>

          {/* Recurring */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                <div className={`w-10 h-5 rounded-full transition-colors ${isRecurring ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isRecurring ? "translate-x-5" : ""}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <RefreshCw size={13} className="text-blue-500" />
                  Recurring Transaction
                </p>
                <p className="text-xs text-slate-400">Repeats automatically</p>
              </div>
            </label>
            {isRecurring && (
              <div className="flex gap-2 pt-1">
                {FREQUENCIES.map((f) => (
                  <button key={f} type="button" onClick={() => setFrequency(f)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                      frequency === f
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-300"
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Note <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              name="note" type="text" placeholder="Any additional details..."
              defaultValue={initialData?.note || ""} className={inputClass}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm shadow-blue-200 dark:shadow-none">
              {isEditing ? "Save Changes" : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}