
const leaveForm = document.getElementById('leaveForm');
const leaveType = document.getElementById('leaveType');
const leaveDates = document.getElementById('leaveDates');
const departureTime = document.getElementById('departureTime');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const departureDate = document.getElementById('departureDate');
const startTime = document.getElementById('startTime');
const endTime = document.getElementById('endTime');
const reason = document.getElementById('reason');

const attachmentInput = document.getElementById('attachment');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const removeAttachmentBtn = document.getElementById('removeAttachmentBtn');
const modal = document.getElementById('leaveModal');


let fileBase64 = null;
let fileName = null;


let currentUserObj = JSON.parse(localStorage.getItem('currentUser')) || {};
let currentUserName = currentUserObj.name || '';

const today = new Date().toISOString().split('T')[0];
if (startDate) startDate.min = today;
if (endDate) endDate.min = today;
if (departureDate) departureDate.min = today;

// ربط تاريخ النهاية بحيث لا يكون قبل تاريخ البداية
if (startDate) {
  startDate.addEventListener('change', function () {
    if (endDate) {
      endDate.min = startDate.value;
      if (endDate.value && endDate.value < startDate.value) {
        endDate.value = '';
      }
    }
  });
}

//  جلب طلبات الموظف الحالي
function getMyRequests() {
  let allRequests = JSON.parse(localStorage.getItem('all_leave_requests')) || [];
  let myRequests = [];

  for (let i = 0; i < allRequests.length; i++) {
    if (allRequests[i].userName === currentUserName) {
      myRequests.push(allRequests[i]);
    }
  }
  return myRequests;
}

// تحديث أرقام الكروت (Stats)
function updateEmployeeStats() {
  let requests = getMyRequests();

  let total = requests.length;
  let pending = 0;
  let approved = 0;
  let rejected = 0;

  for (let i = 0; i < requests.length; i++) {
    if (requests[i].status === 'Pending') pending++;
    else if (requests[i].status === 'Approved') approved++;
    else if (requests[i].status === 'Rejected') rejected++;
  }

  if (document.getElementById('statTotal')) document.getElementById('statTotal').textContent = total;
  if (document.getElementById('statPending')) document.getElementById('statPending').textContent = pending;
  if (document.getElementById('statApproved')) document.getElementById('statApproved').textContent = approved;
  if (document.getElementById('statRejected')) document.getElementById('statRejected').textContent = rejected;
}

//  عرض الجدول بالطلبات
function displayRequests() {
  const requestsTable = document.getElementById('requestsTable');
  if (!requestsTable) return;

  let requests = getMyRequests();
  requestsTable.innerHTML = '';

  if (requests.length === 0) {
    requestsTable.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">No leave requests found.</td></tr>`;
    updateEmployeeStats();
    return;
  }

  for (let i = 0; i < requests.length; i++) {
    let req = requests[i];

    let badgeClass = 'badge-pending';
    if (req.status === 'Approved') badgeClass = 'badge-approved';
    if (req.status === 'Rejected') badgeClass = 'badge-rejected';

    let attachmentHTML = '—';
    if (req.attachment) {
      attachmentHTML = `<a href="javascript:void(0)" onclick="viewAttachment(${req.id})" >${req.attachmentName || 'PDF File'}</a>`;
    }

    let rejectionHTML = '';
    if (req.rejectionReason) {
      rejectionHTML = `<br><small style="color:red">Reason: ${req.rejectionReason}</small>`;
    }

    let row = `
      <tr>
        <td><strong>${req.type}</strong></td>
        <td>${req.dateTime}</td>
        <td>${req.reason}</td>
        <td>${attachmentHTML}</td>
        <td><span class="badge ${badgeClass}">${req.status}</span>${rejectionHTML}</td>
      </tr>
    `;

    requestsTable.innerHTML += row;
  }

  updateEmployeeStats();
  filterRequestsTable();
}

//  التحكم بالحقول وتحديدالـ Required حسب نوع الإجازة
if (leaveType) {
  leaveType.addEventListener('change', function () {
    let type = leaveType.value;
    let isDeparture = (type === 'Departure');
    let isLeave = (type === 'Annual' || type === 'sick');

    // إظهار وإخفاء الحقول المناسبة
    if (isDeparture) {
      departureTime.classList.remove('d-none');
      leaveDates.classList.add('d-none');
    } else if (isLeave) {
      leaveDates.classList.remove('d-none');
      departureTime.classList.add('d-none');
    } else {
      leaveDates.classList.add('d-none');
      departureTime.classList.add('d-none');
    }

    //
    if (departureDate) departureDate.required = isDeparture;
    if (startTime) startTime.required = isDeparture;
    if (endTime) endTime.required = isDeparture;

    if (startDate) startDate.required = isLeave;
    if (endDate) endDate.required = isLeave;
  });
} 

