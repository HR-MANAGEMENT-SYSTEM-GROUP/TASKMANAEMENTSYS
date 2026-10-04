
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

// متغيرات حفظ الملف المرفق
let fileBase64 = null;
let fileName = null;

// قراءة بيانات المستخدم الحالي
let currentUserObj = JSON.parse(localStorage.getItem('currentUser')) || {};
let currentUserName = currentUserObj.name || '';


function getMyRequests() {
  // جلب كل الطلبات المخزنة في النظام
  let allRequests = JSON.parse(localStorage.getItem('all_leave_requests')) || [];
  let myRequests = [];

  // البحث عن الطلبات التي تخص هذا الموظف فقط
  for (let i = 0; i < allRequests.length; i++) {
    if (allRequests[i].userName === currentUserName) {
      myRequests.push(allRequests[i]);
    }
  }

  return myRequests;
}

// 3. تحديث أرقام الكروت (Stats)
function updateEmployeeStats() {
  let requests = getMyRequests();

  let total = requests.length;
  let pending = 0;
  let approved = 0;
  let rejected = 0;

  for (let i = 0; i < requests.length; i++) {
    if (requests[i].status === 'Pending') {
      pending++;
    } else if (requests[i].status === 'Approved') {
      approved++;
    } else if (requests[i].status === 'Rejected') {
      rejected++;
    }
  }

  // عرض الأرقام مباشرة في الكروت
  if (document.getElementById('statTotal')) document.getElementById('statTotal').textContent = total;
  if (document.getElementById('statPending')) document.getElementById('statPending').textContent = pending;
  if (document.getElementById('statApproved')) document.getElementById('statApproved').textContent = approved;
  if (document.getElementById('statRejected')) document.getElementById('statRejected').textContent = rejected;
}

// 4. عرض الجدول بالطلبات (Display Table)

function displayRequests() {
  const requestsTable = document.getElementById('requestsTable');
  if (!requestsTable) return;

  let requests = getMyRequests();
  requestsTable.innerHTML = '';

  // إذا لم تكن هناك طلبات
  if (requests.length === 0) {
    requestsTable.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">No leave requests found.</td></tr>`;
    updateEmployeeStats();
    return;
  }

  // إضافة كل طلب كسطر في الجدول
  for (let i = 0; i < requests.length; i++) {
    let req = requests[i];

    // تحديد لون الشارة
    let badgeClass = 'badge-pending';
    if (req.status === 'Approved') badgeClass = 'badge-approved';
    if (req.status === 'Rejected') badgeClass = 'badge-rejected';

    // رابط المرفق
    let attachmentHTML = '—';
    if (req.attachment) {
      attachmentHTML = `<a href="javascript:void(0)" onclick="viewAttachment(${req.id})">${req.attachmentName || 'PDF File'}</a>`;
    }

    // سبب الرفض إن وجد
    let rejectionHTML = '';
    if (req.rejectionReason) {
      rejectionHTML = `<br><small style="color:red">Reason: ${req.rejectionReason}</small>`;
    }

    // بناء السطر
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

  // تحديث الأرقام العلوية
  updateEmployeeStats();

  // تطبيق الفلترة الحالية إذا كان هناك راديو محدد
  filterRequestsTable();
}

// 5. إظهار وإخفاء حقول النموذج عند التغيير
if (leaveType) {
  leaveType.addEventListener('change', function () {
    let type = leaveType.value;

    if (type === 'Departure') {
      departureTime.classList.remove('d-none');
      leaveDates.classList.add('d-none');
    } else if (type === 'Annual' || type === 'sick') {
      leaveDates.classList.remove('d-none');
      departureTime.classList.add('d-none');
    } else {
      leaveDates.classList.add('d-none');
      departureTime.classList.add('d-none');
    }
  });
}


// 6. التعامل مع رفع ملف الـ PDF
if (attachmentInput) {
  attachmentInput.addEventListener('change', function (e) {
    let file = e.target.files[0];

    if (!file) return;

    // التأكد أنه ملف PDF
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only.');
      return;
    }

    // قراءة الملف
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

// حذف المرفق
if (removeAttachmentBtn) {
  removeAttachmentBtn.addEventListener('click', function () {
    fileBase64 = null;
    fileName = null;
    attachmentInput.value = '';
    fileNameDisplay.textContent = 'No file attached';
    removeAttachmentBtn.classList.add('d-none');
  });
}


// 7. حفظ وتقديم الطلب (Submit Form)
if (leaveForm) {
  leaveForm.addEventListener('submit', function (e) {
    e.preventDefault();

    let type = leaveType.value;
    let dateTimeText = '';

    // تجميع الوقت والتاريخ
    if (type === 'Departure') {
      dateTimeText = `${departureDate.value} (${startTime.value} - ${endTime.value})`;
    } else {
      dateTimeText = `${startDate.value} to ${endDate.value}`;
    }

    // إنشاء كائن الطلب الجديد
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

    // حفظ الطلب في السجل العام
    let allRequests = JSON.parse(localStorage.getItem('all_leave_requests')) || [];
    allRequests.push(newRequest);
    localStorage.setItem('all_leave_requests', JSON.stringify(allRequests));

    alert('Request submitted successfully!');

    // إعادة إغلاق المودال وتنظيف البيانات
    closeModal();
    displayRequests();
  });
}


// 8. فتح المرفق وقراءة الـ PDF
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


// 9. تشغيل كبسات الراديو (تصفية الجدول)

const radioButtons = document.querySelectorAll('.filter-radio');

radioButtons.forEach(radio => {
  radio.addEventListener('click', function () {
    // إمكانية إلغاء التحديد عند الضغط مرتين
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


// 10. فتح وإغلاق النافذة (Modal)

function closeModal() {
  if (modal) modal.classList.remove('active');
  if (leaveForm) leaveForm.reset();
  if (removeAttachmentBtn) removeAttachmentBtn.click();
}

const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

if (openModalBtn) openModalBtn.onclick = () => modal.classList.add('active');
if (closeModalBtn) closeModalBtn.onclick = closeModal;
if (cancelModalBtn) cancelModalBtn.onclick = closeModal;

// تشغيل عرض البيانات فور فتح الصفحة
displayRequests();