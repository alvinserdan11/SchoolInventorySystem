// ============================================
// EQUIPMENT.JS - Equipment management and borrowing
// ============================================

let allEquipment = [];
let allCategories = [];
let allBorrowers = [];
let equipmentToDelete = null;
let lastReceiptData = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('page-equipment')) return;
  loadCategories();
  loadEquipment();
});

async function loadCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    const data = await res.json();
    if (data.success) {
      allCategories = data.data;
      const categorySelect = document.getElementById('equipment-category');
      const categoryFilter = document.getElementById('equipment-category-filter');
      if (categorySelect) {
        categorySelect.innerHTML = allCategories.map(c => `<option value="${c._id}">${c.category_name}</option>`).join('');
      }
      if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
          allCategories.map(c => `<option value="${c._id}">${c.category_name}</option>`).join('');
      }
    }
  } catch (err) {
    console.error('Load categories error:', err);
  }
}

async function loadEquipment() {
  try {
    const res = await fetch(`${API_URL}/equipment`);
    const data = await res.json();
    if (data.success) {
      allEquipment = data.data;
      renderEquipment();
    }
  } catch (err) {
    console.error('Load equipment error:', err);
  }
}

function renderEquipment() {
  const search = document.getElementById('equipment-search')?.value.toLowerCase() || '';
  const categoryFilter = document.getElementById('equipment-category-filter')?.value || 'all';
  const viewFilter = document.getElementById('equipment-view-filter')?.value || 'all';

  let filtered = allEquipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search);
    const matchesCategory = categoryFilter === 'all' || item.category_id?._id === categoryFilter || item.category_id === categoryFilter;
    let matchesView = true;
    if (viewFilter === 'available') matchesView = item.available_quantity > 0;
    if (viewFilter === 'borrowed') matchesView = item.available_quantity < item.total_quantity;
    return matchesSearch && matchesCategory && matchesView;
  });

  const grid = document.getElementById('equipment-grid');
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const isAdminOrCustodian = currentUser && (currentUser.user_type === 'admin' || currentUser.user_type === 'custodian');

  if (grid) {
    grid.innerHTML = filtered.map(item => {
      const isOutOfStock = item.available_quantity === 0;
      const availabilityText = isOutOfStock ? 'Out of Stock' : `${item.available_quantity}/${item.total_quantity} Available`;
      const borrowBtn = isOutOfStock
        ? `<button class="btn btn-small" style="flex:1;background:#ffeaed;color:#c13d50;border-color:#f8d3d9;cursor:not-allowed" disabled>Out of Stock</button>`
        : `<button class="btn btn-primary btn-small" style="flex:1" onclick="event.stopPropagation();openBorrowForm('${item._id}')">Borrow</button>`;
      return `
      <div class="equipment-card" onclick="viewEquipmentDetails('${item._id}')">
        <img src="${item.image_url || 'download.png'}" alt="${item.name}" onerror="this.src='download.png'">
        <h4>${item.name}</h4>
        <p>${item.storage_location || 'No location'}</p>
        <span class="badge ${item.available_quantity > 0 ? 'badge-active' : 'status-rejected'}">
          ${availabilityText}
        </span>
        <div style="display:flex;gap:8px;margin-top:10px">
          ${borrowBtn}
          ${isAdminOrCustodian ? `<button class="btn btn-small" style="color:#c13d50;background:#ffeaed;border-color:#f8d3d9" 
            onclick="event.stopPropagation();openDeleteModal('${item._id}', '${item.name}')">🗑️</button>` : ''}
        </div>
      </div>
    `}).join('');
  }
}

// Custom delete modal
function openDeleteModal(equipmentId, equipmentName) {
  equipmentToDelete = equipmentId;
  document.getElementById('delete-confirm-message').textContent = `Are you sure you want to delete "${equipmentName}"? This action cannot be undone.`;
  openModal('delete-confirm-modal');
}

function closeDeleteModal() {
  equipmentToDelete = null;
  closeModal('delete-confirm-modal');
}