//  رفع ملف PDF
if (attachmentInput) {
  attachmentInput.addEventListener('change', function (e) {
    let file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only.');
      attachmentInput.value = '';
      return;
    }

    let reader = new FileReader();
    reader.onload = function (event) {
      fileBase64 = event.target.result;
      fileName = file.name;
      fileNameDisplay.textContent = file.name;
      removeAttachmentBtn.classList.remove('d-none');
    };
    reader.readAsDataURL(file);
  });
}

if (removeAttachmentBtn) {
  removeAttachmentBtn.addEventListener('click', function () {
    fileBase64 = null;
    fileName = null;
    attachmentInput.value = '';
    fileNameDisplay.textContent = 'No file attached';
    removeAttachmentBtn.classList.add('d-none');
  });
}

//  حفظ وتقديم الطلب مع التحقق من الشروط (Validations)
if (leaveForm) {
  leaveForm.addEventListener('submit', function (e) {
    e.preventDefault();

    let type = leaveType.value;
    let dateTimeText = '';

    // التحقق من صحة الشروط قبل الحفظ
    if (type === 'Departure') {
      if (!departureDate.value || !startTime.value || !endTime.value) {
        alert('Please fill in all departure details.');
        return;
      }
      if (startTime.value >= endTime.value) {
        alert('Start time must be earlier than end time.');
        return;
      }
      dateTimeText = `${departureDate.value} (${startTime.value} - ${endTime.value})`;

    } else if (type === 'Annual' || type === 'sick') {
      if (!startDate.value || !endDate.value) {
        alert('Please select both start and end dates.');
        return;
      }
      if (startDate.value === endDate.value) {
        alert('Start Date and End Date cannot be the same day.');
        return;
      }
      dateTimeText = `${startDate.value} to ${endDate.value}`;

    } else {
      alert('Please select a valid leave type.');
      return;
    }

    let newRequest = {
      id: Date.now(),
      userName: currentUserName,
      type: type,
      dateTime: dateTimeText,
      reason: reason.value,
      status: 'Pending', 
      attachment: fileBase64,
      attachmentName: fileName
    };

    let allRequests = JSON.parse(localStorage.getItem('all_leave_requests')) || [];
    allRequests.push(newRequest);
    localStorage.setItem('all_leave_requests', JSON.stringify(allRequests));

    alert('Request submitted successfully!');

    closeModal();
    displayRequests();
  });
}

// فتح المرفق وقراءة ה- PDF
window.viewAttachment = function (reqId) {
  let requests = getMyRequests();
  let req = null;

  for (let i = 0; i < requests.length; i++) {
    if (requests[i].id === reqId) {
      req = requests[i];
      break;
    }
  }

  if (req && req.attachment) {
    let win = window.open();
    win.document.write(`<iframe src="${req.attachment}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  }
};

//  تشغيل كبسات الراديو (تصفية الجدول)
const radioButtons = document.querySelectorAll('.filter-radio');
 
radioButtons.forEach(radio => {
  radio.addEventListener('click', function () {
    if (this.previousChecked) {
      this.checked = false;
      this.previousChecked = false;
    } else {
      radioButtons.forEach(r => r.previousChecked = false);
      this.previousChecked = true;
    }
    filterRequestsTable();
  });
});

function filterRequestsTable() {
  const selectedRadio = document.querySelector('.filter-radio:checked');
  const rows = document.querySelectorAll('#requestsTable tr');

  if (!selectedRadio) {  
    rows.forEach(row => row.style.display = '');
    return;
  }

  let filterType = '';
  if (selectedRadio.id === 'filter-annual') filterType = 'annual';
  if (selectedRadio.id === 'filter-sick') filterType = 'sick';
  if (selectedRadio.id === 'filter-departure') filterType = 'departure';

  rows.forEach(row => {
    const typeCell = row.cells[0]?.textContent.trim().toLowerCase();
    if (typeCell && typeCell.includes(filterType)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// إغلاق وفتح المودال
function closeModal() {
  if (modal) modal.classList.remove('active');
  if (leaveForm) leaveForm.reset();
  if (removeAttachmentBtn) removeAttachmentBtn.click();
  if (leaveDates) leaveDates.classList.add('d-none');
  if (departureTime) departureTime.classList.add('d-none');
}

const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

if (openModalBtn) openModalBtn.onclick = () => modal.classList.add('active');
if (closeModalBtn) closeModalBtn.onclick = closeModal;
if (cancelModalBtn) cancelModalBtn.onclick = closeModal;

displayRequests();