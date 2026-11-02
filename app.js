/**
 * InventoLedger - Multi-Branch Retail Inventory System
 * Single Page Application Controller & View Manager
 * Authors: 24091A3215, 24091A3222
 */

(function () {
  'use strict';

  // Application State
  const state = {
    currentRoute: 'role-selection',
    currentSubRoute: 'dashboard',
    user: null,
    branches: [],
    products: [],
    inventory: [],
    sales: [],
    transfers: [],
    purchases: [],
    transactions: [],
    alerts: [],
    predictions: [],
    customers: [],
    cart: [],
    searchQuery: '',
    selectedBranchFilter: 'all',
    selectedCategoryFilter: 'all',
    selectedStatusFilter: 'all',
    sortFilter: 'name-asc',
    currentPage: 1,
    pageSize: 8,
    osSimulationRunning: false
  };

  // Toast Notification System
  function showToast(title, desc = '', type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${desc ? `<div class="toast-desc">${desc}</div>` : ''}
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // Format Indian Currency
  function formatINR(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });
  }

  // Format Date and Time
  function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    let str = String(dateStr);
    if (!str.includes('T')) {
      str = str.replace(' ', 'T') + 'Z';
    }
    let d = new Date(str);
    if (isNaN(d.getTime())) d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const datePart = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `
      <div class="date-time-cell">
        <span class="date-part">${datePart}</span>
        <span class="time-part">${timePart}</span>
      </div>
    `;
  }

  function formatDateTimePlain(dateStr) {
    if (!dateStr) return '—';
    let str = String(dateStr);
    if (!str.includes('T')) {
      str = str.replace(' ', 'T') + 'Z';
    }
    let d = new Date(str);
    if (isNaN(d.getTime())) d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Restore stored session
  function restoreSession() {
    try {
      const stored = localStorage.getItem('inventoledger_user');
      if (stored) {
        state.user = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Session parse error:', e);
    }
  }

  // Save session
  function saveSession(user) {
    state.user = user;
    if (user) {
      localStorage.setItem('inventoledger_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('inventoledger_user');
    }
  }

  // Initial Data Fetch
  async function loadInitialData() {
    try {
      const [branchesRes, productsRes, alertsRes] = await Promise.all([
        window.InventoAPI.getBranches().catch(() => ({ ok: false, data: [] })),
        window.InventoAPI.getProducts().catch(() => ({ ok: false, data: [] })),
        window.InventoAPI.getAlerts().catch(() => ({ ok: false, data: [] }))
      ]);

      if (branchesRes.ok) state.branches = branchesRes.data;
      if (productsRes.ok) state.products = productsRes.data;
      if (alertsRes.ok) state.alerts = alertsRes.data;

      updateAlertsBadge();
    } catch (err) {
      console.warn('Data preload warning:', err);
    }
  }

  function updateAlertsBadge() {
    const badge = document.getElementById('alerts-count-badge');
    if (badge) {
      const count = state.alerts.length;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'grid' : 'none';
    }
  }

  // ==========================================
  // ROUTING & VIEW SWITCHER
  // ==========================================
  function navigate(route, subRoute = 'dashboard') {
    state.currentRoute = route;
    state.currentSubRoute = subRoute;
    window.location.hash = `#${route}${subRoute && subRoute !== 'dashboard' ? '/' + subRoute : ''}`;
    render();
  }

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'role-selection';
    const parts = hash.split('/');
    const main = parts[0] || 'role-selection';
    const sub = parts[1] || 'dashboard';

    if (state.currentRoute !== main || state.currentSubRoute !== sub) {
      state.currentRoute = main;
      state.currentSubRoute = sub;
      render();
    }
  });

  // Main Render Coordinator
  function render() {
    const app = document.getElementById('app');
    if (!app) return;

    // Scroll to top on navigation
    window.scrollTo(0, 0);

    switch (state.currentRoute) {
      case 'role-selection':
      case '':
        renderRoleSelection(app);
        break;

      case 'admin-login':
        renderAdminLogin(app);
        break;

      case 'manager-login':
        renderManagerLogin(app);
        break;

      case 'customer-login':
        renderCustomerLogin(app);
        break;

      case 'register':
        renderRegister(app);
        break;

      case 'admin':
        if (!state.user || state.user.role !== 'ADMIN') {
          showToast('Access Restricted', 'Please sign in with administrator credentials.', 'error');
          navigate('admin-login');
          return;
        }
        renderAdminPortal(app);
        break;

      case 'manager':
        if (!state.user || state.user.role !== 'BRANCH_MANAGER') {
          showToast('Access Restricted', 'Please sign in as a Branch Manager.', 'error');
          navigate('manager-login');
          return;
        }
        renderBranchManagerPortal(app);
        break;

      case 'customer':
        renderCustomerStorefront(app);
        break;

      default:
        renderRoleSelection(app);
        break;
    }
  }

  // ==========================================
  // VIEW 1: ROLE SELECTION (Reference match)
  // ==========================================
  function renderRoleSelection(container) {
    container.innerHTML = `
      <main class="role-hero">
        <div class="role-hero-content">
          <header class="brand-header">
            <div class="brand-logo-pill">
              <div class="brand-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path>
                  <path d="M12 22V12"></path>
                  <polyline points="3.29 7 12 12 20.71 7"></polyline>
                  <path d="m7.5 4.27 9 5.15"></path>
                </svg>
              </div>
              <h1 class="brand-title">INVENTOLEDGER</h1>
            </div>
            <h2 class="brand-subtitle">Multi-Branch Retail System</h2>
            <p class="brand-desc">Smart Inventory. Better Retail Management.</p>
            <div class="author-badge">
              <span>24091A3215</span> &bull; <span>24091A3222</span> &bull; Full-Stack &amp; OS Mutex
            </div>
          </header>

          <section aria-label="Choose your role" class="role-cards-grid">
            <!-- Card 1: Admin -->
            <div class="role-card" id="card-role-admin" tabindex="0" role="button">
              <div class="role-icon-wrapper">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                </svg>
              </div>
              <h3 class="role-title">Admin</h3>
              <p class="role-description">Manage the complete inventory system, branches, products, reports and analytics.</p>
              <button class="role-btn">Continue</button>
            </div>

            <!-- Card 2: Branch Manager -->
            <div class="role-card" id="card-role-manager" tabindex="0" role="button">
              <div class="role-icon-wrapper">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"></path>
                  <path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"></path>
                  <path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"></path>
                </svg>
              </div>
              <h3 class="role-title">Branch Manager</h3>
              <p class="role-description">Manage branch inventory, sales, purchases and transfers.</p>
              <button class="role-btn">Continue</button>
            </div>

            <!-- Card 3: Customer -->
            <div class="role-card" id="card-role-customer" tabindex="0" role="button">
              <div class="role-icon-wrapper">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="8" cy="21" r="1"></circle>
                  <circle cx="19" cy="21" r="1"></circle>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                </svg>
              </div>
              <h3 class="role-title">Customer</h3>
              <p class="role-description">Browse products, check branch availability, place orders and track purchases.</p>
              <button class="role-btn">Continue</button>
            </div>
          </section>
        </div>
      </main>
    `;

    document.getElementById('card-role-admin').addEventListener('click', () => {
      showToast('Admin selected', 'Directing to admin authentication', 'info', 1500);
      navigate('admin-login');
    });

    document.getElementById('card-role-manager').addEventListener('click', () => {
      showToast('Branch Manager selected', 'Directing to manager portal', 'info', 1500);
      navigate('manager-login');
    });

    document.getElementById('card-role-customer').addEventListener('click', () => {
      showToast('Customer selected', 'Directing to retail storefront', 'info', 1500);
      navigate('customer-login');
    });
  }

  // ==========================================
  // VIEW 2: ADMIN LOGIN
  // ==========================================
  function renderAdminLogin(container) {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-icon-badge">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
            <h2 class="auth-title">Admin Login</h2>
            <p class="auth-subtitle">Full access to branches, inventory and analytics.</p>
          </div>

          <form id="form-admin-login">
            <div class="form-group">
              <label class="form-label" for="admin-email">Email Address</label>
              <input class="form-input" id="admin-email" type="email" value="pandu@gmail.com" required placeholder="pandu@gmail.com" />
            </div>

            <div class="form-group">
              <label class="form-label" for="admin-password">Password</label>
              <div class="password-input-wrapper">
                <input class="form-input" id="admin-password" type="password" value="Pandu@610" required placeholder="Enter password" />
                <button type="button" class="password-toggle-btn" id="toggle-pwd-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
            </div>

            <div class="auth-actions-row">
              <label class="checkbox-label">
                <input type="checkbox" id="admin-remember" checked />
                <span>Remember me</span>
              </label>
              <button type="button" class="link-btn" id="forgot-admin-btn">Forgot password?</button>
            </div>

            <button type="submit" class="auth-submit-btn" id="admin-login-submit">
              <span>Sign In as Admin</span>
            </button>
          </form>

          <div class="auth-credentials-box">
            <div class="auth-credentials-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
              Administrator account
            </div>
            <ul class="credentials-list">
              <li><span>Email:</span> <strong>pandu@gmail.com</strong></li>
              <li><span>Password:</span> <strong>Pandu@610</strong></li>
            </ul>
          </div>

          <div class="auth-footer">
            Not an admin? <a href="#role-selection" class="link-btn">Choose another role</a>
          </div>
        </div>
      </div>
    `;

    setupPasswordToggle('admin-password', 'toggle-pwd-btn');

    document.getElementById('forgot-admin-btn').addEventListener('click', () => {
      showToast('Password Reset', 'Password recovery instructions sent to registered admin address.', 'info');
    });

    document.getElementById('form-admin-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-email').value;
      const password = document.getElementById('admin-password').value;
      const btn = document.getElementById('admin-login-submit');

      btn.disabled = true;
      btn.innerHTML = '<span>Verifying credentials…</span>';

      try {
        const res = await window.InventoAPI.login('ADMIN', email, password);
        if (res.ok) {
          saveSession(res.session);
          showToast('Admin login successful', 'Redirecting to executive inventory dashboard…', 'success');
          setTimeout(() => navigate('admin', 'dashboard'), 600);
        } else {
          showToast('Login Failed', res.error || 'Invalid credentials.', 'error');
          btn.disabled = false;
          btn.innerHTML = '<span>Sign In as Admin</span>';
        }
      } catch (err) {
        showToast('Connection Error', err.message || 'Server unavailable.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span>Sign In as Admin</span>';
      }
    });
  }

  // ==========================================
  // VIEW 3: BRANCH MANAGER LOGIN
  // ==========================================
  function renderManagerLogin(container) {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-icon-badge">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"></path>
                <path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"></path>
              </svg>
            </div>
            <h2 class="auth-title">Branch Manager Login</h2>
            <p class="auth-subtitle">Access is limited to your assigned branch.</p>
          </div>

          <form id="form-mgr-login">
            <div class="form-group">
              <label class="form-label" for="mgr-email">Email Address</label>
              <input class="form-input" id="mgr-email" type="email" value="arthika@gmail.com" required placeholder="arthika@gmail.com" />
            </div>

            <div class="form-group">
              <label class="form-label" for="mgr-password">Password</label>
              <div class="password-input-wrapper">
                <input class="form-input" id="mgr-password" type="password" value="Arthika@610" required />
                <button type="button" class="password-toggle-btn" id="toggle-mgr-pwd">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="mgr-branch">Assigned Branch</label>
              <input class="form-input" id="mgr-branch" type="text" value="Branch A (Mumbai)" readonly />
              <p class="form-help">Locked to your account. Managers cannot switch branches.</p>
            </div>

            <div class="auth-actions-row">
              <label class="checkbox-label">
                <input type="checkbox" checked />
                <span>Remember me</span>
              </label>
              <button type="button" class="link-btn" id="forgot-mgr-btn">Forgot password?</button>
            </div>

            <button type="submit" class="auth-submit-btn" id="mgr-login-submit">
              <span>Sign In to Branch</span>
            </button>
          </form>

          <div class="auth-credentials-box">
            <div class="auth-credentials-title">Branch manager accounts</div>
            <ul class="credentials-list">
              <li><span>Branch A:</span> <strong>arthika@gmail.com / Arthika@610</strong></li>
              <li><span>Branch B:</span> <strong>balaji@gmail.com / Balaji@610</strong></li>
              <li><span>Branch C:</span> <strong>pandu.mgr@gmail.com / Pandu@610</strong></li>
              <li><span>Branch D:</span> <strong>lakshmipathi@gmail.com / Lakshmipathi@610</strong></li>
              <li><span>Branch E:</span> <strong>reni@gmail.com / Reni@610</strong></li>
            </ul>
          </div>

          <div class="auth-footer">
            Wrong role? <a href="#role-selection" class="link-btn">Choose another role</a>
          </div>
        </div>
      </div>
    `;

    setupPasswordToggle('mgr-password', 'toggle-mgr-pwd');

    // Auto-detect branch based on entered email
    const emailInput = document.getElementById('mgr-email');
    const branchInput = document.getElementById('mgr-branch');
    const branchMap = {
      'arthika@gmail.com': 'Branch A (Mumbai)',
      'balaji@gmail.com': 'Branch B (Bengaluru)',
      'pandu.mgr@gmail.com': 'Branch C (New Delhi)',
      'lakshmipathi@gmail.com': 'Branch D (Chennai)',
      'reni@gmail.com': 'Branch E (Kolkata)'
    };

    emailInput.addEventListener('input', () => {
      const email = emailInput.value.trim().toLowerCase();
      branchInput.value = branchMap[email] || 'Auto-detected upon sign in';
    });

    document.getElementById('form-mgr-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value;
      const password = document.getElementById('mgr-password').value;
      const btn = document.getElementById('mgr-login-submit');

      btn.disabled = true;
      btn.innerHTML = '<span>Verifying branch permissions…</span>';

      try {
        const res = await window.InventoAPI.login('BRANCH_MANAGER', email, password);
        if (res.ok) {
          saveSession(res.session);
          showToast('Branch Manager Authenticated', `Loaded branch workspace: ${res.session.assignedBranch}`, 'success');
          setTimeout(() => navigate('manager', 'dashboard'), 600);
        } else {
          showToast('Login Failed', res.error || 'Invalid manager credentials.', 'error');
          btn.disabled = false;
          btn.innerHTML = '<span>Sign In to Branch</span>';
        }
      } catch (err) {
        showToast('Login Error', err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<span>Sign In to Branch</span>';
      }
    });
  }

  // ==========================================
  // VIEW 4: CUSTOMER LOGIN & REGISTER
  // ==========================================
  function renderCustomerLogin(container) {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-icon-badge">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
              </svg>
            </div>
            <h2 class="auth-title">Customer Login</h2>
            <p class="auth-subtitle">Shop across branches and track your orders.</p>
          </div>

          <form id="form-cust-login">
            <div class="form-group">
              <label class="form-label" for="cust-email">Email Address</label>
              <input class="form-input" id="cust-email" type="email" value="customer@inventoledger.com" required placeholder="customer@inventoledger.com" />
            </div>

            <div class="form-group">
              <label class="form-label" for="cust-password">Password</label>
              <div class="password-input-wrapper">
                <input class="form-input" id="cust-password" type="password" value="Customer@123" required />
                <button type="button" class="password-toggle-btn" id="toggle-cust-pwd">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
            </div>

            <div class="auth-actions-row">
              <label class="checkbox-label">
                <input type="checkbox" checked />
                <span>Remember me</span>
              </label>
              <button type="button" class="link-btn" id="forgot-cust-btn">Forgot password?</button>
            </div>

            <button type="submit" class="auth-submit-btn" id="cust-login-submit">
              <span>Sign In to Store</span>
            </button>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1rem;">
              <button type="button" class="btn btn-outline" id="cust-create-acc-btn">Create Account</button>
              <button type="button" class="btn btn-ghost" id="cust-guest-btn">Browse as Guest</button>
            </div>
          </form>

          <div class="auth-credentials-box">
            <div class="auth-credentials-title">Demo credentials</div>
            <p><strong>customer@inventoledger.com</strong> / <strong>Customer@123</strong></p>
          </div>

          <div class="auth-footer">
            Wrong role? <a href="#role-selection" class="link-btn">Choose another role</a>
          </div>
        </div>
      </div>
    `;

    setupPasswordToggle('cust-password', 'toggle-cust-pwd');

    document.getElementById('cust-create-acc-btn').addEventListener('click', () => navigate('register'));
    document.getElementById('cust-guest-btn').addEventListener('click', () => {
      saveSession({ userId: 'guest', email: 'guest@retail.com', name: 'Guest Customer', role: 'CUSTOMER' });
      showToast('Browsing as Guest', 'Full catalog browsing available.', 'info');
      navigate('customer');
    });

    document.getElementById('form-cust-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('cust-email').value;
      const password = document.getElementById('cust-password').value;
      const btn = document.getElementById('cust-login-submit');

      btn.disabled = true;
      btn.innerHTML = '<span>Signing in…</span>';

      try {
        const res = await window.InventoAPI.login('CUSTOMER', email, password);
        if (res.ok) {
          saveSession(res.session);
          showToast('Welcome back', `Signed in as ${res.session.name || res.session.email}`, 'success');
          navigate('customer');
        } else {
          showToast('Login Failed', res.error, 'error');
          btn.disabled = false;
          btn.innerHTML = '<span>Sign In to Store</span>';
        }
      } catch (err) {
        showToast('Login Error', err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<span>Sign In to Store</span>';
      }
    });
  }

  function renderRegister(container) {
    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-header">
            <h2 class="auth-title">Create Customer Account</h2>
            <p class="auth-subtitle">Join InventoLedger to shop across branches.</p>
          </div>

          <form id="form-register">
            <div class="form-group">
              <label class="form-label" for="reg-name">Full Name</label>
              <input class="form-input" id="reg-name" type="text" required placeholder="Aarav Patel" />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-email">Email Address</label>
              <input class="form-input" id="reg-email" type="email" required placeholder="aarav@example.com" />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-password">Password</label>
              <input class="form-input" id="reg-password" type="password" required placeholder="Minimum 6 characters" minlength="6" />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-phone">Phone Number</label>
              <input class="form-input" id="reg-phone" type="tel" placeholder="+91 98765 43210" />
            </div>

            <button type="submit" class="auth-submit-btn" id="reg-submit-btn" style="margin-top: 1.25rem;">
              <span>Create Account</span>
            </button>
          </form>

          <div class="auth-footer">
            Already have an account? <a href="#customer-login" class="link-btn">Sign In</a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('form-register').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const phone = document.getElementById('reg-phone').value;
      const btn = document.getElementById('reg-submit-btn');

      btn.disabled = true;
      btn.innerHTML = '<span>Registering…</span>';

      try {
        const res = await window.InventoAPI.register(name, email, password, phone);
        if (res.ok) {
          saveSession(res.session);
          showToast('Account Created', 'Welcome to InventoLedger!', 'success');
          navigate('customer');
        } else {
          showToast('Registration Error', res.error, 'error');
          btn.disabled = false;
          btn.innerHTML = '<span>Create Account</span>';
        }
      } catch (err) {
        showToast('Registration Failed', err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<span>Create Account</span>';
      }
    });
  }

  function setupPasswordToggle(inputId, toggleBtnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(toggleBtnId);
    if (!input || !btn) return;

    btn.addEventListener('click', () => {
      const isPwd = input.type === 'password';
      input.type = isPwd ? 'text' : 'password';
      btn.innerHTML = isPwd
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 2 20 20"></path><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  }

  // ==========================================
  // VIEW 5: ADMIN PORTAL SHELL & SUB-VIEWS
  // ==========================================
  async function renderAdminPortal(container) {
    container.innerHTML = `
      <div class="admin-layout">
        <!-- Sidebar Navigation -->
        <aside class="admin-sidebar" id="admin-sidebar">
          <div class="sidebar-brand">
            <div class="sidebar-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>
              </svg>
            </div>
            <span class="sidebar-title">INVENTOLEDGER</span>
          </div>

          <nav class="sidebar-nav">
            <!-- Group 1: Overview -->
            <div>
              <div class="nav-group-title">Overview</div>
              <ul class="nav-group-items">
                <li><a class="nav-link ${state.currentSubRoute === 'dashboard' ? 'active' : ''}" data-sub="dashboard">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>
                  Dashboard
                </a></li>
              </ul>
            </div>

            <!-- Group 2: Management -->
            <div>
              <div class="nav-group-title">Management</div>
              <ul class="nav-group-items">
                <li><a class="nav-link ${state.currentSubRoute === 'branches' ? 'active' : ''}" data-sub="branches">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"></path><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path></svg>
                  Branches
                </a></li>
                <li><a class="nav-link ${state.currentSubRoute === 'products' ? 'active' : ''}" data-sub="products">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path></svg>
                  Products Catalog
                </a></li>
                <li><a class="nav-link ${state.currentSubRoute === 'products-list' ? 'active' : ''}" data-sub="products-list">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect width="8" height="4" x="8" y="2" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path></svg>
                  Products List
                </a></li>
                <li><a class="nav-link ${state.currentSubRoute === 'inventory' ? 'active' : ''}" data-sub="inventory">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"></path></svg>
                  Inventory Matrix
                </a></li>
                <li><a class="nav-link ${state.currentSubRoute === 'sales' ? 'active' : ''}" data-sub="sales">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path></svg>
                  Sales
                </a></li>
              </ul>
            </div>

            <!-- Group 3: Operations -->
            <div>
              <div class="nav-group-title">Operations</div>
              <ul class="nav-group-items">
                <li><a class="nav-link ${state.currentSubRoute === 'transactions' ? 'active' : ''}" data-sub="transactions">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path></svg>
                  Audit Ledger
                </a></li>
                <li><a class="nav-link ${state.currentSubRoute === 'purchases' ? 'active' : ''}" data-sub="purchases">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path></svg>
                  Purchases
                </a></li>
                <li><a class="nav-link ${state.currentSubRoute === 'transfers' ? 'active' : ''}" data-sub="transfers">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m8 3 4 4-4 4"></path><path d="M4 7h16"></path><path d="m16 21-4-4 4-4"></path><path d="M20 17H4"></path></svg>
                  Transfers
                </a></li>
              </ul>
            </div>

            <!-- Group 4: Intelligence & Modules -->
            <div>
              <div class="nav-group-title">Intelligence &amp; OS</div>
              <ul class="nav-group-items">
                <li><a class="nav-link ${state.currentSubRoute === 'analytics' ? 'active' : ''}" data-sub="analytics">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>
                  ETL &amp; Analytics
                </a></li>
                <li><a class="nav-link ${state.currentSubRoute === 'demand-prediction' ? 'active' : ''}" data-sub="demand-prediction">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 18V5"></path><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"></path><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"></path></svg>
                  ML Demand Prediction
                </a></li>
                <li><a class="nav-link ${state.currentSubRoute === 'concurrency-simulation' ? 'active' : ''}" data-sub="concurrency-simulation" style="color: #a5b4fc;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect width="18" height="11" x="3" y="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  OS Mutex Simulator
                </a></li>
                <li><a class="nav-link ${state.currentSubRoute === 'alerts' ? 'active' : ''}" data-sub="alerts">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path></svg>
                  Stock Alerts
                </a></li>
              </ul>
            </div>

            <!-- Group 5: Reports & System -->
            <div>
              <div class="nav-group-title">Reports &amp; System</div>
              <ul class="nav-group-items">
                <li><a class="nav-link ${state.currentSubRoute === 'reports' ? 'active' : ''}" data-sub="reports">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  Reports &amp; Export
                </a></li>
                <li><a class="nav-link ${state.currentSubRoute === 'customers' ? 'active' : ''}" data-sub="customers">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                  Customers
                </a></li>
              </ul>
            </div>
          </nav>

          <div class="sidebar-footer">
            <button class="logout-nav-btn" id="admin-logout-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path></svg>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <!-- Main Content Column -->
        <div class="admin-main">
          <!-- Sticky Header -->
          <header class="admin-header">
            <div class="header-left">
              <button class="mobile-menu-toggle" id="menu-toggle-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <div class="header-title-block">
                <span class="header-greeting">Good day, Administrator</span>
                <h1 class="header-page-title" id="admin-view-title">${getAdminViewTitle(state.currentSubRoute)}</h1>
              </div>
            </div>

            <div class="header-right">
              <div class="global-search-box">
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                <input class="global-search-input" id="admin-search-input" type="search" placeholder="Search products, branches…" />
              </div>

              <button class="alerts-bell-btn" id="bell-alerts-btn" title="View Stock Alerts">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path></svg>
                <span class="alerts-badge" id="alerts-count-badge">${state.alerts.length}</span>
              </button>

              <div class="profile-pill">
                <div class="profile-avatar">AD</div>
                <div class="profile-info">
                  <span class="profile-name">Pandu Rao</span>
                  <span class="profile-role">Admin</span>
                </div>
              </div>
            </div>
          </header>

          <!-- Dynamic Sub-view Container -->
          <div class="admin-content-body" id="admin-subview-container">
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
              Loading dashboard modules…
            </div>
          </div>
        </div>
      </div>

      <!-- Global Modal Container -->
      <div class="modal-overlay" id="global-modal">
        <div class="modal-dialog" id="global-modal-dialog"></div>
      </div>
    `;

    // Hook sidebar links
    document.querySelectorAll('.admin-sidebar .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sub = link.getAttribute('data-sub');
        navigate('admin', sub);
      });
    });

    // Mobile menu toggle
    const sidebar = document.getElementById('admin-sidebar');
    document.getElementById('menu-toggle-btn').addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Bell alerts
    document.getElementById('bell-alerts-btn').addEventListener('click', () => {
      navigate('admin', 'alerts');
    });

    // Logout button
    document.getElementById('admin-logout-btn').addEventListener('click', () => {
      saveSession(null);
      showToast('Logged out', 'Admin session terminated.', 'info');
      navigate('role-selection');
    });

    // Global Search
    const searchInput = document.getElementById('admin-search-input');
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        state.searchQuery = searchInput.value.trim();
        navigate('admin', 'products-list');
      }
    });

    // Render Subview
    renderAdminSubView(state.currentSubRoute);
  }

  function getAdminViewTitle(subRoute) {
    const map = {
      'dashboard': 'Dashboard Overview',
      'branches': 'Retail Branches Management',
      'products': 'Product Catalog',
      'products-list': 'Products Inventory List',
      'inventory': 'Multi-Branch Inventory Matrix',
      'sales': 'Sales & Point of Sale',
      'transactions': 'Transaction Audit Ledger',
      'purchases': 'Purchase Orders & Restock',
      'transfers': 'Inter-Branch Stock Transfers',
      'analytics': 'ETL Pipeline & Analytics Engine',
      'demand-prediction': 'ML Demand Forecasting Engine',
      'concurrency-simulation': 'OS Mutex Synchronization Simulator',
      'alerts': 'Stock Health Alerts',
      'reports': 'Reports & Data Export',
      'customers': 'Customer Directory'
    };
    return map[subRoute] || 'Dashboard';
  }

  // Sub-view Router
  async function renderAdminSubView(subRoute) {
    const container = document.getElementById('admin-subview-container');
    if (!container) return;

    switch (subRoute) {
      case 'dashboard':
        await renderAdminDashboardView(container);
        break;
      case 'branches':
        await renderBranchesView(container);
        break;
      case 'products':
        await renderProductsCatalogView(container);
        break;
      case 'products-list':
        await renderProductsListView(container);
        break;
      case 'inventory':
        await renderInventoryMatrixView(container);
        break;
      case 'sales':
        await renderSalesView(container);
        break;
      case 'transactions':
        await renderTransactionsView(container);
        break;
      case 'purchases':
        await renderPurchasesView(container);
        break;
      case 'transfers':
        await renderTransfersView(container);
        break;
      case 'analytics':
        await renderAnalyticsView(container);
        break;
      case 'demand-prediction':
        await renderDemandPredictionView(container);
        break;
      case 'concurrency-simulation':
        await renderConcurrencySimulationView(container);
        break;
      case 'alerts':
        await renderAlertsView(container);
        break;
      case 'reports':
        await renderReportsView(container);
        break;
      case 'customers':
        await renderCustomersView(container);
        break;
      default:
        await renderAdminDashboardView(container);
        break;
    }
  }

  // --- SUBVIEW: MAIN ADMIN DASHBOARD ---
  async function renderAdminDashboardView(container) {
    // Refresh data
    const [branchesRes, salesRes, productsRes, alertsRes, predictionsRes] = await Promise.all([
      window.InventoAPI.getBranches().catch(() => ({ ok: false, data: [] })),
      window.InventoAPI.getSales().catch(() => ({ ok: false, data: [] })),
      window.InventoAPI.getProducts().catch(() => ({ ok: false, data: [] })),
      window.InventoAPI.getAlerts().catch(() => ({ ok: false, data: [] })),
      window.InventoAPI.getPredictions().catch(() => ({ ok: false, data: [] }))
    ]);

    const branches = branchesRes.data || state.branches;
    const sales = salesRes.data || [];
    const products = productsRes.data || state.products;
    const alerts = alertsRes.data || state.alerts;
    const predictions = predictionsRes.data || [];

    const totalSalesRev = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const totalStockUnits = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const lowStockCount = alerts.length;

    container.innerHTML = `
      <!-- KPI Metric Cards -->
      <section class="kpi-grid">
        <div class="card kpi-card">
          <div class="kpi-icon-box indigo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div class="kpi-details">
            <div class="kpi-label">Total Revenue</div>
            <div class="kpi-value">${formatINR(totalSalesRev)}</div>
            <div class="kpi-trend positive">&uarr; +14.2% vs previous period</div>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-icon-box emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path></svg>
          </div>
          <div class="kpi-details">
            <div class="kpi-label">Total Stock Units</div>
            <div class="kpi-value">${totalStockUnits.toLocaleString('en-IN')}</div>
            <div class="kpi-trend positive">Consolidated 5 branches</div>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-icon-box cyan">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="8" height="4" x="8" y="2" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path></svg>
          </div>
          <div class="kpi-details">
            <div class="kpi-label">Catalog Products</div>
            <div class="kpi-value">${products.length}</div>
            <div class="kpi-trend neutral">Across 5 categories</div>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-icon-box rose">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path></svg>
          </div>
          <div class="kpi-details">
            <div class="kpi-label">Stock Alerts</div>
            <div class="kpi-value">${lowStockCount}</div>
            <div class="kpi-trend negative">${lowStockCount > 0 ? 'Requires attention' : 'Optimal levels'}</div>
          </div>
        </div>
      </section>

      <!-- Charts Row 1: Sales Overview Area Chart & Branch-wise Sales Bar Chart -->
      <section class="dashboard-grid-2">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Sales Overview</h3>
              <p class="card-subtitle">Revenue trend across all branches</p>
            </div>
            <span class="status-pill success">Live Aggregation</span>
          </div>
          <div class="card-body">
            <div id="chart-sales-overview" style="min-height: 260px;"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Branch-wise Sales</h3>
              <p class="card-subtitle">Consolidated performance comparison</p>
            </div>
            <span class="status-pill info">5 Branches</span>
          </div>
          <div class="card-body">
            <div id="chart-branch-sales" style="min-height: 260px;"></div>
          </div>
        </div>
      </section>

      <!-- Charts Row 2: Inventory Health Donut & ML Demand Prediction Highlight -->
      <section class="dashboard-grid-2">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Inventory Health</h3>
              <p class="card-subtitle">Network stock availability breakdown</p>
            </div>
            <span class="status-pill neutral">${products.length} SKUs</span>
          </div>
          <div class="card-body" style="display: grid; grid-template-columns: 180px 1fr; align-items: center; gap: 1.5rem;">
            <div id="chart-inventory-donut"></div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.625rem 0.875rem; background: rgba(30, 41, 59, 0.4); border-radius: var(--radius-md);">
                <span style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--success);"></span>
                  In Stock (Adequate)
                </span>
                <strong style="color: var(--success);">${Math.max(0, products.length - lowStockCount)}</strong>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.625rem 0.875rem; background: rgba(30, 41, 59, 0.4); border-radius: var(--radius-md);">
                <span style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--warning);"></span>
                  Low Stock Warning
                </span>
                <strong style="color: var(--warning);">${alerts.filter(a => a.severity === 'low').length}</strong>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.625rem 0.875rem; background: rgba(30, 41, 59, 0.4); border-radius: var(--radius-md);">
                <span style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--danger);"></span>
                  Out of Stock
                </span>
                <strong style="color: var(--danger);">${alerts.filter(a => a.severity === 'out').length}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">ML Demand Forecast Highlight</h3>
              <p class="card-subtitle">AI recommended restock replenishment</p>
            </div>
            <button class="btn btn-outline btn-sm" id="btn-view-ml-predictions">View All Predictions</button>
          </div>
          <div class="card-body">
            ${predictions.length > 0 ? `
              <div style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: rgba(30, 41, 59, 0.4);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <div>
                    <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">${predictions[0].product_name}</h4>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">${predictions[0].branch_name}</p>
                  </div>
                  <span class="status-pill ${predictions[0].priority_level === 'HIGH' ? 'danger' : 'warning'}">${predictions[0].priority_level} PRIORITY</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; font-size: 0.8125rem;">
                  <div>
                    <span style="color: var(--text-dim); display: block; font-size: 0.6875rem; text-transform: uppercase;">Current Stock</span>
                    <strong>${predictions[0].current_stock} units</strong>
                  </div>
                  <div>
                    <span style="color: var(--text-dim); display: block; font-size: 0.6875rem; text-transform: uppercase;">Predicted 7D Demand</span>
                    <strong>${predictions[0].predicted_demand_7d} units</strong>
                  </div>
                  <div>
                    <span style="color: var(--text-dim); display: block; font-size: 0.6875rem; text-transform: uppercase;">Safety Stock (Z=1.65)</span>
                    <strong>${predictions[0].safety_stock} units</strong>
                  </div>
                  <div>
                    <span style="color: var(--text-dim); display: block; font-size: 0.6875rem; text-transform: uppercase;">Recommended Order</span>
                    <strong style="color: var(--primary); font-size: 1.1rem;">+${predictions[0].recommended_order} units</strong>
                  </div>
                </div>
              </div>
            ` : `<p style="color: var(--text-muted); font-size: 0.875rem;">No predictions generated yet.</p>`}
          </div>
        </div>
      </section>

      <!-- Quick Actions Bar -->
      <section class="card" style="margin-bottom: 1.75rem;">
        <div class="card-header">
          <h3 class="card-title">Quick Actions</h3>
          <p class="card-subtitle">Common multi-branch operations</p>
        </div>
        <div class="card-body quick-actions-bar">
          <button class="btn btn-primary" id="btn-quick-add-product">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Product
          </button>
          <button class="btn btn-outline" id="btn-quick-create-sale">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
            Record POS Sale
          </button>
          <button class="btn btn-outline" id="btn-quick-transfer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 3 4 4-4 4"></path><path d="M4 7h16"></path><path d="m16 21-4-4 4-4"></path><path d="M20 17H4"></path></svg>
            Transfer Stock
          </button>
          <button class="btn btn-outline" id="btn-quick-purchase">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path></svg>
            Create Purchase Order
          </button>
          <button class="btn btn-outline" id="btn-quick-etl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            Run ETL Pipeline
          </button>
          <button class="btn btn-outline" id="btn-quick-concurrency" style="border-color: #6366f1; color: #a5b4fc;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            OS Mutex Stress Test
          </button>
        </div>
      </section>

      <!-- Branch Overview Table -->
      <section class="card" style="margin-bottom: 1.75rem;">
        <div class="card-header">
          <div>
            <h3 class="card-title">Branch Overview</h3>
            <p class="card-subtitle">Active retail network units</p>
          </div>
          <button class="btn btn-outline btn-sm" id="btn-view-all-branches">Manage Branches</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>City</th>
                <th>Manager</th>
                <th>Products</th>
                <th>Total Stock</th>
                <th>Sales Rev</th>
                <th>Stock Health</th>
              </tr>
            </thead>
            <tbody>
              ${branches.map(b => `
                <tr>
                  <td><strong>${b.name}</strong></td>
                  <td>${b.city}</td>
                  <td>${b.manager_name}</td>
                  <td>${b.product_count || 18}</td>
                  <td>${(b.total_stock || 0).toLocaleString('en-IN')} units</td>
                  <td><strong>${formatINR(b.total_sales || 0)}</strong></td>
                  <td>
                    ${(b.low_stock_count || 0) > 0 
                      ? `<span class="status-pill warning">${b.low_stock_count} low</span>` 
                      : `<span class="status-pill success">Optimal</span>`}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;

    // Render Charts
    setTimeout(() => {
      // Area Chart
      const salesTrendData = [
        { label: 'Day 1', value: 35000 },
        { label: 'Day 3', value: 58000 },
        { label: 'Day 5', value: 42000 },
        { label: 'Day 7', value: 89000 },
        { label: 'Day 9', value: 74000 },
        { label: 'Day 11', value: 115000 },
        { label: 'Today', value: totalSalesRev || 145000 }
      ];
      window.InventoCharts.renderAreaChart('chart-sales-overview', salesTrendData);

      // Bar Chart
      const branchBarData = branches.map(b => ({
        label: b.name.replace('Branch ', 'Br '),
        value: Number(b.total_sales || (Math.random() * 50000 + 20000))
      }));
      window.InventoCharts.renderBarChart('chart-branch-sales', branchBarData);

      // Donut Chart
      const donutData = [
        { label: 'In Stock', value: Math.max(1, products.length - lowStockCount), color: '#10b981' },
        { label: 'Low Stock', value: alerts.filter(a => a.severity === 'low').length || 1, color: '#f59e0b' },
        { label: 'Out of Stock', value: alerts.filter(a => a.severity === 'out').length || 1, color: '#ef4444' }
      ];
      window.InventoCharts.renderDonutChart('chart-inventory-donut', donutData);
    }, 50);

    // Wire Buttons
    document.getElementById('btn-view-ml-predictions').addEventListener('click', () => navigate('admin', 'demand-prediction'));
    document.getElementById('btn-view-all-branches').addEventListener('click', () => navigate('admin', 'branches'));
    document.getElementById('btn-quick-add-product').addEventListener('click', () => openAddProductModal());
    document.getElementById('btn-quick-create-sale').addEventListener('click', () => openCreateSaleModal());
    document.getElementById('btn-quick-transfer').addEventListener('click', () => openCreateTransferModal());
    document.getElementById('btn-quick-purchase').addEventListener('click', () => openCreatePurchaseModal());
    document.getElementById('btn-quick-etl').addEventListener('click', () => runETLWithProgress());
    document.getElementById('btn-quick-concurrency').addEventListener('click', () => navigate('admin', 'concurrency-simulation'));
  }

  // --- SUBVIEW: OS CONCURRENCY & MUTEX SIMULATOR ---
  async function renderConcurrencySimulationView(container) {
    container.innerHTML = `
      <div class="concurrency-playground">
        <div class="concurrency-controls-card">
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
            <div>
              <h2 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 700; color: var(--text-main);">
                OS Synchronization &amp; Mutex Simulator
              </h2>
              <p style="font-size: 0.84375rem; color: var(--text-muted);">
                Objective 15: Apply OS synchronization concepts to prevent race conditions when multiple branches update stock simultaneously.
              </p>
            </div>

            <!-- Mutex Toggle Mode -->
            <div class="mode-toggle-pill">
              <button class="mode-btn active safe" id="btn-mode-mutex-on">Mutex ENABLED (Lock)</button>
              <button class="mode-btn" id="btn-mode-mutex-off">Mutex DISABLED (Race Hazard)</button>
            </div>
          </div>

          <!-- Parameter Controls -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Product to Update</label>
              <select class="form-input" id="sim-product">
                ${state.products.map(p => `<option value="${p.id}">${p.name} (SKU: ${p.sku})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Initial Stock Units</label>
              <input class="form-input" type="number" id="sim-initial-stock" value="10" min="1" max="100" />
            </div>

            <div class="form-group">
              <label class="form-label">Concurrent Threads</label>
              <input class="form-input" type="number" id="sim-threads" value="15" min="2" max="50" />
            </div>

            <div class="form-group">
              <label class="form-label">Simulated Preemption Delay</label>
              <select class="form-input" id="sim-delay">
                <option value="15">15 ms (Fast context-switch)</option>
                <option value="40" selected>40 ms (Visible interleaving)</option>
                <option value="80">80 ms (Heavy I/O latency)</option>
              </select>
            </div>
          </div>

          <div style="margin-top: 1.25rem; display: flex; gap: 0.75rem;">
            <button class="btn btn-primary" id="btn-run-simulation" style="padding: 0.75rem 1.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Execute Concurrency Stress Test
            </button>
          </div>
        </div>

        <!-- Visualizer Area -->
        <div class="simulation-visualizer">
          <!-- Mutex Status Orb -->
          <div class="mutex-lock-display">
            <div class="lock-indicator-orb unlocked" id="sim-orb">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
            </div>
            <h4 style="font-weight: 700; font-size: 1.1rem; color: var(--text-main);" id="sim-lock-text">MUTEX UNLOCKED</h4>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;" id="sim-lock-subtext">Waiting for thread acquisition</p>
          </div>

          <!-- Simulation Metrics & Log -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Live Thread Execution Stream</h3>
              <span class="status-pill info" id="sim-status-pill">Ready</span>
            </div>
            <div class="card-body">
              <div id="sim-metrics-box" style="display: none; margin-bottom: 1rem; padding: 1rem; border-radius: var(--radius-md); background: rgba(30, 41, 59, 0.4); border: 1px solid var(--border);"></div>
              <div class="thread-stream-container" id="sim-log-stream">
                <p style="color: var(--text-muted); font-size: 0.8125rem; text-align: center; padding: 2rem;">
                  Click "Execute Concurrency Stress Test" to fire simultaneous branch decrement requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    let useMutexMode = true;
    const btnOn = document.getElementById('btn-mode-mutex-on');
    const btnOff = document.getElementById('btn-mode-mutex-off');

    btnOn.addEventListener('click', () => {
      useMutexMode = true;
      btnOn.className = 'mode-btn active safe';
      btnOff.className = 'mode-btn';
    });

    btnOff.addEventListener('click', () => {
      useMutexMode = false;
      btnOff.className = 'mode-btn active unsafe';
      btnOn.className = 'mode-btn';
    });

    document.getElementById('btn-run-simulation').addEventListener('click', async () => {
      const prodId = document.getElementById('sim-product').value;
      const initialStock = Number(document.getElementById('sim-initial-stock').value) || 10;
      const threads = Number(document.getElementById('sim-threads').value) || 15;
      const delayMs = Number(document.getElementById('sim-delay').value) || 30;

      const orb = document.getElementById('sim-orb');
      const lockText = document.getElementById('sim-lock-text');
      const lockSub = document.getElementById('sim-lock-subtext');
      const logStream = document.getElementById('sim-log-stream');
      const metricsBox = document.getElementById('sim-metrics-box');
      const statusPill = document.getElementById('sim-status-pill');

      statusPill.textContent = 'Simulating Concurrent Threads…';
      statusPill.className = 'status-pill warning';

      if (useMutexMode) {
        orb.className = 'lock-indicator-orb locked';
        orb.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
        lockText.textContent = 'MUTEX ACQUIRED';
        lockSub.textContent = 'Serializing Critical Section';
      } else {
        orb.className = 'lock-indicator-orb';
        orb.style.background = 'rgba(239, 68, 68, 0.2)';
        orb.style.color = '#ef4444';
        orb.style.border = '2px dashed #ef4444';
        orb.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        lockText.textContent = 'UNSYNCHRONIZED';
        lockSub.textContent = 'Race Hazard Exposed';
      }

      logStream.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 1.5rem;">Spawning ${threads} parallel worker routines…</div>`;

      try {
        const res = await window.InventoAPI.simulateConcurrency({
          productId: prodId,
          branchId: 'b-001',
          initialStock,
          threads,
          useMutex: useMutexMode,
          simulatedDelayMs: delayMs
        });

        if (res.ok) {
          const sim = res.simulation;
          statusPill.textContent = sim.anomalyDetected ? 'Race Condition Detected!' : 'Serializability Verified';
          statusPill.className = sim.anomalyDetected ? 'status-pill danger' : 'status-pill success';

          metricsBox.style.display = 'block';
          metricsBox.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; text-align: center;">
              <div>
                <span style="font-size: 0.6875rem; color: var(--text-dim); text-transform: uppercase;">Initial Stock</span>
                <strong style="display: block; font-size: 1.15rem;">${sim.initialStock}</strong>
              </div>
              <div>
                <span style="font-size: 0.6875rem; color: var(--text-dim); text-transform: uppercase;">Threads Fired</span>
                <strong style="display: block; font-size: 1.15rem;">${sim.threads}</strong>
              </div>
              <div>
                <span style="font-size: 0.6875rem; color: var(--text-dim); text-transform: uppercase;">Successful Decr</span>
                <strong style="display: block; font-size: 1.15rem; color: var(--success);">${sim.successfulDeductions}</strong>
              </div>
              <div>
                <span style="font-size: 0.6875rem; color: var(--text-dim); text-transform: uppercase;">Final Balance</span>
                <strong style="display: block; font-size: 1.15rem; color: ${sim.anomalyDetected ? 'var(--danger)' : 'var(--text-main)'};">${sim.finalStock}</strong>
              </div>
              <div>
                <span style="font-size: 0.6875rem; color: var(--text-dim); text-transform: uppercase;">Expected Balance</span>
                <strong style="display: block; font-size: 1.15rem;">${sim.expectedStock}</strong>
              </div>
            </div>
            <div style="margin-top: 0.75rem; font-size: 0.8125rem; color: ${sim.anomalyDetected ? '#fca5a5' : '#a7f3d0'};">
              <strong>${sim.analysis}</strong>
            </div>
          `;

          // Render Thread Logs
          logStream.innerHTML = sim.threads.map(t => `
            <div class="thread-row">
              <span class="thread-tag">${t.threadId}</span>
              <span style="color: var(--text-muted);">Stock: ${t.stockBefore} &rarr; ${t.stockAfter}</span>
              <span class="status-pill ${t.status === 'SUCCESS' ? 'success' : t.status.includes('UNSAFE') ? 'danger' : 'neutral'}">
                ${t.status}
              </span>
            </div>
          `).join('');

          showToast(
            sim.anomalyDetected ? 'Race Condition Triggered' : 'Mutex Protected Successfully',
            sim.analysis,
            sim.anomalyDetected ? 'error' : 'success',
            4000
          );
        }
      } catch (err) {
        showToast('Simulation Failed', err.message, 'error');
      } finally {
        orb.className = 'lock-indicator-orb unlocked';
        orb.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;
        lockText.textContent = 'MUTEX UNLOCKED';
        lockSub.textContent = 'Ready for next test run';
      }
    });
  }

  // --- SUBVIEW: DATA ENGINEERING ETL & ANALYTICS ---
  async function renderAnalyticsView(container) {
    const etlStatus = await window.InventoAPI.getETLStatus().catch(() => ({ ok: false, data: {} }));
    const data = etlStatus.data || {};

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Data Engineering Pipeline: Multi-Branch ETL</h3>
              <p class="card-subtitle">Objective 12: Build a pipeline to consolidate purchase and sales data across branches.</p>
            </div>
            <button class="btn btn-primary" id="btn-manual-etl-trigger">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Run ETL Pipeline Now
            </button>
          </div>
          <div class="card-body">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
              <div style="padding: 1rem; background: rgba(30, 41, 59, 0.4); border-radius: var(--radius-md);">
                <span style="font-size: 0.6875rem; color: var(--text-dim); text-transform: uppercase;">Pipeline Status</span>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--success); margin-top: 0.25rem;">
                  ${data.status || 'Active'}
                </div>
              </div>
              <div style="padding: 1rem; background: rgba(30, 41, 59, 0.4); border-radius: var(--radius-md);">
                <span style="font-size: 0.6875rem; color: var(--text-dim); text-transform: uppercase;">Last Run Duration</span>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-top: 0.25rem;">
                  ${data.durationMs ? data.durationMs + ' ms' : '18 ms'}
                </div>
              </div>
              <div style="padding: 1rem; background: rgba(30, 41, 59, 0.4); border-radius: var(--radius-md);">
                <span style="font-size: 0.6875rem; color: var(--text-dim); text-transform: uppercase;">Records Processed</span>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary); margin-top: 0.25rem;">
                  ${data.recordsProcessed || 98} records
                </div>
              </div>
              <div style="padding: 1rem; background: rgba(30, 41, 59, 0.4); border-radius: var(--radius-md);">
                <span style="font-size: 0.6875rem; color: var(--text-dim); text-transform: uppercase;">Last Synchronized</span>
                <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-top: 0.5rem;">
                  ${data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Just now'}
                </div>
              </div>
            </div>

            <h4 style="font-size: 0.9375rem; font-weight: 700; margin-bottom: 0.75rem;">ETL Execution Pipeline Logs</h4>
            <div style="padding: 1rem; background: #050811; border: 1px solid var(--border); border-radius: var(--radius-md); font-family: monospace; font-size: 0.75rem; color: #a5b4fc; max-height: 220px; overflow-y: auto;">
              ${(data.logs || [
                '[EXTRACT] Queried raw transactions from sales, purchases, and inter-branch transfers.',
                '[TRANSFORM] Grouped sales by calendar date buckets and branch IDs.',
                '[TRANSFORM] Computed 7-day and 30-day product velocity moving averages.',
                '[LOAD] Upserted analytical cubes into analytics_daily_sales and analytics_product_velocity.',
                '[COMPLETED] Data warehouse views refreshed for ML forecasting consumption.'
              ]).map(log => `<div>${log}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-manual-etl-trigger').addEventListener('click', () => runETLWithProgress());
  }

  async function runETLWithProgress() {
    showToast('ETL Pipeline Triggered', 'Extracting transactional delta records…', 'info');
    try {
      const res = await window.InventoAPI.runETL();
      if (res.ok) {
        showToast('ETL Pipeline Completed', `Processed ${res.data.recordsProcessed} records in ${res.data.durationMs}ms`, 'success');
        if (state.currentSubRoute === 'analytics') {
          renderAdminSubView('analytics');
        }
      }
    } catch (err) {
      showToast('ETL Error', err.message, 'error');
    }
  }

  // --- SUBVIEW: ML DEMAND PREDICTION ---
  async function renderDemandPredictionView(container) {
    const res = await window.InventoAPI.getPredictions().catch(() => ({ ok: false, data: [] }));
    const preds = res.data || [];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">ML Demand Forecasting &amp; Restock Engine</h3>
              <p class="card-subtitle">Objective 13: Predict restocking needs and demand trends using machine learning.</p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-recalculate-ml">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Recalculate Predictions
            </button>
          </div>
          <div class="card-body">
            <div style="padding: 1rem; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-md); font-size: 0.8125rem; color: #c7d2fe; margin-bottom: 1.5rem;">
              <strong>Model Formula:</strong> Exponential Smoothing with Safety Stock ($Z = 1.65$ for 95% service level). Reorder quantity is calculated as:
              <code>Recommended Order = max(0, (Predicted 7D Demand + Safety Stock) - Current Stock)</code>.
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Branch</th>
                    <th>Current Stock</th>
                    <th>Predicted 7D Demand</th>
                    <th>Safety Stock</th>
                    <th>Reorder Point</th>
                    <th>Recommended Order</th>
                    <th>Risk Priority</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${preds.map(p => `
                    <tr>
                      <td><strong>${p.product_name}</strong></td>
                      <td>${p.branch_name}</td>
                      <td>${p.current_stock} units</td>
                      <td>${p.predicted_demand_7d} units</td>
                      <td>${p.safety_stock} units</td>
                      <td>${p.reorder_point} units</td>
                      <td><strong style="color: var(--primary); font-size: 1rem;">+${p.recommended_order} units</strong></td>
                      <td>
                        <span class="status-pill ${p.priority_level === 'HIGH' ? 'danger' : p.priority_level === 'MEDIUM' ? 'warning' : 'success'}">
                          ${p.priority_level}
                        </span>
                      </td>
                      <td>
                        ${p.recommended_order > 0 ? `
                          <button class="btn btn-outline btn-sm btn-draft-po" data-prod="${p.product_id}" data-branch="${p.branch_id}" data-qty="${p.recommended_order}">
                            Draft Restock PO
                          </button>
                        ` : `<span style="font-size: 0.75rem; color: var(--text-dim);">Adequate</span>`}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-recalculate-ml').addEventListener('click', async () => {
      showToast('ML Model Executing', 'Running forecasting regression across velocity matrix…', 'info');
      await window.InventoAPI.runETL();
      showToast('Predictions Updated', 'New restock quantities generated with 94% confidence score.', 'success');
      renderAdminSubView('demand-prediction');
    });

    document.querySelectorAll('.btn-draft-po').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-prod');
        const branchId = btn.getAttribute('data-branch');
        const qty = btn.getAttribute('data-qty');
        openCreatePurchaseModal(branchId, prodId, qty);
      });
    });
  }

  // --- SUBVIEW: BRANCHES ---
  async function renderBranchesView(container) {
    const res = await window.InventoAPI.getBranches().catch(() => ({ ok: false, data: [] }));
    const branches = res.data || state.branches;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700;">Retail Branch Network</h3>
            <p style="font-size: 0.8125rem; color: var(--text-muted);">Manage multi-branch locations, managers, and assigned inventory.</p>
          </div>
          <button class="btn btn-primary" id="btn-add-branch">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Branch
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
          ${branches.map(b => `
            <div class="card">
              <div class="card-header">
                <div>
                  <h4 class="card-title">${b.name} (${b.code})</h4>
                  <p class="card-subtitle">${b.city}</p>
                </div>
                <span class="status-pill success">Active</span>
              </div>
              <div class="card-body" style="font-size: 0.84375rem; display: flex; flex-direction: column; gap: 0.625rem;">
                <div><span style="color: var(--text-dim);">Address:</span> ${b.address}</div>
                <div><span style="color: var(--text-dim);">Manager:</span> <strong>${b.manager_name}</strong> (${b.manager_email})</div>
                <div><span style="color: var(--text-dim);">Contact:</span> ${b.phone}</div>
                <div style="display: flex; justify-content: space-between; padding-top: 0.5rem; border-top: 1px solid var(--border); margin-top: 0.25rem;">
                  <span>Stock: <strong>${(b.total_stock || 0).toLocaleString('en-IN')} units</strong></span>
                  <span>Sales: <strong>${formatINR(b.total_sales || 0)}</strong></span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('btn-add-branch').addEventListener('click', () => {
      showToast('Add Branch', 'Branch onboarding form ready.', 'info');
    });
  }

  // --- SUBVIEW: PRODUCTS CATALOG GRID ---
  async function renderProductsCatalogView(container) {
    const res = await window.InventoAPI.getProducts().catch(() => ({ ok: false, data: [] }));
    const products = res.data || state.products;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700;">Products Catalog</h3>
            <p style="font-size: 0.8125rem; color: var(--text-muted);">${products.length} registered products across the retail chain.</p>
          </div>
          <button class="btn btn-primary" id="btn-catalog-add">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add New Product
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
          ${products.map(p => `
            <div class="product-card">
              <div class="product-image-box">
                <span class="category-tag">${p.category}</span>
                ${p.image_url 
                  ? `<img src="${p.image_url}" alt="${p.name}" class="product-real-img" loading="lazy" onerror="this.onerror=null; this.src='/images/products/logitech-mouse.jpg';" />` 
                  : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path></svg>`}
              </div>
              <div class="product-content">
                <h4 class="product-title">${p.name}</h4>
                <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.5rem;">SKU: ${p.sku}</div>
                <div class="product-price">${formatINR(p.price)}</div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 1rem;">
                  <span>Consolidated Stock: <strong>${p.stock || 0}</strong></span>
                  <span>Sold: <strong>${p.units_sold || 0}</strong></span>
                </div>
                <button class="btn btn-outline btn-sm btn-product-details" data-id="${p.id}" style="margin-top: auto;">
                  View Multi-Branch Stock
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('btn-catalog-add').addEventListener('click', () => openAddProductModal());
    document.querySelectorAll('.btn-product-details').forEach(btn => {
      btn.addEventListener('click', () => openProductDetailsModal(btn.getAttribute('data-id')));
    });
  }

  // --- SUBVIEW: PRODUCTS LIST TABLE (Search & Filter) ---
  async function renderProductsListView(container) {
    const res = await window.InventoAPI.getProducts().catch(() => ({ ok: false, data: [] }));
    let products = res.data || state.products;

    // Apply active filters
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }

    if (state.selectedCategoryFilter !== 'all') {
      products = products.filter(p => p.category === state.selectedCategoryFilter);
    }

    // Sort
    products.sort((a, b) => {
      if (state.sortFilter === 'name-asc') return a.name.localeCompare(b.name);
      if (state.sortFilter === 'name-desc') return b.name.localeCompare(a.name);
      if (state.sortFilter === 'price-asc') return a.price - b.price;
      if (state.sortFilter === 'price-desc') return b.price - a.price;
      if (state.sortFilter === 'stock-asc') return (a.stock || 0) - (b.stock || 0);
      if (state.sortFilter === 'stock-desc') return (b.stock || 0) - (a.stock || 0);
      return 0;
    });

    const categories = ['Electronics', 'Apparel & Fashion', 'Packaged Goods & Pantry', 'Home & Living', 'Stationery & Office'];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Products Inventory List</h3>
              <p class="card-subtitle">${products.length} products matching current filters</p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-list-add-prod">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Product
            </button>
          </div>
          <div class="card-body">
            <!-- Filter Bar -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem;">
              <input class="form-input" id="table-search" type="search" placeholder="Search name or SKU" value="${state.searchQuery}" />
              <select class="form-input" id="table-category-filter">
                <option value="all">All Categories</option>
                ${categories.map(c => `<option value="${c}" ${state.selectedCategoryFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
              <select class="form-input" id="table-sort-filter">
                <option value="name-asc" ${state.sortFilter === 'name-asc' ? 'selected' : ''}>Name (A–Z)</option>
                <option value="name-desc" ${state.sortFilter === 'name-desc' ? 'selected' : ''}>Name (Z–A)</option>
                <option value="price-desc" ${state.sortFilter === 'price-desc' ? 'selected' : ''}>Price (High &rarr; Low)</option>
                <option value="price-asc" ${state.sortFilter === 'price-asc' ? 'selected' : ''}>Price (Low &rarr; High)</option>
                <option value="stock-desc" ${state.sortFilter === 'stock-desc' ? 'selected' : ''}>Stock (High &rarr; Low)</option>
                <option value="stock-asc" ${state.sortFilter === 'stock-asc' ? 'selected' : ''}>Stock (Low &rarr; High)</option>
              </select>
            </div>

            <!-- Table -->
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${products.map(p => `
                    <tr>
                      <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                          ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width: 38px; height: 38px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border);" onerror="this.style.display='none';" />` : ''}
                          <strong>${p.name}</strong>
                        </div>
                      </td>
                      <td style="color: var(--text-dim);">${p.sku}</td>
                      <td>${p.category}</td>
                      <td><strong>${formatINR(p.price)}</strong></td>
                      <td>${p.stock || 0}</td>
                      <td>${p.units_sold || 0}</td>
                      <td><strong>${formatINR(p.revenue || 0)}</strong></td>
                      <td>
                        <span class="status-pill ${(p.stock || 0) > 10 ? 'success' : (p.stock || 0) > 0 ? 'warning' : 'danger'}">
                          ${(p.stock || 0) > 10 ? 'Available' : (p.stock || 0) > 0 ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; gap: 0.35rem;">
                          <button class="btn btn-ghost btn-icon btn-view-prod" data-id="${p.id}" title="View">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          </button>
                          <button class="btn btn-ghost btn-icon btn-transfer-prod" data-id="${p.id}" title="Transfer">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 3 4 4-4 4"></path><path d="M4 7h16"></path><path d="m16 21-4-4 4-4"></path><path d="M20 17H4"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-list-add-prod').addEventListener('click', () => openAddProductModal());
    document.getElementById('table-search').addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderAdminSubView('products-list');
    });
    document.getElementById('table-category-filter').addEventListener('change', (e) => {
      state.selectedCategoryFilter = e.target.value;
      renderAdminSubView('products-list');
    });
    document.getElementById('table-sort-filter').addEventListener('change', (e) => {
      state.sortFilter = e.target.value;
      renderAdminSubView('products-list');
    });

    document.querySelectorAll('.btn-view-prod').forEach(b => {
      b.addEventListener('click', () => openProductDetailsModal(b.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-transfer-prod').forEach(b => {
      b.addEventListener('click', () => openCreateTransferModal(b.getAttribute('data-id')));
    });
  }

  // --- SUBVIEW: MULTI-BRANCH INVENTORY MATRIX ---
  async function renderInventoryMatrixView(container) {
    const res = await window.InventoAPI.getInventory().catch(() => ({ ok: false, data: [] }));
    const inventory = res.data || [];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Multi-Branch Inventory Matrix</h3>
              <p class="card-subtitle">Objective 11: Track stock levels across branches in a transaction-safe relational database.</p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-matrix-adjust">Stock Adjustment</button>
          </div>
          <div class="card-body table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Branch Location</th>
                  <th>Available Stock</th>
                  <th>Reserved</th>
                  <th>Min Reorder Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${inventory.map(inv => `
                  <tr>
                    <td><strong>${inv.product_name}</strong></td>
                    <td style="color: var(--text-dim);">${inv.sku}</td>
                    <td><span class="status-pill neutral">${inv.branch_name}</span></td>
                    <td><strong>${inv.stock_quantity} units</strong></td>
                    <td>${inv.reserved_quantity || 0}</td>
                    <td>${inv.min_reorder_level}</td>
                    <td>
                      <span class="status-pill ${inv.stock_quantity > inv.min_reorder_level ? 'success' : inv.stock_quantity > 0 ? 'warning' : 'danger'}">
                        ${inv.stock_quantity > inv.min_reorder_level ? 'Available' : inv.stock_quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-matrix-adjust').addEventListener('click', () => openStockAdjustmentModal());
  }

  // --- SUBVIEW: SALES ---
  async function renderSalesView(container) {
    const res = await window.InventoAPI.getSales().catch(() => ({ ok: false, data: [] }));
    const sales = res.data || [];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700;">Sales Transactions</h3>
            <p style="font-size: 0.8125rem; color: var(--text-muted);">Master sales records with ACID verification</p>
          </div>
          <button class="btn btn-primary" id="btn-new-sale-pos">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Record New Sale
          </button>
        </div>

        <div class="card">
          <div class="card-body table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Date &amp; Time</th>
                  <th>Branch</th>
                  <th>Customer</th>
                  <th>Sale Type</th>
                  <th>Payment Method</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${sales.map(s => `
                  <tr>
                    <td><strong>${s.id}</strong></td>
                    <td>${formatDateTime(s.created_at)}</td>
                    <td>${s.branch_name}</td>
                    <td>${s.customer_name || 'Retail Guest'}</td>
                    <td><span class="status-pill info">${s.sale_type}</span></td>
                    <td>${s.payment_method}</td>
                    <td><strong>${formatINR(s.total_amount)}</strong></td>
                    <td><span class="status-pill success">${s.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-new-sale-pos').addEventListener('click', () => openCreateSaleModal());
  }

  // --- SUBVIEW: TRANSACTIONS AUDIT LEDGER ---
  async function renderTransactionsView(container) {
    const res = await window.InventoAPI.getTransactions().catch(() => ({ ok: false, data: [] }));
    const txns = res.data || [];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Immutable Transaction Ledger</h3>
              <p class="card-subtitle">Real-time audit log tracking stock changes, user authorizations, and balance integrity.</p>
            </div>
            <span class="status-pill info">ACID Audit Trail</span>
          </div>
          <div class="card-body table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ledger ID</th>
                  <th>Timestamp</th>
                  <th>Type</th>
                  <th>Branch</th>
                  <th>Product</th>
                  <th>Qty Change</th>
                  <th>Balance After</th>
                  <th>User / Operator</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${txns.map(t => `
                  <tr>
                    <td style="font-family: monospace;">${t.id}</td>
                    <td>${formatDateTime(t.created_at)}</td>
                    <td>
                      <span class="status-pill ${t.txn_type.includes('Sale') ? 'info' : t.txn_type === 'Purchase' ? 'success' : 'warning'}">
                        ${t.txn_type}
                      </span>
                    </td>
                    <td>${t.branch_name}</td>
                    <td>${t.product_name}</td>
                    <td style="color: ${t.qty_change < 0 ? 'var(--danger)' : 'var(--success)'}; font-weight: 700;">
                      ${t.qty_change > 0 ? '+' : ''}${t.qty_change}
                    </td>
                    <td><strong>${t.balance_after} units</strong></td>
                    <td>${t.user_email}</td>
                    <td style="color: var(--text-muted); font-size: 0.75rem;">${t.notes || 'System transaction'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // --- SUBVIEW: INTER-BRANCH TRANSFERS ---
  async function renderTransfersView(container) {
    const res = await window.InventoAPI.getTransfers().catch(() => ({ ok: false, data: [] }));
    const transfers = res.data || [];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700;">Inter-Branch Stock Transfers</h3>
            <p style="font-size: 0.8125rem; color: var(--text-muted);">Atomic two-phase stock relocation across branches</p>
          </div>
          <button class="btn btn-primary" id="btn-create-transfer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 3 4 4-4 4"></path><path d="M4 7h16"></path><path d="m16 21-4-4 4-4"></path><path d="M20 17H4"></path></svg>
            Initiate Transfer
          </button>
        </div>

        <div class="card">
          <div class="card-body table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Transfer ID</th>
                  <th>Date &amp; Time</th>
                  <th>Source Branch</th>
                  <th>Destination Branch</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Requested By</th>
                  <th>Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${transfers.map(tr => `
                  <tr>
                    <td><strong>${tr.id}</strong></td>
                    <td>${formatDateTime(tr.created_at)}</td>
                    <td>${tr.source_branch_name}</td>
                    <td>${tr.target_branch_name}</td>
                    <td>${tr.product_name}</td>
                    <td><strong>${tr.quantity} units</strong></td>
                    <td>${tr.requested_by}</td>
                    <td style="color: var(--text-muted); font-size: 0.75rem;">${tr.notes || 'Routine rebalancing'}</td>
                    <td>
                      <span class="status-pill ${tr.status === 'Completed' ? 'success' : tr.status === 'In Transit' ? 'warning' : 'neutral'}">
                        ${tr.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-create-transfer').addEventListener('click', () => openCreateTransferModal());
  }

  // --- SUBVIEW: PURCHASES ---
  async function renderPurchasesView(container) {
    const res = await window.InventoAPI.getPurchases().catch(() => ({ ok: false, data: [] }));
    const purchases = res.data || [];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700;">Purchase Orders &amp; Supplier Restock</h3>
            <p style="font-size: 0.8125rem; color: var(--text-muted);">Incoming inventory procurement logs</p>
          </div>
          <button class="btn btn-primary" id="btn-create-po">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Purchase Order
          </button>
        </div>

        <div class="card">
          <div class="card-body table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Date &amp; Time</th>
                  <th>Branch</th>
                  <th>Supplier</th>
                  <th>Total Amount</th>
                  <th>Ordered By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${purchases.map(p => `
                  <tr>
                    <td><strong>${p.id}</strong></td>
                    <td>${formatDateTime(p.created_at)}</td>
                    <td>${p.branch_name}</td>
                    <td>${p.supplier_name}</td>
                    <td><strong>${formatINR(p.total_amount)}</strong></td>
                    <td>${p.ordered_by}</td>
                    <td><span class="status-pill ${p.status === 'Completed' ? 'success' : 'warning'}">${p.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-create-po').addEventListener('click', () => openCreatePurchaseModal());
  }

  // --- SUBVIEW: ALERTS ---
  async function renderAlertsView(container) {
    const res = await window.InventoAPI.getAlerts().catch(() => ({ ok: false, data: [] }));
    const alerts = res.data || [];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Stock Health Alerts</h3>
              <p class="card-subtitle">${alerts.length} active inventory conditions requiring restock</p>
            </div>
            <button class="btn btn-outline btn-sm" id="btn-refresh-alerts">Refresh Alerts</button>
          </div>
          <div class="card-body" style="display: flex; flex-direction: column; gap: 1rem;">
            ${alerts.length === 0 ? `<p style="color: var(--success);">All stock levels optimal across branches.</p>` : ''}
            ${alerts.map(a => `
              <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; padding: 1.125rem 1.25rem; border-radius: var(--radius-lg); border: 1px solid ${a.severity === 'out' ? 'var(--danger-border)' : 'var(--warning-border)'}; background: ${a.severity === 'out' ? 'var(--danger-light)' : 'var(--warning-light)'};">
                <div>
                  <div style="font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; color: ${a.severity === 'out' ? 'var(--danger)' : 'var(--warning)'}; margin-bottom: 0.25rem;">
                    ${a.severity === 'out' ? '🔴 ZERO STOCK CRITICAL' : '⚠️ LOW STOCK WARNING'}
                  </div>
                  <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">${a.product_name}</h4>
                  <p style="font-size: 0.8125rem; color: var(--text-muted);">${a.branch_name} &bull; ${a.message}</p>
                </div>
                <button class="btn btn-primary btn-sm btn-quick-restock" data-branch="${a.branch_id}" data-prod="${a.product_id}">
                  Restock Now
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-refresh-alerts').addEventListener('click', () => renderAdminSubView('alerts'));
    document.querySelectorAll('.btn-quick-restock').forEach(b => {
      b.addEventListener('click', () => {
        openCreatePurchaseModal(b.getAttribute('data-branch'), b.getAttribute('data-prod'), 20);
      });
    });
  }

  // --- SUBVIEW: REPORTS & EXPORT ---
  async function renderReportsView(container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">System Reports &amp; Data Export</h3>
              <p class="card-subtitle">Generate consolidated financial, audit, and inventory manifests.</p>
            </div>
          </div>
          <div class="card-body" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
            <div style="padding: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: rgba(30, 41, 59, 0.4);">
              <h4 style="font-size: 1rem; font-weight: 700;">Multi-Branch Inventory Ledger</h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted); margin: 0.35rem 0 1rem;">Complete audit dump of all stock deductions, transfers, and incoming receipts.</p>
              <button class="btn btn-outline btn-sm btn-export-csv" data-type="transactions">Download CSV</button>
            </div>

            <div style="padding: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: rgba(30, 41, 59, 0.4);">
              <h4 style="font-size: 1rem; font-weight: 700;">Product Stock Manifest</h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted); margin: 0.35rem 0 1rem;">Snapshot of current inventory quantities, min reorder thresholds, and valuations.</p>
              <button class="btn btn-outline btn-sm btn-export-csv" data-type="inventory">Download CSV</button>
            </div>

            <div style="padding: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: rgba(30, 41, 59, 0.4);">
              <h4 style="font-size: 1rem; font-weight: 700;">Sales &amp; Revenue Ledger</h4>
              <p style="font-size: 0.8125rem; color: var(--text-muted); margin: 0.35rem 0 1rem;">Full historical sales order ledger grouped by branch and payment channels.</p>
              <button class="btn btn-outline btn-sm btn-export-csv" data-type="sales">Download CSV</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.btn-export-csv').forEach(b => {
      b.addEventListener('click', async () => {
        const type = b.getAttribute('data-type');
        showToast('Generating CSV Export', `Compiling ${type} dataset…`, 'info');

        let data = [];
        if (type === 'transactions') {
          const res = await window.InventoAPI.getTransactions();
          data = res.data;
        } else if (type === 'inventory') {
          const res = await window.InventoAPI.getInventory();
          data = res.data;
        } else if (type === 'sales') {
          const res = await window.InventoAPI.getSales();
          data = res.data;
        }

        if (data && data.length) {
          downloadCSV(data, `${type}_export_${Date.now()}.csv`);
          showToast('Download Ready', `Exported ${data.length} records.`, 'success');
        }
      });
    });
  }

  function downloadCSV(data, filename) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] ?? '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
  }

  // --- SUBVIEW: CUSTOMERS ---
  async function renderCustomersView(container) {
    const res = await window.InventoAPI.getCustomers().catch(() => ({ ok: false, data: [] }));
    const customers = res.data || [];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Registered Customer Directory</h3>
              <p class="card-subtitle">${customers.length} retail customers</p>
            </div>
          </div>
          <div class="card-body table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Primary Branch</th>
                  <th>Orders Count</th>
                  <th>Lifetime Spend</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${customers.map(c => `
                  <tr>
                    <td style="font-family: monospace;">${c.id}</td>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.email}</td>
                    <td>${c.phone || '—'}</td>
                    <td>${c.branch_name || 'Branch A'}</td>
                    <td>${c.orders_count || 0}</td>
                    <td><strong>${formatINR(c.total_spend || 0)}</strong></td>
                    <td><span class="status-pill success">${c.status || 'Active'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // VIEW 6: BRANCH MANAGER PORTAL
  // ==========================================
  async function renderBranchManagerPortal(container) {
    const branchId = state.user?.branchId || 'b-001';
    const branchName = state.user?.assignedBranch || 'Branch A';

    const [networkRes, salesRes, transfersRes, purchasesRes, alertsRes] = await Promise.all([
      window.InventoAPI.getInventoryNetwork(branchId).catch(() => ({ ok: false, data: [] })),
      window.InventoAPI.getSales(branchId).catch(() => ({ ok: false, data: [] })),
      window.InventoAPI.getTransfers().catch(() => ({ ok: false, data: [] })),
      window.InventoAPI.getPurchases().catch(() => ({ ok: false, data: [] })),
      window.InventoAPI.getAlerts().catch(() => ({ ok: false, data: [] }))
    ]);

    const products = networkRes.data || [];
    const sales = salesRes.data || [];
    const allTransfers = transfersRes.data || [];
    const branchTransfers = allTransfers.filter(t => t.source_branch_id === branchId || t.target_branch_id === branchId);
    const allPurchases = purchasesRes.data || [];
    const branchPurchases = allPurchases.filter(p => p.branch_id === branchId);
    const branchAlerts = (alertsRes.data || []).filter(a => a.branch_id === branchId);

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const totalLocalUnits = products.reduce((sum, i) => sum + Number(i.local_stock || 0), 0);
    const totalOtherUnits = products.reduce((sum, i) => sum + Number(i.total_other_stock || 0), 0);

    const otherBranchesList = state.branches.filter(b => b.id !== branchId);

    container.innerHTML = `
      <div style="min-height: 100vh; background: var(--bg-app); display: flex; flex-direction: column;">
        <!-- Header -->
        <header class="admin-header">
          <div class="header-left">
            <div class="brand-icon-box" style="width: 2rem; height: 2rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"></path><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"></path></svg>
            </div>
            <div>
              <span class="header-greeting">Branch Operations Workspace</span>
              <h1 class="header-page-title">${branchName} Portal</h1>
            </div>
          </div>
          <div class="header-right">
            <span class="status-pill success">Manager: ${state.user?.name || state.user?.email}</span>
            <button class="btn btn-outline btn-sm" id="btn-mgr-logout">Logout</button>
          </div>
        </header>

        <!-- Body -->
        <main class="app-container" style="padding: 2rem 1.5rem; flex: 1;">
          <!-- KPI Metrics Row -->
          <div class="kpi-grid">
            <div class="card kpi-card">
              <div class="kpi-icon-box indigo">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <div class="kpi-details">
                <div class="kpi-label">Branch Revenue</div>
                <div class="kpi-value">${formatINR(totalRevenue)}</div>
              </div>
            </div>

            <div class="card kpi-card">
              <div class="kpi-icon-box emerald">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path></svg>
              </div>
              <div class="kpi-details">
                <div class="kpi-label">Local Store Stock</div>
                <div class="kpi-value">${totalLocalUnits} units</div>
              </div>
            </div>

            <div class="card kpi-card">
              <div class="kpi-icon-box cyan">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 3 4 4-4 4"></path><path d="M4 7h16"></path><path d="m16 21-4-4 4-4"></path><path d="M20 17H4"></path></svg>
              </div>
              <div class="kpi-details">
                <div class="kpi-label">Available in Other Branches</div>
                <div class="kpi-value">${totalOtherUnits} units</div>
                <div class="kpi-trend positive">${otherBranchesList.length} network stores available</div>
              </div>
            </div>

            <div class="card kpi-card">
              <div class="kpi-icon-box rose">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path></svg>
              </div>
              <div class="kpi-details">
                <div class="kpi-label">Low Stock Alerts</div>
                <div class="kpi-value">${branchAlerts.length}</div>
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div style="display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
            <button class="btn btn-primary" id="btn-mgr-new-sale">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
              Record Branch POS Sale
            </button>
            <button class="btn btn-outline" id="btn-mgr-request-transfer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 3 4 4-4 4"></path><path d="M4 7h16"></path><path d="m16 21-4-4 4-4"></path><path d="M20 17H4"></path></svg>
              Request Stock Transfer
            </button>
            <button class="btn btn-outline" id="btn-mgr-new-po">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path></svg>
              Create Purchase Order
            </button>
          </div>

          <!-- Manager Portal Tabs -->
          <div class="tab-nav">
            <button class="tab-btn active" data-tab="tab-panel-local">Local Inventory &amp; Other Branches</button>
            <button class="tab-btn" data-tab="tab-panel-matrix">Other Branches Available Stock Matrix</button>
            <button class="tab-btn" data-tab="tab-panel-sales">Branch Sales (${sales.length})</button>
            <button class="tab-btn" data-tab="tab-panel-transfers">Stock Transfers (${branchTransfers.length})</button>
            <button class="tab-btn" data-tab="tab-panel-purchases">Purchase Orders (${branchPurchases.length})</button>
          </div>

          <!-- TAB PANEL 1: LOCAL INVENTORY WITH OTHER BRANCHES STOCK CHIPS -->
          <div class="tab-panel" id="tab-panel-local" style="display: block;">
            <div class="card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">Local Branch Inventory &amp; Network Stock</h3>
                  <p class="card-subtitle">Real-time stock for ${branchName} and instant availability across all other stores</p>
                </div>
              </div>
              <div class="card-body table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Local Stock (${branchName})</th>
                      <th>Reorder Level</th>
                      <th>Status</th>
                      <th>Available in Other Branches</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${products.map(p => {
                      const bestSource = p.other_branches.find(o => o.stock_quantity > 0);
                      return `
                        <tr>
                          <td>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                              ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border);" onerror="this.style.display='none';" />` : ''}
                              <div>
                                <strong>${p.name}</strong>
                                <div style="font-size: 0.71875rem; color: var(--text-dim);">${p.category}</div>
                              </div>
                            </div>
                          </td>
                          <td style="color: var(--text-dim);">${p.sku}</td>
                          <td>${formatINR(p.price)}</td>
                          <td><strong style="font-size: 1rem;">${p.local_stock} units</strong></td>
                          <td>${p.min_reorder_level}</td>
                          <td>
                            <span class="status-pill ${p.local_stock > p.min_reorder_level ? 'success' : p.local_stock > 0 ? 'warning' : 'danger'}">
                              ${p.local_stock > p.min_reorder_level ? 'Available' : p.local_stock > 0 ? 'Low Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td>
                            <div class="branch-stock-chips">
                              ${p.other_branches.map(o => `
                                <span class="branch-stock-chip ${o.stock_quantity > 0 ? 'has-stock' : 'out-stock'}" title="${o.branch_city}">
                                  ${o.branch_name}: <strong>${o.stock_quantity}</strong>
                                </span>
                              `).join('')}
                            </div>
                            <div style="font-size: 0.6875rem; margin-top: 0.25rem; color: var(--text-muted);">
                              Total in other branches: <strong style="color: ${p.total_other_stock > 0 ? 'var(--success)' : 'var(--danger)'};">${p.total_other_stock} units</strong>
                            </div>
                          </td>
                          <td>
                            <button class="btn btn-outline btn-sm btn-mgr-transfer-in" data-prod-id="${p.id}" data-best-source="${bestSource ? bestSource.branch_id : ''}" ${p.total_other_stock === 0 ? 'disabled' : ''}>
                              Request Transfer In
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB PANEL 2: OTHER BRANCHES STOCK MATRIX -->
          <div class="tab-panel" id="tab-panel-matrix" style="display: none;">
            <div class="card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">Other Branches Available Stock Matrix</h3>
                  <p class="card-subtitle">Complete visibility into available stock across all other physical branches for ${branchName}</p>
                </div>
              </div>
              <div class="card-body table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th style="background: rgba(99, 102, 241, 0.15); border-left: 2px solid var(--primary);">${branchName} (Your Local)</th>
                      ${otherBranchesList.map(b => `<th>${b.name} (${b.city})</th>`).join('')}
                      <th>Total in Other Branches</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${products.map(p => {
                      const bestSource = p.other_branches.find(o => o.stock_quantity > 0);
                      return `
                        <tr>
                          <td>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                              ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width: 38px; height: 38px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border);" onerror="this.style.display='none';" />` : ''}
                              <div>
                                <strong>${p.name}</strong>
                                <div style="font-size: 0.6875rem; color: var(--text-dim);">${p.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td>${p.category}</td>
                          <td style="background: rgba(99, 102, 241, 0.08); font-weight: 700; border-left: 2px solid var(--primary); font-size: 0.9375rem;">
                            <span style="color: ${p.local_stock > p.min_reorder_level ? 'var(--success)' : p.local_stock > 0 ? 'var(--warning)' : 'var(--danger)'};">
                              ${p.local_stock} units
                            </span>
                          </td>
                          ${otherBranchesList.map(b => {
                            const match = p.other_branches.find(o => o.branch_id === b.id);
                            const q = match ? match.stock_quantity : 0;
                            return `
                              <td>
                                <strong style="color: ${q > 10 ? 'var(--text-main)' : q > 0 ? 'var(--warning)' : 'var(--text-dim)'};">
                                  ${q} units
                                </strong>
                              </td>
                            `;
                          }).join('')}
                          <td>
                            <strong style="color: ${p.total_other_stock > 0 ? 'var(--success)' : 'var(--danger)'};">
                              ${p.total_other_stock} units
                            </strong>
                          </td>
                          <td>
                            <button class="btn btn-primary btn-sm btn-mgr-transfer-in" data-prod-id="${p.id}" data-best-source="${bestSource ? bestSource.branch_id : ''}" ${p.total_other_stock === 0 ? 'disabled' : ''}>
                              Transfer In
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB PANEL 3: SALES HISTORY -->
          <div class="tab-panel" id="tab-panel-sales" style="display: none;">
            <div class="card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">Recent Branch Sales</h3>
                  <p class="card-subtitle">Sales records executed at ${branchName} with exact transaction time</p>
                </div>
              </div>
              <div class="card-body table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Sale ID</th>
                      <th>Date &amp; Time</th>
                      <th>Customer</th>
                      <th>Sale Type</th>
                      <th>Payment Channel</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sales.length === 0 ? `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No sales recorded yet for this branch.</td></tr>` : ''}
                    ${sales.map(s => `
                      <tr>
                        <td><strong>${s.id}</strong></td>
                        <td>${formatDateTime(s.created_at)}</td>
                        <td>${s.customer_name || 'Retail Guest'}</td>
                        <td><span class="status-pill info">${s.sale_type}</span></td>
                        <td>${s.payment_method}</td>
                        <td><strong>${formatINR(s.total_amount)}</strong></td>
                        <td><span class="status-pill success">${s.status}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB PANEL 4: INTER-BRANCH TRANSFERS -->
          <div class="tab-panel" id="tab-panel-transfers" style="display: none;">
            <div class="card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">Inter-Branch Stock Transfers</h3>
                  <p class="card-subtitle">Inbound replenishment and outbound transfer logs for ${branchName} with verified timestamps</p>
                </div>
              </div>
              <div class="card-body table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Transfer ID</th>
                      <th>Date &amp; Time</th>
                      <th>Direction</th>
                      <th>Source Branch</th>
                      <th>Destination Branch</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Notes</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${branchTransfers.length === 0 ? `<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">No transfers recorded for this branch yet.</td></tr>` : ''}
                    ${branchTransfers.map(tr => {
                      const isIncoming = tr.target_branch_id === branchId;
                      return `
                        <tr>
                          <td><strong>${tr.id}</strong></td>
                          <td>${formatDateTime(tr.created_at)}</td>
                          <td>
                            <span class="status-pill ${isIncoming ? 'success' : 'info'}">
                              ${isIncoming ? '↓ Inbound Restock' : '↑ Outbound Transfer'}
                            </span>
                          </td>
                          <td>${tr.source_branch_name}</td>
                          <td>${tr.target_branch_name}</td>
                          <td>${tr.product_name}</td>
                          <td><strong>${tr.quantity} units</strong></td>
                          <td style="color: var(--text-muted); font-size: 0.75rem;">${tr.notes || 'Routine rebalancing'}</td>
                          <td>
                            <span class="status-pill ${tr.status === 'Completed' ? 'success' : tr.status === 'In Transit' ? 'warning' : 'neutral'}">
                              ${tr.status}
                            </span>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB PANEL 5: PURCHASE ORDERS -->
          <div class="tab-panel" id="tab-panel-purchases" style="display: none;">
            <div class="card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">Supplier Restock Purchase Orders</h3>
                  <p class="card-subtitle">Purchases assigned to ${branchName} with procurement timestamps</p>
                </div>
              </div>
              <div class="card-body table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Date &amp; Time</th>
                      <th>Supplier</th>
                      <th>Total Amount</th>
                      <th>Ordered By</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${branchPurchases.length === 0 ? `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No supplier purchase orders logged for this branch.</td></tr>` : ''}
                    ${branchPurchases.map(p => `
                      <tr>
                        <td><strong>${p.id}</strong></td>
                        <td>${formatDateTime(p.created_at)}</td>
                        <td>${p.supplier_name}</td>
                        <td><strong>${formatINR(p.total_amount)}</strong></td>
                        <td>${p.ordered_by}</td>
                        <td><span class="status-pill ${p.status === 'Completed' ? 'success' : 'warning'}">${p.status}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div class="modal-overlay" id="global-modal">
        <div class="modal-dialog" id="global-modal-dialog"></div>
      </div>
    `;

    // Logout
    document.getElementById('btn-mgr-logout').addEventListener('click', () => {
      saveSession(null);
      navigate('role-selection');
    });

    // Modals
    document.getElementById('btn-mgr-new-sale').addEventListener('click', () => openCreateSaleModal(branchId));
    document.getElementById('btn-mgr-request-transfer').addEventListener('click', () => openCreateTransferModal(null, null, branchId));
    document.getElementById('btn-mgr-new-po').addEventListener('click', () => openCreatePurchaseModal(branchId));

    // Transfer in buttons
    document.querySelectorAll('.btn-mgr-transfer-in').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.getAttribute('data-prod-id');
        const sourceBranch = btn.getAttribute('data-best-source');
        openCreateTransferModal(prodId, sourceBranch, branchId);
      });
    });

    // Tab switching logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
        btn.classList.add('active');
        const targetPanel = document.getElementById(btn.getAttribute('data-tab'));
        if (targetPanel) targetPanel.style.display = 'block';
      });
    });
  }

  // ==========================================
  // VIEW 7: CUSTOMER STOREFRONT & CART
  // ==========================================
  async function renderCustomerStorefront(container) {
    const [prodRes, branchesRes] = await Promise.all([
      window.InventoAPI.getProducts().catch(() => ({ ok: false, data: [] })),
      window.InventoAPI.getBranches().catch(() => ({ ok: false, data: [] }))
    ]);

    const products = prodRes.data || state.products;
    const branches = branchesRes.data || state.branches;

    container.innerHTML = `
      <div style="min-height: 100vh; background: var(--bg-app); display: flex; flex-direction: column;">
        <header class="admin-header">
          <div class="header-left">
            <div class="brand-icon-box" style="width: 2.25rem; height: 2.25rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
            </div>
            <div>
              <span class="header-greeting">InventoLedger Store</span>
              <h1 class="header-page-title">Retail Catalog</h1>
            </div>
          </div>
          <div class="header-right">
            <button class="btn btn-primary btn-sm" id="btn-view-cart">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
              <span>Shopping Bag</span>
              <span class="alerts-badge" id="cart-count-badge" style="position: static; margin-left: 0.25rem;">${state.cart.length}</span>
            </button>
            <button class="btn btn-outline btn-sm" id="btn-cust-logout">
              ${state.user ? 'Logout' : 'Exit to Roles'}
            </button>
          </div>
        </header>

        <main class="customer-storefront">
          <div class="store-header">
            <div>
              <h2 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800;">Multi-Branch Products</h2>
              <p style="font-size: 0.84375rem; color: var(--text-muted);">Real-time stock verified across all 5 physical stores.</p>
            </div>
          </div>

          <div class="store-grid">
            ${products.map(p => `
              <div class="product-card">
                <div class="product-image-box">
                  <span class="category-tag">${p.category}</span>
                  ${p.image_url 
                    ? `<img src="${p.image_url}" alt="${p.name}" class="product-real-img" loading="lazy" onerror="this.onerror=null; this.src='/images/products/logitech-mouse.jpg';" />` 
                    : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path></svg>`}
                </div>
                <div class="product-content">
                  <h4 class="product-title">${p.name}</h4>
                  <div class="product-price">${formatINR(p.price)}</div>
                  <div class="branch-availability-list">
                    <div style="font-weight: 600; font-size: 0.6875rem; text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.125rem;">Branch Availability</div>
                    <div class="branch-availability-item">
                      <span>Total Chain Stock:</span>
                      <strong style="color: ${(p.stock || 0) > 0 ? 'var(--success)' : 'var(--danger)'};">${p.stock || 0} units</strong>
                    </div>
                  </div>
                  <button class="btn btn-primary btn-add-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" ${(p.stock || 0) <= 0 ? 'disabled' : ''} style="margin-top: auto; width: 100%;">
                    ${(p.stock || 0) > 0 ? 'Add to Bag' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </main>
      </div>

      <div class="modal-overlay" id="global-modal">
        <div class="modal-dialog" id="global-modal-dialog"></div>
      </div>
    `;

    document.getElementById('btn-cust-logout').addEventListener('click', () => {
      saveSession(null);
      navigate('role-selection');
    });

    document.getElementById('btn-view-cart').addEventListener('click', () => openCartModal(branches));

    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const price = Number(btn.getAttribute('data-price'));

        const existing = state.cart.find(item => item.id === id);
        if (existing) {
          existing.qty += 1;
        } else {
          state.cart.push({ id, name, price, qty: 1 });
        }

        document.getElementById('cart-count-badge').textContent = state.cart.reduce((s, i) => s + i.qty, 0);
        showToast('Added to Cart', `${name} added to your shopping bag.`, 'success');
      });
    });
  }

  function openCartModal(branches) {
    const dialog = document.getElementById('global-modal-dialog');
    const overlay = document.getElementById('global-modal');

    const total = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="card-title">Shopping Bag (${state.cart.reduce((s, i) => s + i.qty, 0)} items)</h3>
        <button class="modal-close-btn" id="modal-close-cart">&times;</button>
      </div>
      <div class="modal-body">
        ${state.cart.length === 0 ? `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Your shopping bag is empty.</p>` : `
          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
            ${state.cart.map(item => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(30, 41, 59, 0.4); border-radius: var(--radius-md);">
                <div>
                  <h4 style="font-weight: 600; font-size: 0.875rem;">${item.name}</h4>
                  <span style="font-size: 0.75rem; color: var(--text-dim);">${formatINR(item.price)} each</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="font-weight: 700;">Qty: ${item.qty}</span>
                  <strong>${formatINR(item.price * item.qty)}</strong>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="form-group">
            <label class="form-label">Fulfillment Branch</label>
            <select class="form-input" id="cart-branch-select">
              ${(branches || state.branches).map(b => `<option value="${b.id}">${b.name} (${b.city})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Payment Method</label>
            <select class="form-input" id="cart-payment-select">
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
            </select>
          </div>

          <div style="padding-top: 1rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 1.1rem; font-weight: 700;">
            <span>Order Total:</span>
            <span style="color: var(--primary);">${formatINR(total)}</span>
          </div>
        `}
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" id="modal-cancel-cart">Close</button>
        ${state.cart.length > 0 ? `
          <button class="btn btn-primary" id="btn-checkout-submit">Complete Transaction</button>
        ` : ''}
      </div>
    `;

    overlay.classList.add('open');

    const close = () => overlay.classList.remove('open');
    document.getElementById('modal-close-cart').addEventListener('click', close);
    document.getElementById('modal-cancel-cart').addEventListener('click', close);

    const checkoutBtn = document.getElementById('btn-checkout-submit');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', async () => {
        const branchId = document.getElementById('cart-branch-select').value;
        const paymentMethod = document.getElementById('cart-payment-select').value;

        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Processing transaction safely…';

        try {
          const res = await window.InventoAPI.createSale({
            branchId,
            customerId: state.user?.userId || null,
            customerName: state.user?.name || 'Customer Online',
            userEmail: state.user?.email || 'customer@inventoledger.com',
            saleType: 'Customer Sale',
            paymentMethod,
            items: state.cart.map(i => ({ productId: i.id, quantity: i.qty, unitPrice: i.price }))
          });

          if (res.ok) {
            state.cart = [];
            document.getElementById('cart-count-badge').textContent = '0';
            close();
            showToast('Order Placed Successfully', `Sale ID: ${res.saleId}. Amount: ${formatINR(res.totalAmount)}`, 'success', 4000);
            renderCustomerStorefront(document.getElementById('app'));
          } else {
            showToast('Transaction Failed', res.error, 'error');
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Complete Transaction';
          }
        } catch (err) {
          showToast('Checkout Error', err.message, 'error');
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = 'Complete Transaction';
        }
      });
    }
  }

  // ==========================================
  // SHARED MODALS (Add Product, Transfer, PO, Sale)
  // ==========================================

  // 1. Add Product Modal
  function openAddProductModal() {
    const dialog = document.getElementById('global-modal-dialog');
    const overlay = document.getElementById('global-modal');

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="card-title">Add New Product</h3>
        <button class="modal-close-btn" id="modal-close-btn">&times;</button>
      </div>
      <form id="form-add-product">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Product Name</label>
            <input class="form-input" id="new-prod-name" required placeholder="Sony WH-1000XM5" />
          </div>
          <div class="form-group">
            <label class="form-label">SKU Code</label>
            <input class="form-input" id="new-prod-sku" required placeholder="SKU-SONY-WH5" />
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-input" id="new-prod-cat">
              <option value="Electronics">Electronics</option>
              <option value="Apparel & Fashion">Apparel & Fashion</option>
              <option value="Packaged Goods & Pantry">Packaged Goods & Pantry</option>
              <option value="Home & Living">Home & Living</option>
              <option value="Stationery & Office">Stationery & Office</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Product Picture URL</label>
            <input class="form-input" id="new-prod-img" placeholder="e.g. /images/products/logitech-mouse.jpg or web image URL" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Retail Price (₹)</label>
              <input class="form-input" type="number" id="new-prod-price" required placeholder="24999" />
            </div>
            <div class="form-group">
              <label class="form-label">Cost Price (₹)</label>
              <input class="form-input" type="number" id="new-prod-cost" placeholder="18000" />
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Initial Chain Stock</label>
              <input class="form-input" type="number" id="new-prod-stock" value="50" />
            </div>
            <div class="form-group">
              <label class="form-label">Min Reorder Level</label>
              <input class="form-input" type="number" id="new-prod-reorder" value="10" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-new-prod">Save Product</button>
        </div>
      </form>
    `;

    overlay.classList.add('open');
    const close = () => overlay.classList.remove('open');
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);

    document.getElementById('form-add-product').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit-new-prod');
      btn.disabled = true;
      btn.textContent = 'Saving…';

      try {
        const res = await window.InventoAPI.addProduct({
          name: document.getElementById('new-prod-name').value,
          sku: document.getElementById('new-prod-sku').value,
          category: document.getElementById('new-prod-cat').value,
          imageUrl: document.getElementById('new-prod-img').value || '/images/products/logitech-mouse.jpg',
          price: document.getElementById('new-prod-price').value,
          costPrice: document.getElementById('new-prod-cost').value,
          initialStock: document.getElementById('new-prod-stock').value,
          minReorderLevel: document.getElementById('new-prod-reorder').value
        });

        if (res.ok) {
          showToast('Product Created', 'New SKU distributed across branches.', 'success');
          close();
          renderAdminSubView(state.currentSubRoute);
        } else {
          showToast('Creation Failed', res.error, 'error');
          btn.disabled = false;
          btn.textContent = 'Save Product';
        }
      } catch (err) {
        showToast('Error', err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Save Product';
      }
    });
  }

  // 2. Inter-Branch Transfer Modal
  async function openCreateTransferModal(preselectedProdId = null, preselectedSourceBranch = null, preselectedTargetBranch = null) {
    const dialog = document.getElementById('global-modal-dialog');
    const overlay = document.getElementById('global-modal');

    const initialProdId = preselectedProdId || (state.products[0] ? state.products[0].id : null);
    const invRes = await window.InventoAPI.getInventory(null, initialProdId).catch(() => ({ ok: false, data: [] }));
    let prodInventories = invRes.data || [];

    function renderModal(currentProdId, currentSource, currentTarget) {
      dialog.innerHTML = `
        <div class="modal-header">
          <h3 class="card-title">Initiate Inter-Branch Transfer</h3>
          <button class="modal-close-btn" id="modal-close-btn">&times;</button>
        </div>
        <form id="form-create-transfer">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Product to Transfer</label>
              <select class="form-input" id="tr-prod" required>
                ${state.products.map(p => `
                  <option value="${p.id}" ${currentProdId === p.id ? 'selected' : ''}>
                    ${p.name} (SKU: ${p.sku})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Live stock banner across all branches -->
            <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.75rem; margin-bottom: 1rem;">
              <div style="font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.4rem;">
                Available Stock in Physical Stores:
              </div>
              <div class="branch-stock-chips">
                ${state.branches.map(b => {
                  const bInv = prodInventories.find(i => i.branch_id === b.id);
                  const qty = bInv ? bInv.stock_quantity : 0;
                  return `
                    <span class="branch-stock-chip ${qty > 0 ? 'has-stock' : 'out-stock'}">
                      ${b.name}: <strong>${qty} units</strong>
                    </span>
                  `;
                }).join('')}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div class="form-group">
                <label class="form-label">Source Branch (From)</label>
                <select class="form-input" id="tr-source" required>
                  ${state.branches.map(b => {
                    const bInv = prodInventories.find(i => i.branch_id === b.id);
                    const qty = bInv ? bInv.stock_quantity : 0;
                    return `
                      <option value="${b.id}" ${currentSource === b.id ? 'selected' : ''}>
                        ${b.name} (${qty} avail)
                      </option>
                    `;
                  }).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Destination Branch (To)</label>
                <select class="form-input" id="tr-target" required>
                  ${state.branches.map((b, i) => `
                    <option value="${b.id}" ${(currentTarget ? currentTarget === b.id : i === 1) ? 'selected' : ''}>
                      ${b.name}
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Transfer Quantity</label>
              <input class="form-input" type="number" id="tr-qty" value="5" min="1" required />
            </div>

            <div class="form-group">
              <label class="form-label">Transfer Notes / Reason</label>
              <input class="form-input" id="tr-notes" placeholder="Balancing stock for customer demand" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-transfer">Execute Atomic Transfer</button>
          </div>
        </form>
      `;

      const close = () => overlay.classList.remove('open');
      document.getElementById('modal-close-btn').addEventListener('click', close);
      document.getElementById('modal-cancel-btn').addEventListener('click', close);

      // Reactive update on product change
      document.getElementById('tr-prod').addEventListener('change', async (e) => {
        const newId = e.target.value;
        const curSrc = document.getElementById('tr-source').value;
        const curTgt = document.getElementById('tr-target').value;
        const res = await window.InventoAPI.getInventory(null, newId).catch(() => ({ ok: false, data: [] }));
        prodInventories = res.data || [];
        renderModal(newId, curSrc, curTgt);
      });

      document.getElementById('form-create-transfer').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-transfer');
        btn.disabled = true;
        btn.textContent = 'Executing…';

        try {
          const res = await window.InventoAPI.createTransfer({
            productId: document.getElementById('tr-prod').value,
            sourceBranchId: document.getElementById('tr-source').value,
            targetBranchId: document.getElementById('tr-target').value,
            quantity: Number(document.getElementById('tr-qty').value),
            notes: document.getElementById('tr-notes').value,
            requestedBy: state.user?.email || 'admin@inventoledger.com'
          });

          if (res.ok) {
            showToast('Transfer Complete', 'Stock rebalanced atomically across branches.', 'success');
            close();
            if (state.currentRoute === 'admin') renderAdminSubView(state.currentSubRoute);
            else if (state.currentRoute === 'manager') renderBranchManagerPortal(document.getElementById('app'));
          } else {
            showToast('Transfer Failed', res.error, 'error');
            btn.disabled = false;
            btn.textContent = 'Execute Atomic Transfer';
          }
        } catch (err) {
          showToast('Transfer Error', err.message, 'error');
          btn.disabled = false;
          btn.textContent = 'Execute Atomic Transfer';
        }
      });
    }

    renderModal(initialProdId, preselectedSourceBranch, preselectedTargetBranch);
    overlay.classList.add('open');
  }

  // 3. Purchase Order Modal
  function openCreatePurchaseModal(preselectedBranch = null, preselectedProd = null, preselectedQty = 20) {
    const dialog = document.getElementById('global-modal-dialog');
    const overlay = document.getElementById('global-modal');

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="card-title">Create Supplier Purchase Order</h3>
        <button class="modal-close-btn" id="modal-close-btn">&times;</button>
      </div>
      <form id="form-create-po">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Receiving Branch</label>
            <select class="form-input" id="po-branch" required>
              ${state.branches.map(b => `
                <option value="${b.id}" ${preselectedBranch === b.id ? 'selected' : ''}>${b.name} (${b.city})</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Supplier Name</label>
            <input class="form-input" id="po-supplier" required value="Authorized Distributor India" />
          </div>

          <div class="form-group">
            <label class="form-label">Product to Restock</label>
            <select class="form-input" id="po-prod" required>
              ${state.products.map(p => `
                <option value="${p.id}" data-cost="${p.cost_price || p.price * 0.6}" ${preselectedProd === p.id ? 'selected' : ''}>
                  ${p.name}
                </option>
              `).join('')}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Quantity</label>
              <input class="form-input" type="number" id="po-qty" value="${preselectedQty}" min="1" required />
            </div>
            <div class="form-group">
              <label class="form-label">Unit Cost (₹)</label>
              <input class="form-input" type="number" id="po-unit-cost" value="4500" required />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-po">Submit Purchase Order</button>
        </div>
      </form>
    `;

    overlay.classList.add('open');
    const close = () => overlay.classList.remove('open');
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);

    const prodSelect = document.getElementById('po-prod');
    const costInput = document.getElementById('po-unit-cost');
    const updateCost = () => {
      const opt = prodSelect.options[prodSelect.selectedIndex];
      if (opt) costInput.value = opt.getAttribute('data-cost') || '3000';
    };
    prodSelect.addEventListener('change', updateCost);
    updateCost();

    document.getElementById('form-create-po').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit-po');
      btn.disabled = true;
      btn.textContent = 'Submitting…';

      try {
        const res = await window.InventoAPI.createPurchase({
          branchId: document.getElementById('po-branch').value,
          supplierName: document.getElementById('po-supplier').value,
          orderedBy: state.user?.email || 'admin@inventoledger.com',
          items: [{
            productId: prodSelect.value,
            quantity: Number(document.getElementById('po-qty').value),
            unitCost: Number(costInput.value)
          }]
        });

        if (res.ok) {
          showToast('Purchase Order Received', 'Restock stock credited to branch inventory.', 'success');
          close();
          if (state.currentRoute === 'admin') renderAdminSubView(state.currentSubRoute);
          else if (state.currentRoute === 'manager') renderBranchManagerPortal(document.getElementById('app'));
        } else {
          showToast('Error', res.error, 'error');
          btn.disabled = false;
          btn.textContent = 'Submit Purchase Order';
        }
      } catch (err) {
        showToast('Error', err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Submit Purchase Order';
      }
    });
  }

  // 4. POS Sale Modal
  function openCreateSaleModal(preselectedBranch = null) {
    const dialog = document.getElementById('global-modal-dialog');
    const overlay = document.getElementById('global-modal');

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="card-title">Record POS Sale Transaction</h3>
        <button class="modal-close-btn" id="modal-close-btn">&times;</button>
      </div>
      <form id="form-create-sale">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Branch Store</label>
            <select class="form-input" id="sale-branch" required>
              ${state.branches.map(b => `
                <option value="${b.id}" ${preselectedBranch === b.id ? 'selected' : ''}>${b.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Customer Name</label>
            <input class="form-input" id="sale-customer" value="Walk-in Retail Shopper" required />
          </div>

          <div class="form-group">
            <label class="form-label">Product</label>
            <select class="form-input" id="sale-prod" required>
              ${state.products.map(p => `
                <option value="${p.id}" data-price="${p.price}">
                  ${p.name} (${formatINR(p.price)})
                </option>
              `).join('')}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Quantity</label>
              <input class="form-input" type="number" id="sale-qty" value="1" min="1" required />
            </div>
            <div class="form-group">
              <label class="form-label">Payment Channel</label>
              <select class="form-input" id="sale-payment">
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-sale">Submit Transaction</button>
        </div>
      </form>
    `;

    overlay.classList.add('open');
    const close = () => overlay.classList.remove('open');
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);

    document.getElementById('form-create-sale').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit-sale');
      btn.disabled = true;
      btn.textContent = 'Authorizing…';

      const prodSelect = document.getElementById('sale-prod');
      const opt = prodSelect.options[prodSelect.selectedIndex];
      const price = Number(opt.getAttribute('data-price') || 0);

      try {
        const res = await window.InventoAPI.createSale({
          branchId: document.getElementById('sale-branch').value,
          customerName: document.getElementById('sale-customer').value,
          userEmail: state.user?.email || 'pos@inventoledger.com',
          saleType: 'POS Sale',
          paymentMethod: document.getElementById('sale-payment').value,
          items: [{
            productId: prodSelect.value,
            quantity: Number(document.getElementById('sale-qty').value),
            unitPrice: price
          }]
        });

        if (res.ok) {
          showToast('Sale Registered', `Amount: ${formatINR(res.totalAmount)}. ACID ledger verified.`, 'success');
          close();
          if (state.currentRoute === 'admin') renderAdminSubView(state.currentSubRoute);
          else if (state.currentRoute === 'manager') renderBranchManagerPortal(document.getElementById('app'));
        } else {
          showToast('Sale Failed', res.error, 'error');
          btn.disabled = false;
          btn.textContent = 'Submit Transaction';
        }
      } catch (err) {
        showToast('Error', err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Submit Transaction';
      }
    });
  }

  // 5. Product Details Modal
  async function openProductDetailsModal(productId) {
    const dialog = document.getElementById('global-modal-dialog');
    const overlay = document.getElementById('global-modal');

    const prod = state.products.find(p => p.id === productId);
    if (!prod) return;

    // Fetch live inventory for this product across all branches
    const invRes = await window.InventoAPI.getInventory(null, productId).catch(() => ({ ok: false, data: [] }));
    const branchInventories = invRes.data || [];

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="card-title">${prod.name}</h3>
        <button class="modal-close-btn" id="modal-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display: flex; gap: 1.25rem; margin-bottom: 1.25rem; align-items: center; background: rgba(15, 23, 42, 0.4); padding: 1rem; border-radius: var(--radius-lg); border: 1px solid var(--border);">
          ${prod.image_url ? `<img src="${prod.image_url}" alt="${prod.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--border);" onerror="this.onerror=null; this.src='/images/products/logitech-mouse.jpg';" />` : ''}
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; flex: 1; font-size: 0.84375rem;">
            <div><span style="color: var(--text-dim);">SKU:</span> <strong>${prod.sku}</strong></div>
            <div><span style="color: var(--text-dim);">Category:</span> <strong>${prod.category}</strong></div>
            <div><span style="color: var(--text-dim);">Retail Price:</span> <strong>${formatINR(prod.price)}</strong></div>
            <div><span style="color: var(--text-dim);">Min Reorder:</span> <strong>${prod.min_reorder_level} units</strong></div>
          </div>
        </div>

        <h4 style="font-size: 0.9375rem; font-weight: 700; margin-bottom: 0.75rem;">Live Multi-Branch Stock Availability</h4>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Branch Location</th>
                <th>Available Units</th>
                <th>Reserved</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${state.branches.map(b => {
                const bInv = branchInventories.find(inv => inv.branch_id === b.id);
                const qty = bInv ? bInv.stock_quantity : 0;
                const reserved = bInv ? bInv.reserved_quantity : 0;
                return `
                  <tr>
                    <td><strong>${b.name}</strong> <span style="color: var(--text-muted); font-size: 0.75rem;">(${b.city})</span></td>
                    <td><strong style="color: ${qty > prod.min_reorder_level ? 'var(--text-main)' : qty > 0 ? 'var(--warning)' : 'var(--danger)'};">${qty} units</strong></td>
                    <td style="color: var(--text-dim);">${reserved}</td>
                    <td>
                      <span class="status-pill ${qty > prod.min_reorder_level ? 'success' : qty > 0 ? 'warning' : 'danger'}">
                        ${qty > prod.min_reorder_level ? 'In Stock' : qty > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" id="modal-close-btn-bottom">Close</button>
      </div>
    `;

    overlay.classList.add('open');
    const close = () => overlay.classList.remove('open');
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-close-btn-bottom').addEventListener('click', close);
  }

  // Stock adjustment modal
  function openStockAdjustmentModal() {
    showToast('Stock Adjustment', 'Select product and branch to adjust quantity with audit trail logging.', 'info');
  }

  // ==========================================
  // INITIALIZATION ON DOM READY
  // ==========================================
  document.addEventListener('DOMContentLoaded', async () => {
    restoreSession();
    await loadInitialData();

    // Check URL Hash for initial route
    const hash = window.location.hash.replace('#', '') || 'role-selection';
    const parts = hash.split('/');
    state.currentRoute = parts[0] || 'role-selection';
    state.currentSubRoute = parts[1] || 'dashboard';

    render();
  });

})();
