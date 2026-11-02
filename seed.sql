-- InventoLedger Seed Data
-- Aligned with reference users, branches, realistic products and historical transactions

-- 1. Insert Branches
INSERT OR IGNORE INTO branches (id, code, name, city, address, manager_name, manager_email, phone) VALUES
('b-001', 'BR-MUM', 'Branch A', 'Mumbai', 'Shop 14, Colaba Causeway, Mumbai', 'Arthika Sharma', 'arthika@gmail.com', '+91 98201 12345'),
('b-002', 'BR-BLR', 'Branch B', 'Bengaluru', '402 100ft Road, Indiranagar, Bengaluru', 'Balaji Krishnan', 'balaji@gmail.com', '+91 98450 67890'),
('b-003', 'BR-DEL', 'Branch C', 'New Delhi', 'Block C, Connaught Place, New Delhi', 'Pandu Rao', 'pandu@gmail.com', '+91 98110 54321'),
('b-004', 'BR-CHN', 'Branch D', 'Chennai', '22 Usman Road, T. Nagar, Chennai', 'Lakshmipathi Reddi', 'lakshmipathi@gmail.com', '+91 98400 98765'),
('b-005', 'BR-KOL', 'Branch E', 'Kolkata', 'Sector V, Salt Lake City, Kolkata', 'Reni Sen', 'reni@gmail.com', '+91 98300 24680');

-- 2. Insert Users (Auth Credentials)
INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, branch_id) VALUES
('u-admin', 'pandu@gmail.com', 'Pandu@610', 'Pandu Rao (System Admin)', 'ADMIN', NULL),
('u-mgr-a', 'arthika@gmail.com', 'Arthika@610', 'Arthika Sharma', 'BRANCH_MANAGER', 'b-001'),
('u-mgr-b', 'balaji@gmail.com', 'Balaji@610', 'Balaji Krishnan', 'BRANCH_MANAGER', 'b-002'),
('u-mgr-c', 'pandu.mgr@gmail.com', 'Pandu@610', 'Pandu Branch Manager', 'BRANCH_MANAGER', 'b-003'),
('u-mgr-d', 'lakshmipathi@gmail.com', 'Lakshmipathi@610', 'Lakshmipathi Reddi', 'BRANCH_MANAGER', 'b-004'),
('u-mgr-e', 'reni@gmail.com', 'Reni@610', 'Reni Sen', 'BRANCH_MANAGER', 'b-005'),
('u-cust-1', 'customer@inventoledger.com', 'Customer@123', 'Aarav Patel', 'CUSTOMER', NULL);

-- 3. Insert Product Categories
INSERT OR IGNORE INTO categories (id, name, description) VALUES
('cat-elec', 'Electronics', 'Consumer gadgets, laptops, smartphones and accessories'),
('cat-appl', 'Apparel & Fashion', 'Men, women and kids casual and athletic clothing'),
('cat-groc', 'Packaged Goods & Pantry', 'Gourmet foods, beverages and household staples'),
('cat-home', 'Home & Living', 'Decor, kitchenware and ergonomics'),
('cat-stat', 'Stationery & Office', 'Desk essentials, notebooks and hardware');

