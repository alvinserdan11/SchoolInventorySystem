// ============================================
// HISTORY.JS - Borrowing history
// ============================================

let allTransactions = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('page-history')) return;
  loadHistory();
});

async function loadHistory() {
  try {
    // Auto-check for overdue transactions before loading history
    await fetch(`${API_URL}/transactions/check-overdue`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    const res = await fetch(`${API_URL}/transactions`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      allTransactions = data.data;
      renderHistory();
    }
  } catch (err) {
    console.error('Load history error:', err);
  }
}

function renderHistory() {
  const search = document.getElementById('history-search')?.value.toLowerCase() || '';
  const statusFilter = document.getElementById('history-status-filter')?.value || 'all';

  let filtered = allTransactions.filter(t => {
    const matchesSearch = t.borrower_name.toLowerCase().includes(search) ||
      t.equipment_name.toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const tbody = document.getElementById('history-body');
  if (tbody) {
    tbody.innerHTML = filtered.map(t => {
      const isBorrowed = t.status === 'Borrowed';
      const returnBtn = isBorrowed ? `<button class="btn btn-small" style="background:#e5f7ef;color:#13845b;border-color:#cceedd" onclick="returnItem('${escapeHtml(t._id)}', '${escapeHtml(t.borrower_name)}', '${escapeHtml(t.equipment_name)}')">↩️ Return</button>` : '-';
      return `
      <tr>
        <td>${escapeHtml(t.borrower_name)}</td>
        <td>${escapeHtml(t.borrower_id_number)}</td>
        <td>${escapeHtml(t.equipment_name)}</td>
        <td>${t.quantity}</td>
        <td>${formatDate(t.checkout_date)}</td>
        <td>${formatDate(t.expected_return_date)}</td>
        <td>${formatDate(t.actual_return_date) || '<span style="color:#999">-</span>'}</td>
        <td>${getStatusBadge(t.status)}</td>
        <td>${returnBtn}</td>
      </tr>
    `}).join('');
  }
}

// Return modal state
let transactionToReturn = null;

function returnItem(transactionId, borrowerName, equipmentName) {
  transactionToReturn = transactionId;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('return-confirm-message').innerHTML = `
    <p style="margin:8px 0"><strong>Borrower:</strong> ${escapeHtml(borrowerName)}</p>
    <p style="margin:8px 0"><strong>Equipment:</strong> ${escapeHtml(equipmentName)}</p>
    <p style="margin:8px 0"><strong>Return Date:</strong> ${today}</p>
    <p style="margin:12px 0 0;font-size:12px;color:#718096">Click Confirm Return to mark this item as returned.</p>
  `;
  openModal('return-confirm-modal');
}

function closeReturnModal() {
  transactionToReturn = null;
  closeModal('return-confirm-modal');
}

async function confirmReturn() {
  if (!transactionToReturn) return;

  try {
    const res = await fetch(`${API_URL}/transactions/${transactionToReturn}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status: 'Returned',
        actual_return_date: new Date()
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Item returned successfully!');
      loadHistory();
    } else {
      showToast(data.message || 'Failed to return item', 'error');
    }
  } catch (err) {
    console.error('Return item error:', err);
    showToast('Error returning item', 'error');
  }
  closeReturnModal();
}