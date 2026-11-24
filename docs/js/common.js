// ============================================
// COMMON.JS - Shared functions for all pages
// ============================================

const API_URL = 'http://localhost:3000/api';

// Get auth headers for API requests
function getAuthHeaders() {
  var token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? 'Bearer ' + token : ''
  };
}

// XSS Prevention: escape HTML special characters
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  var div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function checkAuth() {
  var user = JSON.parse(localStorage.getItem('currentUser'));
  var token = localStorage.getItem('authToken');
  if ((!user || !token) && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
  }
  return user;
}

function updateTopbar() {
  var user = JSON.parse(localStorage.getItem('currentUser'));
  if (user) {
    var userNameEl = document.getElementById('user-name');
    var userRoleEl = document.getElementById('user-role');
    if (userNameEl) userNameEl.textContent = user.first_name + ' ' + user.last_name;
    if (userRoleEl) userRoleEl.textContent = user.user_type;
  }
}

function logout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
  window.location.href = 'index.html';
}

function showPage(pageName) {
  var pageMap = {
    'dashboard': 'dashboard.html',
    'equipment': 'equipment.html',
    'users': 'user.html',
    'requests': 'request.html',
    'history': 'history.html',
    'penalties': 'penalties.html'
  };
  window.location.href = pageMap[pageName] || pageName + '.html';
}

function showToast(message, type) {
  type = type || 'success';
  var toast = document.getElementById('toast');

  // Create toast element if it doesn't exist (e.g., on login page)
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.background = type === 'error' ? '#d84b5b' : '#102d52';
  toast.style.display = 'block';
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(function () {
      toast.style.display = 'none';
    }, 300);
  }, 3000);
}

function openModal(modalId) {
  var modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
  var modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

function closeModalOnBackdrop(event, modalId) {
  if (event.target.id === modalId) {
    closeModal(modalId);
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  var date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getStatusBadge(status) {
  var s = (status || '').toLowerCase();
  var bg = '#e5ebf3';
  var color = '#40536d';

  // Transaction / Account statuses
  if (s === 'overdue') {
    bg = '#d84b5b';
    color = '#fff';
  } else if (s === 'returned') {
    bg = '#4caf50';
    color = '#fff';
  } else if (s === 'borrowed') {
    bg = '#1765df';
    color = '#fff';
  } else if (s === 'active' || s === 'available') {
    bg = '#e8f5e9';
    color = '#2e7d32';
  } else if (s === 'inactive') {
    bg = '#ffebee';
    color = '#c62828';
  }
  // User types
  else if (s === 'admin') {
    bg = '#ffc107';      // pure yellow
    color = '#333';
  } else if (s === 'custodian') {
    bg = '#fff3cd';      // light yellow
    color = '#856404';
  } else if (s === 'teacher') {
    bg = '#e3f2fd';      // light blue
    color = '#1565c0';
  } else if (s === 'student') {
    bg = '#f3e5f5';      // light purple
    color = '#6a1b9a';
  }

  return `<span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;background:${bg};color:${color}">${escapeHtml(status)}</span>`;
}

document.addEventListener('DOMContentLoaded', function () {
  checkAuth();
  updateTopbar();
});

function checkUserRole() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  return user ? user.user_type || user.role : null;
}

function isAdmin() {
  return checkUserRole() === 'admin';
}

function isCustodian() {
  return checkUserRole() === 'custodian';
}

function requireAdmin() {
  if (!isAdmin()) {
    showToast('Admin access required.', 'error');
    return false;
  }
  return true;
}

// Hide admin-only UI elements for non-admin users
document.addEventListener('DOMContentLoaded', function () {
  if (!isAdmin()) {
    const adminOnlyElements = document.querySelectorAll('[data-admin-only]');
    adminOnlyElements.forEach(el => el.style.display = 'none');
  }
});