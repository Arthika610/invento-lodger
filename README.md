# InventoLedger (24091A3215, 24091A3222)
## Multi-Branch Retail Inventory System

> **Live Reference Design:** [https://invento-select-role.lovable.app](https://invento-select-role.lovable.app)  
> **Local Live Demo URL:** [http://localhost:3000](http://localhost:3000)

---

## 📌 Problem Statement
Retail chains struggle to track stock consistently across branches, causing overstocking or shortages. **InventoLedger** provides a transaction-safe database, consolidated analytics pipelines, demand prediction, a full-stack dashboard, and race-condition-safe concurrent updates — deployable entirely on free hosting.

---

## 🏛️ System Architecture & Five Core Modules

```mermaid
graph TD
    A[Frontend SPA / Vanilla CSS & JS] -->|REST API| B[Node.js / FastAPI HTTP Server]
    B --> C[OS Module: Mutex Lock Registry]
    C --> D[DBMS Module: ACID Relational SQLite/PostgreSQL Engine]
    D --> E[Transaction Ledger & Branch Inventory]
    D --> F[Data Engineering Module: Multi-Branch ETL Pipeline]
    F --> G[Analytics Data Warehouse Cubes]
    G --> H[ML Module: Demand Forecasting & Safety Stock Model]
    H --> A
```

### 1. 🗄️ DBMS Module
- **Transaction-Safe Relational Schema**: Enforces strict ACID compliance, foreign keys, non-negative stock constraints (`stock_quantity >= 0`), and atomic multi-table writes.
- **Relational Tables**:
  - `branches`: Multi-branch locations, codes, managers, contact details.
  - `products`: Master product catalog with SKU, category, price, cost, min reorder level.
  - `inventory`: Composite key (`product_id`, `branch_id`) tracking stock and reserved units.
  - `sales` & `sale_items`: Point-of-sale customer and counter orders.
  - `purchases` & `purchase_items`: Inbound supplier restock orders.
  - `transfers`: Inter-branch relocation orders requiring dual-branch atomic updates.
  - `transaction_ledger`: Immutable audit log recording every inventory modification, before/after balances, user IDs, and timestamps.
  - `alerts`: Automatic low-stock and zero-stock alerts.

### 2. 📊 Data Engineering Module (ETL Pipeline)
- **Extract**: Extracts raw operational transaction logs across sales, purchases, and transfers.
- **Transform**: Aggregates sales by date and branch, calculates 7-day and 30-day velocity moving averages, standard deviation of demand, and revenue metrics.
- **Load**: Upserts into analytics data warehouse tables (`analytics_daily_sales`, `analytics_product_velocity`).
- **Pipeline Runner**: Built-in scheduler and interactive manual trigger with execution duration metrics and step-by-step logs.

### 3. 🤖 ML Module (Demand Forecasting & Restock Recommender)
- **Time-Series Demand Prediction**: Evaluates historical sales velocity with exponential smoothing.
- **Safety Stock Formula**:
  $$\text{Safety Stock} = Z \times \sigma_d \times \sqrt{L}$$
  * $Z = 1.65$ (95% service level confidence coefficient)
  * $\sigma_d =$ Standard deviation of daily demand
  * $L =$ Lead time in days ($L = 3$)
- **Restock Recommendation**:
  $$\text{Recommended Restock} = \max(0, (\text{Predicted 7D Demand} + \text{Safety Stock}) - \text{Current Stock})$$
- Generates risk priority levels (**HIGH**, **MEDIUM**, **LOW**) and offers 1-click draft Purchase Order creation.

### 4. ⚡ OS Module (Mutex Synchronization & Concurrency Simulator)
- **Critical Section Problem**: Solves the Lost Update anomaly and race condition hazard when multiple branches deduct from shared stock simultaneously.
- **Interactive Simulator**:
  - **With Mutex Lock**: Threads acquire resource lock, enter critical section, atomically verify balance, decrement stock, and release lock. Guarantees 100% serializability and exact balance consistency.
  - **Without Mutex**: Simultaneous unsynchronized read-modify-write causes lost updates and overselling below 0.
  - **Live Visualization**: Displays Mutex Lock state (`LOCKED` / `UNLOCKED`), thread pool queue, execution stream, and balance verification.

### 5. 💻 Full-Stack Module (Frontend, API & Dashboards)
- **Frontend Design**: Replicates `https://invento-select-role.lovable.app` using dark glassmorphism, responsive cards, interactive SVG charts (Area, Bar, Donut), and zero external dependencies.
- **Three User Roles**:
  1. **Admin**: Full executive dashboard (Overview, Branches, Catalog, Inventory Matrix, Sales, Ledger, Transfers, Purchases, ETL, ML Predictions, Alerts, Reports, Customers, OS Mutex Lab).
  2. **Branch Manager**: Scoped strictly to assigned branch inventory, local sales POS, and transfer requests.
  3. **Customer**: Multi-branch storefront showing live stock per branch, shopping cart, and transaction-safe checkout.
- **Dual Backend Options**:
  - Pure Node.js zero-dependency HTTP REST API (`server.js`).
  - Python FastAPI backend with SQLAlchemy (`backend_python/main.py`).

---

## 🔑 Authentication Credentials

| Role | Email | Password | Assigned Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `pandu@gmail.com` | `Pandu@610` | Full System Access |
| **Manager (Branch A)** | `arthika@gmail.com` | `Arthika@610` | Branch A (Mumbai) |
| **Manager (Branch B)** | `balaji@gmail.com` | `Balaji@610` | Branch B (Bengaluru) |
| **Manager (Branch C)** | `pandu.mgr@gmail.com` | `Pandu@610` | Branch C (New Delhi) |
| **Manager (Branch D)** | `lakshmipathi@gmail.com` | `Lakshmipathi@610` | Branch D (Chennai) |
| **Manager (Branch E)** | `reni@gmail.com` | `Reni@610` | Branch E (Kolkata) |
| **Customer** | `customer@inventoledger.com` | `Customer@123` | Retail Storefront |

---

## 🚀 How to Run Locally

### Option 1: 1-Click Launch (Windows)
Double-click `start.bat` in the project directory. It starts the server and automatically opens `http://localhost:3000` in your default browser.

### Option 2: Command Line (Node.js)
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000).

### Option 3: Python FastAPI Backend
```bash
cd backend_python
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## ☁️ Free-Tier Cloud Deployment Guide

### A. Deploy Frontend on Vercel
1. Connect GitHub repository to [Vercel](https://vercel.com).
2. Root directory: `./`
3. Vercel automatically detects `vercel.json` and deploys both static frontend and serverless API endpoints for free.

### B. Deploy Backend on Render
1. Create a **New Web Service** on [Render](https://render.com).
2. Connect your repository.
3. Select Environment: `Node` (or `Docker`).
4. Build Command: leave empty or `npm install`.
5. Start Command: `node server.js`.
6. Select **Free Instance Type**.

### C. Free-Tier PostgreSQL (Supabase / Neon)
1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Run `database/schema.sql` and `database/seed.sql` in the SQL Editor.
3. Set `DATABASE_URL=postgres://user:password@host/dbname` in Render environment variables.

---

## 👥 Authors
- **24091A3215**
- **24091A3222**
