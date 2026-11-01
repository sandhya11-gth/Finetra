import { useEffect, useMemo, useState } from "react";
import Auth from "./Auth";
import { supabase } from "./supabase";
import {
  ArrowDownLeft, ArrowUpRight, CreditCard, Download, LayoutDashboard, Plus, Search,
  Sparkles, Target, TrendingUp, Wallet, X, Utensils, Car, ShoppingBag,
  GraduationCap, HeartPulse, ReceiptText, CalendarDays, ArrowRight,
  SlidersHorizontal, Landmark, PiggyBank, Pencil, Trash2,
  ChartNoAxesCombined, WalletCards, BrainCircuit
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, XAxis, YAxis
} from "recharts";
import "./App.css";

const categoryStyles = {
  Food: { label: "Food & dining", color: "#7545F5" },
  Travel: { label: "Travel", color: "#00A88F" },
  Shopping: { label: "Shopping", color: "#E84D9B" },
  Education: { label: "Education", color: "#F2A900" },
  Health: { label: "Health", color: "#3569E8" },
  Other: { label: "Other", color: "#FF665C" },
};

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);

function MetricCard({ label, value, change, icon: Icon, tone, note }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-top">
        <span className="metric-icon">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <span className={`metric-change ${change.startsWith("-") ? "negative" : ""}`}>
          {change}
        </span>
      </div>
      <p className="eyebrow">{label}</p>
      <div className="metric-value">{value}</div>
      <p className="metric-note">{note}</p>
    </article>
  );
}

function TransactionIcon({ category }) {
  const icons = {
    Food: Utensils,
    Travel: Car,
    Shopping: ShoppingBag,
    Education: GraduationCap,
    Health: HeartPulse,
    Income: Landmark
  };
  const Icon = icons[category] || ReceiptText;

  return (
    <span className={`transaction-icon icon-${category.toLowerCase()}`}>
      <Icon size={17} />
    </span>
  );
}

function displayDate(value) {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function TransactionList({
  transactions,
  limit = 5,
  onEdit,
  onDelete,
  deletingTransactionId
}) {
  return (
    <div className="transaction-list">
      {transactions.slice(0, limit).map((tx) => (
        <div className="transaction-row" key={tx.id}>
          <TransactionIcon category={tx.category} />
          <div className="transaction-info">
            <strong>{tx.title}</strong>
            <span>
              {tx.category} <span className="dot-separator">·</span>{" "}
              {displayDate(tx.date)}
            </span>
          </div>
          <strong className={`transaction-amount ${tx.type === "income" ? "income" : ""}`}>
            {tx.type === "income" ? "+" : "−"}{currency(tx.amount)}
          </strong>
          <div style={{ display: "flex", gap: 6, marginLeft: 10 }}>
            <button
              type="button"
              className="icon-button"
              aria-label={`Edit ${tx.title}`}
              title="Edit transaction"
              onClick={() => onEdit?.(tx)}
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={`Delete ${tx.title}`}
              title="Delete transaction"
              disabled={deletingTransactionId === tx.id}
              onClick={() => onDelete?.(tx)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const displayName = (() => {
    const user = session?.user;
    const metadata = user?.user_metadata || {};
    const metadataName = metadata.full_name || metadata.name || metadata.display_name || metadata.username;
    const emailName = user?.email?.split("@")[0]?.replace(/[._-]+/g, " ");
    const rawName = metadataName || emailName || "there";
    return String(rawName).trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
  })();

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error("Session check failed:", error.message);
      setSession(data?.session ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [activePage, setActivePage] = useState("Overview");
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState("");
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState(18000);
  const [budgetInput, setBudgetInput] = useState("18000");
  const [budgetMessage, setBudgetMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");
  
useEffect(() => {
  if (activePage !== "Forecast" && activePage !== "Overview") return;

  const accessToken = session?.access_token;

  if (!accessToken) {
    setForecastError("Please log in to view your forecast.");
    return;
  }

  let cancelled = false;

  async function fetchForecast() {
    setForecastLoading(true);
    setForecastError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/forecast",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to fetch your forecast."
        );
      }

      if (!cancelled) {
        setForecastData(data);
      }
    } catch (error) {
      if (!cancelled) {
        setForecastError(error.message);
      }
    } finally {
      if (!cancelled) {
        setForecastLoading(false);
      }
    }
  }

  fetchForecast();

  return () => {
    cancelled = true;
  };
}, [activePage, session?.access_token]);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "Food",
    date: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    let cancelled = false;

    async function loadTransactions() {
      if (!session?.user?.id) {
        setTransactions([]);
        setTransactionsLoading(false);
        return;
      }

      setTransactionsLoading(true);
      setTransactionsError("");

      const { data, error } = await supabase
        .from("expenses")
        .select("id, user_id, title, amount, category, transaction_date, type, created_at")
        .eq("user_id", session.user.id)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Could not load transactions:", error.message);
        setTransactionsError(
          "We couldn't load your transactions. Please refresh and try again."
        );
        setTransactions([]);
      } else {
        setTransactions((data || []).map((row) => ({
          id: row.id,
          title: row.title,
          amount: Number(row.amount),
          category: row.category,
          date: row.transaction_date,
          type: row.type,
        })));
      }

      setTransactionsLoading(false);
    }

    loadTransactions();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);
    const expenses = transactions.filter(
    (tx) => tx.type === "expense"
  );

  const incomeTransactions = transactions.filter(
    (tx) => tx.type === "income"
  );

  const totalSpent = expenses.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  const totalIncome = incomeTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  const balance = totalIncome - totalSpent;

  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyExpenses = expenses.filter(
    (tx) => tx.date?.startsWith(currentMonth)
  );

  const monthlyIncome = incomeTransactions.filter(
    (tx) => tx.date?.startsWith(currentMonth)
  );

  const monthlySpent = monthlyExpenses.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  const monthlyIncomeTotal = monthlyIncome.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  const remainingBudget = Math.max(0, monthlyBudget - monthlySpent);

  const budgetPercentage =
    monthlyBudget > 0
      ? Math.min(100, (monthlySpent / monthlyBudget) * 100)
      : 0;
const today = new Date();

const daysRemainingInMonth =
  new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate() - today.getDate() + 1;

const safeRemaining = Math.max(0, remainingBudget);

const dailySafeSpend =
  daysRemainingInMonth > 0
    ? safeRemaining / daysRemainingInMonth
    : 0;

const progressColor =
  budgetPercentage >= 100
    ? "#E36B7A"
    : budgetPercentage >= 80
    ? "#E5A34B"
    : "#42B99A";

const budgetStatus =
  monthlyBudget <= 0
    ? "Set a budget to start tracking."
    : budgetPercentage >= 100
    ? "You've exceeded your monthly budget."
    : budgetPercentage >= 80
    ? "You're getting close to your spending limit."
    : "You're comfortably within your budget.";
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        `${tx.title} ${tx.category}`.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === "all" || tx.type === typeFilter;

      const matchesCategory =
        categoryFilter === "all" || tx.category === categoryFilter;

      const matchesFromDate =
        !fromDate || tx.date >= fromDate;

      const matchesToDate =
        !toDate || tx.date <= toDate;


      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    transactions,
    search,
    typeFilter,
    categoryFilter,
    fromDate,
    toDate
  ]);

  const monthlyChartData = useMemo(() => {
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);

      const key = date.toISOString().slice(0, 7);

      months.push({
        key,
        month: date.toLocaleDateString("en-IN", {
          month: "short"
        }),
        spending: 0,
        income: 0
      });
    }

    transactions.forEach((tx) => {
      const month = months.find((item) => item.key === tx.date?.slice(0, 7));

      if (!month) return;

      if (tx.type === "expense") {
        month.spending += Number(tx.amount);
      } else {
        month.income += Number(tx.amount);
      }
    });

    return months;
  }, [transactions]);

  const categoryData = useMemo(() => {
    const totals = {};

    expenses
      .filter((tx) => tx.date?.startsWith(currentMonth))
      .forEach((tx) => {
        totals[tx.category] =
          (totals[tx.category] || 0) + Number(tx.amount);
      });

    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
      color: categoryStyles[name]?.color || "#C5C9D6"
    }));
  }, [expenses, currentMonth]);
        // Analytics insights
