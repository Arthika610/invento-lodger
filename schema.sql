-- InventoLedger - Multi-Branch Retail Inventory System
-- DBMS Module: Transaction-Safe Relational Schema
-- Authors: 24091A3215, 24091A3222

PRAGMA foreign_keys = ON;

-- 1. Branches Table
CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    manager_name TEXT NOT NULL,
    manager_email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Product Categories
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- 3. Products Catalog Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL CHECK(price >= 0),
    cost_price REAL NOT NULL CHECK(cost_price >= 0),
    min_reorder_level INTEGER NOT NULL DEFAULT 10,
    target_stock INTEGER NOT NULL DEFAULT 50,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Branch Inventory Table (Composite Unique constraint on product_id + branch_id)
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK(reserved_quantity >= 0),
    last_restocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    UNIQUE(product_id, branch_id)
);

-- 5. Users and Roles
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'BRANCH_MANAGER', 'CUSTOMER')),
    branch_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- 6. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    home_branch_id TEXT,
    total_spend REAL DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(home_branch_id) REFERENCES branches(id)
);

-- 7. Sales Table (ACID transaction master)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    branch_id TEXT NOT NULL,
    customer_id TEXT,
    customer_name TEXT,
    user_email TEXT NOT NULL,
    sale_type TEXT NOT NULL CHECK(sale_type IN ('Customer Sale', 'Admin Sale', 'POS Sale')),
    payment_method TEXT NOT NULL DEFAULT 'Credit Card',
    total_amount REAL NOT NULL CHECK(total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'Completed' CHECK(status IN ('Completed', 'Pending', 'Processing', 'Cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(branch_id) REFERENCES branches(id)
);

-- 8. Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price REAL NOT NULL CHECK(unit_price >= 0),
    subtotal REAL NOT NULL,
    FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id)
);

-- 9. Purchase Orders (Restock Supply)
CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    branch_id TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    total_amount REAL NOT NULL CHECK(total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'Completed' CHECK(status IN ('Completed', 'Pending', 'Draft', 'Shipped')),
    ordered_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(branch_id) REFERENCES branches(id)
);

-- 10. Purchase Items Table
CREATE TABLE IF NOT EXISTS purchase_items (
    id TEXT PRIMARY KEY,
    purchase_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_cost REAL NOT NULL CHECK(unit_cost >= 0),
    subtotal REAL NOT NULL,
    FOREIGN KEY(purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id)
);

-- 11. Inter-Branch Transfers Table
CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY,
    source_branch_id TEXT NOT NULL,
    target_branch_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    status TEXT NOT NULL DEFAULT 'Completed' CHECK(status IN ('Requested', 'In Transit', 'Completed', 'Rejected')),
    requested_by TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY(source_branch_id) REFERENCES branches(id),
    FOREIGN KEY(target_branch_id) REFERENCES branches(id),
    FOREIGN KEY(product_id) REFERENCES products(id),
    CHECK(source_branch_id <> target_branch_id)
);

-- 12. Transaction Ledger (Immutable Audit Log for ACID traceability)
CREATE TABLE IF NOT EXISTS transaction_ledger (
    id TEXT PRIMARY KEY,
    txn_ref_id TEXT,
    txn_type TEXT NOT NULL CHECK(txn_type IN ('Customer Sale', 'Admin Sale', 'POS Sale', 'Purchase', 'Transfer', 'Stock Adjustment')),
    branch_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    qty_change INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(branch_id) REFERENCES branches(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);

-- 13. Stock Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    branch_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('out', 'low')),
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_resolved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(branch_id) REFERENCES branches(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);

-- 14. Data Engineering Module: Analytical Data Warehouse Aggregation Tables
CREATE TABLE IF NOT EXISTS analytics_daily_sales (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    total_sales REAL NOT NULL DEFAULT 0,
    total_units INTEGER NOT NULL DEFAULT 0,
    total_orders INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(branch_id) REFERENCES branches(id),
    UNIQUE(date, branch_id)
);

CREATE TABLE IF NOT EXISTS analytics_product_velocity (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    units_sold_7d INTEGER DEFAULT 0,
    units_sold_30d INTEGER DEFAULT 0,
    avg_daily_demand REAL DEFAULT 0,
    demand_std_dev REAL DEFAULT 0,
    last_calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(branch_id) REFERENCES branches(id),
    UNIQUE(product_id, branch_id)
);

-- 15. ML Module: Demand Forecast Predictions Table
CREATE TABLE IF NOT EXISTS ml_demand_predictions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    current_stock INTEGER NOT NULL,
    predicted_demand_7d INTEGER NOT NULL,
    safety_stock INTEGER NOT NULL,
    reorder_point INTEGER NOT NULL,
    recommended_order INTEGER NOT NULL,
    priority_level TEXT NOT NULL CHECK(priority_level IN ('HIGH', 'MEDIUM', 'LOW')),
    model_version TEXT NOT NULL DEFAULT 'v1.4-exponential-smoothing',
    confidence_score REAL DEFAULT 0.92,
    predicted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(branch_id) REFERENCES branches(id)
);

-- Indices for rapid querying & high-concurrency throughput
CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON inventory(product_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch_date ON sales(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_branch ON transaction_ledger(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON alerts(is_resolved);
