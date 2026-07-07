import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Trash2, Coins } from "lucide-react";
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
  const [calendarSchedule, setCalendarSchedule] = useState({
    goalDeadlines: [],
    recurring: [],
    budgets: [],
    notes: [],
    dailyExpenseLimit: 0
  });

  const [calendarMonthDate, setCalendarMonthDate] = useState(() => startOfMonth(new Date()));
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  
  // Quick Save Form
  const [showQuickSave, setShowQuickSave] = useState(false);
  const [transactionType, setTransactionType] = useState("deposit");
  const [transactionDate, setTransactionDate] = useState(() => formatDateKey(new Date()));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("General");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState(null);

  // Notes Form
  const [calendarNoteForm, setCalendarNoteForm] = useState({ title: "", note: "" });
  const [savingCalendarNote, setSavingCalendarNote] = useState(false);

  // Expense Limit Form
  const [dailyLimitInput, setDailyLimitInput] = useState("");
  const [savingDailyLimit, setSavingDailyLimit] = useState(false);

  const loadCalendar = async () => {
    const [calendarRes, transactionsRes] = await Promise.all([
      calendarApi.get(),
      txApi.list(),
    ]);
    const data = calendarRes.data || {};
    
    setCalendarData((data.days || []).map((item) => ({
      day: item.day,
      income: Number(item.income || 0),
      expense: Number(item.expense || 0),
    })));

    setCalendarSchedule({
      goalDeadlines: data.goal_deadlines || [],
      recurring: data.recurring || [],
      budgets: data.budgets || [],
      notes: data.notes || [],
      dailyExpenseLimit: Number(data.daily_expense_limit || 0)
    });

    setDailyLimitInput(data.daily_expense_limit > 0 ? String(data.daily_expense_limit) : "");
    setTransactions(transactionsRes.data || []);
  };

  useEffect(() => {
    loadCalendar().catch((err) => {
      console.error("Calendar Load Error:", err);
      showToast(`Failed to load calendar: ${err.message || err}`, "error");
    });
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Build 12-month recurring entries preview
  const recurringPreview = useMemo(() => {
    const preview = [];
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const startYear = currentMonth.getFullYear();
    const startMonthVal = currentMonth.getMonth();
    
    (calendarSchedule.recurring || []).forEach((entry) => {
      let nextRun = new Date(`${entry.next_run_date}T00:00:00`);
      if (Number.isNaN(nextRun.getTime())) return;
      
      for (let offset = 0; offset < 12; offset++) {
        const monthDate = new Date(startYear, startMonthVal + offset, 1);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        
        if (entry.frequency === "weekly") {
          let dateRunner = new Date(nextRun);
          while (dateRunner.getMonth() === month && dateRunner.getFullYear() === year) {
            preview.push({
              id: entry.id,
              date: formatDateKey(dateRunner),
              name: entry.name,
              amount: Number(entry.amount),
              type: entry.type,
              category: entry.category || "General",
              eventType: entry.type === "deposit" ? "recurring-saving" : "payment",
              frequency: entry.frequency
            });
            dateRunner.setDate(dateRunner.getDate() + 7);
          }
        } else {
          // monthly
          if (nextRun.getMonth() === month && nextRun.getFullYear() === year) {
            preview.push({
              id: entry.id,
              date: formatDateKey(nextRun),
              name: entry.name,
              amount: Number(entry.amount),
              type: entry.type,
              category: entry.category || "General",
              eventType: entry.type === "deposit" ? "recurring-saving" : "payment",
              frequency: entry.frequency
            });
          }
        }
      }
    });
    return preview;
  }, [calendarSchedule.recurring]);

  const totalMonthlyBudget = useMemo(() => {
    return (calendarSchedule.budgets || []).reduce((sum, budget) => sum + Number(budget.monthly_limit || 0), 0);
  }, [calendarSchedule.budgets]);

  const customDailyExpenseLimit = Number(calendarSchedule.dailyExpenseLimit || 0);

  const selectedCalendarMonth = useMemo(() => {
    const monthDate = startOfMonth(calendarMonthDate);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthKey = formatMonthKey(monthDate);
    const now = new Date();
    const todayKey = formatDateKey(now);
    const firstDay = new Date(year, month, 1, 12, 0, 0);
    const totalDays = new Date(year, month + 1, 0, 12, 0, 0).getDate();

    const activityDays = calendarData
      .map((item) => String(item.day || "").slice(0, 10))
      .filter(Boolean)
      .sort();
    const noSpendTrackingStart = activityDays[0] || todayKey;

    const totalsByDay = new Map(
      calendarData.map((item) => [
        item.day,
        { income: Number(item.income || 0), expense: Number(item.expense || 0) },
      ]),
    );

    const deadlinesByDay = new Map();
    (calendarSchedule.goalDeadlines || []).forEach((goal) => {
      const day = String(goal.deadline || "").slice(0, 10);
      if (!day) return;
      deadlinesByDay.set(day, [...(deadlinesByDay.get(day) || []), goal]);
    });

    const recurringByDay = new Map();
    recurringPreview.forEach((entry) => {
      recurringByDay.set(entry.date, [...(recurringByDay.get(entry.date) || []), entry]);
    });

    const notesByDay = new Map();
    (calendarSchedule.notes || []).forEach((note) => {
      const day = String(note.event_date || "").slice(0, 10);
      if (!day) return;
      notesByDay.set(day, [...(notesByDay.get(day) || []), note]);
    });

    const dailyBudgetLimit = customDailyExpenseLimit > 0
      ? customDailyExpenseLimit
      : (totalMonthlyBudget > 0 ? totalMonthlyBudget / totalDays : 0);

    const monthExpenseMaximum = Math.max(
      0,
      ...Array.from({ length: totalDays }, (_, index) => {
        const key = formatDateKey(new Date(year, month, index + 1, 12, 0, 0));
        return Number(totalsByDay.get(key)?.expense || 0);
      }),
    );

    const emptyCells = Array.from({ length: firstDay.getDay() }, (_, index) => ({
      key: `${formatDateKey(firstDay)}-empty-${index}`,
      isEmpty: true,
    }));

    const dayCells = Array.from({ length: totalDays }, (_, index) => {
      const dayNumber = index + 1;
      const key = formatDateKey(new Date(year, month, dayNumber, 12, 0, 0));
      const totals = totalsByDay.get(key) || { income: 0, expense: 0 };
      const scheduled = recurringByDay.get(key) || [];
      const budgetRatio = dailyBudgetLimit > 0
        ? totals.expense / dailyBudgetLimit
        : (monthExpenseMaximum > 0 ? totals.expense / monthExpenseMaximum : 0);

      const heatLevel = totals.expense <= 0 ? 0
        : budgetRatio <= (dailyBudgetLimit > 0 ? 0.5 : 0.25) ? 1
          : budgetRatio <= (dailyBudgetLimit > 0 ? 1 : 0.5) ? 2
            : budgetRatio <= (dailyBudgetLimit > 0 ? 1.5 : 0.75) ? 3 : 4;

      return {
        key,
        dayNumber,
        income: totals.income,
        expense: totals.expense,
        goalDeadlines: deadlinesByDay.get(key) || [],
        paymentReminders: scheduled.filter((entry) => entry.eventType === "payment"),
        recurringSavings: scheduled.filter((entry) => entry.eventType === "recurring-saving"),
        notes: notesByDay.get(key) || [],
        dailyBudgetLimit,
        budgetRemaining: Math.max(0, dailyBudgetLimit - totals.expense),
        budgetOver: Math.max(0, totals.expense - dailyBudgetLimit),
        heatLevel,
        isNoSpendDay: key >= noSpendTrackingStart && key < todayKey && totals.expense <= 0,
        isToday: key === todayKey,
      };
    });

    return {
      key: monthKey,
      label: monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      dailyBudgetLimit,
      cells: [...emptyCells, ...dayCells],
    };
  }, [calendarMonthDate, calendarData, calendarSchedule, recurringPreview, customDailyExpenseLimit, totalMonthlyBudget]);

  const selectedMonthSummary = useMemo(() => {
    const cells = (selectedCalendarMonth?.cells || []).filter((cell) => !cell.isEmpty);
    const income = cells.reduce((sum, cell) => sum + Number(cell.income || 0), 0);
    const expense = cells.reduce((sum, cell) => sum + Number(cell.expense || 0), 0);
    const budget = Number(selectedCalendarMonth?.dailyBudgetLimit || 0) * cells.length;

    return {
      income,
      expense,
      net: income - expense,
      budget,
      budgetUsed: budget > 0 ? Math.round((expense / budget) * 100) : null,
      noSpendDays: cells.filter((cell) => cell.isNoSpendDay).length,
      notes: cells.reduce((sum, cell) => sum + (cell.notes?.length || 0), 0),
    };
  }, [selectedCalendarMonth]);

  const handleCalendarMonthChange = (direction) => {
    setSelectedCalendarDay(null);
    setCalendarMonthDate((currentDate) => addMonths(currentDate, direction));
  };

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
      goalDeadlines: selectedCalendarDay.goalDeadlines || [],
      paymentReminders: selectedCalendarDay.paymentReminders || [],
      recurringSavings: selectedCalendarDay.recurringSavings || [],
      notes: (calendarSchedule.notes || []).filter((note) => String(note.event_date || "").slice(0, 10) === selectedCalendarDay.key),
      dailyBudgetLimit: selectedCalendarDay.dailyBudgetLimit || 0,
      budgetRemaining: selectedCalendarDay.budgetRemaining || 0,
      budgetOver: selectedCalendarDay.budgetOver || 0,
      heatLevel: selectedCalendarDay.heatLevel || 0,
      isNoSpendDay: Boolean(selectedCalendarDay.isNoSpendDay),
    };
  }, [transactions, calendarSchedule.notes, selectedCalendarDay]);

  const openCalendarDay = (cell) => {
    if (!cell || cell.isEmpty) return;
    setCalendarNoteForm({ title: "", note: "" });
    setSelectedCalendarDay(cell);
  };

  const saveCalendarNote = async (event) => {
    event.preventDefault();
    const title = calendarNoteForm.title.trim();
    if (!selectedCalendarDay || !title || savingCalendarNote) return;

    setSavingCalendarNote(true);
    try {
      const response = await calendarApi.saveNote({
        event_date: selectedCalendarDay.key,
        title,
        note: calendarNoteForm.note.trim(),
      });
      if (response.data) {
        setCalendarSchedule((previous) => ({
          ...previous,
          notes: [...previous.notes, response.data],
        }));
      }
      setCalendarNoteForm({ title: "", note: "" });
      showToast("Calendar note saved");
    } catch (error) {
      showToast(error.message || "Failed to save calendar note", "error");
    } finally {
      setSavingCalendarNote(false);
    }
  };

  const deleteCalendarNote = async (noteId) => {
    try {
      await calendarApi.deleteNote(noteId);
      setCalendarSchedule((previous) => ({
        ...previous,
        notes: previous.notes.filter((note) => Number(note.id) !== Number(noteId)),
      }));
      showToast("Calendar note deleted");
    } catch (error) {
      showToast(error.message || "Failed to delete calendar note", "error");
    }
  };

  const saveDailyExpenseLimit = async (event, resetToAutomatic = false) => {
    event?.preventDefault();
    const nextLimit = resetToAutomatic ? 0 : Number(dailyLimitInput);
    if (!Number.isFinite(nextLimit) || nextLimit < 0 || savingDailyLimit) return;

    setSavingDailyLimit(true);
    try {
      const response = await calendarApi.saveSettings({ daily_expense_limit: nextLimit });
      const savedLimit = Number(response.data?.daily_expense_limit || 0);
      setCalendarSchedule((previous) => ({ ...previous, dailyExpenseLimit: savedLimit }));
      setDailyLimitInput(savedLimit > 0 ? String(savedLimit) : "");
      showToast(savedLimit > 0 ? "Daily expense limit saved" : "Automatic daily limit restored");
    } catch (error) {
      showToast(error.message || "Failed to save daily expense limit", "error");
    } finally {
      setSavingDailyLimit(false);
    }
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
        transition={{ delay: 0.2 }}
      >
        <div className="card-header">
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={20} color="#2563eb" />
            Calendar
          </h3>
        </div>

        <div className="finance-calendar-legend" aria-label="Calendar event legend">
          <span><i className="deadline" /> Goal deadline</span>
          <span><i className="payment" /> Payment reminder</span>
          <span><i className="recurring" /> Recurring saving</span>
          <span><i className="note" /> Event note</span>
          <span><i className="no-spend" /> No-spend day</span>
          <span className="heatmap-legend"><em>Spending heatmap</em> Low spending <b /><b /><b /><b /> High spending</span>
        </div>

        <div className="finance-calendar-budget-bar">
          <div className="calendar-limit-copy">
            {selectedCalendarMonth?.dailyBudgetLimit > 0 ? (
              <>
                <span>Daily budget limit</span>
                <strong>{money(selectedCalendarMonth.dailyBudgetLimit)}</strong>
                <small>{customDailyExpenseLimit > 0 ? "Your custom limit" : "Calculated from your Planner monthly budgets"}</small>
              </>
            ) : (
              <><span>Daily budget limit</span><small>Enter the amount you want to spend per day</small></>
            )}
          </div>
          <form className="calendar-limit-form" onSubmit={saveDailyExpenseLimit}>
            <label>
              <span>¥</span>
              <input
                type="number"
                min="1"
                step="1"
                value={dailyLimitInput}
                onChange={(event) => setDailyLimitInput(event.target.value)}
                placeholder="1500"
                aria-label="Custom daily expense limit"
                required
              />
            </label>
            <button type="submit" disabled={savingDailyLimit}>{savingDailyLimit ? "Saving..." : "Set Limit"}</button>
            {customDailyExpenseLimit > 0 && (
              <button type="button" className="automatic" onClick={(event) => saveDailyExpenseLimit(event, true)} disabled={savingDailyLimit}>
                Use Auto
              </button>
            )}
          </form>
        </div>

        <div className="calendar-month-summary">
          <div className="calendar-month-summary-header">
            <div>
              <span>Monthly Summary</span>
              <strong>{selectedCalendarMonth?.label}</strong>
            </div>
            <small>Updates automatically from calendar activity</small>
          </div>
          <div className="calendar-month-summary-grid">
            <div><span>Income</span><strong className="income">+{money(selectedMonthSummary.income)}</strong></div>
            <div><span>Expense</span><strong className="expense">-{money(selectedMonthSummary.expense)}</strong></div>
            <div><span>Net</span><strong className={selectedMonthSummary.net >= 0 ? "income" : "expense"}>{selectedMonthSummary.net >= 0 ? "+" : "-"}{money(Math.abs(selectedMonthSummary.net))}</strong></div>
            <div><span>Budget used</span><strong>{selectedMonthSummary.budgetUsed === null ? "Not set" : `${selectedMonthSummary.budgetUsed}%`}</strong></div>
            <div><span>No-spend days</span><strong>{selectedMonthSummary.noSpendDays}</strong></div>
            <div><span>Event notes</span><strong>{selectedMonthSummary.notes}</strong></div>
          </div>
        </div>

        <div className="finance-calendar-month">
          <div className="finance-calendar-toolbar">
            <button
              type="button"
              className="finance-calendar-nav"
              onClick={() => handleCalendarMonthChange(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <h4 className="finance-calendar-month-title">
              {selectedCalendarMonth?.label}
            </h4>
            <button
              type="button"
              className="finance-calendar-nav"
              onClick={() => handleCalendarMonthChange(1)}
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
                className={`finance-calendar-day${cell.isEmpty ? " empty" : ` heat-${cell.heatLevel}`}${cell.isToday ? " today" : ""}${cell.isNoSpendDay ? " no-spend" : ""}${!cell.isEmpty ? " clickable" : ""}`}
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
                    {cell.income > 0 && (
                      <div className="finance-calendar-amount income">+{money(cell.income)}</div>
                    )}
                    {cell.expense > 0 && (
                      <div className="finance-calendar-amount expense">-{money(cell.expense)}</div>
                    )}
                    {cell.dailyBudgetLimit > 0 && cell.key <= formatDateKey(new Date()) && (
                      <div className={`finance-calendar-budget-status${cell.budgetOver > 0 ? " over" : ""}`}>
                        {cell.budgetOver > 0
                          ? `\u26a0 ${money(cell.budgetOver)} over`
                          : `\u2713 ${money(cell.budgetRemaining)} left`}
                      </div>
                    )}
                    <div className="finance-calendar-events">
                      {cell.notes.length > 0 && (
                        <span className="calendar-event-chip note" title={cell.notes.map((n) => n.title).join(", ")}>
                          📝 {cell.notes.length} {cell.notes.length === 1 ? "note" : "notes"}
                        </span>
                      )}
                      {cell.isNoSpendDay && (
                        <span className="calendar-event-chip no-spend">🌿 No-spend</span>
                      )}
                      {cell.goalDeadlines.slice(0, 1).map((goal) => (
                        <span className="calendar-event-chip deadline" key={`goal-${goal.id}`} title={`${goal.name} deadline`}>
                          🎯 {goal.name}
                        </span>
                      ))}
                      {cell.paymentReminders.slice(0, 1).map((entry) => (
                        <span className="calendar-event-chip payment" key={`payment-${entry.id}`} title={`${entry.name} payment due: ${money(entry.amount)}`}>
                          🔔 {entry.name}
                        </span>
                      ))}
                      {cell.recurringSavings.slice(0, 1).map((entry) => (
                        <span className="calendar-event-chip recurring" key={`saving-${entry.id}`} title={`${entry.name}: ${money(entry.amount)}`}>
                          ♻ {entry.name}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Day Details Modal */}
      <AnimatePresence>
        {selectedCalendarDay && selectedCalendarDayDetails && (
          <motion.div
            className="modal-overlay calendar-day-overlay"
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

              {selectedCalendarDayDetails.isNoSpendDay && (
                <div className="calendar-no-spend-banner">
                  <span>🌿</span>
                  <div><strong>No-spend day</strong><small>You recorded no expenses on this day.</small></div>
                </div>
              )}

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

              {(selectedCalendarDayDetails.goalDeadlines.length > 0 ||
                selectedCalendarDayDetails.paymentReminders.length > 0 ||
                selectedCalendarDayDetails.recurringSavings.length > 0) && (
                <div className="calendar-day-schedule">
                  <h4>Schedule & Reminders</h4>
                  {selectedCalendarDayDetails.goalDeadlines.map((goal) => (
                    <div className="calendar-schedule-item deadline" key={`goal-${goal.id}`}>
                      <span className="calendar-schedule-icon">🎯</span>
                      <div>
                        <strong>Goal deadline</strong>
                        <span>{goal.name} · {money(goal.current_amount)} of {money(goal.target_amount)}</span>
                      </div>
                    </div>
                  ))}
                  {selectedCalendarDayDetails.paymentReminders.map((entry) => (
                    <div className="calendar-schedule-item payment" key={`payment-${entry.id}`}>
                      <span className="calendar-schedule-icon">🔔</span>
                      <div>
                        <strong>Payment reminder</strong>
                        <span>{entry.name} · {money(entry.amount)} · {entry.frequency}</span>
                      </div>
                    </div>
                  ))}
                  {selectedCalendarDayDetails.recurringSavings.map((entry) => (
                    <div className="calendar-schedule-item recurring" key={`saving-${entry.id}`}>
                      <span className="calendar-schedule-icon">♻</span>
                      <div>
                        <strong>Recurring saving</strong>
                        <span>{entry.name} · {money(entry.amount)} · {entry.frequency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="calendar-day-notes">
                <h4>Event Notes</h4>
                <form className="calendar-note-form" onSubmit={saveCalendarNote}>
                  <input
                    className="form-input"
                    value={calendarNoteForm.title}
                    onChange={(event) => setCalendarNoteForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Title (Payday, Trip, Shopping...)"
                    maxLength={100}
                    required
                  />
                  <textarea
                    className="form-input"
                    value={calendarNoteForm.note}
                    onChange={(event) => setCalendarNoteForm((prev) => ({ ...prev, note: event.target.value }))}
                    placeholder="Add an optional note"
                    maxLength={500}
                    rows={2}
                  />
                  <button className="btn btn-primary" type="submit" disabled={savingCalendarNote || !calendarNoteForm.title.trim()}>
                    <Plus size={15} /> {savingCalendarNote ? "Saving..." : "Add Note"}
                  </button>
                </form>

                {selectedCalendarDayDetails.notes.length === 0 ? (
                  <p className="calendar-day-empty">No event notes for this day.</p>
                ) : (
                  <div className="calendar-note-list">
                    {selectedCalendarDayDetails.notes.map((note) => (
                      <div className="calendar-note-item" key={note.id}>
                        <span className="calendar-note-icon">📝</span>
                        <div>
                          <strong>{note.title}</strong>
                          {note.note && <span>{note.note}</span>}
                        </div>
                        <button type="button" onClick={() => deleteCalendarNote(note.id)} aria-label="Delete event note">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Quick Save Modal */}
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

              <form onSubmit={submitQuickSave}>
                <div className="quick-save-segmented" role="tablist" aria-label="Transaction type">
                  <button
                    type="button"
                    className={`segmented-tab ${transactionType === "deposit" ? "active" : ""}`}
                    onClick={() => setTransactionType("deposit")}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    className={`segmented-tab ${transactionType === "withdrawal" ? "active" : ""}`}
                    onClick={() => setTransactionType("withdrawal")}
                  >
                    Expense
                  </button>
                </div>

                <div className="quick-save-amount-input">
                  <label>Amount (¥)</label>
                  <div className="amount-field-wrapper">
                    <span>¥</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="quick-save-form-group">
                  <label>Category</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="General">General</option>
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Pet Saving">Pet Saving</option>
                  </select>
                </div>

                <div className="quick-save-form-group">
                  <label>Note (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Lunch with friends"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary quick-save-submit">
                  Save Transaction
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