-- 4. Insert Products Catalog
INSERT OR IGNORE INTO products (id, sku, name, category, price, cost_price, min_reorder_level, target_stock, image_url) VALUES
('p-001', 'SKU-LOGI-MX3', 'Logitech MX Master 3S Mouse', 'Electronics', 8495.00, 5200.00, 15, 60, '/images/products/logitech-mouse.jpg'),
('p-002', 'SKU-APPL-M3P', 'Apple MacBook Pro M3 (16GB/512GB)', 'Electronics', 169900.00, 142000.00, 5, 20, '/images/products/macbook-pro.jpg'),
('p-003', 'SKU-DELL-U27', 'Dell UltraSharp 27" 4K Monitor', 'Electronics', 48500.00, 36000.00, 8, 30, '/images/products/dell-monitor.jpg'),
('p-004', 'SKU-SONY-WH5', 'Sony WH-1000XM5 Noise Cancelling', 'Electronics', 26990.00, 18500.00, 10, 40, '/images/products/sony-headphones.jpg'),
('p-005', 'SKU-SAMS-T7S', 'Samsung T7 Shield 1TB Rugged SSD', 'Electronics', 9999.00, 6800.00, 12, 50, '/images/products/samsung-ssd.jpg'),
('p-006', 'SKU-KEYC-K2V', 'Keychron K2 Wireless Mechanical', 'Electronics', 7499.00, 4900.00, 10, 35, '/images/products/keychron-keyboard.jpg'),
('p-007', 'SKU-ANKR-PD6', 'Anker 735 65W GaN Charger', 'Electronics', 3999.00, 2400.00, 20, 80, '/images/products/anker-charger.jpg'),
('p-008', 'SKU-PATG-JKT', 'Patagonia Nano Puff Jacket', 'Apparel & Fashion', 18500.00, 11000.00, 6, 25, '/images/products/patagonia-jacket.jpg'),
('p-009', 'SKU-LEVI-511', 'Levi’s 511 Slim Fit Stretch Denim', 'Apparel & Fashion', 3499.00, 1800.00, 15, 60, '/images/products/levis-jeans.jpg'),
('p-010', 'SKU-NIKE-PEG', 'Nike Air Zoom Pegasus 40', 'Apparel & Fashion', 9995.00, 6200.00, 12, 45, '/images/products/nike-shoes.jpg'),
('p-011', 'SKU-UNQL-TEE', 'Uniqlo Supima Cotton Crew Tee', 'Apparel & Fashion', 1290.00, 650.00, 25, 100, '/images/products/uniqlo-tshirt.jpg'),
('p-012', 'SKU-ARAB-COF', 'Blue Tokai Attikan Estate Coffee 500g', 'Packaged Goods & Pantry', 850.00, 480.00, 20, 80, '/images/products/coffee-beans.jpg'),
('p-013', 'SKU-MATC-JPN', 'Uji Ceremonial Grade Matcha 100g', 'Packaged Goods & Pantry', 1950.00, 1100.00, 15, 50, '/images/products/matcha-tea.jpg'),
('p-014', 'SKU-OLIV-EXT', 'Borges Extra Virgin Olive Oil 1L', 'Packaged Goods & Pantry', 1250.00, 780.00, 18, 70, '/images/products/olive-oil.jpg'),
('p-015', 'SKU-HYDR-BTL', 'Hydro Flask 32oz Wide Mouth Bottle', 'Home & Living', 3799.00, 2100.00, 10, 40, '/images/products/water-bottle.jpg'),
('p-016', 'SKU-AERO-PRS', 'AeroPress Original Coffee Maker', 'Home & Living', 4200.00, 2600.00, 10, 35, '/images/products/aeropress-maker.jpg'),
('p-017', 'SKU-MOLE-NBK', 'Moleskine Classic Dotted Notebook', 'Stationery & Office', 1750.00, 950.00, 20, 80, '/images/products/moleskine-notebook.jpg'),
('p-018', 'SKU-LAMY-SAF', 'Lamy Safari Charcoal Fountain Pen', 'Stationery & Office', 2400.00, 1350.00, 15, 60, '/images/products/lamy-pen.jpg');

-- 5. Insert Multi-Branch Inventory
INSERT OR IGNORE INTO inventory (id, product_id, branch_id, stock_quantity, reserved_quantity) VALUES
-- Branch A (Mumbai)
('inv-01', 'p-001', 'b-001', 34, 2),
('inv-02', 'p-002', 'b-001', 8, 1),
('inv-03', 'p-003', 'b-001', 14, 0),
('inv-04', 'p-004', 'b-001', 19, 2),
('inv-05', 'p-005', 'b-001', 42, 3),
('inv-06', 'p-006', 'b-001', 4, 0), -- Low Stock
('inv-07', 'p-007', 'b-001', 65, 0),
('inv-08', 'p-008', 'b-001', 12, 0),
('inv-09', 'p-009', 'b-001', 48, 2),
('inv-10', 'p-010', 'b-001', 22, 1),
('inv-11', 'p-011', 'b-001', 85, 4),
('inv-12', 'p-012', 'b-001', 50, 0),
('inv-13', 'p-013', 'b-001', 0, 0),  -- Out of stock
('inv-14', 'p-014', 'b-001', 35, 0),
('inv-15', 'p-015', 'b-001', 28, 1),
('inv-16', 'p-016', 'b-001', 15, 0),
('inv-17', 'p-017', 'b-001', 60, 0),
('inv-18', 'p-018', 'b-001', 38, 0),

