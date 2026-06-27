import { useState, useRef, useCallback } from "react";
import {
  X, Upload, Download, FileText, CheckCircle, AlertCircle,
  ChevronRight, Loader2, Trash2, Eye, EyeOff, RefreshCw,
} from "lucide-react";
import axios from "axios";

/* ─── CSV Parser (no external deps) ─────────────────────── */
function parseCSVText(text) {
  const rows = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;
    const row = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

/* ─── Auto-detect column index ──────────────────────────── */
const COLUMN_HINTS = {
  title:    ["title", "name", "description", "narration", "particulars", "remarks", "details", "merchant"],
  amount:   ["amount", "debit", "credit", "withdrawal amt", "deposit amt", "txn amount", "transaction amount", "inr"],
  type:     ["type", "transaction type", "txn type", "dr/cr"],
  category: ["category", "tag", "labels", "group"],
  date:     ["date", "txn date", "transaction date", "value date", "posting date"],
  note:     ["note", "notes", "memo", "comments"],
};

function detectColumn(headers, field) {
  const hints = COLUMN_HINTS[field];
  for (const hint of hints) {
    const idx = headers.findIndex((h) => h.toLowerCase().includes(hint));
    if (idx !== -1) return idx;
  }
  return -1;
}

/* ─── Template CSV ───────────────────────────────────────── */
function downloadTemplate() {
  const today = new Date().toISOString().split("T")[0];
  const csv = [
    "title,amount,type,category,date,note",
    `Swiggy Order,350,expense,Food,${today},Lunch`,
    `Monthly Salary,50000,income,Income,${today},June salary`,
    `Netflix Subscription,499,expense,Entertainment,${today},Monthly`,
    `Uber Ride,220,expense,Travel,${today},Office commute`,
    `Freelance Payment,8000,income,Income,${today},Website project`,
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hisaab_kitab_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Constants ──────────────────────────────────────────── */
const CATEGORIES = ["Food", "Travel", "Shopping", "Education", "Entertainment", "Health", "Utilities", "Income", "Other"];
const STEPS = ["upload", "map", "preview", "importing", "done"];

/* ─── Main Component ─────────────────────────────────────── */
export default function CSVImportModal({ isOpen, onClose, onImport }) {
  const [step, setStep] = useState("upload");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);  // array of arrays (data rows only)
  const [colMap, setColMap] = useState({ title: -1, amount: -1, type: -1, category: -1, date: -1, note: -1 });
  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const [importErrors, setImportErrors] = useState([]);
  const [parseError, setParseError] = useState("");

  const fileInputRef = useRef();

  if (!isOpen) return null;

  /* ── Helpers ─────────────────────────────────────────── */
  const reset = () => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRawRows([]);
    setColMap({ title: -1, amount: -1, type: -1, category: -1, date: -1, note: -1 });
    setTransactions([]);
    setSelected(new Set());
    setProgress({ done: 0, total: 0, errors: 0 });
    setImportErrors([]);
    setParseError("");
  };

  const handleClose = () => { reset(); onClose(); };

  /* ── File processing ─────────────────────────────────── */
  const processFile = (file) => {
    if (!file || !file.name.endsWith(".csv")) {
      setParseError("Please upload a valid .csv file.");
      return;
    }
    setFileName(file.name);
    setParseError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSVText(e.target.result);
        if (rows.length < 2) { setParseError("CSV must have at least a header row and one data row."); return; }

        const hdrs = rows[0].map((h) => h.replace(/"/g, "").trim());
        const dataRows = rows.slice(1).filter((r) => r.some((c) => c));

        setHeaders(hdrs);
        setRawRows(dataRows);

        // Auto-detect columns
        const detected = {};
        for (const field of Object.keys(colMap)) {
          detected[field] = detectColumn(hdrs, field);
        }
        setColMap(detected);
        setStep("map");
      } catch {
        setParseError("Failed to parse CSV. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }, []);

  /* ── Build preview ───────────────────────────────────── */
  const buildPreview = () => {
    const today = new Date().toISOString().split("T")[0];
    const txns = rawRows.map((row, i) => {
      const get = (field) => (colMap[field] >= 0 ? (row[colMap[field]] || "").trim() : "");

      const rawType = get("type").toLowerCase();
      const type = rawType.includes("cr") || rawType === "income" || rawType === "credit"
        ? "income"
        : "expense";

      const rawAmt = get("amount").replace(/[^0-9.]/g, "");
      const amount = parseFloat(rawAmt) || 0;

      const rawDate = get("date");
      let date = today;
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed)) date = parsed.toISOString().split("T")[0];
      }

      const category = get("category") || (type === "income" ? "Income" : "Other");

      return {
        _id: `csv-${i}`,
        title: get("title") || `Transaction ${i + 1}`,
        amount,
        type,
        category: CATEGORIES.includes(category) ? category : "Other",
        date,
        note: get("note"),
        _valid: amount > 0,
      };
    }).filter((t) => t._valid);

    setTransactions(txns);
    setSelected(new Set(txns.map((_, i) => i)));
    setStep("preview");
  };

  /* ── Import ──────────────────────────────────────────── */
  const handleImport = async () => {
    const toImport = transactions.filter((_, i) => selected.has(i));
    setProgress({ done: 0, total: toImport.length, errors: 0 });
    setImportErrors([]);
    setStep("importing");

    let done = 0;
    let errors = 0;
    const errList = [];
    const imported = [];

    for (const tx of toImport) {
      try {
        const { _id, _valid, ...data } = tx;
        const res = await axios.post(
          "http://localhost:8000/api/v1/transactions",
          data,
          { withCredentials: true }
        );
        imported.push(res.data.transaction || data);
      } catch (err) {
        errors++;
        errList.push(`"${tx.title}": ${err.response?.data?.message || "Failed"}`);
      }
      done++;
      setProgress({ done, total: toImport.length, errors });
    }

    setImportErrors(errList);
    if (onImport) onImport(imported);
    setStep("done");
  };

  /* ── Toggle selection ────────────────────────────────── */
  const toggleRow = (i) => setSelected((prev) => {
    const s = new Set(prev);
    s.has(i) ? s.delete(i) : s.add(i);
    return s;
  });

  const toggleAll = () => setSelected((prev) =>
    prev.size === transactions.length ? new Set() : new Set(transactions.map((_, i) => i))
  );

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Import from CSV</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === "upload" && "Upload your bank statement or expense CSV"}
              {step === "map" && `${rawRows.length} rows found — map your columns`}
              {step === "preview" && `${transactions.length} transactions ready — select to import`}
              {step === "importing" && `Importing ${progress.done} of ${progress.total}...`}
              {step === "done" && `Done! ${progress.done - progress.errors} imported, ${progress.errors} failed`}
            </p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
          <div className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${(STEPS.indexOf(step) / (STEPS.length - 1)) * 100}%` }} />
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── STEP: UPLOAD ── */}
          {step === "upload" && (
            <div className="space-y-5">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${dragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
              >
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
                  <Upload size={24} className="text-blue-500" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">Drop your CSV here</p>
                <p className="text-sm text-slate-400 mt-1">or click to browse</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-3">.csv files only</p>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                  onChange={(e) => processFile(e.target.files[0])} />
              </div>

              {parseError && (
                <div className="flex items-center gap-2.5 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/40">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{parseError}</p>
                </div>
              )}

              {/* Template download */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">Don't have a CSV?</p>
                    <p className="text-xs text-slate-400 mt-1">Download our template and fill in your transactions</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {["title", "amount", "type", "category", "date", "note"].map((col) => (
                        <span key={col} className="text-[11px] font-mono bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={downloadTemplate}
                    className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-300 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex-shrink-0">
                    <Download size={15} />
                    Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: MAP COLUMNS ── */}
          {step === "map" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40">
                <FileText size={16} className="text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{fileName} — {rawRows.length} rows</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(colMap).map(([field, idx]) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                      {field} {field !== "note" && field !== "category" && <span className="text-red-400">*</span>}
                    </label>
                    <select
                      value={idx}
                      onChange={(e) => setColMap((p) => ({ ...p, [field]: parseInt(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value={-1}>— Skip —</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview of first raw row */}
              {rawRows.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 overflow-x-auto">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">First row preview</p>
                  <div className="flex gap-3 flex-wrap">
                    {headers.map((h, i) => (
                      <div key={i} className="text-xs">
                        <span className="text-slate-400">{h}:</span>{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-200">{rawRows[0][i] || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: PREVIEW ── */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-white">{selected.size}</span> of {transactions.length} selected
                </p>
                <button onClick={toggleAll} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  {selected.size === transactions.length ? "Deselect all" : "Select all"}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="p-3 text-left">
                          <input type="checkbox" checked={selected.size === transactions.length}
                            onChange={toggleAll} className="rounded cursor-pointer" />
                        </th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Title</th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Amount</th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Type</th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Category</th>
                        <th className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {transactions.map((tx, i) => (
                        <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!selected.has(i) ? "opacity-40" : ""}`}>
                          <td className="p-3">
                            <input type="checkbox" checked={selected.has(i)} onChange={() => toggleRow(i)} className="rounded cursor-pointer" />
                          </td>
                          <td className="p-3 font-medium text-slate-800 dark:text-white max-w-[140px] truncate">{tx.title}</td>
                          <td className="p-3 font-semibold">
                            <span className={tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}>
                              ₹{tx.amount.toLocaleString("en-IN")}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${tx.type === "income" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/30 text-red-500"}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{tx.category}</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 text-xs">{tx.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: IMPORTING ── */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-6">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-800 dark:text-white">Importing transactions...</p>
                <p className="text-sm text-slate-400 mt-1">{progress.done} of {progress.total} done</p>
              </div>
              <div className="w-full max-w-sm">
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>{progress.done} imported</span>
                  <span>{progress.errors} failed</span>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${progress.errors === 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-yellow-50 dark:bg-yellow-900/20"}`}>
                <CheckCircle size={28} className={progress.errors === 0 ? "text-emerald-500" : "text-yellow-500"} />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 dark:text-white text-lg">Import Complete</p>
                <p className="text-sm text-slate-400 mt-1">
                  <span className="text-emerald-600 font-semibold">{progress.done - progress.errors} transactions imported</span>
                  {progress.errors > 0 && <span className="text-red-500 ml-2 font-semibold">{progress.errors} failed</span>}
                </p>
              </div>

              {importErrors.length > 0 && (
                <div className="w-full bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800/40 max-h-32 overflow-y-auto">
                  {importErrors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400 mb-1">{e}</p>
                  ))}
                </div>
              )}

              <button onClick={reset} className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                <RefreshCw size={14} />
                Import another file
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 flex-shrink-0">
          <button onClick={step === "upload" ? handleClose : () => setStep(STEPS[STEPS.indexOf(step) - 1])}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors">
            {step === "upload" || step === "done" ? "Close" : "Back"}
          </button>

          <div className="flex items-center gap-3">
            {step === "map" && (
              <button onClick={buildPreview}
                disabled={colMap.title < 0 || colMap.amount < 0}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                Preview <ChevronRight size={15} />
              </button>
            )}
            {step === "preview" && (
              <button onClick={handleImport} disabled={selected.size === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-emerald-200 dark:shadow-none">
                Import {selected.size} transactions
              </button>
            )}
            {step === "done" && (
              <button onClick={handleClose}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