const analyticsNow = new Date();

const currentMonthKey =
  `${analyticsNow.getFullYear()}-${String(
    analyticsNow.getMonth() + 1
  ).padStart(2, "0")}`;

const previousMonthDate = new Date(
  analyticsNow.getFullYear(),
  analyticsNow.getMonth() - 1,
  1
);

const previousMonthKey =
  `${previousMonthDate.getFullYear()}-${String(
    previousMonthDate.getMonth() + 1
  ).padStart(2, "0")}`;

const previousMonthSpent = transactions
  .filter((t) =>
    t.type === "expense" &&
    String(t.date).slice(0, 7) === previousMonthKey
  )
  .reduce((sum, t) => sum + Number(t.amount || 0), 0);

const monthlySavings = monthlyIncomeTotal - monthlySpent;

const savingsRate =
  monthlyIncomeTotal > 0
    ? (monthlySavings / monthlyIncomeTotal) * 100
    : 0;

const spendingChange =
  previousMonthSpent > 0
    ? ((monthlySpent - previousMonthSpent) / previousMonthSpent) * 100
    : null;

const topSpendingCategory = [...categoryData].sort(
  (a, b) => b.value - a.value
)[0];
// Forecast display calculations
const forecastHistory = forecastData?.history ?? [];
const predictionError = forecastData?.prediction_error;
const forecastPrediction = Number(
  forecastData?.predicted_spending ?? 0
);

const forecastMaxValue = Math.max(
  ...forecastHistory.map((item) => Number(item.amount)),
  forecastPrediction,
  1
);

const lastForecastMonth = forecastHistory.length
  ? new Date(
      `${forecastHistory[forecastHistory.length - 1].month}-01T00:00:00`
    )
  : null;

const forecastTargetMonth = lastForecastMonth
  ? new Date(
      lastForecastMonth.getFullYear(),
      lastForecastMonth.getMonth() + 1,
      1
    )
  : null;

const forecastTargetLabel = forecastTargetMonth
  ? forecastTargetMonth.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    })
    
  : "Next month";

// Compare predicted spending with the monthly budget
const hasForecastBudget = monthlyBudget > 0;

const forecastBudgetPercentage = hasForecastBudget
  ? (forecastPrediction / monthlyBudget) * 100
  : 0;

const forecastBudgetDifference = forecastPrediction - monthlyBudget;

const forecastBudgetStatus = !hasForecastBudget
  ? "no-budget"
  : forecastBudgetPercentage > 100
  ? "over-budget"
  : forecastBudgetPercentage >= 80
  ? "near-limit"
  : "within-budget";

const forecastBudgetMessage = {
  "no-budget": "Set a monthly budget to track your predicted spending.",
  "over-budget": `Your spending could exceed your budget by ${currency(forecastBudgetDifference)}.`,
  "near-limit": "Your predicted spending is getting close to your monthly budget.",
  "within-budget": "Your predicted spending is comfortably within your budget."
}[forecastBudgetStatus];

  const categoryTotal = categoryData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  function openNewTransaction() {
    setEditingTransaction(null);
    setForm({
      title: "",
      amount: "",
      type: "expense",
      category: "Food",
      date: new Date().toISOString().slice(0, 10)
    });
    setFormMessage("");
    setShowAddExpense(true);
  }

  function openEditTransaction(tx) {
    setEditingTransaction(tx);
    setForm({
      title: tx.title,
      amount: String(tx.amount),
      type: tx.type,
      category: tx.category,
      date: tx.date
    });
    setFormMessage("");
    setShowAddExpense(true);
  }

  async function addExpense(event) {
    event.preventDefault();
    setFormMessage("");

    const amount = Number(form.amount);

    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setFormMessage("Enter a valid title and amount.");
      return;
    }

    if (!session?.user?.id) {
      setFormMessage("Please sign in again.");
      return;
    }

    setSavingTransaction(true);

    const transactionData = {
      title: form.title.trim(),
      amount,
      category: form.category,
      transaction_date: form.date,
      type: form.type,
      user_id: session.user.id
    };

    try {
      let result;

      if (editingTransaction) {
        result = await supabase
          .from("expenses")
          .update(transactionData)
          .eq("id", editingTransaction.id)
          .eq("user_id", session.user.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("expenses")
          .insert(transactionData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      const saved = {
        id: result.data.id,
        title: result.data.title,
        amount: Number(result.data.amount),
        category: result.data.category,
        date: result.data.transaction_date,
        type: result.data.type
      };

      if (editingTransaction) {
        setTransactions((current) =>
          current.map((tx) =>
            tx.id === saved.id ? saved : tx
          )
        );
      } else {
        setTransactions((current) => [saved, ...current]);
      }

      setShowAddExpense(false);
      setEditingTransaction(null);
      setForm({
        title: "",
        amount: "",
        type: "expense",
        category: "Food",
        date: new Date().toISOString().slice(0, 10)
      });

      setActivePage("Transactions");
    } catch (error) {
      console.error("Transaction save failed:", error);
      setFormMessage(error.message || "Could not save transaction.");
    } finally {
      setSavingTransaction(false);
    }
  }

  async function deleteTransaction(tx) {
    const confirmed = window.confirm(
      `Delete "${tx.title}" permanently?`
    );

    if (!confirmed) return;

    setDeletingTransactionId(tx.id);

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", tx.id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Delete failed:", error.message);
      alert("Could not delete this transaction. Please try again.");
    } else {
      setTransactions((current) =>
        current.filter((item) => item.id !== tx.id)
      );
    }

    setDeletingTransactionId(null);
  }

  function exportTransactions() {
    const headers = [
      "Title",
      "Amount",
      "Category",
      "Date",
      "Type"
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.title,
      tx.amount,
      tx.category,
      tx.date,
      tx.type
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) =>
          `"${String(value ?? "").replace(/"/g, '""')}"`
        ).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "finetra-transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
  }
