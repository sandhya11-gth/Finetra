
import pandas as pd
from sklearn.linear_model import LinearRegression


def prepare_monthly_data(expenses):
    expenses = expenses.copy()

    expenses["Date"] = pd.to_datetime(
        expenses["Date"], errors="coerce"
    )
    expenses["Amount"] = pd.to_numeric(
        expenses["Amount"], errors="coerce"
    )

    expenses = expenses.dropna(subset=["Date", "Amount"])

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


def predict_next_month(expenses):
    monthly = prepare_monthly_data(expenses)

    if len(monthly) < 3:
        return None

    model = LinearRegression()
    model.fit(monthly[["Month_Number"]], monthly["Amount"])

    next_month = pd.DataFrame({
        "Month_Number": [monthly["Month_Number"].max() + 1]
    })

    prediction = model.predict(next_month)[0]
    return max(0.0, float(prediction))


def evaluate_model(expenses):
    monthly = prepare_monthly_data(expenses)

    if len(monthly) < 4:
        return None

    train = monthly.iloc[:-1]
    test = monthly.iloc[-1]

    model = LinearRegression()
    model.fit(train[["Month_Number"]], train["Amount"])

    test_month = pd.DataFrame({
        "Month_Number": [test["Month_Number"]]
    })

    predicted = model.predict(test_month)[0]

    return float(abs(test["Amount"] - predicted))
