# 🏠 Whitehouse — Shared Household Expense Management System

A modern, full-stack, enterprise-grade **Expense Management Web Application** designed for tracking and managing shared household expenses among flatmates and families with real-time analytics in **Indian Standard Time (IST / Asia/Kolkata)**.

---

## ⚡ Tech Stack

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router
* **Backend API**: Python 3.12+, **Django 5.x**, **Django REST Framework (DRF)**, SimpleJWT, Gunicorn, Whitenoise
* **Database**: **PostgreSQL 16** (Configured for **Amazon RDS** with Multi-AZ support)
* **Cloud & Hosting**: **Amazon Web Services (AWS)** — Amazon RDS, AWS App Runner / EC2, Amazon S3, AWS CloudFront
* **CI/CD & DevOps**: **GitHub Actions** workflows for automated testing, linting, Docker builds, and cloud deployment

---

## 📂 Clean Project Architecture

```
Expanses-Calculation/
├── .github/
│   └── workflows/
│       ├── django-ci.yml             # Automated Django test pipeline on PR & push
│       └── aws-deploy.yml            # Automated Docker build & AWS deploy workflow
├── aws/
│   └── README_AWS_DEPLOYMENT.md      # Step-by-step Amazon RDS & AWS deployment guide
├── client/                           # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/               # Layout, UI components, charts, modals
│   │   ├── context/                  # AuthContext & AppContext (live state & polling)
│   │   ├── pages/                    # Auth, User Dashboard, Admin Console pages
│   │   ├── lib/                      # API client, IST time formatters, mock DB
│   │   └── types/                    # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── server/                           # Django REST Framework Backend API
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml            # Multi-container setup with PostgreSQL
│   ├── .env.example
│   ├── whitehouse_core/              # Django core settings, URLs, WSGI, ASGI
│   └── apps/
│       ├── authentication/           # Custom User model, SimpleJWT, Login, Register
│       ├── categories/               # Expense categories (Food, Grocery, Rent, etc.)
│       ├── expenses/                 # Shared expense transactions with IST tracking
│       ├── members/                  # User/member management, stats, soft-delete
│       ├── reports/                  # Aggregations, monthly & daily spending trends
│       ├── audit/                    # Enterprise audit trails & logging
│       └── settings_app/             # Dynamic app configuration
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Run Django Backend with PostgreSQL (Docker Compose)
```bash
cd server
docker-compose up --build
```
The Django REST Framework API will run on `http://localhost:8000/api/` and PostgreSQL 16 on port `5432`.

---

### 2. Run Django Backend Locally (Python Virtualenv)
```bash
cd server
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_db
python manage.py runserver 8000
```

---

### 3. Run React Frontend Locally
```bash
cd client
npm install
npm run dev
```
The React development server will start on `http://localhost:5173`.

---

## 🔑 Default Clean Accounts

| Account | Email / Username | Password | Role | Access Level |
|---|---|---|---|---|
| **Admin** | `admin@whitehouse.com` *(or `admin`)* | `admin123` | `ADMIN` | Full Administrative Console & Reports |
| **Pawan** | `pawan@whitehouse.com` *(or `pawan`)* | `pawan123` | `USER` | Member Dashboard & Expense Logging |

---

## ☁️ AWS & Amazon RDS Deployment

For step-by-step instructions on setting up **Amazon RDS PostgreSQL** and deploying via **AWS App Runner** or **AWS EC2**, refer to:
👉 **[`aws/README_AWS_DEPLOYMENT.md`](./aws/README_AWS_DEPLOYMENT.md)**

---

## 🧪 Running Automated Tests
```bash
cd server
python manage.py test
```
All 5 test suites (Auth, JWT, Expenses, Reports, Health) will execute automatically.
