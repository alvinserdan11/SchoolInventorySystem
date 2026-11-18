// ============================================
// COMMON.JS - Shared functions for all pages
// ============================================

const API_URL = 'http://localhost:3000/api';

function checkAuth() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
  }
  return user;
}

function updateTopbar() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (user) {
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    if (userNameEl) userNameEl.textContent = user.first_name + ' ' + user.last_name;
    if (userRoleEl) userRoleEl.textContent = user.user_type;
  }
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

function showPage(pageName) {
  const pageMap = {
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
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#d84b5b' : '#102d52';
    toast.style.display = 'block';
    setTimeout(function() { toast.style.display = 'none'; }, 3000);
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

function closeModalOnBackdrop(event, modalId) {
  if (event.target.id === modalId) {
    closeModal(modalId);
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getStatusBadge(status) {
  const statusClass = (status || '').toLowerCase();
  return '<span class="badge status-' + statusClass + '">' + status + '</span>';
}

document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  updateTopbar();
});
