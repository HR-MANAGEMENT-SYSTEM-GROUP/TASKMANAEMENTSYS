//------------------- جلب البيانات من localStorage -------------------
const Employees = JSON.parse(localStorage.getItem("Employees")) || [];
const Leaves = JSON.parse(localStorage.getItem("all_leave_requests")) || [];
const Tasks = JSON.parse(localStorage.getItem("tasks")) || [];
const Feedbacks = JSON.parse(localStorage.getItem("feedbacks")) || [];
const Meetings = JSON.parse(localStorage.getItem("Meetings")) || [];

//------------------- عرض الإحصائيات -------------------
document.addEventListener("DOMContentLoaded", () => {
  // عرض تاريخ اليوم
  const dateElem = document.getElementById("currentDateDisplay");
  if (dateElem) {
    const options = { month: "short", day: "numeric", year: "numeric" };
    dateElem.textContent = new Date().toLocaleDateString("en-US", options);
  }

  // إحصائيات عامة
  document.getElementById("activeEmployees").textContent =
    Employees.filter(e => e.status === "Active").length;
  document.getElementById("pendingLeaves").textContent =
    Leaves.filter(l => l.status === "Pending").length;
  document.getElementById("openTasks").textContent =
    Tasks.filter(t => t.status === "New").length;
  document.getElementById("employeeFeedback").textContent = Feedbacks.length;

  document.getElementById("LeavesCount").textContent = Leaves.length;
  document.getElementById("TasksCount").textContent = Tasks.length;
  document.getElementById("MeetingsCount").textContent = Meetings.length;
  document.getElementById("FeedbackCount").textContent = Feedbacks.length;

  // عرض الإجازات
  displayLeaves(Leaves);

  // عرض الاجتماعات
  displayMeetings(Meetings);
});

//------------------- دوال عرض الإجازات -------------------
function displayLeaves(list) {
  const output = document.getElementById("leavesTableBody");
  output.innerHTML = "";

  if (!list.length) {
    output.innerHTML = `
      <tr><td colspan="3" class="text-center">No leave requests submitted yet.</td></tr>
    `;
    return;
  }

  list.forEach(leave => {
    output.innerHTML += `
      <tr class="table-data-row">
        <td>
          <div class="emp-profile-cell">
            <span class="emp-avatar">${leave.employeeInitials || "--"}</span>
            <div class="emp-details">
              <span class="emp-name">${leave.employeeName}</span>
              <span class="emp-role">${leave.employeeRole}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="leave-type-badge">
            <i class="bi ${getLeaveIcon(leave.leaveType)}"></i>
            ${leave.leaveType} &middot; ${leave.duration || "N/A"}
          </span>
        </td>
        <td>
          <span class="status-badge ${getStatusClass(leave.status)}">
            <i class="bi ${getStatusIcon(leave.status)}"></i>
            ${leave.status}
          </span>
        </td>
      </tr>
    `;
  });
}

function getLeaveIcon(type) {
  switch (type?.toLowerCase()) {
    case "annual": return "bi-sun";
    case "sick": return "bi-hospital";
    case "personal": return "bi-briefcase";
    case "remote": return "bi-house-door";
    default: return "bi-calendar2-range";
  }
}
function getStatusClass(status) {
  return status?.toLowerCase() === "approved" ? "badge-approved" : "badge-pending";
}
function getStatusIcon(status) {
  return status?.toLowerCase() === "approved" ? "bi-check-circle-fill" : "bi-hourglass-bottom";
}

//------------------- دوال عرض الاجتماعات -------------------
function displayMeetings(list) {
  const output = document.getElementById("meetingsList");
  output.innerHTML = "";

  if (!list.length) {
    document.getElementById("meetingsEmptyNotice").classList.remove("d-none");
    return;
  }
  document.getElementById("meetingsEmptyNotice").classList.add("d-none");

  list.forEach(m => {
    output.innerHTML += `
      <div class="meeting-item">
        <div class="meeting-date-box">
          <span class="meeting-date-month">${m.month}</span>
          <span class="meeting-date-day">${m.day}</span>
        </div>
        <div class="meeting-info">
          <div class="meeting-title">${m.title}</div>
          <div class="meeting-meta">
            <span><i class="bi bi-clock"></i> ${m.time}</span>
            <span>&middot;</span>
            <span><i class="bi bi-geo-alt"></i> ${m.location}</span>
          </div>
        </div>
        <span class="meeting-tag">${m.tag || ""}</span>
      </div>
    `;
  });
}
