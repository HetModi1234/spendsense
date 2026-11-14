# SpendSense AI – Database Architecture & Schema Specification

SpendSense AI uses **MongoDB** with **Mongoose ODM** for strict schema validation, deterministic referencing, automated timestamps, and compound indexing for high-performance financial queries.

---

## 1. Entity-Relationship Overview

```
 ┌─────────────┐       1:N       ┌─────────────────┐
 │    User     ├────────────────►│   Transaction   │
 └──────┬──────┘                 └─────────────────┘
        │
        │ 1:N                    ┌─────────────────┐
        ├───────────────────────►│     Budget      │
        │                        └─────────────────┘
        │
        │ 1:N                    ┌─────────────────┐
        ├───────────────────────►│ AIConversation  │
        │                        └─────────────────┘
        │
        │ 1:N                    ┌─────────────────┐
        ├───────────────────────►│  Notification   │
        │                        └─────────────────┘
        │
        │ N:M (via members)      ┌─────────────────┐       1:N       ┌─────────────────┐
        └───────────────────────►│      Group      ├────────────────►│  SharedExpense  │
                                 └────────┬────────┘                 └─────────────────┘
                                          │ 1:N
                                          ▼
                                 ┌─────────────────┐
                                 │   Settlement    │
                                 └─────────────────┘
```

---

## 2. Model Schemas

### 2.1 User (`server/models/User.js`)
Stores authenticated user credentials, default currency preferences, and income targets.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Auto-generated user ID |
| `name` | String | Required, Trim, Max: 50 | Full name |
| `email` | String | Required, Unique, Lowercase, Indexed | Login email |
| `passwordHash` | String | Required | Bcrypt salt hash (10 rounds) |
| `avatar` | String | Default: '' | Profile picture URL |
| `currency` | String | Default: 'INR', Uppercase | Default ISO currency code |
| `monthlyIncome` | Number | Default: 0, Min: 0 | User base monthly income target |
| `monthlyBudget` | Number | Default: 0, Min: 0 | Default monthly budget target |
| `timezone` | String | Default: 'Asia/Kolkata' | User timezone |
| `preferences` | Object | Nested | UI theme, firstDayOfMonth, preferredCategories |
| `resetPasswordToken`| String | Optional | Hashed password reset token |
| `resetPasswordExpire`| Date | Optional | Expiry timestamp (30 mins) |
| `createdAt`, `updatedAt`| Date | Auto | Audit timestamps |

**Indexes:**
- `{ email: 1 }` (Unique)

---

### 2.2 Transaction (`server/models/Transaction.js`)
Stores individual income and expense records. Supports recurring rules and duplicate detection metadata.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Transaction unique identifier |
| `userId` | ObjectId | Ref: 'User', Required, Indexed | Record owner |
| `type` | String | Enum: ['income', 'expense'], Required | Flow direction |
| `amount` | Number | Required, Min: 0.01 | Transaction value |
| `currency` | String | Default: 'INR', Uppercase | Currency code |
| `category` | String | Required, Indexed | Expense/Income category |
| `merchant` | String | Default: '', Trim | Vendor or payee name |
| `description` | String | Required, Trim | Line item description |
| `date` | Date | Default: Date.now, Indexed | Transaction date |
| `paymentMethod` | String | Enum: ['UPI', 'Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other'] | Mode of payment |
| `notes` | String | Default: '' | Additional remarks |
| `isRecurring` | Boolean | Default: false | Repeats automatically |
| `recurringFrequency`| String | Enum: ['daily', 'weekly', 'monthly', 'yearly', 'none'] | Cadence |
| `tags` | [String]| Default: [] | User-defined tags |
| `duplicateStatus` | String | Enum: ['none', 'potential', 'reviewed'], Default: 'none' | Duplicate state |
| `potentialDuplicateOf`| ObjectId | Ref: 'Transaction', Default: null | Candidate match |

**Indexes:**
- `{ userId: 1, date: -1 }` (Optimal for chronological statements)
- `{ userId: 1, category: 1 }` (Optimal for category spending rollups)
- `{ userId: 1, type: 1, date: -1 }` (Optimal for cashflow queries)