-- Branch B (Bengaluru)
('inv-19', 'p-001', 'b-002', 28, 1),
('inv-20', 'p-002', 'b-002', 12, 2),
('inv-21', 'p-003', 'b-002', 18, 1),
('inv-22', 'p-004', 'b-002', 25, 0),
('inv-23', 'p-005', 'b-002', 39, 2),
('inv-24', 'p-006', 'b-002', 18, 0),
('inv-25', 'p-007', 'b-002', 54, 0),
('inv-26', 'p-008', 'b-002', 3, 0),  -- Low Stock
('inv-27', 'p-009', 'b-002', 35, 1),
('inv-28', 'p-010', 'b-002', 19, 0),
('inv-29', 'p-011', 'b-002', 72, 3),
('inv-30', 'p-012', 'b-002', 64, 0),
('inv-31', 'p-013', 'b-002', 22, 0),
('inv-32', 'p-014', 'b-002', 40, 0),
('inv-33', 'p-015', 'b-002', 24, 0),
('inv-34', 'p-016', 'b-002', 20, 0),
('inv-35', 'p-017', 'b-002', 45, 0),
('inv-36', 'p-018', 'b-002', 29, 0),

-- Branch C (New Delhi)
('inv-37', 'p-001', 'b-003', 19, 0),
('inv-38', 'p-002', 'b-003', 6, 0),
('inv-39', 'p-003', 'b-003', 10, 0),
('inv-40', 'p-004', 'b-003', 14, 1),
('inv-41', 'p-005', 'b-003', 30, 0),
('inv-42', 'p-006', 'b-003', 15, 0),
('inv-43', 'p-007', 'b-003', 44, 0),
('inv-44', 'p-008', 'b-003', 16, 0),
('inv-45', 'p-009', 'b-003', 42, 0),
('inv-46', 'p-010', 'b-003', 27, 2),
('inv-47', 'p-011', 'b-003', 90, 5),
('inv-48', 'p-012', 'b-003', 38, 0),
('inv-49', 'p-013', 'b-003', 14, 0),
('inv-50', 'p-014', 'b-003', 25, 0),
('inv-51', 'p-015', 'b-003', 0, 0),  -- Out of stock
('inv-52', 'p-016', 'b-003', 11, 0),
('inv-53', 'p-017', 'b-003', 52, 0),
('inv-54', 'p-018', 'b-003', 31, 0),

-- Branch D (Chennai)
('inv-55', 'p-001', 'b-004', 15, 0),
('inv-56', 'p-002', 'b-004', 2, 0),  -- Low Stock
('inv-57', 'p-003', 'b-004', 7, 0),
('inv-58', 'p-004', 'b-004', 12, 0),
('inv-59', 'p-005', 'b-004', 28, 1),
('inv-60', 'p-006', 'b-004', 11, 0),
('inv-61', 'p-007', 'b-004', 35, 0),
('inv-62', 'p-008', 'b-004', 8, 0),
('inv-63', 'p-009', 'b-004', 29, 0),
('inv-64', 'p-010', 'b-004', 18, 0),
('inv-65', 'p-011', 'b-004', 60, 2),
('inv-66', 'p-012', 'b-004', 45, 0),
('inv-67', 'p-013', 'b-004', 8, 0),
('inv-68', 'p-014', 'b-004', 30, 0),
('inv-69', 'p-015', 'b-004', 19, 0),
('inv-70', 'p-016', 'b-004', 14, 0),
('inv-71', 'p-017', 'b-004', 38, 0),
('inv-72', 'p-018', 'b-004', 22, 0),

-- Branch E (Kolkata)
('inv-73', 'p-001', 'b-005', 21, 0),
('inv-74', 'p-002', 'b-005', 5, 0),
('inv-75', 'p-003', 'b-005', 9, 0),
('inv-76', 'p-004', 'b-005', 16, 0),
('inv-77', 'p-005', 'b-005', 33, 0),
('inv-78', 'p-006', 'b-005', 13, 0),
('inv-79', 'p-007', 'b-005', 40, 0),
('inv-80', 'p-008', 'b-005', 11, 0),
('inv-81', 'p-009', 'b-005', 36, 0),
('inv-82', 'p-010', 'b-005', 15, 0),
('inv-83', 'p-011', 'b-005', 68, 0),
('inv-84', 'p-012', 'b-005', 42, 0),
('inv-85', 'p-013', 'b-005', 10, 0),
('inv-86', 'p-014', 'b-005', 28, 0),
('inv-87', 'p-015', 'b-005', 16, 0),
('inv-88', 'p-016', 'b-005', 0, 0),  -- Out of stock
('inv-89', 'p-017', 'b-005', 44, 0),
('inv-90', 'p-018', 'b-005', 26, 0);

