let Meetings = [];
let Employees = [];
let editId = null;
let reqId = null;

let form = document.getElementById("meetingForm");
let menu = document.getElementById("participantsMenu");
let allEmp = document.getElementById("selectAllEmployees");

//بتجيب الاجتماعات من local والموظفين من ملف JSON وبتعرضهم
async function loadData() {
    try {
        let saved = JSON.parse(localStorage.getItem("Meetings"));
        if (Array.isArray(saved)) Meetings = saved;
    } catch (error) {
        console.error("Unable to read meetings:", error);
    }
    try {
        let response = await fetch("../../jsonFiles/Users.json");
        if (!response.ok) throw new Error("Users.json could not be loaded");
        let users = await response.json();
        if (!Array.isArray(users)) throw new Error("Invalid user directory");
        Employees = users.filter(function (user) {
            return user.role === "employee";
        });
        displayEmp();
        displayMeet();
    } catch (error) {
        console.error("Error loading Users.json:", error);
    }
}
// بجيب الميتنج
function getMeet(id) {
    for (let meet of Meetings) {
        if (meet.id === id) return meet;
    }
    return null;
}
//بجيب الموظف
function getEmp(id) {
    for (let emp of Employees) {
        if (emp.id === id) return emp;
    }
    return null;
}

//بحفظ الميتنج بال local 
function saveData() {
    localStorage.setItem("Meetings", JSON.stringify(Meetings));
    displayMeet();
}

// عرض الموظفين والأقسام .
function displayEmp() {
    let empBox = document.getElementById("employeesCheckboxes");
    let deptBox = document.getElementById("departmentsCheckboxes");
    let depts = ["IT", "Marketing", "Finance", "Operations", "Sales"];
    empBox.innerHTML = "";
    deptBox.innerHTML = "";
    for (let emp of Employees) {
        empBox.innerHTML += `<label class="participant-option">
            <input type="checkbox" class="employee-option" value="${emp.id}" onchange="checkEmp()">
            <span>${emp.name}</span></label>`;
    }
    for (let dept of depts) {
        deptBox.innerHTML += `<label class="participant-option">
            <input type="checkbox" class="department-option" value="${dept}" onchange="selectDept(this)">
            <span>${dept}</span></label>`;
    }
}
//dropdown list
function showMenu() {
    menu.hidden = !menu.hidden;
}
//بتجيب الايدي للموظفين
function getIds() {
    let ids = [];
    for (let box of document.querySelectorAll(".employee-option:checked")) {
        ids.push(Number(box.value));
    }
    return ids;
}
//بجيب كل الموظفين بالقسم الي اخترته 
function selectDept(dept) {
    for (let box of document.querySelectorAll(".employee-option")) {
        let emp = getEmp(Number(box.value));
        if (emp && emp.department === dept.value) box.checked = dept.checked;
    }
    checkEmp();
}

//تحديث عدد الموظفين الي اخترتهم
function checkEmp() {
    let ids = getIds();
    allEmp.checked = Employees.length > 0 && ids.length === Employees.length;
    for (let box of document.querySelectorAll(".department-option")) {
        let deptEmp = Employees.filter(function (emp) {
            return emp.department === box.value;
        });
        let selected = deptEmp.filter(function (emp) {
            return ids.includes(emp.id);
        });
        box.checked = deptEmp.length > 0 && selected.length === deptEmp.length;
    }
    document.getElementById("participantsText").textContent = "Select participants";
    if (ids.length > 0) document.getElementById("participantsText").textContent = ids.length + " participants selected";
}

// لما بدي اعمل ميتنج جديد + بتجهز البيانات وبتخلي الفورم فاضي
function openForm() {
    editId = null;
    form.reset();
    checkEmp();
    document.getElementById("formTitle").textContent = "Schedule Meeting";
    document.getElementById("saveMeetingButton").textContent = "Schedule Meeting";
    document.getElementById("meetingFormContainer").hidden = false;
}
function closeForm() {
    document.getElementById("meetingFormContainer").hidden = true;
    menu.hidden = true;
    editId = null;
}

