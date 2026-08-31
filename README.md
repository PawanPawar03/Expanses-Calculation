# 🏠 WHITEHOUSE — Shared Household Expense Management System

> **“Simple. Transparent. Shared Expenses.”**

**Whitehouse** is a production-ready, modern, full-stack shared household expense management web application built with **React.js (Vite + TypeScript + Tailwind CSS)** and a **Node.js / Express + SQLite** backend with full Indian Standard Time (**IST / Asia/Kolkata**) timezone support, role-based access control (**Admin vs Member**), visual analytics, and audit history.

---

## ✨ Key Features

- 🔐 **Secure Role-Based Authentication & Authorization**
  - **Admin**: Complete control over all members, master expenses, category management, editable site branding & settings, and immutable audit trails.
  - **Member / User**: View profile, add shared expenses, inspect personal contributions, view member balances, explore reports and transaction details.
- 🕒 **Strict Indian Standard Time (IST / Asia/Kolkata) Engine**
  - Internal timestamps stored in UTC ISO format.
  - Live header clock and all displayed dates/times formatted in `Asia/Kolkata` (e.g. `31 Aug 2026, 04:05 PM IST`).
  - Dynamic today and monthly boundary calculations strictly adhere to Indian calendar dates (+05:30).
- 💸 **Household Expense Tracking**
  - Record item name (e.g., `Chapati & Dinner`), amount (₹ with decimal support), payer selection, category, shop/vendor, description, and custom/current IST date & time.
  - Separate tracking for **Paid By** (payer) vs. **Added By** (logged-in creator).
  - Multi-facet filters: Preset ranges (*Today, Yesterday, Last 7 Days, This Month, Last Month*), Member filter, Category filter, Amount sort, and instant search.
  - 1-Click **CSV Export** for transaction logs and financial summaries.
- 📊 **Dynamic Visual Analytics & Reports**
  - **Member-wise Spending**: Interactive bar chart comparing member payments.
  - **Category Breakdown**: Donut chart of spend across Food, Grocery, Rent, Electricity, Internet, etc.
  - **Monthly Spend Velocity**: Year-to-date monthly trend line/area chart.
  - **Daily Spending**: 14-day spending timeline.
  - **Settlement Matrix**: Dynamic matrix calculating total paid, % share, today's spend, and month-to-date per member.
- 📜 **Full Audit Logging System**
  - Immutable activity tracking for additions, updates, deletions, and member status changes with user identity and exact IST timestamps.
- 📱 **100% Responsive Design**
  - Smoothly adapts from 4K/Desktop down to tablet and mobile screens with touch-friendly cards, drawer navigation, and compact layouts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, date-fns, date-fns-tz |
| **Backend** | Node.js, Express.js, TypeScript, better-sqlite3, jsonwebtoken, bcryptjs, zod |
| **Database** | Embedded SQLite (`whitehouse.db`) with Foreign Keys, WAL journal mode, and index optimizations |
| **Timezone** | `Asia/Kolkata` (IST, UTC+05:30) |

---


---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

### 2. Installation
From the project root directory (`Expance Calculation/`):

```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

Or install separately:
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 3. Database Initialization & Seed
Pre-populate the SQLite database with the demo household members, default categories, and sample shared expenses:

```bash
npm run seed
```

*(Or from `server/`: `npm run seed`)*

### 4. Run in Development Mode
Start both backend (Port 5000) and frontend (Port 3000) concurrently:

```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

---

## 🔌 API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new household member (role `USER`).
- `POST /api/auth/login` — Sign in with email and password, receives JWT token.
- `GET /api/auth/me` — Retrieve currently authenticated user profile.
- `POST /api/auth/change-password` — Change password for current logged-in user.

### Expenses (`/api/expenses`)
- `GET /api/expenses` — List expenses with filters (`preset`, `startDate`, `endDate`, `memberId`, `categoryId`, `sortBy`, `search`, `page`, `limit`).
- `GET /api/expenses/:id` — Get single expense details with creator & payer metadata.
- `POST /api/expenses` — Create a new expense (auto-captures IST date/time and creator).
- `PUT /api/expenses/:id` — Edit existing expense (Admin or creator).
- `DELETE /api/expenses/:id` — Soft delete expense (Admin only).

### Members & Users (`/api/users`)
- `GET /api/users` — List active household members with aggregate total paid sums.
- `GET /api/users/:id` — Retrieve member profile, stats (total paid, this month, today), and member expense history.
- `POST /api/users` — Admin create member with role and status.
- `PUT /api/users/:id` — Update member profile.
- `PATCH /api/users/:id/status` — Admin toggle `ACTIVE` / `INACTIVE` status.
- `DELETE /api/users/:id` — Admin soft-delete member.

### Reports & Analytics (`/api/reports`)
- `GET /api/reports/summary` — Key KPI numbers (*Total Members, Active Members, Total Expenses, Today's Spend IST, This Month Spend IST, Total Paid Out*).
- `GET /api/reports/members` — Overall member matrix table (*Member, Count, Total, This Month, Today, % Share*).
- `GET /api/reports/categories` — Category-wise spend distribution.
- `GET /api/reports/monthly` — 12-month spending trend for current year.
- `GET /api/reports/daily` — 14-day spending timeline in IST.

### Categories (`/api/categories`)
- `GET /api/categories` — List active categories.
- `POST /api/categories` — Admin add new category.
- `PUT /api/categories/:id` — Admin edit category.
- `DELETE /api/categories/:id` — Admin deactivate/delete category.

### Audit Logs (`/api/audit-logs`)
- `GET /api/audit-logs` — Admin list of all system actions, user names, old/new values, and IST timestamps.

### Settings (`/api/settings`)
- `GET /api/settings` — Get website name, tagline, currency symbol, registration policy.
- `PUT /api/settings` — Admin update application settings and branding.

---

## 📦 Production Build & Deployment

### 1. Build Both Client and Server
```bash
npm run build
```

This compiles:
- Backend TypeScript into `server/dist/`
- Frontend React bundle into `client/dist/` (which the Express server automatically serves statically)

### 2. Start Production Server
```bash
npm start
```
The server serves both the full REST API and the production-optimized React single page application on `http://localhost:5000`.

---

## 🔒 Security & Best Practices

- **Password Hashing**: BCrypt with salt rounds (10) for all user and admin accounts.
- **JWT Authentication**: Stateles JSON Web Tokens with expiry and server-side user status verification on every request.
- **Role Guards**: Backend API middleware strictly prevents normal members from accessing admin routes.
- **Data Integrity**: Soft deletes prevent accidental loss of historical expense calculations.
- **Audit Trails**: Critical actions record user ID, user name, event description, and timestamp.

---

## 📄 License
MIT License. Built for **Whitehouse Shared Household Expense Management**.
