
import pandas as pd
from sklearn.linear_model import LinearRegression


def prepare_monthly_data(transactions):
    """Convert daily expense transactions into monthly totals."""

    expenses = transactions.copy()

    expenses["Date"] = pd.to_datetime(
        expenses["Date"], errors="coerce"
    )
    expenses["Amount"] = pd.to_numeric(
        expenses["Amount"], errors="coerce"
    )

    expenses = expenses.dropna(subset=["Date", "Amount"])
    expenses = expenses[expenses["Amount"] > 0]

    if expenses.empty:
        return pd.DataFrame()

    expenses["Month"] = expenses["Date"].dt.to_period("M")

    monthly = (
        expenses.groupby("Month")["Amount"]
        .sum()
        .reset_index()
        .sort_values("Month")
    )

    first_month = monthly["Month"].min()

    monthly["Month_Number"] = (
        (monthly["Month"].dt.year - first_month.year) * 12
        + monthly["Month"].dt.month - first_month.month
    )

    return monthly


def generate_forecast(transactions):
    """Generate next month's spending forecast and insights."""

    monthly = prepare_monthly_data(transactions)

    history = [
        {
            "month": str(row.Month),
            "amount": round(float(row.Amount), 2)
        }
        for row in monthly.itertuples()
    ]

    spending_direction = "insufficient_data"
    spending_change = None
    spending_change_percentage = None
    latest_month_spending = None
    previous_month_spending = None

    if len(monthly) >= 2:
        latest_month_spending = float(monthly.iloc[-1]["Amount"])
        previous_month_spending = float(monthly.iloc[-2]["Amount"])

        spending_change = round(
            latest_month_spending - previous_month_spending, 2
        )

        if previous_month_spending > 0:
            spending_change_percentage = round(
                (spending_change / previous_month_spending) * 100, 2
            )

        if spending_change > 0:
            spending_direction = "increasing"
        elif spending_change < 0:
            spending_direction = "decreasing"
        else:
            spending_direction = "stable"

    if len(monthly) < 3:
        return {
            "status": "insufficient_data",
            "message": "At least 3 months of expense history is required.",
            "predicted_spending": None,
            "history": history,
            "spending_direction": spending_direction,
            "spending_change": spending_change,
            "spending_change_percentage": spending_change_percentage,
            "latest_month_spending": latest_month_spending,
            "previous_month_spending": previous_month_spending
        }

    model = LinearRegression()

    model.fit(
        monthly[["Month_Number"]],
        monthly["Amount"]
    )

    next_month_number = monthly["Month_Number"].max() + 1

    next_month = pd.DataFrame({
        "Month_Number": [next_month_number]
    })

    prediction = model.predict(next_month)[0]

    return {
        "status": "success",
        "model": "Linear Regression",
        "predicted_spending": round(max(0.0, float(prediction)), 2),
        "history": history,
        "spending_direction": spending_direction,
        "spending_change": spending_change,
        "spending_change_percentage": spending_change_percentage,
        "latest_month_spending": latest_month_spending,
        "previous_month_spending": previous_month_spending
    }


def evaluate_model(transactions):
    """Evaluate the model using the latest month as test data."""

    monthly = prepare_monthly_data(transactions)

    if len(monthly) < 4:
        return None

    train = monthly.iloc[:-1]
    test = monthly.iloc[-1]

    model = LinearRegression()

    model.fit(
        train[["Month_Number"]],
        train["Amount"]
    )

    test_month = pd.DataFrame({
        "Month_Number": [test["Month_Number"]]
    })

    predicted = model.predict(test_month)[0]

    return float(abs(test["Amount"] - predicted))
