// HR - PART 

let searchEmployee = document.getElementById('searchEmployee');
let statusFilter = document.getElementById('statusFilter');
let hrRequestsTable = document.getElementById('hrRequestsTable');

// 1. جلب كافة الطلبات من السجل العام الموحد
function getAllRequests() {
  try {
    return JSON.parse(localStorage.getItem('all_leave_requests')) || [];
  } catch (err) {
    console.error('Error loading all_leave_requests:', err);
    return [];
  }
}

// 2. دالة العرض مع تطبيق الفلاتر (اسم الموظف + حالة الطلب)
function displayHRRequests() {
  if (!hrRequestsTable) return;

  let allRequests = getAllRequests();
  let searchValue = searchEmployee ? searchEmployee.value.toLowerCase().trim() : '';
  let selectedStatus = statusFilter ? statusFilter.value : 'All';

  // التصفية والفرز بحسب اسم الموظف والحالة
  let filteredRequests = allRequests.filter(req => {
    // 🟢 قراءة الاسم بمرونة لضمان عدم الخروج بـ undefined
    let userName = (req.userName || req.user || req.name || '').toLowerCase();
    let matchesUser = userName.includes(searchValue);
    let matchesStatus = (selectedStatus === 'All') || (req.status === selectedStatus);
    return matchesUser && matchesStatus;
  });

  hrRequestsTable.innerHTML = '';

  if (filteredRequests.length === 0) {
    hrRequestsTable.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted" style="padding: 20px;">No matching requests found.</td>
      </tr>
    `;
    return;
  }

  // رسم الجدول
  filteredRequests.forEach((req) => {
    let actionButtons = '—';
    let displayName = req.userName || req.user || req.name || 'Unknown Employee';

    // استخدام window لربط الدوال مع أزرار الموارد الديناميكية
    if (req.status === 'Pending') {
      actionButtons = `
        <button class="btn btn-warning btn-sm me-1" onclick="window.approveRequest(${req.id})">Approve</button>
        <button class="btn btn-danger btn-sm" onclick="window.rejectRequest(${req.id})">Reject</button>
      `;
    } else if (req.status === 'Rejected' && req.rejectionReason) {
      actionButtons = `<small class="text-danger">Reason: ${escapeHtml(req.rejectionReason)}</small>`;
    }

    let attachmentContent = req.attachment ? 
      `<a href="${req.attachment}" target="_blank" class="btn btn-sm btn-outline-info">View Attachment</a>` : '—';

    let row = `
      <tr>
        <td><strong>${escapeHtml(displayName)}</strong></td>
        <td>${escapeHtml(req.type || 'N/A')}</td>
        <td>${escapeHtml(req.dateTime || 'N/A')}</td>
        <td>${escapeHtml(req.reason || 'N/A')}</td>
        <td>${attachmentContent}</td>
        <td>
          <span class="badge ${getStatusBadgeClass(req.status)}">${escapeHtml(req.status || 'Pending')}</span>
        </td>
        <td>${actionButtons}</td>
      </tr>
    `;
    hrRequestsTable.innerHTML += row;
  });
}

// دالة حماية للحد من ثغرات HTML Injection
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ألوان التميز للحالات
function getStatusBadgeClass(status) {
  if (status === 'Approved') return 'bg-success';
  if (status === 'Rejected') return 'bg-danger';
  return 'bg-warning text-dark';
}

// 3. الموافقة على الطلب
window.approveRequest = function(requestId) {
  updateRequestStatus(requestId, 'Approved');
};

// 4. رفض الطلب مع إرسال رسالة سبب الرفض
window.rejectRequest = function(requestId) {
  let reason = prompt('Please enter the reason for rejection:');
  
  if (reason === null) return; // تم إلغاء العملية
  if (reason.trim() === '') {
    alert('Rejection reason cannot be empty!');
    return;
  }

  updateRequestStatus(requestId, 'Rejected', reason.trim());
};

// 5. التعديل والحفظ الموحد والمزامن مع الموظف
function updateRequestStatus(requestId, newStatus, rejectionReason = '') {
  let targetId = Number(requestId);

  // أ) تحديث السجل العام الـ HR
  let allRequests = getAllRequests();
  allRequests = allRequests.map(req => {
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

  // ب) مزامنة الرد مع الموظف في currentUser (إذا كان هو صاحب الطلب المفعل)
  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  } catch (e) {
    currentUser = {};
  }

  if (Array.isArray(currentUser.requests)) {
    currentUser.requests = currentUser.requests.map(req => {
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
  displayHRRequests(); // تحديث الجدول فوراً
}

// الأحداث (Event Listeners) للفلاتر
if (searchEmployee) {
  searchEmployee.addEventListener('input', displayHRRequests);
}

if (statusFilter) {
  statusFilter.addEventListener('change', displayHRRequests);
}

// التشغيل الأولي عند فتح الصفحة
document.addEventListener('DOMContentLoaded', () => {
  displayHRRequests();
});