-- 6. Insert Customers
INSERT OR IGNORE INTO customers (id, user_id, name, email, phone, home_branch_id, total_spend, orders_count, status) VALUES
('c-001', 'u-cust-1', 'Aarav Patel', 'aarav.patel@gmail.com', '+91 99887 11223', 'b-001', 184985.00, 4, 'Active'),
('c-002', NULL, 'Priya Nair', 'priya.nair@outlook.com', '+91 98765 43210', 'b-002', 54290.00, 3, 'Active'),
('c-003', NULL, 'Rohan Verma', 'rohan.v@gmail.com', '+91 97112 34567', 'b-003', 27499.00, 2, 'Active'),
('c-004', NULL, 'Sneha Iyer', 'sneha.iyer@yahoo.com', '+91 94440 12389', 'b-004', 12599.00, 1, 'New'),
('c-005', NULL, 'Ananya Das', 'ananya.das@live.com', '+91 98310 99887', 'b-005', 64500.00, 5, 'Active'),
('c-006', NULL, 'Vikram Malhotra', 'vikram.m@corp.in', '+91 98200 44556', 'b-001', 218400.00, 6, 'Active');

-- 7. Insert Historical Sales
INSERT OR IGNORE INTO sales (id, branch_id, customer_id, customer_name, user_email, sale_type, payment_method, total_amount, status, created_at) VALUES
('s-101', 'b-001', 'c-001', 'Aarav Patel', 'customer@inventoledger.com', 'Customer Sale', 'Credit Card', 178395.00, 'Completed', datetime('now', '-1 days')),
('s-102', 'b-002', 'c-002', 'Priya Nair', 'balaji@gmail.com', 'POS Sale', 'UPI', 35489.00, 'Completed', datetime('now', '-2 days')),
('s-103', 'b-003', 'c-003', 'Rohan Verma', 'pandu@gmail.com', 'Admin Sale', 'Bank Transfer', 26990.00, 'Completed', datetime('now', '-2 days')),
('s-104', 'b-004', 'c-004', 'Sneha Iyer', 'lakshmipathi@gmail.com', 'Customer Sale', 'Credit Card', 9999.00, 'Completed', datetime('now', '-3 days')),
('s-105', 'b-005', 'c-005', 'Ananya Das', 'reni@gmail.com', 'POS Sale', 'Debit Card', 15998.00, 'Completed', datetime('now', '-4 days')),
('s-106', 'b-001', 'c-006', 'Vikram Malhotra', 'arthika@gmail.com', 'Customer Sale', 'Corporate Account', 84950.00, 'Completed', datetime('now', '-5 days')),
('s-107', 'b-002', 'c-002', 'Priya Nair', 'balaji@gmail.com', 'POS Sale', 'UPI', 18801.00, 'Completed', datetime('now', '-6 days')),
('s-108', 'b-003', 'c-001', 'Aarav Patel', 'pandu@gmail.com', 'Customer Sale', 'UPI', 6590.00, 'Processing', datetime('now', '-1 hours'));

-- 8. Insert Purchases
INSERT OR IGNORE INTO purchases (id, branch_id, supplier_name, total_amount, status, ordered_by, created_at) VALUES
('po-501', 'b-001', 'Logitech India Distribution Pvt Ltd', 104000.00, 'Completed', 'arthika@gmail.com', datetime('now', '-10 days')),
('po-502', 'b-002', 'Apple Authorized Wholesale', 568000.00, 'Completed', 'balaji@gmail.com', datetime('now', '-8 days')),
('po-503', 'b-003', 'Samsung Electronics Logistics', 136000.00, 'Completed', 'pandu@gmail.com', datetime('now', '-7 days')),
('po-504', 'b-004', 'Sony India Hub', 92500.00, 'Completed', 'lakshmipathi@gmail.com', datetime('now', '-4 days')),
('po-505', 'b-005', 'Specialty Coffee Importers', 24000.00, 'Pending', 'reni@gmail.com', datetime('now', '-1 days'));

-- 9. Insert Transfers
INSERT OR IGNORE INTO transfers (id, source_branch_id, target_branch_id, product_id, quantity, status, requested_by, notes, created_at, completed_at) VALUES
('tr-301', 'b-002', 'b-001', 'p-006', 10, 'Completed', 'arthika@gmail.com', 'Balancing mechanical keyboard shortages in Colaba', datetime('now', '-3 days'), datetime('now', '-2 days')),
('tr-302', 'b-001', 'b-003', 'p-015', 8, 'Completed', 'pandu@gmail.com', 'Replenishing Hydro Flasks in Connaught Place', datetime('now', '-5 days'), datetime('now', '-4 days')),
('tr-303', 'b-002', 'b-004', 'p-002', 2, 'In Transit', 'lakshmipathi@gmail.com', 'Urgent customer booking for MacBook Pro M3', datetime('now', '-1 days'), NULL),
('tr-304', 'b-001', 'b-005', 'p-016', 5, 'Requested', 'reni@gmail.com', 'Salt Lake store stock replenishment', datetime('now', '-6 hours'), NULL);

