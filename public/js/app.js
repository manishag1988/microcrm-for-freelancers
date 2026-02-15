// Micro-CRM Main Application
import { API } from './api.js';
import { Router } from './router.js';
import { Validator, validateForm } from './validator.js';
import { DataExport } from './modules/export.js';
import { Dashboard } from './modules/dashboard.js';
import { Clients } from './modules/clients.js';
import { Projects } from './modules/projects.js';
import { Tasks } from './modules/tasks.js';
import { Invoices } from './modules/invoices.js';
import { TimeTracker } from './modules/timetracker.js';
import { Admin } from './modules/admin.js';
import { Modal } from './modal.js';
import { Toast } from './toast.js';

class Loading {
  static show() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  static hide() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  static async wrap(promise) {
    this.show();
    try {
      return await promise;
    } finally {
      this.hide();
    }
  }
}

// App State
const state = {
  user: null,
  currentPage: 'dashboard',
  timer: {
    interval: null,
    startTime: null,
    logId: null
  }
};

// Page renderers
const pages = {
  dashboard: () => Dashboard.render(),
  clients: () => Clients.render(),
  projects: () => Projects.render(),
  tasks: () => Tasks.render(),
  invoices: () => Invoices.render(),
  timetracker: () => TimeTracker.render(),
  admin: () => Admin.render()
};

// DOM Elements
const elements = {
  authContainer: document.getElementById('auth-container'),
  appContainer: document.getElementById('app-container'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  showRegister: document.getElementById('show-register'),
  showLogin: document.getElementById('show-login'),
  pageTitle: document.getElementById('page-title'),
  menuToggle: document.getElementById('menu-toggle'),
  sidebar: document.querySelector('.sidebar'),
  navItems: document.querySelectorAll('.nav-item'),
  logoutBtn: document.getElementById('logout-btn'),
  userMenuBtn: document.getElementById('user-menu-btn'),
  userDropdown: document.getElementById('user-dropdown'),
  userAvatar: document.getElementById('user-avatar'),
  userName: document.getElementById('user-name'),
  timerDisplay: document.getElementById('timer-display'),
  adminLink: document.querySelector('.admin-link'),
  modalOverlay: document.getElementById('modal-overlay'),
  modalTitle: document.getElementById('modal-title'),
  modalBody: document.getElementById('modal-body'),
  modalClose: document.getElementById('modal-close'),
  toastContainer: document.getElementById('toast-container')
};

// Initialize modules
Router.init(state, elements, pages);
Modal.init(state, elements);

// Expose globally for inline onclick handlers
window.API = API;
window.Projects = Projects;
window.Clients = Clients;
window.Tasks = Tasks;
window.Invoices = Invoices;
window.TimeTracker = TimeTracker;
window.Admin = Admin;
window.Toast = Toast;
window.Modal = Modal;
window.Validator = Validator;
window.validateForm = validateForm;
window.DataExport = DataExport;

// Initialize App
async function init() {
  setupEventListeners();
  await checkAuth();
}

async function checkAuth() {
  try {
    const response = await API.get('/auth/me');
    // /auth/me returns user directly, not wrapped in { user: ... }
    if (response && response.id) {
      state.user = response;
      showApp();
    } else {
      showAuth();
    }
  } catch (error) {
    showAuth();
  }
}

function showAuth() {
  elements.authContainer.classList.remove('hidden');
  elements.appContainer.classList.add('hidden');
}

function showApp() {
  elements.authContainer.classList.add('hidden');
  elements.appContainer.classList.remove('hidden');
  updateUserInfo();
  Router.navigate('dashboard');
  if (state.user.role === 'admin') {
    elements.adminLink.classList.remove('hidden');
  }
  TimeTracker.startTimerDisplay();
}

function updateUserInfo() {
  elements.userName.textContent = state.user.name;
  elements.userAvatar.textContent = state.user.name.charAt(0).toUpperCase();
}

function setupEventListeners() {
  // Auth forms
  elements.showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    elements.loginForm.classList.add('hidden');
    elements.registerForm.classList.remove('hidden');
  });

  elements.showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    elements.registerForm.classList.add('hidden');
    elements.loginForm.classList.remove('hidden');
  });

  elements.loginForm.addEventListener('submit', handleLogin);
  elements.registerForm.addEventListener('submit', handleRegister);

  // Navigation
  elements.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) {
        Router.navigate(page);
      }
    });
  });

  // Mobile menu toggle
  elements.menuToggle.addEventListener('click', () => {
    elements.sidebar.classList.toggle('open');
  });

  // Logout
  elements.logoutBtn.addEventListener('click', handleLogout);

  // User menu
  elements.userMenuBtn.addEventListener('click', () => {
    elements.userDropdown.classList.toggle('hidden');
  });

  // User dropdown actions
  elements.userDropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const action = item.dataset.action;
      if (action === 'logout') {
        handleLogout();
      } else if (action === 'settings') {
        Modal.showSettings();
      } else if (action === 'profile') {
        Modal.showProfile();
      }
      elements.userDropdown.classList.add('hidden');
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!elements.userMenuBtn.contains(e.target) && !elements.userDropdown.contains(e.target)) {
      elements.userDropdown.classList.add('hidden');
    }
  });

  // Modal close
  elements.modalClose.addEventListener('click', Modal.hide);
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) {
      Modal.hide();
    }
  });

  // Quick actions
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      handleQuickAction(action);
    });
  });

  // Timer widget button
  document.getElementById('timer-widget-btn')?.addEventListener('click', () => {
    Router.navigate('timetracker');
  });
}

async function handleLogin(e) {
  e.preventDefault();
  
  // Validate form
  if (!validateForm('login-form', 'login')) {
    return;
  }
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await API.post('/auth/login', { email, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    // Login returns { user: {...}, token: ... }
    state.user = response.user;
    showApp();
    Toast.show('Welcome back!', 'success');
  } catch (error) {
    Toast.show(error.error || 'Login failed', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  // Validate form
  if (!validateForm('register-form', 'register')) {
    return;
  }
  
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const company = document.getElementById('register-company').value;
  const password = document.getElementById('register-password').value;

  try {
    const response = await API.post('/auth/register', { name, email, company_name: company, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    state.user = response.user;
    showApp();
    Toast.show('Account created successfully!', 'success');
  } catch (error) {
    Toast.show(error.error || 'Registration failed', 'error');
  }
}

async function handleLogout() {
  try {
    await API.post('/auth/logout');
    localStorage.removeItem('token');
    state.user = null;
    showAuth();
    Toast.show('Logged out successfully', 'success');
  } catch (error) {
    Toast.show('Logout failed', 'error');
  }
}

function handleQuickAction(action) {
  switch (action) {
    case 'add-client':
      Modal.showClientForm();
      break;
    case 'add-project':
      Modal.showProjectForm();
      break;
    case 'create-invoice':
      Modal.showInvoiceForm();
      break;
    case 'start-timer':
      Router.navigate('timetracker');
      break;
  }
}

// Export for module usage
export { state, elements, pages, API };

// Start the app
init();