async function saveBudget(event) {
  event.preventDefault();

  const amount = Number(budgetInput);

  if (!Number.isFinite(amount) || amount <= 0) {
    setBudgetMessage("Enter a valid budget amount.");
    return;
  }

  if (!session?.user?.id) {
    setBudgetMessage("Please log in first.");
    return;
  }

  const now = new Date();

  // First day of the current month
  const month = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-01`;

  const { error } = await supabase
    .from("budgets")
    .upsert(
      {
        user_id: session.user.id,
        monthly_limit: amount,
        month: month,
      },
      {
        onConflict: "user_id,month",
      }
    );

  if (error) {
    console.error("Budget save failed:", error.message);
    setBudgetMessage("Could not save budget. Please try again.");
    return;
  }

  setMonthlyBudget(amount);
  setBudgetMessage("Monthly budget updated successfully.");
}

  async function handleLogout() {
    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      alert("Could not sign out. Please try again.");
    }

    setSigningOut(false);
  }

 useEffect(() => {
  if (!session?.user?.id) return;

  let cancelled = false;

  async function loadBudget() {
    const now = new Date();

    const month = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-01`;

    const { data, error } = await supabase
      .from("budgets")
      .select("monthly_limit")
      .eq("user_id", session.user.id)
      .eq("month", month)
      .maybeSingle();

    if (error) {
      console.error("Budget loading failed:", error.message);
      return;
    }

    if (cancelled) return;

    if (data) {
      const amount = Number(data.monthly_limit);

      setMonthlyBudget(amount);
      setBudgetInput(String(amount));
    } else {
      setMonthlyBudget(0);
      setBudgetInput("");
    }
  }

  loadBudget();

  return () => {
    cancelled = true;
  };
}, [session?.user?.id]);

  const navItems = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Transactions", icon: ReceiptText },
    { label: "Analytics", icon: ChartNoAxesCombined },
    { label: "Budget", icon: PiggyBank },
    { label: "Forecast", icon: BrainCircuit }
  ];

  if (authLoading) {
    return <div className="auth-page">Loading Finetra...</div>;
  }

  if (!session) {
    return <Auth />;
  }
    return (
    <div className={`app-shell page-${activePage.toLowerCase()}`}>
      <div className="ambient-swirl ambient-swirl-top" aria-hidden="true" />
      <div className="ambient-swirl ambient-swirl-bottom" aria-hidden="true" />
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActivePage("Overview");
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            <svg className="finetra-logo-symbol" viewBox="0 0 52 52" aria-hidden="true">
              <defs>
                <linearGradient id="finetraFTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#D9FF38" />
                  <stop offset="100%" stopColor="#A7E52E" />
                </linearGradient>
                <linearGradient id="finetraFMid" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#C5F342" />
                  <stop offset="100%" stopColor="#7B5BFF" />
                </linearGradient>
                <linearGradient id="finetraFBottom" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#D15CFF" />
                  <stop offset="100%" stopColor="#875BFF" />
                </linearGradient>
              </defs>
              <path d="M13.5 9C15.5 6.1 18.7 4.5 22.4 4.5H46L39.2 13.8H16.8C13.6 13.8 11.4 12 13.5 9Z" fill="url(#finetraFTop)" />
              <path d="M10.5 21.5C12.6 18.5 15.8 16.8 19.5 16.8H39.5L32.7 26H13.8C10.5 26 8.3 24.6 10.5 21.5Z" fill="url(#finetraFMid)" />
              <path d="M6.7 34.2C8.8 31.2 11.8 29.5 15.4 29.5H27.5L20.6 38.8H9.8C6.5 38.8 4.5 37.4 6.7 34.2Z" fill="url(#finetraFBottom)" />
            </svg>
          </span>
          <span>finetra<span className="brand-period">.</span></span>
        </a>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="side-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              onClick={() => setActivePage(label)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Transactions" && (
                <span className="nav-count">{transactions.length}</span>
              )}
            </button>
          ))}
        </nav>

        <p className="sidebar-label tools-label">PREFERENCES</p>

        <nav className="side-nav">
          <button className="nav-item" onClick={openNewTransaction}>
            <Plus size={18} />
            <span>Add transaction</span>
          </button>

        </nav>

        <div className="sidebar-bottom">
          <button className="profile-button" onClick={handleLogout} disabled={signingOut}>
            <div className="profile-avatar">
              {(session.user.email || "S")[0].toUpperCase()}
            </div>
            <div className="profile-copy">
              <strong>{displayName}</strong>
              <span>{signingOut ? "Signing out..." : "Sign out"}</span>
            </div>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
              />
            </label>

            <button className="primary-button" onClick={openNewTransaction}>
              <Plus size={17} /> Add transaction
            </button>
          </div>
        </header>

        {transactionsError && (
          <div className="empty-state" role="alert">
            {transactionsError}
          </div>
        )}

        {activePage === "Overview" && (
          <>
            <section className="welcome-row">
              <div>
                <div className="overline">
                  <span className="overline-dot" />
                  YOUR FINANCIAL SPACE
                </div>
                <h1>Welcome back, <span>{displayName}</span>!</h1>
                <p className="welcome-subtitle">Here’s your financial snapshot for {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}.</p>
              </div>

              <div className="overview-period">
                <span className="overview-period-icon"><CalendarDays size={17} /></span>
                <span>
                  <small>YOUR FINANCIAL OVERVIEW</small>
                  <strong>{new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong>
                </span>
              </div>
            </section>

            <section className="metrics-grid">
              <MetricCard
                label="Available balance"
                value={currency(balance)}
                change="Live"
                icon={WalletCards}
                tone="violet"
                note="Income minus expenses"
              />
              <MetricCard
                label="Total spent"
                value={currency(monthlySpent)}
                change="This month"
                icon={ShoppingBag}
                tone="mint"
                note="Your monthly expenditure"
              />
              <MetricCard
                label="Income received"
                value={currency(monthlyIncomeTotal)}
                change="This month"
                icon={Landmark}
                tone="peach"
                note="Income recorded this month"
              />
              <MetricCard
                label="Monthly budget"
                value={currency(monthlyBudget)}
                change={`${Math.round(budgetPercentage)}% used`}
                icon={PiggyBank}
                tone="blue"
                note={`${currency(remainingBudget)} remaining`}
              />
            </section>

            <section className="dashboard-grid">
              <article className="panel spending-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">THE BIG PICTURE</p>
                    <h2>Spending overview</h2>
                    <p className="panel-subtitle">
                      Your money flow over the last six months
                    </p>
                  </div>
                  <span className="demo-chip">LIVE DATA</span>
                </div>

                <div className="chart-summary">
                  <strong>{currency(monthlySpent)}</strong>
                  <span className="muted-text">spent this month</span>
                </div>

                <div className="spending-chart">
                  <stop offset="0%" stopColor="#7545F5" stopOpacity={0.30} />   
                  <stop offset="100%" stopColor="#7545F5" stopOpacity={0.01} />
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyChartData}
                      margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="spendingFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A58BFA" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#A58BFA" stopOpacity={0.015} />
                        </linearGradient>
                        <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#75D8C0" stopOpacity={0.17} />
                          <stop offset="100%" stopColor="#75D8C0" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="#ECEAF3"
                        strokeDasharray="4 5"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9290A2", fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9290A2", fontSize: 11 }}
                        tickFormatter={(v) => `₹${v / 1000}k`}
                      />
                      <Tooltip formatter={(value) => currency(value)} />
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#73CDB8"
                        strokeWidth={2}
                        fill="url(#incomeFill)"
                      />
                      <Area
                        type="monotone"
                        dataKey="spending"
                        name="Spending"
                        stroke="#9A7AFB"
                        strokeWidth={2.7}
                        fill="url(#spendingFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-legend">
                  <span><i className="legend-dot violet-dot" /> Spending</span>
                  <span><i className="legend-dot mint-dot" /> Income</span>
                  <span className="chart-footnote">Based on your transactions</span>
                </div>
              </article>

              <article className="panel category-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">WHERE IT GOES</p>
                    <h2>Spending by category</h2>
                    <p className="panel-subtitle">A snapshot of your habits this month</p>
                  </div>
                </div>

                <div className="donut-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={68}
                        outerRadius={91}
                        paddingAngle={4}
                        stroke="none"
                        cornerRadius={5}
                      >
                        {categoryData.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => currency(value)} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="donut-center">
                    <span>Total outflow</span>
                    <strong>{currency(categoryTotal)}</strong>
                    <small>this month</small>
                  </div>
                </div>

                <div className="category-legend">
                  {categoryData.length === 0 ? (
                    <p className="empty-state">No expenses recorded this month.</p>
                  ) : (
                    categoryData.map((item) => (
                      <div className="category-line" key={item.name}>
                        <span className="category-name">
                          <i style={{ background: item.color }} />
                          {categoryStyles[item.name]?.label || item.name}
                        </span>
                        <strong>{currency(item.value)}</strong>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="panel transactions-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">THE LATEST</p>
                    <h2>Recent transactions</h2>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setActivePage("Transactions")}
                  >
                    View all <ArrowRight size={14} />
                  </button>
                </div>

                {transactionsLoading ? (
                  <p className="empty-state">Loading transactions...</p>
                ) : (
                  <>
                    <TransactionList
                      transactions={transactions}
                      onEdit={openEditTransaction}
                      onDelete={deleteTransaction}
                      deletingTransactionId={deletingTransactionId}
                    />
                    {transactions.length === 0 && (
                      <p className="empty-state">No transactions yet. Add your first one!</p>
                    )}
                  </>
                )}
              </article>

            
<article className="forecast-card">
  <div className="forecast-card-top">
    <span className="forecast-icon">
      <Sparkles size={19} />
    </span>
    <span className="forecast-badge">
      {forecastLoading ? "UPDATING" : "AI FORECAST"}
    </span>
  </div>

  <p className="eyebrow">A LOOK AHEAD</p>

  <h2>
    Spending forecast
  </h2>

  <div className="forecast-mini">
    <div>
      <span>
        {forecastData?.status === "success"
          ? `Projected spend · ${forecastTargetLabel}`
          : "Projected spend"}
      </span>

      <strong>
        {forecastLoading
          ? "Calculating..."
          : forecastError
          ? "Unavailable"
          : forecastData?.status === "success"
          ? currency(forecastPrediction)
          : "More data needed"}
      </strong>
    </div>

    <div className="mini-chart" aria-label="Historical spending trend">
      {forecastHistory.slice(-10).map((item, index) => (
        <i
          key={`${item.month}-${index}`}
          style={{
            height: `${Math.max(
              12,
              (Number(item.amount) / forecastMaxValue) * 100
            )}%`,
            background:
              index === forecastHistory.slice(-10).length - 1
                ? "#58c5a8"
                : "#9878f3",
          }}
        />
      ))}
    </div>
  </div>

  <button
    className="forecast-link"
    onClick={() => setActivePage("Forecast")}
  >
    Explore forecast <ArrowRight size={15} />
  </button>

  <span className="forecast-glow" />
</article>

            </section>
          </>
        )}

        {activePage === "Transactions" && (
          <section className="page-section">
            <div className="page-title-row">
              <div>
                <p className="overline">YOUR MONEY TRAIL</p>
                <h1>Transactions</h1>
                <p className="welcome-subtitle">
                  Every little detail, all in one place.
                </p>
              </div>
            </div>

            <article className="panel full-transactions">
              <div className="panel-heading">
                <div>
                  <h2>All activity</h2>
                  <p className="panel-subtitle">
                    {filteredTransactions.length} transactions shown
                  </p>
                </div>
                <button className="secondary-button" onClick={exportTransactions}>
                  <Download size={15} /> Export CSV
                </button>
              </div>

              <div className="transaction-filters" style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                margin: "18px 0"
              }}>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expenses</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  <option value="Food">Food</option>
                  <option value="Travel">Travel</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Education">Education</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                  <option value="Allowance">Allowance</option>
                  <option value="Salary">Salary</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Gift">Gift</option>
                </select>

                <label>
                  From
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </label>

                <label>
                  To
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </label>

                <button
                  className="secondary-button"
                  onClick={() => {
                    setTypeFilter("all");
                    setCategoryFilter("all");
                    setFromDate("");
                    setToDate("");
                    setSearch("");
                  }}
                >
                  Clear filters
                </button>
              </div>

              {transactionsLoading ? (
                <p className="empty-state">Loading transactions...</p>
              ) : (
                <>
                  <TransactionList
                    transactions={filteredTransactions}
                    limit={1000}
                    onEdit={openEditTransaction}
                    onDelete={deleteTransaction}
                    deletingTransactionId={deletingTransactionId}
                  />
                  {filteredTransactions.length === 0 && (
                    <p className="empty-state">No transactions match your filters.</p>
                  )}
                </>
              )}
            </article>
          </section>
        )}
                
