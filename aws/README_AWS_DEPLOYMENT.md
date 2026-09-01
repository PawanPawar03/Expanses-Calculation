# 🚀 AWS + Amazon RDS + Django REST Framework Deployment Guide

This guide walks you through deploying the **Whitehouse Expense Management** system to **Amazon Web Services (AWS)** using **Amazon RDS (PostgreSQL)** and **AWS App Runner / EC2**.

---

## 📋 Architecture Overview

* **Frontend**: React 18 + TypeScript + Vite (Hosted on AWS CloudFront / S3 or GitHub Pages)
* **Backend API**: Python 3 + Django 5 + Django REST Framework + Gunicorn
* **Database**: Amazon RDS PostgreSQL 16 (Multi-AZ / Free Tier `db.t4g.micro`)
* **CI/CD**: GitHub Actions automated pipeline

---

## 🐘 PART 1: Create Amazon RDS PostgreSQL Database (5 Minutes)

1. Open the [AWS Management Console](https://console.aws.amazon.com/) and navigate to **RDS**.
2. Click **Create database**.
3. Configure the database options:
   - **Database creation method**: *Standard create*
   - **Engine type**: *PostgreSQL*
   - **Engine Version**: *PostgreSQL 16.x*
   - **Templates**: *Free tier*
   - **DB instance identifier**: `whitehouse-rds-postgres`
   - **Master username**: `postgres`
   - **Master password**: *[Choose a strong password, e.g. `WhiteHousePass2026!`]*
   - **DB instance class**: `db.t4g.micro` or `db.t3.micro`
   - **Storage**: 20 GiB (gp3 / gp2)
   - **Public access**: *Yes* (or *No* if inside private VPC with EC2)
   - **VPC security group**: Create new or select existing (ensure Inbound Rule allows TCP port `5432` from your IP or `0.0.0.0/0` with secure password)
   - **Initial database name** (under *Additional configuration*): `whitehouse_db`
4. Click **Create database** and wait 3–5 minutes until status changes to **Available**.
5. Copy your **RDS Endpoint** (e.g. `whitehouse-rds-postgres.c7xxxxxx.ap-south-1.rds.amazonaws.com`).

Your connection string will be:
```
postgres://postgres:WhiteHousePass2026!@whitehouse-rds-postgres.c7xxxxxx.ap-south-1.rds.amazonaws.com:5432/whitehouse_db
```

---

## 🚀 PART 2: Deploy Django Backend on AWS App Runner (Recommended)

**AWS App Runner** is AWS's fully managed container service for web applications with zero server maintenance, automated scaling, and free SSL certificates.

### Step 1: Link Your GitHub Repository
1. In the AWS Console, navigate to **AWS App Runner**.
2. Click **Create service**.
3. Under **Source**, choose **Source code repository** and connect your GitHub account.
4. Select repository `PawanPawar03/Expanses-Calculation` and branch `main`.

### Step 2: Configure Build & Start
- **Runtime**: `Python 3`
- **Build command**:
  ```bash
  pip install -r server_django/requirements.txt && python server_django/manage.py collectstatic --noinput
  ```
- **Start command**:
  ```bash
  python server_django/manage.py migrate && python server_django/manage.py seed_db && gunicorn --chdir server_django whitehouse_core.wsgi:application --bind 0.0.0.0:8000 --workers 3
  ```
- **Port**: `8000`

### Step 3: Set Environment Variables
Add the following environment variables:
| Variable Key | Value |
|---|---|
| `DEBUG` | `False` |
| `SECRET_KEY` | *[Generate a 50-character random key]* |
| `DATABASE_URL` | `postgres://postgres:YourPassword@your-rds-endpoint:5432/whitehouse_db` |
| `ALLOWED_HOSTS` | `*` |

4. Click **Create & Deploy**.
5. Once deployed, App Runner will give you a default HTTPS endpoint:
   > `https://xxxxxx.ap-south-1.awsapprunner.com`

---

## 🖥️ PART 3: Alternative - Deploy on AWS EC2 (Ubuntu VM + Docker)

If you prefer full control on an AWS EC2 instance:

1. Launch an **Ubuntu 24.04 LTS** EC2 instance (`t3.micro` or `t2.micro`).
2. SSH into your instance:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```
3. Install Docker & Docker Compose:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose git
   sudo usermod -aG docker ubuntu
   ```
4. Clone the repository:
   ```bash
   git clone https://github.com/PawanPawar03/Expanses-Calculation.git
   cd Expanses-Calculation/server_django
   ```
5. Create `.env` file with your RDS PostgreSQL URL:
   ```bash
   nano .env
   ```
   Paste:
   ```ini
   DEBUG=False
   SECRET_KEY=your_production_secret_key
   ALLOWED_HOSTS=*
   DATABASE_URL=postgres://postgres:YourPass@your-rds-endpoint:5432/whitehouse_db
   ```
6. Run migrations, seeder, and launch Gunicorn:
   ```bash
   docker-compose up -d --build
   ```

---

## 🌐 PART 4: Connect React Client to AWS Backend

1. Open your live Whitehouse frontend:
   👉 **[https://pawanpawar03.github.io/Expanses-Calculation/](https://pawanpawar03.github.io/Expanses-Calculation/)**
2. Log in as **Admin** (`admin@whitehouse.com` / `admin123`).
3. Navigate to **Admin ➔ App Settings ➔ Live Cloud Backend Sync**.
4. In the **"Custom Cloud Backend URL"** input, paste your AWS App Runner or EC2 URL:
   > `https://xxxxxx.ap-south-1.awsapprunner.com`
5. Click **Save & Connect Cloud API**.

🎉 All mobile phones, laptops, and tablets across the world will now instantly sync with your **Amazon RDS PostgreSQL** database!
