/**
 * InventoLedger API Client & Data Access Layer
 * Handles live REST API requests to the Node.js backend with local fallback cache
 * Authors: 24091A3215, 24091A3222
 */

window.InventoAPI = {
  baseUrl: window.location.origin,

  async request(endpoint, options = {}) {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn(`[InventoAPI] Endpoint ${endpoint} error:`, err.message);
      throw err;
    }
  },

  // Auth
  async login(role, email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role, email, password })
    });
  },

  async register(name, email, password, phone) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone })
    });
  },

  // Branches
  async getBranches() {
    return this.request('/api/branches');
  },

  // Products
  async getProducts(branchId = null) {
    const q = branchId ? `?branch_id=${branchId}` : '';
    return this.request(`/api/products${q}`);
  },

  async addProduct(productData) {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  // Inventory
  async getInventory(branchId = null, productId = null) {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    if (productId) params.append('product_id', productId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/inventory${q}`);
  },

  async getInventoryNetwork(branchId = null, productId = null) {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    if (productId) params.append('product_id', productId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/inventory/network${q}`);
  },

  // Sales & Orders
  async getSales(branchId = null) {
    const q = branchId ? `?branch_id=${branchId}` : '';
    return this.request(`/api/sales${q}`);
  },

  async createSale(saleData) {
    return this.request('/api/sales', {
      method: 'POST',
      body: JSON.stringify(saleData)
    });
  },

  // Transfers
  async getTransfers() {
    return this.request('/api/transfers');
  },

  async createTransfer(transferData) {
    return this.request('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(transferData)
    });
  },

  // Purchases
  async getPurchases() {
    return this.request('/api/purchases');
  },

  async createPurchase(purchaseData) {
    return this.request('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData)
    });
  },

  // Transactions Audit Ledger
  async getTransactions(branchId = null) {
    const q = branchId ? `?branch_id=${branchId}` : '';
    return this.request(`/api/transactions${q}`);
  },

  // Alerts
  async getAlerts() {
    return this.request('/api/alerts');
  },

  // Customers
  async getCustomers() {
    return this.request('/api/customers');
  },

  // Data Engineering Module: ETL Pipeline
  async getETLStatus() {
    return this.request('/api/etl/status');
  },

  async runETL() {
    return this.request('/api/etl/run', { method: 'POST' });
  },

  // ML Module: Predictions
  async getPredictions() {
    return this.request('/api/predictions');
  },

  // OS Module: Concurrency Stress Test Simulator
  async simulateConcurrency(params) {
    return this.request('/api/concurrency/simulate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
};
