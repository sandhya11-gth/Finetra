
import os

from dotenv import load_dotenv
from supabase import create_client, ClientOptions


load_dotenv()


def get_user_transactions(access_token: str):
    """
    Fetch transactions belonging to the authenticated user.

    Supabase RLS policies determine which records
    this access token is allowed to retrieve.
    """

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_PUBLISHABLE_KEY")

    if not supabase_url or not supabase_key:
        raise RuntimeError(
            "Supabase environment variables are missing."
        )

    if not access_token:
        raise ValueError("User access token is required.")

    supabase = create_client(
        supabase_url,
        supabase_key,
        options=ClientOptions(
            headers={
                "Authorization": f"Bearer {access_token}"
            }
        )
    )

    response = (
        supabase
        .table("expenses")
        .select("transaction_date, amount, type")
        .execute()
    )

    return response.data
