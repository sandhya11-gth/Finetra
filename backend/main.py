
import logging
import pandas as pd

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ai.predictor import (
    generate_forecast,
    prepare_monthly_data,
    evaluate_model
)

from schemas.forecast import ForecastResponse
from services.transaction_service import get_user_transactions


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI(
    title="Finetra API",
    description="Backend services for the Finetra personal finance application",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://finetra-theta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


security = HTTPBearer(auto_error=False)


@app.get("/")
def home():
    return {
        "message": "Welcome to Finetra API!",
        "status": "running"
    }


@app.get("/forecast", response_model=ForecastResponse)
def get_forecast(
    credentials: HTTPAuthorizationCredentials | None = Depends(security)
):

    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication token is required."
        )

    access_token = credentials.credentials

    try:
        transactions = get_user_transactions(access_token)

        expenses = [
            transaction
            for transaction in transactions
            if transaction.get("type", "").lower() == "expense"
        ]

        expense_data = pd.DataFrame(
            [
                {
                    "Date": transaction["transaction_date"],
                    "Amount": transaction["amount"]
                }
                for transaction in expenses
            ],
            columns=["Date", "Amount"]
        )

        monthly_data = prepare_monthly_data(expense_data)

        result = generate_forecast(expense_data)

        prediction_error = evaluate_model(expense_data)

        result["prediction_error"] = (
            round(prediction_error, 2)
            if prediction_error is not None
            else None
        )

        return {
            **result,
            "months_available": len(monthly_data),
            "currency": "INR"
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Forecast generation failed")

        raise HTTPException(
            status_code=500,
            detail="Unable to generate forecast. Please try again."
        )
