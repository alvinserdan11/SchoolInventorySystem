// ============================================
// USERS.JS - User management
// ============================================

let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('page-users')) return;
  loadUsers();
});

async function loadUsers() {
  try {
    const res = await fetch(`${API_URL}/users`);
    const data = await res.json();
    if (data.success) {
      allUsers = data.data;
      renderUsers();
    }
  } catch (err) {
    console.error('Load users error:', err);
  }
}

function renderUsers() {
  const search = document.getElementById('users-search')?.value.toLowerCase() || '';
  const typeFilter = document.getElementById('users-type-filter')?.value || 'all';

  let filtered = allUsers.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(search) || user.email.toLowerCase().includes(search);
    let matchesType = true;
    if (typeFilter === 'student') matchesType = user.user_type === 'student';
    if (typeFilter === 'teacher') matchesType = user.user_type === 'teacher';
    if (typeFilter === 'staff') matchesType = user.user_type === 'custodian' || user.user_type === 'admin';
    return matchesSearch && matchesType;
  });

  const tbody = document.getElementById('users-body');
  if (tbody) {
    tbody.innerHTML = filtered.map(user => `
      <tr>
        <td>${user._id.slice(-6)}</td>
        <td>${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}</td>
        <td>${user.student_id_number || '-'}</td>
        <td>${user.email}</td>
        <td>${user.contact_number}</td>
        <td>${user.department}${user.course ? ' - ' + user.course : ''}</td>
        <td><span class="badge">${user.user_type}</span></td>
        <td>${getStatusBadge(user.account_status)}</td>
        <td>
          <button class="btn btn-small" onclick="editUser('${user._id}')">Edit</button>
          <button class="btn btn-small" onclick="viewUserHistory('${user._id}')">History</button>
        </td>
      </tr>
    `).join('');
  }
}

function openAddUser() {
  document.getElementById('user-form-title').textContent = 'Add New User';
  document.getElementById('user-form').reset();
  document.getElementById('user-record-id').value = '';
  document.getElementById('user-password-group').style.display = 'block';
  document.getElementById('user-role').value = 'borrower';
  openModal('user-form-modal');
}

function editUser(id) {
  const user = allUsers.find(u => u._id === id);
  if (!user) return;
  document.getElementById('user-form-title').textContent = 'Edit User';
  document.getElementById('user-record-id').value = user._id;
  document.getElementById('user-student-id').value = user.student_id_number || '';
  document.getElementById('user-first-name').value = user.first_name || '';
  document.getElementById('user-middle-name').value = user.middle_name || '';
  document.getElementById('user-last-name').value = user.last_name || '';
  document.getElementById('user-address').value = user.address || '';
  document.getElementById('user-email').value = user.email;
  document.getElementById('user-contact').value = user.contact_number;
  document.getElementById('user-dob').value = user.date_of_birth ? user.date_of_birth.split('T')[0] : '';
  document.getElementById('user-department').value = user.department;
  document.getElementById('user-course').value = user.course || '';
  document.getElementById('user-type').value = user.user_type;
  document.getElementById('user-role').value = user.role || 'borrower';
  document.getElementById('user-status').value = user.account_status;
  document.getElementById('user-password-group').style.display = 'none';
  openModal('user-form-modal');
}

async function saveUser(event) {
  event.preventDefault();
  const id = document.getElementById('user-record-id').value;

  // Validation
  const studentId = document.getElementById('user-student-id').value.trim();
  const course = document.getElementById('user-course').value.trim();
  if (!studentId) { alert('Student Number / Employee ID is required!'); return; }
  if (!course) { alert('Course is required!'); return; }

  const userData = {
    student_id_number: document.getElementById('user-student-id').value,
    first_name: document.getElementById('user-first-name').value,
    middle_name: document.getElementById('user-middle-name').value,
    last_name: document.getElementById('user-last-name').value,
    address: document.getElementById('user-address').value,
    email: document.getElementById('user-email').value,
    contact_number: document.getElementById('user-contact').value,
    date_of_birth: document.getElementById('user-dob').value,
    department: document.getElementById('user-department').value,
    course: document.getElementById('user-course').value,
    user_type: document.getElementById('user-type').value,
    role: document.getElementById('user-role').value,
    account_status: document.getElementById('user-status').value
  };

  if (!id) {
    const password = document.getElementById('user-password').value;
    if (password) userData.password = password;
  }

  try {
    const url = id ? `${API_URL}/users/${id}` : `${API_URL}/users`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (data.success) {
      showToast(id ? 'User updated!' : 'User created!');
      closeModal('user-form-modal');
      loadUsers();
    }
  } catch (err) {
    console.error('Save user error:', err);
    showToast('Error saving user', 'error');
  }
}

function updateUserFormFields() {
  const type = document.getElementById('user-type').value;
  const passwordGroup = document.getElementById('user-password-group');
  const passwordHint = document.getElementById('user-password-hint');
  if (type === 'custodian' || type === 'admin') {
    passwordGroup.style.display = 'block';
    passwordHint.textContent = 'Password is required for operator accounts.';
  } else {
    passwordGroup.style.display = 'none';
  }
}

async function viewUserHistory(userId) {
  try {
    const res = await fetch(`${API_URL}/transactions`);
    const data = await res.json();
    if (data.success) {
      const userTransactions = data.data.filter(t => t.user_id === userId || t.user_id?._id === userId);
      const user = allUsers.find(u => u._id === userId);
      document.getElementById('user-history-title').textContent = `Borrowing History - ${user?.first_name || ''} ${user?.last_name || ''}`;
      const body = document.getElementById('user-history-body');
      if (body) {
        body.innerHTML = `
          <table>
            <thead><tr><th>Equipment</th><th>Qty</th><th>Borrow Date</th><th>Return Date</th><th>Status</th></tr></thead>
            <tbody>
              ${userTransactions.length ? userTransactions.map(t => `
                <tr>
                  <td>${t.equipment_name}</td>
                  <td>${t.quantity}</td>
                  <td>${formatDate(t.checkout_date)}</td>
                  <td>${formatDate(t.actual_return_date)}</td>
                  <td>${getStatusBadge(t.status)}</td>
                </tr>
              `).join('') : '<tr><td colspan="5">No borrowing history found.</td></tr>'}
            </tbody>
          </table>
        `;
      }
      openModal('user-history-modal');
    }
  } catch (err) {
    console.error('User history error:', err);
  }
}
