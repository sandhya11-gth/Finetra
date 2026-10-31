
import os
from datetime import date

import pandas as pd
import plotly.express as px
import streamlit as st

from predictor import predict_next_month, evaluate_model


# ---------- PAGE CONFIG ----------
st.set_page_config(
    page_title="Finetra | Future of Finance",
    page_icon="💠",
    layout="wide",
    initial_sidebar_state="expanded"
)

FILE = "expenses.csv"


# ---------- FUTURISTIC THEME ----------
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
    --bg: #050b18;
    --panel: rgba(12, 26, 47, 0.88);
    --border: rgba(72, 211, 196, 0.25);
    --mint: #48f0b5;
    --cyan: #46dfff;
    --text: #edf7ff;
    --muted: #91a9c8;
}

.stApp {
    background:
        radial-gradient(ellipse at 10% 0%, #102c48 0%, transparent 35%),
        radial-gradient(ellipse at 95% 20%, #10213e 0%, transparent 32%),
        linear-gradient(145deg, #050b18, #071326 55%, #050b18);
    color: var(--text);
    font-family: 'Inter', sans-serif;
}

[data-testid="stHeader"] {
    background: rgba(5, 11, 24, 0.7);
}

[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #09172b, #07101f);
    border-right: 1px solid var(--border);
}

[data-testid="stSidebar"] h1,
[data-testid="stSidebar"] h2,
[data-testid="stSidebar"] p {
    color: var(--text);
}

h1, h2, h3 {
    color: var(--text) !important;
    letter-spacing: -0.5px;
}

p, label, [data-testid="stCaptionContainer"] {
    color: var(--muted);
}

.hero {
    position: relative;
    padding: 32px 30px;
    margin: 4px 0 24px 0;
    border-radius: 22px;
    overflow: hidden;
    background:
        radial-gradient(ellipse at 85% 0%, rgba(44, 220, 220, 0.20), transparent 40%),
        linear-gradient(120deg, rgba(15, 39, 68, 0.97), rgba(8, 25, 43, 0.95));
    border: 1px solid rgba(70, 223, 255, 0.30);
    box-shadow: 0 0 32px rgba(30, 188, 220, 0.08),
                inset 0 1px rgba(255,255,255,0.06);
}

.hero-title {
    font-size: clamp(27px, 3vw, 39px);
    font-weight: 800;
    line-height: 1.2;
    color: #f3fbff;
}

.hero-subtitle {
    margin-top: 10px;
    font-size: 15px;
    color: #9ec5e6;
}

.hero-tag {
    display: inline-block;
    margin-bottom: 14px;
    padding: 6px 11px;
    border: 1px solid rgba(72, 240, 181, 0.35);
    border-radius: 30px;
    color: #69f6c5;
    background: rgba(72, 240, 181, 0.07);
    font-size: 11px;
    letter-spacing: 1.5px;
}

div[data-testid="stMetric"] {
    background: linear-gradient(145deg, rgba(17, 40, 67, 0.96), rgba(9, 22, 41, 0.96));
    border: 1px solid rgba(70, 223, 255, 0.25);
    border-radius: 17px;
    padding: 21px 20px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15),
                inset 0 1px rgba(255,255,255,0.04);
    transition: border-color 0.2s ease, transform 0.2s ease;
}

div[data-testid="stMetric"]:hover {
    border-color: rgba(72, 240, 181, 0.7);
    transform: translateY(-2px);
}

[data-testid="stMetricLabel"] {
    color: #9bb4d2 !important;
}

[data-testid="stMetricValue"] {
    color: #6df5c1 !important;
    font-weight: 750;
}

.section-heading {
    font-size: 21px;
    font-weight: 700;
    color: #edf7ff;
    margin: 20px 0 13px 0;
}

.panel {
    background: linear-gradient(145deg, rgba(15, 34, 58, 0.92), rgba(8, 20, 38, 0.95));
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 20px;
    box-shadow: inset 0 1px rgba(255,255,255,0.04),
                0 10px 30px rgba(0,0,0,0.12);
}

div.stButton > button,
div.stFormSubmitButton > button {
    background: linear-gradient(100deg, #38e8a6, #38d9db);
    color: #031521;
    border: none;
    border-radius: 10px;
    min-height: 43px;
    font-weight: 750;
    transition: all 0.2s ease;
}

div.stButton > button:hover,
div.stFormSubmitButton > button:hover {
    box-shadow: 0 0 20px rgba(56, 232, 166, 0.25);
    color: #031521;
    border: none;
}

div[data-baseweb="input"] > div,
div[data-baseweb="select"] > div {
    background: #0c1b30;
    border-color: #29415e;
    border-radius: 9px;
}

input, textarea {
    color: #edf7ff !important;
}

[data-testid="stDataFrame"] {
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
}

[data-testid="stExpander"] {
    background: rgba(12, 26, 47, 0.8);
    border: 1px solid var(--border);
    border-radius: 13px;
}

[data-testid="stAlert"] {
    border-radius: 12px;
}

hr {
    border-color: rgba(100, 150, 190, 0.20);
}

.footer {
    text-align: center;
    padding: 30px 0 10px 0;
    color: #627c9d;
    font-size: 11px;
    letter-spacing: 2px;
}

.stPlotlyChart {
    background: transparent;
    border-radius: 15px;
}

@media (prefers-reduced-motion: reduce) {
    * {
        transition: none !important;
        animation: none !important;
    }
}
</style>
""", unsafe_allow_html=True)


# ---------- DATA ----------
def load_expenses():
    if not os.path.exists(FILE):
        return pd.DataFrame(columns=["Date", "Amount", "Category"])

    data = pd.read_csv(FILE)

    required = {"Date", "Amount", "Category"}
    if not required.issubset(data.columns):
        return pd.DataFrame(columns=["Date", "Amount", "Category"])

    data["Date"] = pd.to_datetime(data["Date"], errors="coerce")
    data["Amount"] = pd.to_numeric(data["Amount"], errors="coerce")
    data = data.dropna(subset=["Date", "Amount"])

    return data


def style_chart(fig):
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#c5d9ef", family="Inter"),
        margin=dict(l=10, r=10, t=35, b=10),
        legend=dict(
            bgcolor="rgba(0,0,0,0)",
            font=dict(color="#c5d9ef")
        )
    )
    return fig


# ---------- SIDEBAR ----------
with st.sidebar:
    st.markdown("# 💠 Finetra")
    st.caption("PERSONAL FINANCE SYSTEM")
    st.divider()

    page = st.radio(
        "NAVIGATION",
        ["Overview", "Transactions", "Analytics", "Forecast"]
    )

    st.divider()
    st.markdown("**SYSTEM STATUS**")
    st.markdown("🟢 Expense tracking active")
    st.markdown("🔵 Analytics ready")
    st.caption("Your money. Your patterns. Your future.")


# ---------- HERO ----------
st.markdown("""
<div class="hero">
    <div class="hero-tag">✦ YOUR FINANCIAL COMMAND CENTER</div>
    <div class="hero-title">A clearer view of your future.</div>
    <div class="hero-subtitle">
        Track your spending. Discover your patterns. Make smarter decisions.
    </div>
</div>
""", unsafe_allow_html=True)


# ---------- ADD EXPENSE ----------
with st.expander("＋  Record a new expense", expanded=False):
    with st.form("expense_form"):
        col1, col2 = st.columns(2)

        with col1:
            expense_date = st.date_input("Date", value=date.today())
            amount = st.number_input(
                "Amount (₹)", min_value=0.0, step=10.0
            )

        with col2:
            category = st.selectbox(
                "Category",
                ["Food", "Travel", "Shopping", "Education", "Health", "Other"]
            )

        submitted = st.form_submit_button(
            "Save Expense", use_container_width=True
        )

        if submitted:
            if amount <= 0:
                st.warning("Enter an amount greater than zero.")
            else:
                new_expense = pd.DataFrame([{
                    "Date": str(expense_date),
                    "Amount": amount,
                    "Category": category
                }])

                if os.path.exists(FILE):
                    new_expense.to_csv(
                        FILE, mode="a", header=False, index=False
                    )
                else:
                    new_expense.to_csv(FILE, index=False)

                st.success("Expense saved successfully.")
                st.rerun()


df = load_expenses()


# ---------- EMPTY STATE ----------
if df.empty:
    st.info("Your dashboard is ready. Record your first expense to begin.")

else:
    total = df["Amount"].sum()
    count = len(df)
    average = df["Amount"].mean()
    df["Month"] = df["Date"].dt.to_period("M").astype(str)

    # ---------- OVERVIEW ----------
    if page == "Overview":
        st.markdown(
            '<div class="section-heading">◈ Financial Overview</div>',
            unsafe_allow_html=True
        )

        c1, c2, c3 = st.columns(3)
        c1.metric("TOTAL SPENDING", f"₹{total:,.2f}")
        c2.metric("TRANSACTIONS", f"{count:,}")
        c3.metric("AVERAGE EXPENSE", f"₹{average:,.2f}")

        left, right = st.columns(2)

        with left:
            st.markdown("### ◉ Category Distribution")
            categories = (
                df.groupby("Category")["Amount"]
                .sum().reset_index()
            )

            fig = px.pie(
                categories,
                names="Category",
                values="Amount",
                hole=0.68,
                color_discrete_sequence=[
                    "#48f0b5", "#46dfff", "#8c7bff",
                    "#ff76c8", "#ffbd69", "#6f94ff"
                ]
            )
            fig.update_traces(
                textposition="inside",
                textinfo="percent",
                marker=dict(line=dict(color="#081426", width=3))
            )
            st.plotly_chart(style_chart(fig), use_container_width=True)

        with right:
            st.markdown("### ⌁ Spending Timeline")
            monthly = (
                df.groupby("Month")["Amount"]
                .sum().reset_index()
                .sort_values("Month")
            )

            fig = px.bar(
                monthly, x="Month", y="Amount",
                color_discrete_sequence=["#48f0b5"]
            )
            fig.update_traces(
                marker_line_color="#46dfff",
                marker_line_width=1
            )
            fig.update_layout(
                xaxis_title="Month",
                yaxis_title="Spending (₹)"
            )
            st.plotly_chart(style_chart(fig), use_container_width=True)

        st.markdown("### ◇ Recent Transactions")
        recent = df.sort_values("Date", ascending=False).head(5).copy()
        recent["Date"] = recent["Date"].dt.strftime("%d %b %Y")
        recent["Amount"] = recent["Amount"].map(lambda x: f"₹{x:,.2f}")

        st.dataframe(
            recent[["Date", "Category", "Amount"]],
            use_container_width=True,
            hide_index=True
        )

    # ---------- TRANSACTIONS ----------
    elif page == "Transactions":
        st.markdown(
            '<div class="section-heading">◈ Transaction Log</div>',
            unsafe_allow_html=True
        )

        categories = ["All"] + sorted(
            df["Category"].dropna().unique().tolist()
        )
        selected = st.selectbox("Filter category", categories)

        filtered = df.copy()
        if selected != "All":
            filtered = filtered[filtered["Category"] == selected]

        st.dataframe(
            filtered.sort_values("Date", ascending=False),
            use_container_width=True,
            hide_index=True
        )
        st.caption(f"{len(filtered)} transaction(s) found.")

    # ---------- ANALYTICS ----------
    elif page == "Analytics":
        st.markdown(
            '<div class="section-heading">◈ Spending Intelligence</div>',
            unsafe_allow_html=True
        )

        left, right = st.columns(2)

        with left:
            st.markdown("### Category Breakdown")
            categories = (
                df.groupby("Category")["Amount"]
                .sum().reset_index()
            )

            fig = px.pie(
                categories,
                names="Category",
                values="Amount",
                hole=0.62,
                color_discrete_sequence=[
                    "#48f0b5", "#46dfff", "#8c7bff",
                    "#ff76c8", "#ffbd69", "#6f94ff"
                ]
            )
            st.plotly_chart(style_chart(fig), use_container_width=True)

        with right:
            st.markdown("### Monthly Trend")
            monthly = (
                df.groupby("Month")["Amount"]
                .sum().reset_index()
                .sort_values("Month")
            )

            fig = px.line(
                monthly, x="Month", y="Amount", markers=True
            )
            fig.update_traces(
                line_color="#48f0b5",
                line_width=3,
                marker=dict(size=8, color="#46dfff")
            )
            fig.update_layout(
                xaxis_title="Month",
                yaxis_title="Spending (₹)"
            )
            st.plotly_chart(style_chart(fig), use_container_width=True)

        st.markdown("### Category Totals")
        st.dataframe(
            categories.sort_values("Amount", ascending=False),
            use_container_width=True,
            hide_index=True
        )

    # ---------- FORECAST ----------
    elif page == "Forecast":
        st.markdown(
            '<div class="section-heading">◈ Predictive Intelligence</div>',
            unsafe_allow_html=True
        )

        prediction = predict_next_month(df.copy())
        mae = evaluate_model(df.copy())

        c1, c2 = st.columns(2)

        with c1:
            if prediction is not None:
                st.metric(
                    "ESTIMATED NEXT MONTH",
                    f"₹{prediction:,.2f}"
                )
                st.caption(
                    "A basic trend estimate using historical monthly spending."
                )
            else:
                st.info(
                    "Add expenses across at least 3 different months "
                    "to generate a forecast."
                )

        with c2:
            if mae is not None:
                st.metric("LATEST-MONTH TEST ERROR", f"₹{mae:,.2f}")
                st.caption(
                    "Mean absolute error on the latest held-out month."
                )
            else:
                st.info(
                    "At least 4 different months are needed to calculate "
                    "the test error."
                )

        st.markdown("### Historical Spending")
        monthly = (
            df.groupby("Month")["Amount"]
            .sum().reset_index()
            .sort_values("Month")
        )

        fig = px.area(
            monthly,
            x="Month",
            y="Amount",
            color_discrete_sequence=["#48f0b5"]
        )
        fig.update_traces(
            line=dict(color="#46dfff", width=3),
            fillcolor="rgba(72, 240, 181, 0.13)"
        )
        fig.update_layout(
            xaxis_title="Month",
            yaxis_title="Spending (₹)"
        )
        st.plotly_chart(style_chart(fig), use_container_width=True)


st.markdown("""
<div class="footer">
    FINETRA &nbsp; • &nbsp; FINANCIAL INTELLIGENCE, REIMAGINED
</div>
""", unsafe_allow_html=True)
