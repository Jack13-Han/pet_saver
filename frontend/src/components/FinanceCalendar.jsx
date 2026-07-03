import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { calendar as calendarApi, transactions as txApi } from "../api.js";

const formatDateKey = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date, count) => new Date(date.getFullYear(), date.getMonth() + count, 1);
const formatMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const money = (amount = 0) => `\u00a5${Number(amount || 0).toLocaleString()}`;

export default function FinanceCalendar({ onChanged }) {
  const [calendarData, setCalendarData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [calendarMonthKey, setCalendarMonthKey] = useState(() => formatMonthKey(new Date()));
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [showQuickSave, setShowQuickSave] = useState(false);
  const [transactionType, setTransactionType] = useState("deposit");
  const [transactionDate, setTransactionDate] = useState(() => formatDateKey(new Date()));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("General");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState(null);

  const loadCalendar = async () => {
    const [calendarRes, transactionsRes] = await Promise.all([
      calendarApi.get(),
      txApi.list(),
    ]);
    setCalendarData((calendarRes.data || []).map((item) => ({
      day: item.day,
      income: Number(item.income || 0),
      expense: Number(item.expense || 0),
    })));
    setTransactions(transactionsRes.data || []);
  };

  useEffect(() => {
    loadCalendar().catch(() => showToast("Failed to load calendar", "error"));
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const calendarMonths = useMemo(() => {
    const now = new Date();
    const todayKey = formatDateKey(now);
    const currentMonth = startOfMonth(now);
    const nextMonth = addMonths(currentMonth, 1);
    const totalsByDay = new Map(
      calendarData.map((item) => [
        item.day,
        { income: Number(item.income || 0), expense: Number(item.expense || 0) },
      ]),
    );
    const datesWithEntries = calendarData
      .map((item) => new Date(`${item.day}T00:00:00`))
      .filter((date) => !Number.isNaN(date.getTime()));
    const earliestMonthFromData = datesWithEntries.length
      ? startOfMonth(new Date(Math.min(...datesWithEntries.map((date) => date.getTime()))))
      : currentMonth;
    const earliestMonth = earliestMonthFromData < currentMonth ? earliestMonthFromData : currentMonth;
    const latestMonthFromData = datesWithEntries.length
      ? startOfMonth(new Date(Math.max(...datesWithEntries.map((date) => date.getTime()))))
      : currentMonth;
    const lastMonth = latestMonthFromData > nextMonth ? latestMonthFromData : nextMonth;

    const months = [];
    for (let monthDate = earliestMonth; monthDate <= lastMonth; monthDate = addMonths(monthDate, 1)) {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const totalDays = new Date(year, month + 1, 0).getDate();
      const emptyCells = Array.from({ length: firstDay.getDay() }, (_, index) => ({
        key: `${formatDateKey(firstDay)}-empty-${index}`,
        isEmpty: true,
      }));
      const dayCells = Array.from({ length: totalDays }, (_, index) => {
        const dayNumber = index + 1;
        const key = formatDateKey(new Date(year, month, dayNumber));
        const totals = totalsByDay.get(key) || { income: 0, expense: 0 };
        return {
          key,
          dayNumber,
          income: totals.income,
          expense: totals.expense,
          isToday: key === todayKey,
        };
      });

      months.push({
        key: formatMonthKey(monthDate),
        label: monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        cells: [...emptyCells, ...dayCells],
      });
    }

    return months;
  }, [calendarData]);

  const selectedCalendarMonthIndex = Math.max(
    0,
    calendarMonths.findIndex((month) => month.key === calendarMonthKey),
  );
  const selectedCalendarMonth = calendarMonths[selectedCalendarMonthIndex] || calendarMonths[0];
  const canGoPreviousMonth = selectedCalendarMonthIndex > 0;
  const canGoNextMonth = selectedCalendarMonthIndex < calendarMonths.length - 1;

  const selectedCalendarDayDetails = useMemo(() => {
    if (!selectedCalendarDay) return null;
    const dayTransactions = transactions
      .filter((tx) => String(tx.transaction_date || "").slice(0, 10) === selectedCalendarDay.key)
      .sort((a, b) => new Date(b.created_at || b.transaction_date) - new Date(a.created_at || a.transaction_date));
    const income = dayTransactions
      .filter((tx) => tx.type === "deposit")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const expense = dayTransactions
      .filter((tx) => tx.type === "withdrawal")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    return {
      label: new Date(`${selectedCalendarDay.key}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      income,
      expense,
      net: income - expense,
      transactions: dayTransactions,
    };
  }, [selectedCalendarDay, transactions]);

  const handleCalendarMonthChange = (direction) => {
    if (!calendarMonths.length) return;
    const nextIndex = Math.min(
      calendarMonths.length - 1,
      Math.max(0, selectedCalendarMonthIndex + direction),
    );
    setCalendarMonthKey(calendarMonths[nextIndex].key);
  };

  const openCalendarDay = (cell) => {
    if (!cell || cell.isEmpty) return;
    setSelectedCalendarDay(cell);
  };

  const openCalendarTransaction = (type) => {
    if (!selectedCalendarDay) return;
    setTransactionDate(selectedCalendarDay.key);
    setTransactionType(type);
    setAmount("");
    setCategory("General");
    setNote("");
    setSelectedCalendarDay(null);
    setShowQuickSave(true);
  };

  const submitQuickSave = async (event) => {
    event.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;

    try {
      await txApi.create({
        target_id: null,
        amount: numAmount,
        type: transactionType,
        category,
        note: note ? `${category} - ${note}` : category,
        date: transactionDate,
      });
      setShowQuickSave(false);
      setAmount("");
      setNote("");
      await loadCalendar();
      if (onChanged) onChanged();
      showToast(transactionType === "deposit" ? "Income saved" : "Expense saved");
    } catch (err) {
      showToast(err.message || "Transaction failed", "error");
    }
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast ${toast.type}`}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="card finance-calendar-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="card-header">
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={20} color="#2563eb" />
            Calendar
          </h3>
        </div>
        <div className="finance-calendar-month">
          <div className="finance-calendar-toolbar">
            <button
              type="button"
              className="finance-calendar-nav"
              onClick={() => handleCalendarMonthChange(-1)}
              disabled={!canGoPreviousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <h4 className="finance-calendar-month-title">{selectedCalendarMonth?.label}</h4>
            <button
              type="button"
              className="finance-calendar-nav"
              onClick={() => handleCalendarMonthChange(1)}
              disabled={!canGoNextMonth}
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="finance-calendar-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="finance-calendar-grid">
            {(selectedCalendarMonth?.cells || []).map((cell) => (
              <div
                key={cell.key}
                className={`finance-calendar-day${cell.isEmpty ? " empty" : ""}${cell.isToday ? " today" : ""}${!cell.isEmpty ? " clickable" : ""}`}
                role={cell.isEmpty ? undefined : "button"}
                tabIndex={cell.isEmpty ? undefined : 0}
                onClick={() => openCalendarDay(cell)}
                onKeyDown={(event) => {
                  if (!cell.isEmpty && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    openCalendarDay(cell);
                  }
                }}
              >
                {!cell.isEmpty && (
                  <>
                    <div className="finance-calendar-date">{cell.dayNumber}</div>
                    <div className="finance-calendar-amount income">+{money(cell.income)}</div>
                    <div className="finance-calendar-amount expense">-{money(cell.expense)}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedCalendarDay && selectedCalendarDayDetails && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCalendarDay(null)}
          >
            <motion.div
              className="calendar-day-modal"
              initial={{ scale: 0.94, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="calendar-day-modal-header">
                <div>
                  <span>Calendar Day</span>
                  <h3>{selectedCalendarDayDetails.label}</h3>
                </div>
                <button
                  type="button"
                  className="calendar-day-close"
                  onClick={() => setSelectedCalendarDay(null)}
                  aria-label="Close day details"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="calendar-day-summary">
                <div>
                  <span>Income</span>
                  <strong className="income">+{money(selectedCalendarDayDetails.income)}</strong>
                </div>
                <div>
                  <span>Expense</span>
                  <strong className="expense">-{money(selectedCalendarDayDetails.expense)}</strong>
                </div>
                <div>
                  <span>Net</span>
                  <strong className={selectedCalendarDayDetails.net >= 0 ? "income" : "expense"}>
                    {selectedCalendarDayDetails.net >= 0 ? "+" : "-"}{money(Math.abs(selectedCalendarDayDetails.net))}
                  </strong>
                </div>
              </div>

              <div className="calendar-day-actions">
                <button type="button" className="btn btn-primary" onClick={() => openCalendarTransaction("deposit")}>
                  <Plus size={16} />
                  Add Income
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => openCalendarTransaction("withdrawal")}>
                  <Plus size={16} />
                  Add Expense
                </button>
              </div>

              <div className="calendar-day-transactions">
                <h4>Transactions</h4>
                {selectedCalendarDayDetails.transactions.length === 0 ? (
                  <p className="calendar-day-empty">No transactions recorded for this day.</p>
                ) : (
                  selectedCalendarDayDetails.transactions.map((tx) => (
                    <div className="calendar-day-transaction" key={tx.id}>
                      <div>
                        <strong>{tx.category || "General"}</strong>
                        <span>{tx.note || tx.target_name || "No note"}</span>
                      </div>
                      <strong className={tx.type === "deposit" ? "income" : "expense"}>
                        {tx.type === "deposit" ? "+" : "-"}{money(tx.amount)}
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuickSave && (
          <motion.div
            className="quick-save-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuickSave(false)}
          >
            <motion.div
              className={`quick-save-sheet ${transactionType === "withdrawal" ? "expense-mode" : "income-mode"}`}
              initial={{ scale: 0.94, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="quick-save-topbar">
                <button type="button" className="quick-save-icon-btn" onClick={() => setShowQuickSave(false)} aria-label="Close">
                  <ChevronLeft size={20} />
                </button>
                <div className="quick-save-heading">
                  <span className="quick-save-eyebrow">{transactionType === "withdrawal" ? "Expense" : "Income"}</span>
                  <h3>{transactionType === "withdrawal" ? "Quick Expense" : "Quick Save"}</h3>
                </div>
                <button type="button" className="quick-save-icon-btn" onClick={() => setShowQuickSave(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="quick-save-segmented" role="tablist" aria-label="Transaction type">
                <button
                  type="button"
                  className={`quick-save-segment${transactionType === "deposit" ? " active" : ""}`}
                  onClick={() => setTransactionType("deposit")}
                >
                  Income
                </button>
                <button
                  type="button"
                  className={`quick-save-segment${transactionType === "withdrawal" ? " active" : ""}`}
                  onClick={() => setTransactionType("withdrawal")}
                >
                  Expense
                </button>
                <button type="button" className="quick-save-segment disabled" disabled>
                  Transfer
                </button>
              </div>

              <div className="quick-save-meta-row">
                <div>
                  <div className="quick-save-meta-label">Date</div>
                  <div className="quick-save-meta-value">
                    {new Date(`${transactionDate}T00:00:00`).toLocaleDateString("en-US")}
                  </div>
                </div>
              </div>

              <form className="quick-save-form" onSubmit={submitQuickSave}>
                <div className="quick-save-amount-block">
                  <label>Amount ({money(0).slice(0, 1)})</label>
                  <div className="quick-save-amount-field">
                    <span>{money(0).slice(0, 1)}</span>
                    <input
                      type="number"
                      min="1"
                      max="9999999999999.99"
                      step="0.01"
                      inputMode="numeric"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                </div>

                <select className="form-input" value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="General">General</option>
                  <option value="Food">Food</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Transport">Transport</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Other">Other</option>
                </select>

                <input
                  className="form-input"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Note"
                />

                <div className="quick-save-actions">
                  <button type="submit" className="quick-save-primary" disabled={!amount}>
                    {transactionType === "withdrawal" ? "Use" : "Save"}
                  </button>
                  <button type="button" className="quick-save-secondary" onClick={() => setShowQuickSave(false)}>
                    Continue
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
