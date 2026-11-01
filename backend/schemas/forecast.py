
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class ForecastTransaction(BaseModel):
    transaction_date: date
    amount: float = Field(gt=0)
    type: Literal["expense", "income"]


class ForecastRequest(BaseModel):
    transactions: list[ForecastTransaction]


class ForecastHistoryItem(BaseModel):
    month: str
    amount: float


class ForecastResponse(BaseModel):
    status: Literal["success", "insufficient_data"]

    model: str | None = None
    predicted_spending: float | None = None

    currency: str = "INR"
    months_available: int = 0

    history: list[ForecastHistoryItem] = []
    message: str | None = None

    spending_direction: str = "insufficient_data"
    spending_change: float | None = None
    spending_change_percentage: float | None = None

    latest_month_spending: float | None = None
    previous_month_spending: float | None = None

    prediction_error: float | None = None
