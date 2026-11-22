// ============================================
// DASHBOARD.JS - Loads dashboard statistics
// ============================================

document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('page-dashboard')) return;
  loadDashboardStats();
  loadRecentActivities();
  loadActiveBorrowings();
  loadRecentEquipment();
  loadEquipmentAvailability();
});

async function loadDashboardStats() {
  try {
    // REMOVED: sync-stock call was causing stock corruption
    // Stock is managed directly by borrow/return operations

    var headers = getAuthHeaders();
    var [equipmentRes, usersRes, transactionsRes] = await Promise.all([
      fetch(API_URL + '/equipment', { headers }),
      fetch(API_URL + '/users', { headers }),
      fetch(API_URL + '/transactions', { headers })
    ]);

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

    // Active borrowings count (includes both Borrowed and Overdue)
    if (transactions.success) {
      var active = 0;
      for (var k = 0; k < transactions.data.length; k++) {
        if (transactions.data[k].status === 'Borrowed' || transactions.data[k].status === 'Overdue') {
          active++;
        }
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
    var res = await fetch(API_URL + '/transactions', { headers: getAuthHeaders() });
    var data = await res.json();
    if (data.success) {
      var recent = data.data.slice(0, 5);
      var tbody = document.getElementById('recent-activities-body');
      if (tbody) {
        tbody.innerHTML = recent.map(function (t) {
          return '<tr><td>' + escapeHtml(t.borrower_name || '-') + '</td><td>' + escapeHtml(t.equipment_name || '-') + '</td><td>' + (t.quantity || 0) + '</td><td>' + formatDate(t.checkout_date) + '</td><td>' + getStatusBadge(t.status) + '</td></tr>';
        }).join('');
      }
    }
  } catch (err) {
    console.error('Recent activities error:', err);
  }
}

async function loadActiveBorrowings() {
  try {
    var res = await fetch(API_URL + '/transactions', { headers: getAuthHeaders() });
    var data = await res.json();
    if (data.success) {
      // Include both Borrowed and Overdue in active borrowings
      var active = data.data.filter(function (t) {
        return t.status === 'Borrowed' || t.status === 'Overdue';
      }).slice(0, 5);
      var tbody = document.getElementById('dashboard-active-body');
      if (tbody) {
        if (active.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No active borrowings.</td></tr>';
        } else {
          tbody.innerHTML = active.map(function (t) {
            return '<tr><td>' + escapeHtml(t.borrower_name || '-') + '</td><td>' + escapeHtml(t.equipment_name || '-') + '</td><td>' + (t.quantity || 0) + '</td><td>' + formatDate(t.expected_return_date) + '</td></tr>';
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
    var res = await fetch(API_URL + '/equipment', { headers: getAuthHeaders() });
    var data = await res.json();
    if (data.success) {
      var recent = data.data.slice(0, 5);
      var list = document.getElementById('recent-equipment-list');
      if (list) {
        list.innerHTML = recent.map(function (item) {
          return '<li>' + escapeHtml(item.name) + ' <span style="color:var(--muted)">(' + item.available_quantity + '/' + item.total_quantity + ' available)</span></li>';
        }).join('');
      }
    }
  } catch (err) {
    console.error('Recent equipment error:', err);
  }
}

async function loadEquipmentAvailability() {
  try {
    var res = await fetch(API_URL + '/equipment', { headers: getAuthHeaders() });
    var data = await res.json();
    var container = document.getElementById('availability-overview');

    if (!container) return;

    if (data.success && data.data.length > 0) {
      var html = '';
      for (var i = 0; i < data.data.length; i++) {
        var item = data.data[i];
        var available = item.available_quantity || 0;
        var total = item.total_quantity || 0;
        var borrowed = total - available;
        var percent = total > 0 ? Math.round((available / total) * 100) : 0;

        var barColor = percent > 50 ? '#13845b' : percent > 20 ? '#f59e0b' : '#c13d50';

        html += '<div style="margin-bottom:16px;">';
        html += '<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;">';
        html += '<span style="font-weight:600;color:#1b3150;">' + escapeHtml(item.name) + '</span>';
        html += '<span style="color:#718096;">' + available + '/' + total + ' available</span>';
        html += '</div>';
        html += '<div style="background:#e5ebf3;border-radius:8px;height:10px;overflow:hidden;">';
        html += '<div style="width:' + percent + '%;background:' + barColor + ';height:100%;border-radius:8px;transition:width 0.5s;"></div>';
        html += '</div>';
        html += '<div style="font-size:11px;color:#718096;margin-top:4px;">' + borrowed + ' borrowed</div>';
        html += '</div>';
      }
      container.innerHTML = html;
    } else {
      container.innerHTML = '<p style="color:#718096;text-align:center;">No equipment found.</p>';
    }
  } catch (err) {
    console.error('Equipment availability error:', err);
    var container = document.getElementById('availability-overview');
    if (container) container.innerHTML = '<p style="color:#c13d50;text-align:center;">Failed to load.</p>';
  }
}