---

### 2.3 Budget (`server/models/Budget.js`)
Stores monthly total limits, category allowances, and threshold alert triggers.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Budget ID |
| `userId` | ObjectId | Ref: 'User', Required, Indexed | Budget owner |
| `month` | String | Regex: `^\d{4}-(0[1-9]\|1[0-2])$`, Required | Month identifier (e.g. "2026-11") |
| `totalBudget` | Number | Required, Min: 0 | Total monthly cap |
| `categoryBudgets` | Array | `[{ category, limit, spent }]` | Sub-category budget allocations |
| `alertsTriggered` | Array | `[{ type, category, percentage, triggeredAt }]` | History of threshold alerts |

**Indexes:**
- `{ userId: 1, month: 1 }` (Unique compound index)

---

### 2.4 Group (`server/models/Group.js`)
Manages roommate and shared expense clusters.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Group ID |
| `name` | String | Required, Max: 100 | Group title |
| `description` | String | Default: '' | Group notes |
| `currency` | String | Default: 'INR' | Default group currency |
| `createdBy` | ObjectId | Ref: 'User', Required | Group administrator |
| `members` | Array | Embedded subdocuments | `[{ userId, name, email, avatar, role, status, joinedAt }]` |

**Indexes:**
- `{ 'members.userId': 1 }`
- `{ 'members.email': 1 }`

---

### 2.5 SharedExpense (`server/models/SharedExpense.js`)
Tracks shared expenses with equal, exact, or percentage splitting.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Shared expense ID |
| `groupId` | ObjectId | Ref: 'Group', Required, Indexed | Target group |
| `title` | String | Required, Trim | Line item title |
| `amount` | Number | Required, Min: 0.01 | Total expense amount |
| `paidBy` | ObjectId | Ref: 'User', Required, Indexed | Who paid upfront |
| `splitType` | String | Enum: ['equal', 'exact', 'percentage'] | Algorithm used |
| `splits` | Array | `[{ userId, amount, percentage }]` | Member split shares |
| `date` | Date | Default: Date.now, Indexed | Date of expense |
| `createdBy` | ObjectId | Ref: 'User', Required | Submitter |

**Indexes:**
- `{ groupId: 1, date: -1 }`

---

### 2.6 Settlement (`server/models/Settlement.js`)
Records debt settlements between group members to resolve balances.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Settlement ID |
| `groupId` | ObjectId | Ref: 'Group', Required, Indexed | Target group |
| `payerId` | ObjectId | Ref: 'User', Required, Indexed | Debtor paying |
| `payeeId` | ObjectId | Ref: 'User', Required, Indexed | Creditor receiving |
| `amount` | Number | Required, Min: 0.01 | Settled amount |
| `paymentMethod` | String | Default: 'UPI' | Mode of settlement |
| `status` | String | Enum: ['pending', 'settled'] | Status |
| `settledAt` | Date | Default: Date.now | Settlement timestamp |

---

### 2.7 AIConversation (`server/models/AIConversation.js`)
Maintains conversational history, tool invocations, and interactive UI card payloads.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Conversation thread ID |
| `userId` | ObjectId | Ref: 'User', Required, Indexed | Account owner |
| `title` | String | Default: 'Financial Chat' | Thread title |
| `messages` | Array | `[{ role, content, timestamp, toolCalls: [], cards: [] }]` | Message stream |

---

### 2.8 Notification (`server/models/Notification.js`)
In-app notification records for budget thresholds, duplicate alerts, and shared expenses.

| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Notification ID |
| `userId` | ObjectId | Ref: 'User', Required, Indexed | Recipient |
| `type` | String | Enum: NOTIFICATION_TYPES | Notification category |
| `title` | String | Required | Header title |
| `message` | String | Required | Body text |
| `data` | Mixed | Default: {} | Contextual metadata |
| `isRead` | Boolean | Default: false, Indexed | Read receipt |

**Indexes:**
- `{ userId: 1, isRead: 1, createdAt: -1 }`