function editMeet(id) {
    let meet = getMeet(id);
    if (!meet || meet.createdBy !== "HR") return;
    openForm();
    editId = id;
    document.getElementById("meetingTitle").value = meet.title || "";
    document.getElementById("meetingDate").value = meet.date || "";
    document.getElementById("meetingTime").value = meet.time || "";
    document.getElementById("meetingNotes").value = meet.notes || "";
    for (let box of document.querySelectorAll(".employee-option")) {
        box.checked = meet.participants.includes(Number(box.value));
    }
    checkEmp();
    document.getElementById("formTitle").textContent = "Edit Meeting";
    document.getElementById("saveMeetingButton").textContent = "Save Changes";
}

//هون بخزن قيم الميتنج
function saveMeet(event) {
    event.preventDefault();
    let ids = getIds();
    if (ids.length === 0) {
        alert("Please select at least one employee.");
        return;
    }
    let isNew = editId === null;
    let meet = getMeet(editId);
    if (isNew) {
        let id = Date.now();
        meet = { id: id, createdBy: "HR", status: "Scheduled", responses: [], roomName: "HRMeeting_" + id };
        Meetings.push(meet);
    }
    if (!meet) return;
    meet.title = document.getElementById("meetingTitle").value.trim();
    meet.date = document.getElementById("meetingDate").value;
    meet.time = document.getElementById("meetingTime").value;
    meet.notes = document.getElementById("meetingNotes").value.trim();
    meet.participants = ids;
    saveData();
    closeForm();
    if (isNew) alert("Meeting scheduled successfully.");
}
function deleteMeet(id) {
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    Meetings = Meetings.filter(function (meet) {
        return meet.id !== id;
    });
    saveData();
}

// عرض الطلبات المعلقة والاجتماعات المجدولة.
function displayMeet() {
    let reqBox = document.getElementById("meetingRequests");
    let meetBox = document.getElementById("meetingsContainer");
    reqBox.innerHTML = "";
    meetBox.innerHTML = "";
    for (let meet of Meetings) {
        if (meet.createdBy === "Employee" && meet.status === "Pending") {
            let emp = getEmp(meet.requestedBy);
            let name = "Employee";
            if (emp) name = emp.name;
            let info = `<p class="meeting-info"><strong>Employee</strong><span>${name}</span></p>`;
            let buttons = `<button class="view-button" onclick="viewReq(${meet.id})">Review Request</button>`;
            reqBox.appendChild(card(meet, "Pending", info, buttons));
        }
        if (meet.createdBy === "HR" || (meet.createdBy === "Employee" && meet.status === "Accepted")) {
            let status = "Accepted";
            let info = `<p class="meeting-info"><strong>Participants</strong><span>${meet.participants.length}</span></p>`;
            if (meet.notes) info += `<div class="notes-preview">${meet.notes}</div>`;
            let buttons = `
                <button class="join-button" onclick="joinMeet(${meet.id})">Join Meeting</button>
                <button class="view-button" onclick="viewMeet(${meet.id})">View</button>`;
            if (meet.createdBy === "HR") {
                status = "Upcoming";
                buttons += `
                    <button class="edit-button" onclick="editMeet(${meet.id})">Edit</button>
                    <button class="delete-button" onclick="deleteMeet(${meet.id})">Delete</button>`;
            }
            meetBox.appendChild(card(meet, status, info, buttons));
        }
    }
    if (reqBox.innerHTML === "") reqBox.innerHTML = '<p class="empty-message">No pending meeting requests.</p>';
    if (meetBox.innerHTML === "") meetBox.innerHTML = '<p class="empty-message">No scheduled meetings.</p>';
}
function card(meet, status, info, buttons) {
    let box = document.createElement("div");
    box.className = "meeting-card";
    box.innerHTML = `
        <div class="meeting-card-header">
            <h3>${meet.title}</h3><span class="status status-${status.toLowerCase()}">${status}</span>
        </div>
        <div class="meeting-details">
            <p class="meeting-info"><strong>Date</strong><span>${showDate(meet.date)}</span></p>
            <p class="meeting-info"><strong>Time</strong><span>${showTime(meet.time)}</span></p>
            ${info}
        </div>
        <div class="card-actions">${buttons}</div>`;
    return box;
}
function joinMeet(id) {
    let meet = getMeet(id);
    if (!meet) return;
    if (!meet.roomName) {
        meet.roomName = "HRMeeting_" + meet.id;
        saveData();
    }
    window.location.href = "../meetingzoom/meetingzoom.html?room=" + encodeURIComponent(meet.roomName);
}

