# Finetra — Personal Finance Tracker

**Track smarter. Spend better. Plan ahead.**

Finetra is an AI-powered personal finance tracking application designed to help users understand their spending habits, manage budgets, visualize financial activity, and forecast future expenses.

## Live Demo

- **Application:** https://finetra-theta.vercel.app
- **Backend API:** https://finetra-backend-efgk.onrender.com
- **API Documentation:** https://finetra-backend-efgk.onrender.com/docs

## Features

- **Authentication:** Secure user authentication through Supabase.
- **Transaction Management:** Add, edit, delete, and organize expenses.
- **Spending Analytics:** Visualize spending patterns through interactive charts.
- **Budget Management:** Set budgets and monitor spending.
- **Financial Forecasting:** Predict upcoming expenses using machine learning.
- **CSV Export:** Export transaction records for external analysis.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Styling | CSS |
| Backend | Python, FastAPI |
| Database | Supabase, PostgreSQL |
| Authentication | Supabase Auth |
| Machine Learning | Pandas, scikit-learn |
| Visualization | Recharts |
| Deployment | Vercel, Render |
| Version Control | Git, GitHub |

## Architecture

```text
                 FINETRA
                    |
          +---------+---------+
          |                   |
       Frontend             Backend
       React + Vite         FastAPI
          |                   |
          |                   |
       Supabase          ML Forecasting
          |
       PostgreSQL
```

## Project Structure

```text
Finetra/
├── frontend/
│   ├── src/
│   └── package.json
│
├── backend/
│   ├── ai/
│   │   └── predictor.py
│   ├── schemas/
│   ├── services/
│   ├── main.py
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.10+
- A Supabase project

### 1. Clone the repository

```bash
git clone https://github.com/sandhya11-gth/Finetra.git
cd Finetra
```

### 2. Configure the frontend

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

### 3. Configure the backend

Open another terminal:

```bash
cd Finetra/backend

python -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `backend/.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Start the API:

```bash
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

Interactive API documentation: `http://127.0.0.1:8000/docs`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API health check |
| GET | `/forecast` | Generate spending forecast (authenticated) |

## Deployment

- Frontend hosted on Vercel.
- Backend hosted on Render.
- Supabase provides authentication and database services.

## Future Improvements

- Enhanced forecasting models.
- More detailed financial insights.
- Recurring transaction detection.
- Personalized savings recommendations.

## Author

**Sandhya Barolia**

GitHub: [@sandhya11-gth](https://github.com/sandhya11-gth)

---

*Finetra — Making personal finance easier to understand.*
