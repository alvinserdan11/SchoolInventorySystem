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
  if (toast) {
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#d84b5b' : '#102d52';
    toast.style.display = 'block';
    setTimeout(function () { toast.style.display = 'none'; }, 3000);
  }
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
  var statusClass = (status || '').toLowerCase();
  return '' + escapeHtml(status) + '';
}

document.addEventListener('DOMContentLoaded', function () {
  checkAuth();
  updateTopbar();
});