// عرض تفاصيل الاجتماع وردود المشاركين.
function viewMeet(id) {
    let meet = getMeet(id);
    if (!meet) return;
    document.getElementById("viewMeetingTitle").textContent = meet.title;
    document.getElementById("viewMeetingDate").textContent = showDate(meet.date);
    document.getElementById("viewMeetingTime").textContent = showTime(meet.time);
    document.getElementById("viewMeetingNotes").textContent = meet.notes || "No notes";
    let empBox = document.getElementById("viewMeetingParticipants");
    let replyBox = document.getElementById("viewMeetingResponses");
    empBox.innerHTML = "";
    replyBox.innerHTML = "";
    for (let id of meet.participants) {
        let emp = getEmp(id);
        if (!emp) continue;
        empBox.innerHTML += `<div class="view-participant"><div>
            <div class="participant-name">${emp.name}</div>
            <div class="participant-department">${emp.department || emp.position || ""}</div>
        </div></div>`;
        if (meet.createdBy === "HR") {
            let replies = (meet.responses || []).filter(function (reply) {
                return reply.employeeId === id;
            });
            let reply = replies[0] || { status: "Pending", message: "" };
            replyBox.innerHTML += replyCard(emp.name, reply.status, reply.message);
        }
    }
    if (meet.createdBy === "Employee") replyBox.innerHTML = replyCard("HR Response", meet.status, meet.hrMessage);
    document.getElementById("viewMeetingModal").hidden = false;
}
function replyCard(name, status, message) {
    let text = "";
    if (message) text = `<p class="response-message">${message}</p>`;
    let color = "status-pending";
    if (status === "Accepted") color = "status-accepted";
    if (status === "Rejected") color = "status-rejected";
    return `<div class="response-item">
        <div class="response-header"><strong>${name}</strong><span class="status ${color}">${status}</span></div>
        ${text}</div>`;
}
function closeView() {
    document.getElementById("viewMeetingModal").hidden = true;
}

// عرض طلب الموظف .
function viewReq(id) {
    let req = getMeet(id);
    if (!req) return;
    reqId = id;
    let emp = getEmp(req.requestedBy);
    let name = "Employee";
    if (emp) name = emp.name;
    document.getElementById("viewRequestTitle").textContent = req.title;
    document.getElementById("viewRequestEmployee").textContent = name;
    document.getElementById("viewRequestDate").textContent = showDate(req.date);
    document.getElementById("viewRequestTime").textContent = showTime(req.time);
    document.getElementById("viewRequestStatus").textContent = req.status;
    document.getElementById("viewRequestNotes").textContent = req.notes || "No notes";
    document.getElementById("requestResponseMessage").value = req.hrMessage || "";
    document.getElementById("viewRequestModal").hidden = false;
}
function replyReq(status) {
    let req = getMeet(reqId);
    if (!req) return;
    if (status === "Rejected" && !confirm("Are you sure you want to reject this meeting request?")) return;
    req.status = status;
    req.hrMessage = document.getElementById("requestResponseMessage").value.trim();
    if (!req.roomName) req.roomName = "EmployeeMeeting_" + req.id;
    saveData();
    closeReq();
}
function closeReq() {
    document.getElementById("viewRequestModal").hidden = true;
    reqId = null;
}

// تنسيق التاريخ والوقت للعرض فقط، بدون تغيير القيم المحفوظة.
function showDate(date) {
    if (!date) return "-";
    let parts = date.split("-");
    let value = new Date(parts[0], parts[1] - 1, parts[2]);
    return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function showTime(time) {
    if (!time) return "-";
    let parts = time.split(":");
    let hour = Number(parts[0]);
    let period = "AM";
    if (hour >= 12) period = "PM";
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return hour + ":" + parts[1] + " " + period;
}

form.addEventListener("submit", saveMeet);
allEmp.addEventListener("change", function () {
    for (let box of document.querySelectorAll(".employee-option")) box.checked = this.checked;
    checkEmp();
});
document.addEventListener("click", function (event) {
    let dropdown = document.querySelector(".participants-dropdown");
    if (dropdown && !dropdown.contains(event.target)) menu.hidden = true;
});
loadData();