async function confirmDelete() {
  if (!equipmentToDelete) return;

  try {
    const res = await fetch(`${API_URL}/equipment/${equipmentToDelete}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Equipment deleted successfully!');
      loadEquipment();
    } else {
      showToast(data.message || 'Failed to delete equipment', 'error');
    }
  } catch (err) {
    console.error('Delete equipment error:', err);
    showToast('Error deleting equipment', 'error');
  }
  closeDeleteModal();
}

function openAddEquipment() {
  document.getElementById('equipment-form-title').textContent = 'Add New Equipment';
  document.getElementById('equipment-form').reset();
  document.getElementById('equipment-record-id').value = '';
  openModal('equipment-form-modal');
}

async function saveEquipment(event) {
  event.preventDefault();
  const id = document.getElementById('equipment-record-id').value;
  const totalQty = parseInt(document.getElementById('equipment-total').value);

  const equipmentData = {
    category_id: document.getElementById('equipment-category').value,
    name: document.getElementById('equipment-name').value,
    total_quantity: totalQty,
    storage_location: document.getElementById('equipment-location').value,
    condition_status: document.getElementById('equipment-condition').value,
    image_url: document.getElementById('equipment-image-url').value || ''
  };

  if (id) {
    // Editing existing equipment - preserve available_quantity, recalculate if total changed
    const existing = allEquipment.find(e => e._id === id);
    if (existing) {
      const borrowed = existing.total_quantity - existing.available_quantity;
      equipmentData.available_quantity = Math.max(0, totalQty - borrowed);
    } else {
      equipmentData.available_quantity = totalQty;
    }
  } else {
    // Adding new equipment
    equipmentData.available_quantity = totalQty;
  }

  try {
    const url = id ? `${API_URL}/equipment/${id}` : `${API_URL}/equipment`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipmentData)
    });
    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Equipment updated!' : 'Equipment added!');
      closeModal('equipment-form-modal');
      loadEquipment();
    }
  } catch (err) {
    console.error('Save equipment error:', err);
    showToast('Error saving equipment', 'error');
  }
}

function viewEquipmentDetails(id) {
  const item = allEquipment.find(e => e._id === id);
  if (!item) return;
  const body = document.getElementById('equipment-details-body');
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const isAdminOrCustodian = currentUser && (currentUser.user_type === 'admin' || currentUser.user_type === 'custodian');
  if (body) {
    body.innerHTML = `
      <p><strong>Name:</strong> ${item.name}</p>
      <p><strong>Serial Number:</strong> ${item.serial_number || 'N/A'}</p>
      <p><strong>Specifications:</strong> ${item.specifications || 'N/A'}</p>
      <p><strong>Location:</strong> ${item.storage_location || 'N/A'}</p>
      <p><strong>Condition:</strong> ${item.condition_status}</p>
      <p><strong>Status:</strong> ${item.operational_status || 'N/A'}</p>
      <p><strong>Available:</strong> ${item.available_quantity}/${item.total_quantity}</p>
      ${isAdminOrCustodian ? `<div style="margin-top:20px;display:flex;gap:10px">
        <button class="btn btn-primary" style="flex:1" onclick="closeModal('equipment-details-modal');editEquipment('${item._id}')">✏️ Edit Equipment</button>
      </div>` : ''}
    `;
    openModal('equipment-details-modal');
  }
}

function editEquipment(id) {
  const item = allEquipment.find(e => e._id === id);
  if (!item) return;
  document.getElementById('equipment-form-title').textContent = 'Edit Equipment';
  document.getElementById('equipment-record-id').value = item._id;
  document.getElementById('equipment-category').value = item.category_id?._id || item.category_id || '';
  document.getElementById('equipment-name').value = item.name || '';
  document.getElementById('equipment-total').value = item.total_quantity || 0;
  document.getElementById('equipment-location').value = item.storage_location || '';
  document.getElementById('equipment-condition').value = item.condition_status || 'Good';
  document.getElementById('equipment-image-url').value = item.image_url || '';
  openModal('equipment-form-modal');
}

// ============================================
// BORROWING FORM - Centralized System
// ============================================

async function loadBorrowers() {
  try {
    const res = await fetch(`${API_URL}/users`);
    const data = await res.json();
    if (data.success) {
      // Only ACTIVE students and teachers (borrowers)
      // Supports multiple status field names and case variations
      allBorrowers = data.data.filter(u => {
        const isBorrower = u.user_type === 'student' || u.user_type === 'teacher';
        const userStatus = u.status || u.account_status || u.user_status || 'Active';
        const isActive = String(userStatus).toLowerCase() === 'active';
        return isBorrower && isActive;
      });
      console.log('Loaded borrowers:', allBorrowers.length, allBorrowers);
    }
  } catch (err) {
    console.error('Load borrowers error:', err);
  }
}

async function openBorrowForm(equipmentId) {
  const item = allEquipment.find(e => e._id === equipmentId);
  if (!item) return;

  if (allBorrowers.length === 0) {
    await loadBorrowers();
  }

  const select = document.getElementById('borrower-select');
  if (select) {
    select.innerHTML = '<option value="">-- Choose a borrower --</option>' +
      allBorrowers.map(u => `<option value="${u._id}">${u.first_name} ${u.middle_name ? u.middle_name + ' ' : ''}${u.last_name} (${u.student_id_number})</option>`).join('');
  }

  document.getElementById('borrow-name').value = '';
  document.getElementById('borrow-idnumber').value = '';
  document.getElementById('borrow-type').value = '';
  document.getElementById('borrow-department').value = '';
  document.getElementById('borrow-email').value = '';
  document.getElementById('borrow-contact').value = '';
  document.getElementById('borrow-user-id').value = '';

  document.getElementById('borrow-equipment-id').value = equipmentId;
  document.getElementById('borrow-equipment-name').value = item.name;
  document.getElementById('borrow-date').value = new Date().toISOString().split('T')[0];
  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 7);
  document.getElementById('borrow-return-date').value = returnDate.toISOString().split('T')[0];
  document.getElementById('borrow-available-hint').textContent = `Available: ${item.available_quantity}`;

  document.getElementById('borrow-purpose').value = '';
  document.getElementById('borrow-notes').value = '';

  openModal('borrow-form-modal');
}

function fillBorrowerFromSelect() {
  const userId = document.getElementById('borrower-select').value;
  if (!userId) {
    document.getElementById('borrow-name').value = '';
    document.getElementById('borrow-idnumber').value = '';
    document.getElementById('borrow-type').value = '';
    document.getElementById('borrow-department').value = '';
    document.getElementById('borrow-email').value = '';
    document.getElementById('borrow-contact').value = '';
    document.getElementById('borrow-user-id').value = '';
    return;
  }

  const user = allBorrowers.find(u => u._id === userId);
  if (!user) return;

  document.getElementById('borrow-name').value = `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`;
  document.getElementById('borrow-idnumber').value = user.student_id_number || '';
  document.getElementById('borrow-type').value = user.user_type;
  document.getElementById('borrow-department').value = user.department;
  document.getElementById('borrow-email').value = user.email;
  document.getElementById('borrow-contact').value = user.contact_number;
  document.getElementById('borrow-user-id').value = user._id;
}

async function submitBorrowRequest(event) {
  event.preventDefault();
  const equipmentId = document.getElementById('borrow-equipment-id').value;
  const userId = document.getElementById('borrow-user-id').value;

  if (!userId) {
    alert('Please select a borrower from the dropdown.');
    return;
  }

  const borrowData = {
    user_id: userId,
    equipment_id: equipmentId,
    borrower_name: document.getElementById('borrow-name').value,
    borrower_id_number: document.getElementById('borrow-idnumber').value,
    equipment_name: document.getElementById('borrow-equipment-name').value,
    quantity: parseInt(document.getElementById('borrow-quantity').value),
    purpose: document.getElementById('borrow-purpose').value,
    checkout_date: new Date(document.getElementById('borrow-date').value),
    expected_return_date: new Date(document.getElementById('borrow-return-date').value),
    notes: document.getElementById('borrow-notes').value,
    status: 'Borrowed'
  };

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(borrowData)
    });
    const data = await res.json();
    if (data.success) {
      lastReceiptData = {
        transactionId: data.data?._id || 'N/A',
        borrowerName: borrowData.borrower_name,
        borrowerId: borrowData.borrower_id_number,
        userType: document.getElementById('borrow-type').value,
        department: document.getElementById('borrow-department').value,
        email: document.getElementById('borrow-email').value,
        contact: document.getElementById('borrow-contact').value,
        equipmentName: borrowData.equipment_name,
        quantity: borrowData.quantity,
        purpose: borrowData.purpose,
        borrowDate: document.getElementById('borrow-date').value,
        returnDate: document.getElementById('borrow-return-date').value,
        notes: borrowData.notes,
        operator: JSON.parse(localStorage.getItem('currentUser'))?.full_name || 'Admin'
      };

      showReceiptModal();
      closeModal('borrow-form-modal');
      loadEquipment();
    } else {
      showToast(data.message || 'Error saving transaction', 'error');
    }
  } catch (err) {
    console.error('Submit borrow error:', err);
    showToast('Error submitting request', 'error');
  }
}

function showReceiptModal() {
  if (!lastReceiptData) return;

  const receiptHtml = `
    <div style="border:2px solid #1765df;padding:25px;border-radius:12px;background:#fff">
      <div style="text-align:center;border-bottom:2px solid #e5ebf3;padding-bottom:15px;margin-bottom:20px">
        <h2 style="margin:0;color:#1765df;font-size:20px">School Inventory System</h2>
        <p style="margin:5px 0 0;color:#718096;font-size:12px">Equipment Borrowing Receipt</p>
      </div>

      <div style="margin-bottom:15px">
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Receipt No:</strong> ${lastReceiptData.transactionId.slice(-8).toUpperCase()}</p>
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Date Issued:</strong> ${new Date().toLocaleString()}</p>
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Issued By:</strong> ${lastReceiptData.operator}</p>
      </div>

      <div style="background:#f5f8fc;padding:15px;border-radius:8px;margin-bottom:15px">
        <h4 style="margin:0 0 10px;color:#1b3150;font-size:14px">Borrower Information</h4>
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Name:</strong> ${lastReceiptData.borrowerName}</p>
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>ID Number:</strong> ${lastReceiptData.borrowerId}</p>
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Type:</strong> ${lastReceiptData.userType}</p>
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Department:</strong> ${lastReceiptData.department}</p>
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Contact:</strong> ${lastReceiptData.contact}</p>
      </div>

      <div style="background:#f5f8fc;padding:15px;border-radius:8px;margin-bottom:15px">
        <h4 style="margin:0 0 10px;color:#1b3150;font-size:14px">Equipment Details</h4>
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Equipment:</strong> ${lastReceiptData.equipmentName}</p>
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Quantity:</strong> ${lastReceiptData.quantity}</p>
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Purpose:</strong> ${lastReceiptData.purpose}</p>
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Date Borrowed:</strong> ${lastReceiptData.borrowDate}</p>
        <p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Return Deadline:</strong> ${lastReceiptData.returnDate}</p>
        ${lastReceiptData.notes ? `<p style="margin:3px 0;font-size:12px;color:#40536d"><strong>Notes:</strong> ${lastReceiptData.notes}</p>` : ''}
      </div>

      <div style="border-top:2px dashed #e5ebf3;padding-top:15px;margin-top:15px;text-align:center">
        <p style="margin:0;font-size:11px;color:#718096">Please bring this receipt when returning the equipment.</p>
        <p style="margin:5px 0 0;font-size:11px;color:#718096">Late returns may incur penalties.</p>
      </div>
    </div>
  `;

  document.getElementById('receipt-content').innerHTML = receiptHtml;
  openModal('receipt-modal');
}

function printReceipt() {
  const receiptContent = document.getElementById('receipt-content').innerHTML;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Borrowing Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>${receiptContent}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}