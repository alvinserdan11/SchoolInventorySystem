// ============================================
// LOGIN.JS - Handles login functionality
// ============================================

document.addEventListener('DOMContentLoaded', function () {
  var loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    try {
      var response = await fetch(API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
      });
      var data = await response.json();
      if (data.success) {
        // Store both user data and JWT token
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        localStorage.setItem('authToken', data.token);
        window.location.href = 'dashboard.html';
      } else {
        showToast(data.message || 'Invalid credentials!', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('Server error. Make sure backend is running on localhost:3000', 'error');
    }
  });
});