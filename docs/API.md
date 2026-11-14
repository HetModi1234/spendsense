# SpendSense AI – REST API Documentation

All API requests must include the header:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a new user account.
```json
// Request Body
{
  "name": "Het Modi",
  "email": "het@example.com",
  "password": "password123",
  "currency": "INR",
  "monthlyIncome": 85000,
  "monthlyBudget": 50000
}
```

### `POST /api/auth/login`
Authenticates a user and issues a JWT token.
```json
// Request Body
{
  "email": "het@example.com",
  "password": "password123"
}
```

### `GET /api/auth/me`
Fetches the current authenticated user profile.

### `POST /api/auth/forgot-password`
Generates a secure password reset token.

### `POST /api/auth/reset-password/:token`
Resets password using valid token.

---

## 2. Transactions (`/api/transactions`)

### `GET /api/transactions`
Retrieves paginated and filtered transactions.
- Query Parameters:
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
  - `search` (string)
  - `category` (string)
  - `type` ('income' | 'expense')
  - `paymentMethod` (string)
  - `startDate`, `endDate` (ISO date string)
  - `sortBy` ('date' | 'amount', default: 'date')
  - `sortOrder` ('asc' | 'desc', default: 'desc')

### `POST /api/transactions`
Creates a transaction and executes deterministic duplicate detection.
```json
// Request Body
{
  "type": "expense",
  "amount": 450,
  "currency": "INR",
  "category": "Food",
  "merchant": "Swiggy",
  "description": "Lunch order",
  "date": "2026-11-14",
  "paymentMethod": "UPI",
  "notes": "With team"
}
```

### `PUT /api/transactions/:id`
Updates an existing transaction (enforces user ownership).

### `DELETE /api/transactions/:id`
Deletes a transaction.

### `GET /api/transactions/duplicates`
Returns all potential duplicate candidate pairs.

### `PATCH /api/transactions/:id/duplicate-status`
Updates duplicate review status (`'reviewed'` | `'none'`).

### `POST /api/transactions/import`
Processes CSV rows, validates schema, identifies duplicates, and persists records.

---

## 3. Dashboard (`/api/dashboard`)

### `GET /api/dashboard/summary`
Returns top-level KPIs (Total Balance, Monthly Inflow, Monthly Outflow, Net Savings, Budget Utilization, Top Category, Forecast run-rate).
- Query Parameter: `month=YYYY-MM`

### `GET /api/dashboard/charts`
Returns 6-month cashflow history, category expenditure distribution, and daily run-rate velocity.

### `GET /api/dashboard/recent-transactions`
Returns the 6-10 most recent transactions.

---

## 4. Budgets (`/api/budgets`)

### `GET /api/budgets`
Retrieves monthly budget target, category allowances, and actual spent values.
- Query Parameter: `month=YYYY-MM`

### `POST /api/budgets`
Creates or updates a monthly budget.
```json
{
  "month": "2026-11",
  "totalBudget": 50000,
  "categoryBudgets": [
    { "category": "Food", "limit": 10000 },
    { "category": "Housing", "limit": 20000 }
  ]
}
```

### `GET /api/budgets/recommendations`
Returns AI-computed budget allocations based on 3-month historical averages.

---

## 5. Generative AI (`/api/ai`)

### `POST /api/ai/parse-expense`
Extracts structured JSON transaction entities from natural language text using Gemini structured output.
```json
// Request Body
{
  "text": "Paid 350 rupees for dinner at Domino's using UPI yesterday"
}

// Response
{
  "success": true,
  "data": {
    "type": "expense",
    "amount": 350,
    "currency": "INR",
    "description": "Dinner at Domino's",
    "merchant": "Domino's",
    "category": "Food",
    "paymentMethod": "UPI",
    "date": "2026-11-13"
  }
}
```

### `POST /api/ai/chat`
Conversational chat with SpendSense AI Assistant using tool calling.
```json
// Request Body
{
  "message": "Where did most of my money go this month?",
  "conversationId": "optional_id"
}
```

### `POST /api/ai/insights`
Calculates month-over-month category variance and generates natural language narrative.

### `POST /api/ai/forecast`
Computes mathematical projection: `(current spend / elapsed days) * total days in month`.

---

## 6. Shared Expenses & Groups (`/api/groups`)

### `GET /api/groups`
Lists all groups where user is a member.

### `POST /api/groups`
Creates a group with member invites.

### `GET /api/groups/:id`
Returns group overview, member balances, expenses, and simplified settlements.

### `POST /api/groups/:id/expenses`
Adds a shared bill with equal, exact, or percentage splits.

### `POST /api/groups/:id/settlements`
Records a debt settlement between two members.

---

## 7. Reports & Exports (`/api/reports`)

### `GET /api/reports/weekly`
Weekly financial report data.

### `GET /api/reports/monthly?month=YYYY-MM`
Monthly report data.

### `GET /api/reports/annual?year=YYYY`
Annual financial report data.

### `GET /api/reports/export/csv`
Streams CSV file attachment of transactions.

### `GET /api/reports/export/pdf`
Streams branded PDF report generated via PDFKit.

---

## 8. Notifications (`/api/notifications`)

### `GET /api/notifications`
Lists notifications with `unreadCount`.

### `PATCH /api/notifications/read-all`
Marks all notifications as read.

### `PATCH /api/notifications/:id/read`
Marks single notification as read.

### `DELETE /api/notifications/:id`
Deletes a notification.

---

## 9. Settings (`/api/settings`)

### `GET /api/settings`
Returns user preferences and profile.

### `PUT /api/settings`
Updates user preferences, currency, and defaults.

### `GET /api/settings/export-data`
Downloads complete personal data JSON export.

### `DELETE /api/settings/financial-data`
Deletes all transactions and budgets while preserving the account.

### `DELETE /api/settings/account`
Irrevocably deletes user account and all records.
