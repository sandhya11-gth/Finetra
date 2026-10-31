import { useEffect, useMemo, useState } from "react";
import Auth from "./Auth";
import { supabase } from "./supabase";
import {
  ArrowDownLeft, ArrowUpRight, Bell, ChevronDown, CircleHelp, Command,
  CreditCard, Download, Ellipsis, LayoutDashboard, Plus, Search, Settings2,
  Sparkles, Target, TrendingUp, Wallet, X, Utensils, Car, ShoppingBag,
  GraduationCap, HeartPulse, ReceiptText, CalendarDays, ArrowRight,
  SlidersHorizontal, Landmark, PiggyBank, Pencil, Trash2
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, XAxis, YAxis
} from "recharts";
import "./App.css";

const categoryStyles = {
  Food: { label: "Food & dining", color: "#9A7AFB" },
  Travel: { label: "Travel", color: "#62C9B2" },
  Shopping: { label: "Shopping", color: "#F5A6C8" },
  Education: { label: "Education", color: "#F4C66A" },
  Health: { label: "Health", color: "#83A8FA" },
  Other: { label: "Other", color: "#C5C9D6" },
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

  function saveBudget(event) {
    event.preventDefault();

    const amount = Number(budgetInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      setBudgetMessage("Enter a valid budget amount.");
      return;
    }

    setMonthlyBudget(amount);

    localStorage.setItem(
      `finetra-budget-${session.user.id}`,
      String(amount)
    );

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

    const savedBudget = localStorage.getItem(
      `finetra-budget-${session.user.id}`
    );

    if (savedBudget && Number(savedBudget) > 0) {
      setMonthlyBudget(Number(savedBudget));
      setBudgetInput(savedBudget);
    }
  }, [session?.user?.id]);

  const navItems = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Transactions", icon: ReceiptText },
    { label: "Analytics", icon: SlidersHorizontal },
    { label: "Budget", icon: Target },
    { label: "Forecast", icon: TrendingUp }
  ];

  if (authLoading) {
    return <div className="auth-page">Loading Finetra...</div>;
  }

  if (!session) {
    return <Auth />;
  }
    return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActivePage("Overview");
          }}
        >
          <span className="brand-mark">
            <Wallet size={20} strokeWidth={2.1} />
          </span>
          <span>finetra<span className="brand-period">.</span></span>
        </a>

        <div className="workspace-switcher">
          <div className="workspace-avatar">
            {(session.user.email || "S")[0].toUpperCase()}
          </div>
          <div className="workspace-copy">
            <strong>Personal space</strong>
            <span>Personal workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>

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

          <button
            className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
            onClick={() => setActivePage("Settings")}
          >
            <Settings2 size={18} />
            <span>Settings</span>
          </button>

          <button
            className={`nav-item ${activePage === "Help" ? "active" : ""}`}
            onClick={() => setActivePage("Help")}
          >
            <CircleHelp size={18} />
            <span>Help & support</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <span className="upgrade-sparkle">
              <Sparkles size={17} />
            </span>
            <strong>A little more clarity.</strong>
            <p>Your money story, all in one place.</p>
            <button onClick={() => setActivePage("Forecast")}>
              Explore insights <ArrowRight size={14} />
            </button>
          </div>

          <button className="profile-button" onClick={handleLogout} disabled={signingOut}>
            <div className="profile-avatar">
              {(session.user.email || "S")[0].toUpperCase()}
            </div>
            <div className="profile-copy">
              <strong>{session.user.email || "Finetra user"}</strong>
              <span>{signingOut ? "Signing out..." : "Click to sign out"}</span>
            </div>
            <Ellipsis size={18} />
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
              <kbd>⌘ K</kbd>
            </label>

            <button className="icon-button notification-button" aria-label="Notifications">
              <Bell size={18} />
              <i />
            </button>

            <button className="date-filter">
              <CalendarDays size={15} />
              This month
              <ChevronDown size={14} />
            </button>

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
                <h1>Your money, <span>in a better light.</span></h1>
                <p className="welcome-subtitle">
                  A little more clarity today can make a big difference tomorrow.
                </p>
              </div>

              <div className="welcome-decoration" aria-hidden="true">
                <div className="aurora-orb orb-one" />
                <div className="aurora-orb orb-two" />
                <div className="orb-ring ring-one" />
                <div className="orb-ring ring-two" />
                <span className="float-note note-one">
                  <Sparkles size={13} /> mindful spending
                </span>
                <span className="float-note note-two">✦ one step at a time</span>
              </div>
            </section>

            <section className="metrics-grid">
              <MetricCard
                label="Available balance"
                value={currency(balance)}
                change="Live"
                icon={Wallet}
                tone="violet"
                note="Income minus expenses"
              />
              <MetricCard
                label="Total spent"
                value={currency(monthlySpent)}
                change="This month"
                icon={ArrowUpRight}
                tone="mint"
                note="Your monthly expenditure"
              />
              <MetricCard
                label="Income received"
                value={currency(monthlyIncomeTotal)}
                change="This month"
                icon={ArrowDownLeft}
                tone="peach"
                note="Income recorded this month"
              />
              <MetricCard
                label="Monthly budget"
                value={currency(monthlyBudget)}
                change={`${Math.round(budgetPercentage)}% used`}
                icon={Target}
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
                  <button className="round-more" aria-label="More options">
                    <Ellipsis size={19} />
                  </button>
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
                  <span className="forecast-icon"><Sparkles size={19} /></span>
                  <span className="forecast-badge">PREVIEW</span>
                </div>
                <p className="eyebrow">A LOOK AHEAD</p>
                <h2>Your next month,<br /><span>in perspective.</span></h2>
                <p className="forecast-description">
                  Get a clearer picture of where your spending might be heading
                  with a little help from predictive insights.
                </p>
                <div className="forecast-mini">
                  <div>
                    <span>Projected spend</span>
                    <strong>Coming soon</strong>
                  </div>
                  <div className="mini-chart" aria-label="Forecast pending">
                    <i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
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
              <button className="primary-button" onClick={openNewTransaction}>
                <Plus size={17} /> Add transaction
              </button>
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
                label="Budget left"
                value={currency(remainingBudget)}
                change={`${Math.round(budgetPercentage)}% used`}
                icon={PiggyBank}
                tone="peach"
                note="Your current monthly budget"
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
                      <linearGradient id="analyticsSpending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9A7AFB" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#9A7AFB" stopOpacity={0.02} />
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
                    />
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

            <article className="panel" style={{ marginTop: 20 }}>
              <div className="panel-heading">
                <div>
                  <h2>Category breakdown</h2>
                  <p className="panel-subtitle">
                    Your expenses by category this month
                  </p>
                </div>
              </div>

              {categoryData.length === 0 ? (
                <p className="empty-state">Add expenses to see your category breakdown.</p>
              ) : (
                <div className="category-legend">
                  {categoryData.map((item) => (
                    <div className="category-line" key={item.name}>
                      <span className="category-name">
                        <i style={{ background: item.color }} />
                        {categoryStyles[item.name]?.label || item.name}
                      </span>
                      <strong>{currency(item.value)}</strong>
                    </div>
                  ))}
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
                  Keep your spending within a limit that works for you.
                </p>
              </div>
            </div>

            <article className="panel" style={{ padding: 28 }}>
              <p className="eyebrow">MONTHLY BUDGET</p>
              <h2 style={{ fontSize: 32, margin: "12px 0" }}>
                {currency(monthlyBudget)}
              </h2>
              <p className="panel-subtitle">
                {currency(monthlySpent)} spent this month
              </p>

              <div
                style={{
                  height: 12,
                  background: "#ECEAF3",
                  borderRadius: 20,
                  overflow: "hidden",
                  margin: "24px 0 12px"
                }}
              >
                <div
                  style={{
                    width: `${budgetPercentage}%`,
                    height: "100%",
                    background: budgetPercentage >= 100 ? "#E67A8A" : "#9A7AFB",
                    borderRadius: 20,
                    transition: "width 0.3s"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <span>{Math.round(budgetPercentage)}% used</span>
                <strong>{currency(remainingBudget)} remaining</strong>
              </div>

              {monthlySpent > monthlyBudget && (
                <p className="empty-state" style={{ marginTop: 16 }}>
                  You've exceeded your monthly budget by{" "}
                  {currency(monthlySpent - monthlyBudget)}.
                </p>
              )}
            </article>

            <article className="panel" style={{ padding: 28, marginTop: 20 }}>
              <div className="panel-heading">
                <div>
                  <h2>Update your budget</h2>
                  <p className="panel-subtitle">
                    Choose a spending limit for the month.
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
                Your budget is currently saved in this browser for this account.
                It is not yet synchronized across devices.
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
                <span className="forecast-badge">COMING SOON</span>
                <h2>Your spending forecast is <span>on its way.</span></h2>
                <p>
                  Finetra will use your transaction history and Python
                  forecasting model to estimate future spending.
                </p>
                <div className="forecast-confidence">
                  <span className="confidence-dot" />
                  Python model connection pending
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

            <div className="forecast-detail-grid">
              <article className="panel">
                <p className="eyebrow">YOUR CURRENT SPENDING</p>
                <h2 className="forecast-number">{currency(monthlySpent)}</h2>
                <p className="panel-subtitle">
                  Recorded expenditure this month
                </p>
              </article>

              <article className="panel">
                <p className="eyebrow">WHAT'S NEXT</p>
                <h2>Build your money picture</h2>
                <ul className="next-steps">
                  <li><span>01</span> Add transactions consistently</li>
                  <li><span>02</span> Connect the Python model</li>
                  <li><span>03</span> Generate spending predictions</li>
                </ul>
              </article>
            </div>
          </section>
        )}

        {activePage === "Settings" && (
          <section className="page-section">
            <p className="overline">YOUR SPACE</p>
            <h1>Settings</h1>
            <article className="panel simple-message">
              <Settings2 size={26} />
              <h2>Your preferences</h2>
              <p>{session.user.email}</p>
              <button
                className="primary-button"
                onClick={handleLogout}
                disabled={signingOut}
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </article>
          </section>
        )}

        {activePage === "Help" && (
          <section className="page-section">
            <p className="overline">HERE TO HELP</p>
            <h1>Help & support</h1>
            <article className="panel simple-message">
              <CircleHelp size={26} />
              <h2>Need a hand?</h2>
              <p>
                Finetra helps you track your income, expenses and spending habits.
              </p>
            </article>
          </section>
        )}

        <footer className="app-footer">
          <span>© 2026 Finetra</span>
          <span><i /> Your financial space, thoughtfully designed.</span>
          <span>Personal finance tracker</span>
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