{activePage === "Analytics" && (
  <section className="page-section">
    <div className="page-title-row">
      <div>
        <p className="overline">PATTERNS & PERSPECTIVE</p>
        <h1>Your spending, decoded.</h1>
        <p className="welcome-subtitle">
          Small patterns can tell a useful story.
        </p>
      </div>
    </div>

    {/* Financial metrics */}
    <section className="metrics-grid analytics-metrics">
      <MetricCard
        label="Monthly spending"
        value={currency(monthlySpent)}
        change="This month"
        icon={TrendingUp}
        tone="violet"
        note="Based on saved expenses"
      />

      <MetricCard
        label="Monthly income"
        value={currency(monthlyIncomeTotal)}
        change="This month"
        icon={ArrowDownLeft}
        tone="mint"
        note="Based on saved income"
      />

      <MetricCard
        label="Monthly savings"
        value={currency(monthlySavings)}
        change={`${savingsRate.toFixed(1)}% savings rate`}
        icon={PiggyBank}
        tone="peach"
        note="Income minus expenses"
      />

      <MetricCard
        label="Transactions"
        value={transactions.length}
        change="All time"
        icon={ReceiptText}
        tone="blue"
        note="Total recorded transactions"
      />
    </section>

    {/* Income and spending chart */}
    <article className="panel analytics-chart">
      <div className="panel-heading">
        <div>
          <h2>Income vs. spending</h2>
          <p className="panel-subtitle">
            Your actual transaction history over six months
          </p>
        </div>
        <span className="demo-chip">LIVE DATA</span>
      </div>

      <div className="large-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyChartData}>
            <defs>
              <linearGradient
                id="analyticsSpending"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#9A7AFB" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#9A7AFB" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#ECEAF3"
              strokeDasharray="4 5"
              vertical={false}
            />

            <XAxis dataKey="month" axisLine={false} tickLine={false} />

            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${v / 1000}k`}
            />

            <Tooltip formatter={(value) => currency(value)} />

            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#73CDB8"
              fill="#73CDB822"
              strokeWidth={2}
            />

            <Area
              type="monotone"
              dataKey="spending"
              name="Spending"
              stroke="#9A7AFB"
              fill="url(#analyticsSpending)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>

    {/* Spending insights */}
    <div className="analytics-metrics" style={{ marginTop: 20 }}>
      <article className="panel" style={{ padding: 24 }}>
        <p className="eyebrow">MONTH-ON-MONTH</p>
        <h2 style={{ fontSize: 26, margin: "12px 0" }}>
          {spendingChange === null
            ? "—"
            : `${Math.abs(spendingChange).toFixed(1)}%`}
        </h2>

        <p className="panel-subtitle">
          {spendingChange === null
            ? "Not enough previous-month spending data to compare."
            : spendingChange > 0
            ? "Your spending increased compared with last month."
            : spendingChange < 0
            ? "Your spending decreased compared with last month."
            : "Your spending is unchanged from last month."}
        </p>

        <p className="panel-subtitle" style={{ marginTop: 12 }}>
          Previous month: {currency(previousMonthSpent)}
        </p>
      </article>

      <article className="panel" style={{ padding: 24 }}>
        <p className="eyebrow">TOP SPENDING CATEGORY</p>

        <h2 style={{ fontSize: 26, margin: "12px 0" }}>
          {topSpendingCategory
            ? categoryStyles[topSpendingCategory.name]?.label ||
              topSpendingCategory.name
            : "No data yet"}
        </h2>

        <p className="panel-subtitle">
          {topSpendingCategory
            ? `${currency(topSpendingCategory.value)} spent this month`
            : "Add expenses to discover your biggest spending category."}
        </p>
      </article>
    </div>

    {/* Category breakdown */}
    <article className="panel" style={{ marginTop: 20, padding: 28 }}>
      <div className="panel-heading">
        <div>
          <h2>Category breakdown</h2>
          <p className="panel-subtitle">
            See where your money goes this month.
          </p>
        </div>
      </div>

      {categoryData.length === 0 ? (
        <p className="empty-state">
          Add expenses to see your category breakdown.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 22, marginTop: 24 }}>
          {categoryData
            .slice()
            .sort((a, b) => b.value - a.value)
            .map((item) => {
              const percentage =
                monthlySpent > 0
                  ? (item.value / monthlySpent) * 100
                  : 0;

              return (
                <div key={item.name}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 9
                    }}
                  >
                    <strong>
                      {categoryStyles[item.name]?.label || item.name}
                    </strong>

                    <span>
                      {currency(item.value)} · {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div
                    style={{
                      height: 10,
                      background: "#ECEAF3",
                      borderRadius: 20,
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, percentage)}%`,
                        height: "100%",
                        background: item.color || "#9A7AFB",
                        borderRadius: 20,
                        transition: "width 0.3s"
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </article>
  </section>
)}



