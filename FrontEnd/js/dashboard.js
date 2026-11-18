// ============================================
// DASHBOARD.JS - Loads dashboard statistics
// ============================================

document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('page-dashboard')) return;
  loadDashboardStats();
  loadRecentActivities();
  loadActiveBorrowings();
  loadRecentEquipment();
});

async function loadDashboardStats() {
  try {
    var equipmentRes = await fetch(API_URL + '/equipment');
    var usersRes = await fetch(API_URL + '/users');
    var transactionsRes = await fetch(API_URL + '/transactions');

    var equipment = await equipmentRes.json();
    var users = await usersRes.json();
    var transactions = await transactionsRes.json();

    // Equipment stats
    if (equipment.success) {
      var total = equipment.data.length;
      var available = 0;
      var borrowed = 0;
      for (var i = 0; i < equipment.data.length; i++) {
        var item = equipment.data[i];
        available += (item.available_quantity || 0);
        borrowed += ((item.total_quantity || 0) - (item.available_quantity || 0));
      }
      var statTotal = document.getElementById('stat-total');
      var statAvailable = document.getElementById('stat-available');
      var statBorrowed = document.getElementById('stat-borrowed');
      if (statTotal) statTotal.textContent = total;
      if (statAvailable) statAvailable.textContent = available;
      if (statBorrowed) statBorrowed.textContent = borrowed;
    }

    // User stats
    if (users.success) {
      var students = 0;
      var teachers = 0;
      for (var j = 0; j < users.data.length; j++) {
        if (users.data[j].user_type === 'student') students++;
        if (users.data[j].user_type === 'teacher') teachers++;
      }
      var statStudents = document.getElementById('stat-students');
      var statTeachers = document.getElementById('stat-teachers');
      if (statStudents) statStudents.textContent = students;
      if (statTeachers) statTeachers.textContent = teachers;
    }

    // Active borrowings count
    if (transactions.success) {
      var active = 0;
      for (var k = 0; k < transactions.data.length; k++) {
        if (transactions.data[k].status === 'Borrowed') active++;
      }
      var statPending = document.getElementById('stat-pending');
      if (statPending) statPending.textContent = active;
    }
  } catch (err) {
    console.error('Dashboard stats error:', err);
  }
}

async function loadRecentActivities() {
  try {
    var res = await fetch(API_URL + '/transactions');
    var data = await res.json();
    if (data.success) {
      var recent = data.data.slice(0, 5);
      var tbody = document.getElementById('recent-activities-body');
      if (tbody) {
        tbody.innerHTML = recent.map(function (t) {
          return '<tr><td>' + (t.borrower_name || '-') + '</td><td>' + (t.equipment_name || '-') + '</td><td>' + (t.quantity || 0) + '</td><td>' + formatDate(t.checkout_date) + '</td><td>' + getStatusBadge(t.status) + '</td></tr>';
        }).join('');
      }
    }
  } catch (err) {
    console.error('Recent activities error:', err);
  }
}

async function loadActiveBorrowings() {
  try {
    var res = await fetch(API_URL + '/transactions');
    var data = await res.json();
    if (data.success) {
      var active = data.data.filter(function (t) {
        return t.status === 'Borrowed';
      }).slice(0, 5);
      var tbody = document.getElementById('dashboard-active-body');
      if (tbody) {
        if (active.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No active borrowings.</td></tr>';
        } else {
          tbody.innerHTML = active.map(function (t) {
            return '<tr><td>' + (t.borrower_name || '-') + '</td><td>' + (t.equipment_name || '-') + '</td><td>' + (t.quantity || 0) + '</td><td>' + formatDate(t.expected_return_date) + '</td></tr>';
          }).join('');
        }
      }
    }
  } catch (err) {
    console.error('Active borrowings error:', err);
  }
}

async function loadRecentEquipment() {
  try {
    var res = await fetch(API_URL + '/equipment');
    var data = await res.json();
    if (data.success) {
      var recent = data.data.slice(0, 5);
      var list = document.getElementById('recent-equipment-list');
      if (list) {
        list.innerHTML = recent.map(function (item) {
          return '<li>' + item.name + ' <span style="color:var(--muted)">(' + item.available_quantity + '/' + item.total_quantity + ' available)</span></li>';
        }).join('');
      }
    }
  } catch (err) {
    console.error('Recent equipment error:', err);
  }
}