-- 10. Insert Transaction Ledger Entries (Audit trail)
INSERT OR IGNORE INTO transaction_ledger (id, txn_ref_id, txn_type, branch_id, product_id, qty_change, balance_after, user_email, user_role, notes, created_at) VALUES
('txl-01', 's-101', 'Customer Sale', 'b-001', 'p-002', -1, 8, 'customer@inventoledger.com', 'CUSTOMER', 'Online order checkout', datetime('now', '-1 days')),
('txl-02', 's-101', 'Customer Sale', 'b-001', 'p-001', -1, 34, 'customer@inventoledger.com', 'CUSTOMER', 'Online order checkout', datetime('now', '-1 days')),
('txl-03', 's-102', 'POS Sale', 'b-002', 'p-004', -1, 25, 'balaji@gmail.com', 'BRANCH_MANAGER', 'Counter POS purchase', datetime('now', '-2 days')),
('txl-04', 'po-501', 'Purchase', 'b-001', 'p-001', +20, 35, 'arthika@gmail.com', 'BRANCH_MANAGER', 'Received supplier delivery batch 884', datetime('now', '-10 days')),
('txl-05', 'tr-301', 'Transfer', 'b-002', 'p-006', -10, 18, 'balaji@gmail.com', 'BRANCH_MANAGER', 'Transferred out to Branch A', datetime('now', '-3 days')),
('txl-06', 'tr-301', 'Transfer', 'b-001', 'p-006', +10, 14, 'arthika@gmail.com', 'BRANCH_MANAGER', 'Received transfer from Branch B', datetime('now', '-2 days')),
('txl-07', 'tr-302', 'Transfer', 'b-003', 'p-015', +8, 8, 'pandu@gmail.com', 'BRANCH_MANAGER', 'Received transfer from Branch A', datetime('now', '-4 days'));

-- 11. Insert Stock Alerts
INSERT OR IGNORE INTO alerts (id, branch_id, product_id, severity, alert_type, message, is_resolved, created_at) VALUES
('alt-01', 'b-001', 'p-013', 'out', 'Zero Stock', 'Uji Ceremonial Grade Matcha is completely out of stock in Branch A (Mumbai)', 0, datetime('now', '-2 hours')),
('alt-02', 'b-003', 'p-015', 'out', 'Zero Stock', 'Hydro Flask 32oz Bottle is completely out of stock in Branch C (New Delhi)', 0, datetime('now', '-5 hours')),
('alt-03', 'b-005', 'p-016', 'out', 'Zero Stock', 'AeroPress Original Coffee Maker reached 0 units in Branch E (Kolkata)', 0, datetime('now', '-8 hours')),
('alt-04', 'b-001', 'p-006', 'low', 'Low Stock', 'Keychron K2 Keyboard has only 4 units remaining (Threshold: 10)', 0, datetime('now', '-12 hours')),
('alt-05', 'b-002', 'p-008', 'low', 'Low Stock', 'Patagonia Nano Puff Jacket has only 3 units remaining (Threshold: 6)', 0, datetime('now', '-1 day')),
('alt-06', 'b-004', 'p-002', 'low', 'Low Stock', 'Apple MacBook Pro M3 has only 2 units remaining (Threshold: 5)', 0, datetime('now', '-1 day'));

-- 12. Insert ML Predictions
INSERT OR IGNORE INTO ml_demand_predictions (id, product_id, branch_id, current_stock, predicted_demand_7d, safety_stock, reorder_point, recommended_order, priority_level, confidence_score) VALUES
('mlp-01', 'p-001', 'b-001', 34, 45, 12, 57, 23, 'MEDIUM', 0.94),
('mlp-02', 'p-002', 'b-004', 2, 8, 4, 12, 10, 'HIGH', 0.91),
('mlp-03', 'p-006', 'b-001', 4, 18, 8, 26, 22, 'HIGH', 0.89),
('mlp-04', 'p-013', 'b-001', 0, 15, 6, 21, 21, 'HIGH', 0.93),
('mlp-05', 'p-015', 'b-003', 0, 20, 8, 28, 28, 'HIGH', 0.95),
('mlp-06', 'p-004', 'b-002', 25, 22, 10, 32, 7, 'LOW', 0.88),
('mlp-07', 'p-007', 'b-001', 65, 30, 15, 45, 0, 'LOW', 0.96),
('mlp-08', 'p-008', 'b-002', 3, 14, 6, 20, 17, 'HIGH', 0.90);