{activePage === "Budget" && (
  <section className="page-section">
    <div className="page-title-row">
      <div>
        <p className="overline">SPEND WITH INTENTION</p>
        <h1>Your monthly budget.</h1>
        <p className="welcome-subtitle">
          Understand your spending and stay in control of your money.
        </p>
      </div>
    </div>

    {/* Financial summary cards */}
    <div className="metric-grid">
      <MetricCard
        label="Monthly budget"
        value={currency(monthlyBudget)}
        change="Your spending limit"
        icon={Target}
        tone="violet"
      />

      <MetricCard
        label="Total spent"
        value={currency(monthlySpent)}
        change="Spent this month"
        icon={CreditCard}
        tone="coral"
      />

      <MetricCard
        label="Remaining"
        value={currency(safeRemaining)}
        change={
          remainingBudget < 0
            ? "Budget exceeded"
            : "Available to spend"
        }
        icon={Wallet}
        tone="mint"
      />

      <MetricCard
        label="Daily safe spend"
        value={currency(dailySafeSpend)}
        change={`${daysRemainingInMonth} days remaining`}
        icon={CalendarDays}
        tone="blue"
      />
    </div>

    {/* Budget progress */}
    <article className="panel" style={{ padding: 28, marginTop: 20 }}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">MONTHLY OVERVIEW</p>
          <h2>Your spending progress</h2>
          <p className="panel-subtitle">
            Track how much of your monthly limit you've used.
          </p>
        </div>

        <strong style={{ color: progressColor, fontSize: 20 }}>
          {Math.round(budgetPercentage)}%
        </strong>
      </div>

      <div
        style={{
          height: 14,
          background: "#ECEAF3",
          borderRadius: 20,
          overflow: "hidden",
          margin: "24px 0 14px"
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, budgetPercentage))}%`,
            height: "100%",
            background: progressColor,
            borderRadius: 20,
            transition: "width 0.4s ease"
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12
        }}
      >
        <span>
          {currency(monthlySpent)} spent
        </span>

        <strong>
          {remainingBudget >= 0
            ? `${currency(remainingBudget)} remaining`
            : `${currency(Math.abs(remainingBudget))} over budget`}
        </strong>
      </div>

      {monthlyBudget > 0 && (
        <div
          style={{
            marginTop: 22,
            padding: 16,
            borderRadius: 14,
            background:
              budgetPercentage >= 100
                ? "#FFF0F1"
                : budgetPercentage >= 80
                ? "#FFF7E9"
                : "#EDFAF5",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}
        >
          <span style={{ fontSize: 22 }}>
            {budgetPercentage >= 100
              ? "⚠️"
              : budgetPercentage >= 80
              ? "👀"
              : "✓"}
          </span>

          <div>
            <strong style={{ color: progressColor }}>
              {budgetStatus}
            </strong>

            <p className="panel-subtitle" style={{ marginTop: 4 }}>
              {budgetPercentage >= 100
                ? "Consider limiting non-essential purchases for the rest of the month."
                : budgetPercentage >= 80
                ? "Keep an eye on upcoming expenses to avoid overspending."
                : "Keep following your spending plan!"}
            </p>
          </div>
        </div>
      )}
    </article>

    {/* Daily spending recommendation */}
    <article
      className="panel"
      style={{
        padding: 28,
        marginTop: 20,
        background: "linear-gradient(120deg, #F5F0FF, #F0FBF8)"
      }}
    >
      <p className="eyebrow">YOUR DAILY SPENDING GUIDE</p>

      <h2 style={{ fontSize: 28, margin: "12px 0" }}>
        {currency(dailySafeSpend)}
        <span style={{ fontSize: 14, fontWeight: 400 }}>
          {" "}per day
        </span>
      </h2>

      <p className="panel-subtitle">
        Based on your remaining budget of {currency(safeRemaining)}
        {" "}and {daysRemainingInMonth} days left in this month.
      </p>

      {remainingBudget <= 0 && monthlyBudget > 0 && (
        <p style={{ color: "#D65F70", marginTop: 12 }}>
          Your budget has been exhausted. Avoid additional
          discretionary spending if possible.
        </p>
      )}
    </article>

    {/* Update budget */}
    <article className="panel" style={{ padding: 28, marginTop: 20 }}>
      <div className="panel-heading">
        <div>
          <h2>Update your budget</h2>
          <p className="panel-subtitle">
            Choose a spending limit for this month.
          </p>
        </div>
      </div>

      <form onSubmit={saveBudget} className="expense-form">
        <label>
          Monthly budget (₹)
          <input
            type="number"
            min="1"
            step="1"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="primary-button">
          <Target size={16} /> Save budget
        </button>
      </form>

      {budgetMessage && (
        <p role="status" className="empty-state">
          {budgetMessage}
        </p>
      )}

      <p className="panel-subtitle" style={{ marginTop: 16 }}>
        Your budget is securely synced across devices with Finetra.
      </p>
    </article>
  </section>
)}



{activePage === "Forecast" && (
  <section className="page-section forecast-page">

    <div className="page-title-row">
      <div>
        <p className="overline">LOOKING AHEAD</p>
        <h1>Make room for tomorrow.</h1>
        <p className="welcome-subtitle">
          A forecast is a guide, not a promise.
        </p>
      </div>
    </div>

    <article className="forecast-hero-panel">
      <div className="forecast-hero-copy">

        <span className="forecast-badge">
          {forecastLoading
            ? "ANALYSING"
            : forecastError
            ? "UNAVAILABLE"
            : forecastData?.status === "success"
            ? "AI FORECAST"
            : "BUILDING YOUR FORECAST"}
        </span>

        <h2>
          {forecastLoading
            ? "Reading your spending patterns."
            : forecastError
            ? "Your forecast needs attention."
            : forecastData?.status === "success"
            ? <>Your next month, <span>in perspective.</span></>
            : "Let's build your money picture."}
        </h2>

        <p>
          {forecastLoading
            ? "Finetra is analysing your transaction history."
            : forecastError
            ? forecastError
            : forecastData?.status === "success"
            ? `Based on ${forecastData.months_available} months of recorded expenses, here's your estimated spending for ${forecastTargetLabel}.`
            : forecastData?.message ||
              "Add transactions across at least three different months to unlock your spending forecast."}
        </p>

        <div className="forecast-confidence">
          <span className="confidence-dot" />
          {forecastLoading
            ? "Processing transaction history"
            : forecastData?.status === "success"
            ? `${forecastData.model} · Historical trend analysis`
            : "Waiting for sufficient expense history"}
        </div>

      </div>

      <div className="forecast-illustration">
        <div className="forecast-planet" />
        <div className="forecast-orbit orbit-a" />
        <div className="forecast-orbit orbit-b" />
        <span className="planet-star star-a">✦</span>
        <span className="planet-star star-b">✧</span>
      </div>
    </article>

    {forecastError && (
      <article className="panel">
        <p className="panel-subtitle">{forecastError}</p>
      </article>
    )}

    {forecastLoading && (
      <article className="panel">
        <p className="eyebrow">PLEASE WAIT</p>
        <h2>Analysing your financial history...</h2>
      </article>
    )}

    {!forecastLoading && forecastData?.status === "success" && (
      <>
        <div className="forecast-detail-grid">

          <article className="panel">
            <p className="eyebrow">PREDICTED SPENDING</p>
            <h2 className="forecast-number">
              {currency(forecastPrediction)}
            </h2>
            <p className="panel-subtitle">
              Estimated expenditure for {forecastTargetLabel}
            </p>
          </article>

          <article className="panel">
            <p className="eyebrow">CURRENT MONTH SPENDING</p>
            <h2 className="forecast-number">
              {currency(monthlySpent)}
            </h2>
            <p className="panel-subtitle">
              Actual recorded expenditure this month
            </p>
          </article>

        </div>

<article
  className="panel"
  style={{ marginTop: "24px" }}
>
  <p className="eyebrow">BUDGET FORECAST INSIGHT</p>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap"
    }}
  >
    <h2>
      {forecastBudgetStatus === "no-budget"
        ? "Your budget picture"
        : forecastBudgetStatus === "over-budget"
        ? "Potential overspending"
        : forecastBudgetStatus === "near-limit"
        ? "Getting close to your limit"
        : "You're on track"}
    </h2>

    <span
      style={{
        fontSize: "12px",
        fontWeight: 600,
        padding: "7px 12px",
        borderRadius: "20px",
        background:
          forecastBudgetStatus === "over-budget"
            ? "#FCE8EA"
            : forecastBudgetStatus === "near-limit"
            ? "#FFF1D9"
            : "#E5F5EF",
        color:
          forecastBudgetStatus === "over-budget"
            ? "#C64F60"
            : forecastBudgetStatus === "near-limit"
            ? "#A87324"
            : "#318C70"
      }}
    >
      {forecastBudgetStatus === "no-budget"
        ? "No budget set"
        : `${forecastBudgetPercentage.toFixed(1)}% of budget`}
    </span>
  </div>

  <p className="panel-subtitle">
    {forecastBudgetMessage}
  </p>

  {hasForecastBudget && (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "24px",
          gap: "12px"
        }}
      >
        <div>
          <p className="eyebrow">MONTHLY BUDGET</p>
          <h2>{currency(monthlyBudget)}</h2>
        </div>

        <div style={{ textAlign: "right" }}>
          <p className="eyebrow">PREDICTED SPENDING</p>
          <h2>{currency(forecastPrediction)}</h2>
        </div>
      </div>

      <div
        style={{
          height: "12px",
          background: "#EEEAF5",
          borderRadius: "20px",
          overflow: "hidden",
          marginTop: "18px"
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, forecastBudgetPercentage)}%`,
            background:
              forecastBudgetStatus === "over-budget"
                ? "#E36B7A"
                : forecastBudgetStatus === "near-limit"
                ? "#E5A34B"
                : "#42B99A",
            borderRadius: "20px",
            transition: "width 0.4s ease"
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "16px",
          gap: "12px",
          flexWrap: "wrap"
        }}
      >
        <span className="panel-subtitle">
          {forecastBudgetDifference > 0
            ? `Potentially over by ${currency(forecastBudgetDifference)}`
            : `Potentially under by ${currency(Math.abs(forecastBudgetDifference))}`}
        </span>

        <span className="panel-subtitle">
          Budget limit: 100%
        </span>
      </div>
    </>
  )}
</article>

<article className="panel" style={{ marginTop: "24px" }}>
  <p className="eyebrow">SPENDING DIRECTION</p>

  {forecastData?.spending_direction === "insufficient_data" ? (
    <>
      <h2>Building your spending pattern</h2>
      <p className="panel-subtitle">
        Add expenses across at least two months to understand
        your spending direction.
      </p>
    </>
  ) : (
    <>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap"
      }}>
        <h2>
          {forecastData?.spending_direction === "increasing"
            ? "Your spending is increasing"
            : forecastData?.spending_direction === "decreasing"
            ? "Your spending is decreasing"
            : "Your spending is stable"}
        </h2>

        <span style={{
          fontSize: "13px",
          fontWeight: 600,
          color:
            forecastData?.spending_direction === "increasing"
              ? "#C64F60"
              : forecastData?.spending_direction === "decreasing"
              ? "#318C70"
              : "#A87324"
        }}>
          {forecastData?.spending_direction === "increasing"
            ? "↑ Increasing"
            : forecastData?.spending_direction === "decreasing"
            ? "↓ Decreasing"
            : "→ Stable"}
        </span>
      </div>

      <div style={{
        display: "flex",
        gap: "32px",
        flexWrap: "wrap",
        marginTop: "20px"
      }}>
        <div>
          <p className="eyebrow">LATEST MONTH</p>
          <h2>
            {currency(forecastData?.latest_month_spending ?? 0)}
          </h2>
        </div>

        <div>
          <p className="eyebrow">PREVIOUS MONTH</p>
          <h2>
            {currency(forecastData?.previous_month_spending ?? 0)}
          </h2>
        </div>

        <div>
          <p className="eyebrow">MONTHLY CHANGE</p>
          <h2>
            {forecastData?.spending_change_percentage == null
              ? "—"
              : `${forecastData.spending_change_percentage > 0 ? "+" : ""}${forecastData.spending_change_percentage}%`}
          </h2>
        </div>
      </div>
    </>
  )}
</article>

<article className="panel" style={{ marginTop: "24px" }}>
  <p className="eyebrow">MODEL PERFORMANCE</p>

  <h2>
    {predictionError == null
      ? "More history needed"
      : currency(predictionError)}
  </h2>

  <p className="panel-subtitle">
    {predictionError == null
      ? "At least four months of recorded expenses are needed to evaluate the model."
      : "Historical prediction error when testing against your latest recorded month."}
  </p>

  <p className="panel-subtitle" style={{ marginTop: "12px" }}>
    A lower error means the prediction was closer to your actual spending.
  </p>
</article>


        <article className="panel" style={{ marginTop: "24px" }}>
          <p className="eyebrow">YOUR SPENDING TREND</p>
          <h2>History meets prediction</h2>
          <p className="panel-subtitle">
            Monthly expenses and estimated next-month spending
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "18px",
              height: "230px",
              padding: "24px 8px 0",
              overflowX: "auto"
            }}
          >
            {[
              ...forecastHistory.map((item) => ({
                ...item,
                predicted: false
              })),
              {
                month: forecastTargetLabel,
                amount: forecastPrediction,
                predicted: true
              }
            ].map((item, index) => (
              <div
                key={`${item.month}-${index}`}
                style={{
                  flex: "1 0 65px",
                  minWidth: "65px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  height: "100%",
                  gap: "8px"
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 600 }}>
                  {currency(item.amount)}
                </span>

                <div
                  style={{
                    width: "min(100%, 48px)",
                    height: `${Math.max(
                      8,
                      (Number(item.amount) / forecastMaxValue) * 145
                    )}px`,
                    background: item.predicted
                      ? "#A99AE8"
                      : "#8DCFC0",
                    borderRadius: "9px 9px 3px 3px",
                    border: item.predicted
                      ? "2px dashed #806CCB"
                      : "none",
                    boxSizing: "border-box"
                  }}
                />

                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted, #888)",
                    textAlign: "center"
                  }}
                >
                  {item.predicted
                    ? "Forecast"
                    : new Date(
                        `${item.month}-01T00:00:00`
                      ).toLocaleDateString("en-IN", {
                        month: "short"
                      })}
                </span>
              </div>
            ))}
          </div>

          <p className="panel-subtitle" style={{ marginTop: "20px" }}>
            <span style={{ color: "#8DCFC0" }}>●</span> Actual spending
            {"  "}
            <span style={{ color: "#A99AE8" }}>●</span> Predicted spending
          </p>
        </article>

        <div className="forecast-detail-grid" style={{ marginTop: "24px" }}>
          <article className="panel">
            <p className="eyebrow">MODEL INFORMATION</p>
            <h2>{forecastData.model}</h2>
            <p className="panel-subtitle">
              Used {forecastData.months_available} months of historical data.
            </p>
          </article>

          <article className="panel">
            <p className="eyebrow">A NOTE ABOUT YOUR FORECAST</p>
            <h2>Plan, don't predict perfectly.</h2>
            <p className="panel-subtitle">
              This estimate uses a linear trend from your recorded monthly
              expenses. Actual spending may differ.
            </p>
          </article>
        </div>
      </>
    )}

    {!forecastLoading &&
      !forecastError &&
      forecastData?.status === "insufficient_data" && (
        <div className="forecast-detail-grid">
          <article className="panel">
            <p className="eyebrow">YOUR CURRENT SPENDING</p>
            <h2 className="forecast-number">
              {currency(monthlySpent)}
            </h2>
            <p className="panel-subtitle">
              Recorded expenditure this month
            </p>
          </article>

          <article className="panel">
            <p className="eyebrow">YOUR NEXT STEP</p>
            <h2>Build your money picture</h2>
            <p className="panel-subtitle">
              You currently have {forecastData.months_available || 0}
              {" "}months of expense history. At least three are needed
              to generate a forecast.
            </p>
          </article>
        </div>
      )}

  </section>
)}


        <footer className="app-footer">
          <span>© 2026 Finetra</span>
        </footer>
      </main>

      {showAddExpense && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddExpense(false);
              setEditingTransaction(null);
            }
          }}
        >
          <section
            className="expense-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-heading">
              <div>
                <span className="modal-icon"><Plus size={18} /></span>
                <h2 id="modal-title">
                  {editingTransaction ? "Edit transaction" : "Add a transaction"}
                </h2>
                <p>Keep your money picture up to date.</p>
              </div>

              <button
                className="icon-button"
                onClick={() => {
                  setShowAddExpense(false);
                  setEditingTransaction(null);
                  setFormMessage("");
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={addExpense} className="expense-form">
              <label>
                Transaction type
                <select
                  value={form.type}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setForm({
                      ...form,
                      type: nextType,
                      category: nextType === "income" ? "Allowance" : "Food"
                    });
                  }}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>

              <label>
                What was it for?
                <input
                  autoFocus
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder={
                    form.type === "income"
                      ? "e.g. Monthly allowance"
                      : "e.g. Lunch with friends"
                  }
                  required
                />
              </label>

              <label>
                Amount (₹)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  placeholder="0"
                  required
                />
              </label>

              <div className="form-two-col">
                <label>
                  Category
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {form.type === "expense" ? (
                      <>
                        <option value="Food">Food</option>
                        <option value="Travel">Travel</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Education">Education</option>
                        <option value="Health">Health</option>
                        <option value="Other">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="Allowance">Allowance</option>
                        <option value="Salary">Salary</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Gift">Gift</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    required
                  />
                </label>
              </div>

              {formMessage && (
                <p className="empty-state" role="alert">
                  {formMessage}
                </p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowAddExpense(false);
                    setEditingTransaction(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingTransaction}
                >
                  {savingTransaction
                    ? "Saving..."
                    : editingTransaction
                      ? "Save changes"
                      : "Add transaction"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}