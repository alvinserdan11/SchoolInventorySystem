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
    const res = await fetch(`${API_URL}/transactions`);
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
      const returnBtn = isBorrowed ? `<button class="btn btn-small" style="background:#e5f7ef;color:#13845b;border-color:#cceedd" onclick="returnItem('${t._id}', '${t.borrower_name}', '${t.equipment_name}')">↩️ Return</button>` : '-';
      return `
      <tr>
        <td>${t.borrower_name}</td>
        <td>${t.borrower_id_number}</td>
        <td>${t.equipment_name}</td>
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
    <p style="margin:8px 0"><strong>Borrower:</strong> ${borrowerName}</p>
    <p style="margin:8px 0"><strong>Equipment:</strong> ${equipmentName}</p>
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
      headers: { 'Content-Type': 'application/json' },
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