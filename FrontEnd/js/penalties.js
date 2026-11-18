// ============================================
// PENALTIES.JS - Penalty management
// ============================================

let allPenalties = [];
let allUsers = [];
let allTransactions = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('page-penalties')) return;
  loadPenaltiesData();
});

async function loadPenaltiesData() {
  try {
    const [penaltiesRes, usersRes, transactionsRes] = await Promise.all([
      fetch(`${API_URL}/penalties`),
      fetch(`${API_URL}/users`),
      fetch(`${API_URL}/transactions`)
    ]);

    const penaltiesData = await penaltiesRes.json();
    const usersData = await usersRes.json();
    const transactionsData = await transactionsRes.json();

    if (penaltiesData.success) allPenalties = penaltiesData.data;
    if (usersData.success) allUsers = usersData.data;
    if (transactionsData.success) allTransactions = transactionsData.data;

    renderPenalties();
  } catch (err) {
    console.error('Load penalties error:', err);
  }
}

function renderPenalties() {
  const search = document.getElementById('penalties-search')?.value.toLowerCase() || '';
  const statusFilter = document.getElementById('penalties-status-filter')?.value || 'all';

  let filtered = allPenalties.filter(p => {
    const matchesSearch = p.user_name.toLowerCase().includes(search) || p.reason.toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'all' || p.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const tbody = document.getElementById('penalties-body');
  if (tbody) {
    tbody.innerHTML = filtered.length ? filtered.map(p => `
      <tr>
        <td>${p.user_name}</td>
        <td>${p.reason}</td>
        <td>PHP ${p.amount_due.toFixed(2)}</td>
        <td>${formatDate(p.date_notified)}</td>
        <td>${getStatusBadge(p.payment_status)}</td>
        <td>
          ${p.payment_status === 'Pending' ? `
            <button class="btn btn-primary btn-small" onclick="markPenaltyPaid('${p._id}')">Mark Paid</button>
            <button class="btn btn-small" onclick="waivePenalty('${p._id}')">Waive</button>
          ` : formatDate(p.date_settled)}
        </td>
      </tr>
    `).join('') : '<tr><td colspan="6">No penalties found.</td></tr>';
  }
}

function openAddPenalty() {
  document.getElementById('penalty-form').reset();
  populatePenaltyUsers();
  populatePenaltyTransactions();
  openModal('penalty-form-modal');
}

function populatePenaltyUsers() {
  const select = document.getElementById('penalty-user');
  if (select) {
    select.innerHTML = allUsers.filter(u => u.user_type === 'student' || u.user_type === 'teacher')
      .map(u => `<option value="${u._id}">${u.first_name} ${u.last_name} (${u.student_id_number || u.email})</option>`).join('');
  }
}

function populatePenaltyTransactions() {
  const select = document.getElementById('penalty-transaction');
  if (select) {
    select.innerHTML = '<option value="">Select Transaction (Optional)</option>' +
      allTransactions.filter(t => t.status === 'Returned' || t.status === 'Overdue')
        .map(t => `<option value="${t._id}">${t.borrower_name} - ${t.equipment_name} (${formatDate(t.checkout_date)})</option>`).join('');
  }
}

async function savePenalty(event) {
  event.preventDefault();
  const userId = document.getElementById('penalty-user').value;
  const user = allUsers.find(u => u._id === userId);

  const penaltyData = {
    transaction_id: document.getElementById('penalty-transaction').value || null,
    user_id: userId,
    user_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
    amount_due: parseFloat(document.getElementById('penalty-amount').value),
    reason: document.getElementById('penalty-reason').value,
    payment_status: 'Pending',
    recorded_by: 'admin001' // In production, use logged-in user ID
  };

  try {
    const res = await fetch(`${API_URL}/penalties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(penaltyData)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Penalty recorded!');
      closeModal('penalty-form-modal');
      loadPenaltiesData();
    }
  } catch (err) {
    console.error('Save penalty error:', err);
    showToast('Error recording penalty', 'error');
  }
}

async function markPenaltyPaid(id) {
  try {
    const res = await fetch(`${API_URL}/penalties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: 'Paid', date_settled: new Date() })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Penalty marked as paid!');
      loadPenaltiesData();
    }
  } catch (err) {
    console.error('Mark paid error:', err);
    showToast('Error updating penalty', 'error');
  }
}

async function waivePenalty(id) {
  try {
    const res = await fetch(`${API_URL}/penalties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: 'Waived', date_settled: new Date() })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Penalty waived!');
      loadPenaltiesData();
    }
  } catch (err) {
    console.error('Waive error:', err);
    showToast('Error waiving penalty', 'error');
  }
}
