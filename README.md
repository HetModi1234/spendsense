# SpendSense AI – Smart Personal Finance & Expense Intelligence Platform

SpendSense AI is a production-grade full-stack personal finance and expense intelligence platform built with the **MERN stack (MongoDB, Express, React, Node.js)** and **Google Gemini Generative AI**.

SpendSense AI implements **deterministic financial calculations** in Node.js for 100% numerical accuracy, while leveraging Google Gemini for natural-language expense extraction, multi-turn conversational tool calling, executive financial summaries, and velocity forecasts.

---

## 🌟 Key Modules & Features

1. **Dashboard & Analytics**:
   - Total Net Balance, Monthly Inflows, Monthly Expenses, and Net Savings Rate.
   - Dynamic Recharts: 6-Month Income vs. Expenses Bar Chart, Category Expense Donut Chart, and Daily Velocity Trend.
   - Real-time Budget Utilization Progress Bar with multi-tier alerts (50%, 75%, 90%, 100%).
   - AI Month-End Run-Rate Forecast Card.

2. **Gemini AI Natural-Language Expense Parser**:
   - Converts conversational text (e.g., *"Paid 350 rupees for dinner at Domino's using UPI yesterday"*) into structured JSON.
   - Validated strictly with Zod schemas.
   - Interactive preview allowing user review before saving.

3. **Deterministic Duplicate Detection**:
   - Deterministic algorithm comparing user identity, merchant similarity, exact amounts, and dates within a 72-hour window.
   - Flags exact and probable duplicates with actionable workflows (*Keep Both*, *Delete Duplicate*, or *Mark Reviewed*).

4. **SpendSense AI Assistant (Signature Conversational Feature)**:
   - Live AI Financial Chatbot using **Gemini Tool/Function Calling**.
   - Backend tools: `getMonthlySummary`, `getCategorySpending`, `getTransactionHistory`, `compareMonthlySpending`, `getBudgetStatus`, `getTopExpenses`, `getSpendingProjection`, `getGroupBalances`.
   - Security-enforced: User context is derived exclusively from authenticated tokens; arbitrary queries or cross-user leaks are impossible.
   - Returns markdown answers with dynamic embedded UI cards.

5. **Shared Expenses & Roommates (Splitwise-Style)**:
   - Apartment and group management with member email invites.
   - Equal, exact, and percentage bill splitting.
   - Graph debt simplification algorithm to determine minimal settlement transfers.
   - Settlement tracking and Socket.IO real-time group updates.

6. **Budgets & AI Recommendations**:
   - Monthly budget and category caps.
   - Historical spending analysis over past 3 months to generate recommended category limits with a safety buffer.

7. **Reports & Exports**:
   - Downloadable, branded PDF financial reports generated via **PDFKit**.
   - One-click CSV exports of transaction histories via **PapaParse**.
   - Weekly, monthly, and annual reporting cadences.

8. **In-App Notification Center**:
   - Threshold warnings (75%, 90%, 100%), duplicate alerts, group expense notifications, and payment receipts.

9. **Security, Privacy & Data Portability**:
   - JWT authentication, bcrypt password hashing, Helmet headers, CORS, and tiered rate limiters.
   - Data portability: Download full personal data archive in JSON format.
   - Account deletion and financial record wipe options.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router DOM v6, Axios, Recharts, Lucide React, React Hot Toast, React Hook Form, Zod.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JSON Web Tokens (JWT), bcryptjs, Multer, PapaParse, PDFKit, Socket.IO, Helmet, Express Rate Limit.
- **Generative AI**: Official Google GenAI JavaScript SDK (`@google/generative-ai`), Gemini Structured JSON Output, Gemini Tool/Function Calling.
- **Testing**: Jest, Supertest, MongoMemoryServer.

---

## 📁 Repository Structure

```
spendsense/
├── client/                     # Vite React Frontend
│   ├── src/
│   │   ├── components/         # Modals, MetricCards, Chart renderers
│   │   ├── context/            # AuthContext, CurrencyContext, SocketContext
│   │   ├── layouts/            # DashboardLayout (Sidebar & TopNav)
│   │   ├── pages/              # Overview, Transactions, Budgets, AI Assistant, etc.
│   │   ├── services/           # Axios API client
│   │   ├── App.jsx             # React Router route tree
│   │   └── main.jsx            # React root & providers
│   ├── .env.example
│   └── package.json
│
├── server/                     # Express Node.js Backend
│   ├── config/                 # Database connection & constants
│   ├── controllers/            # Auth, Transaction, Budget, AI, Group, Report controllers
│   ├── middleware/             # Auth guard, error handler, rate limiters, Zod validator
│   ├── models/                 # Mongoose schemas (User, Transaction, Budget, Group, etc.)
│   ├── routes/                 # REST API routes
│   ├── services/               # Deterministic calculation engines & Gemini SDK service
│   ├── tests/                  # Jest & Supertest test suite
│   ├── utils/                  # Seed script, date helpers, currency helpers
│   ├── app.js                  # Express application setup
│   ├── server.js               # HTTP & Socket.IO server listener
│   ├── .env.example
│   └── package.json
│
├── docs/                       # Architectural & API Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── DATABASE.md
│
├── package.json                # Root monorepo scripts
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/spendsense`) or MongoDB Atlas URI
- **Google Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/)

---

### 2. Environment Configuration

#### Backend (`server/.env`):
Create `server/.env` (copy from `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/spendsense
JWT_SECRET=spendsense_jwt_super_secure_secret_key_2026
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
CLIENT_URL=http://localhost:5173
```

#### Frontend (`client/.env`):
Create `client/.env` (copy from `client/.env.example`):
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Installation

Install dependencies for both the backend and frontend:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

---

### 4. Seed Development Data (Optional but Recommended)
Populate the database with realistic demo accounts, transactions, budgets, and roommate expense groups:
```bash
cd server
npm run seed
```
**Demo Account Credentials:**
- Email: `demo@spendsense.ai`
- Password: `password123`

*(You can also use the 1-click **"Demo Login"** button on the sign-in page!)*

---

### 5. Running the Application

Open two terminal windows:

#### Terminal 1 – Start Backend:
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

#### Terminal 2 – Start Frontend:
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Running Automated Tests

SpendSense AI includes a complete Jest and Supertest test suite covering authentication, cross-user authorization restrictions, budget utilization, duplicate detection, roommate debt settlements, and PDF report buffer generation:

```bash
cd server
npm test
```

**Test Suite Coverage:**
```
PASS tests/sharedExpense.test.js
PASS tests/transaction.test.js
PASS tests/budget.test.js
PASS tests/auth.test.js
PASS tests/report.test.js
PASS tests/aiParser.test.js

Test Suites: 6 passed, 6 total
Tests:       18 passed, 18 total
```

---

## 🌐 Production Deployment Guide

### Frontend Deployment (Vercel)
1. Push your repository to GitHub.
2. Link the repository to **Vercel**.
3. Set **Root Directory** to `client`.
4. Configure Build Command: `npm run build` and Output Directory: `dist`.
5. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`

### Backend Deployment (Render)
1. Create a new **Web Service** on **Render**.
2. Set **Root Directory** to `server`.
3. Set **Build Command**: `npm install`.
4. Set **Start Command**: `node server.js`.
5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/spendsense?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<your_secure_jwt_secret>`
   - `GEMINI_API_KEY`: `<your_gemini_api_key>`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`

---

## 📄 License
MIT License. Built for portfolio and engineering demonstration.
