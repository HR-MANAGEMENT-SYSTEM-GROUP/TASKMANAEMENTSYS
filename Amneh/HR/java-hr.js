// ==========================================
// HR SECTION - CLEAN CODE (WITH WORKING PDF)
// ==========================================

const searchEmployee = document.getElementById('searchEmployee');
const statusFilter = document.getElementById('statusFilter');
const hrRequestsTable = document.getElementById('hrRequestsTable');

// 1. جلب كافة الطلبات من السجل العام
function getAllRequests() {
  try {
    return JSON.parse(localStorage.getItem('all_leave_requests')) || [];
  } catch (err) {
    return [];
  }
}

// 2. دالة فتح ملف الـ PDF بأمان عند الـ HR
function openPdfDocument(base64Data, pdfName = 'document.pdf') {
  try {
    const arr = base64Data.split(',');
    let bstr;
    
    if (arr[1]) {
      bstr = atob(arr[1]);
    } else {
      bstr = atob(arr[0]);
    }

    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    const blob = new Blob([u8arr], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');

    if (!win || win.closed) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = pdfName;
      a.click();
    }
  } catch (err) {
    alert('Unable to open the attached PDF.');
  }
}

// ربط الدالة بـ window لاستدعائها من أزرار الجدول
window.viewHrAttachment = function (requestId) {
  const allRequests = getAllRequests();
  const req = allRequests.find((r) => Number(r.id) === Number(requestId));

  if (!req || !req.attachment) {
    alert('Attachment not found.');
    return;
  }

  const pdfName = req.attachmentName || 'document.pdf';
  openPdfDocument(req.attachment, pdfName);
};

// 3. عرض الجدول وتطبييق الفلاتر
function displayHRRequests() {
  if (!hrRequestsTable) return;

  let searchValue = '';
  if (searchEmployee) {
    searchValue = searchEmployee.value.toLowerCase().trim();
  }

  let selectedStatus = 'All';
  if (statusFilter) {
    selectedStatus = statusFilter.value;
  }

  const allRequests = getAllRequests();

  const filteredRequests = allRequests.filter((req) => {
    let userName = '';
    if (req.userName) userName = req.userName;
    else if (req.user) userName = req.user;
    else if (req.name) userName = req.name;

    userName = userName.toLowerCase();

    const matchesUser = userName.includes(searchValue);
    let matchesStatus = false;

    if (selectedStatus === 'All' || req.status === selectedStatus) {
      matchesStatus = true;
    }

    if (matchesUser && matchesStatus) {
      return true;
    }
    return false;
  });

  hrRequestsTable.innerHTML = '';

  if (filteredRequests.length === 0) {
    hrRequestsTable.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 20px;">No matching requests found.</td></tr>`;
    return;
  }

  filteredRequests.forEach((req) => {
    const tr = document.createElement('tr');

    let displayName = 'Unknown Employee';
    if (req.userName) displayName = req.userName;
    else if (req.user) displayName = req.user;
    else if (req.name) displayName = req.name;

    let badgeClass = 'bg-warning text-dark';
    if (req.status === 'Approved') {
      badgeClass = 'bg-success';
    } else if (req.status === 'Rejected') {
      badgeClass = 'bg-danger';
    }

    let actionButtons = '—';
    if (req.status === 'Pending') {
      actionButtons = `
        <button class="btn btn-warning btn-sm me-1" onclick="window.approveRequest(${req.id})">Approve</button>
        <button class="btn btn-danger btn-sm" onclick="window.rejectRequest(${req.id})">Reject</button>
      `;
    } else if (req.status === 'Rejected' && req.rejectionReason) {
      actionButtons = `<small class="text-danger">Reason: ${req.rejectionReason}</small>`;
    }

    let attachmentContent = '—';
    if (req.attachment) {
      const pdfName = req.attachmentName || 'View Attachment';
      attachmentContent = `
        <button type="button" class="btn btn-sm btn-outline-info" onclick="window.viewHrAttachment(${req.id})">
          ${pdfName}
        </button>
      `;
    }

    tr.innerHTML = `
      <td><strong>${displayName}</strong></td>
      <td>${req.type || 'N/A'}</td>
      <td>${req.dateTime || 'N/A'}</td>
      <td>${req.reason || 'N/A'}</td>
      <td>${attachmentContent}</td>
      <td><span class="badge ${badgeClass}">${req.status || 'Pending'}</span></td>
      <td>${actionButtons}</td>
    `;

    hrRequestsTable.appendChild(tr);
  });
}

// 4. أزرار القبول والرفض
window.approveRequest = function (requestId) {
  updateRequestStatus(requestId, 'Approved');
};

window.rejectRequest = function (requestId) {
  const reason = prompt('Please enter the reason for rejection:');

  if (reason === null) {
    return;
  }

  if (reason.trim() === '') {
    alert('Rejection reason cannot be empty!');
    return;
  }

  updateRequestStatus(requestId, 'Rejected', reason.trim());
};

// 5. التعديل والمزامنة مع LocalStorage
function updateRequestStatus(requestId, newStatus, rejectionReason = '') {
  const targetId = Number(requestId);

  // أ) تحديث سجل HR العام
  let allRequests = getAllRequests();
  allRequests = allRequests.map((req) => {
    if (Number(req.id) === targetId) {
      req.status = newStatus;
      if (rejectionReason) {
        req.rejectionReason = rejectionReason;
      } else {
        delete req.rejectionReason;
      }
    }
    return req;
  });
  localStorage.setItem('all_leave_requests', JSON.stringify(allRequests));

  // ب) مزامنة الرد مع الموظف الحالي في currentUser
  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  } catch (e) {
    currentUser = {};
  }

  if (Array.isArray(currentUser.requests)) {
    currentUser.requests = currentUser.requests.map((req) => {
      if (Number(req.id) === targetId) {
        req.status = newStatus;
        if (rejectionReason) {
          req.rejectionReason = rejectionReason;
        } else {
          delete req.rejectionReason;
        }
      }
      return req;
    });
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }

  alert(`Request updated successfully to ${newStatus}!`);
  displayHRRequests();
}

// 6. الأحداث والتشغيل الأول
if (searchEmployee) {
  searchEmployee.addEventListener('input', displayHRRequests);
}

if (statusFilter) {
  statusFilter.addEventListener('change', displayHRRequests);
}

displayHRRequests();