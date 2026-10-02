let Meetings = JSON.parse(localStorage.getItem("Meetings")) || [];
let Employees = [];
let editingMeetingId = null;
let currentRequestId = null;

let meetingForm = document.getElementById("meetingForm");
let meetingModal = document.getElementById("meetingFormContainer");
let participantsMenu = document.getElementById("participantsMenu");
let selectAllEmployees = document.getElementById("selectAllEmployees");
let meetingFields = { title: "meetingTitle", date: "meetingDate", time: "meetingTime", notes: "meetingNotes" };
/*اول فنكشن بشتغل عندي بجيب اليوزرز من ال json file */
// بس بجيب ال employees 
function loadEmployees() {
    fetch("../../jsonFiles/Users.json")
        .then(response => {
            if (!response.ok) throw new Error("Users.json could not be loaded");
            return response.json();
        })
        .then(data => {
            Employees = data.filter(user => user.role === "employee");
            startPage();
        })
        .catch(error => console.error("Error loading Users.json:", error));
}
//بجيب ال meeting req والميتنج تاعت ال HR
function startPage() {
    displayParticipantOptions();
    displayMeetingRequests();
    displayMeetings();
}
//حفظ ال meetings في ال local storage
function saveMeetings() {
    localStorage.setItem("Meetings", JSON.stringify(Meetings));
}
// هون بجيب كل ال employees وال departments وبحطهم في ال dropdown list
function displayParticipantOptions() {
    let employeesBox = document.getElementById("employeesCheckboxes");
    let departmentsBox = document.getElementById("departmentsCheckboxes");
    let departments = [];

    employeesBox.innerHTML = "";
    departmentsBox.innerHTML = "";

    Employees.forEach(employee => {
        employeesBox.innerHTML += `
            <label class="participant-option">
                <input type="checkbox" class="employee-option"
                    value="${employee.id}" onchange="updateSelection()">
                <span>${employee.name}</span>
            </label>`;

        if (employee.department && !departments.includes(employee.department)) {
            departments.push(employee.department);
        }
    });

    departments.forEach(department => {
        departmentsBox.innerHTML += `
            <label class="participant-option">
                <input type="checkbox" class="department-option"
                    value="${department}" onchange="selectDepartment(this)">
                <span>${department}</span>
            </label>`;
    });
}
//عشان افتح واسكر ال dropdown
function toggleParticipantsDropdown() {
    participantsMenu.hidden = !participantsMenu.hidden;
}
/*لما اكبس على all employee بال dropdown list عشان يصيرو كلهم checked*/ 
selectAllEmployees.addEventListener("change", function () {
    document.querySelectorAll(".employee-option, .department-option").forEach(box => {
        box.checked = this.checked;
    });

    updateParticipantsText();
});
//هون لما اكبس على قسم معين بال الليست بعمل تشيك على الموظفين
function selectDepartment(departmentBox) {
    document.querySelectorAll(".employee-option").forEach(box => {
        let employee = Employees.find(user => user.id == box.value);

        if (employee && employee.department === departmentBox.value) {
            box.checked = departmentBox.checked;
        }
    });

    updateSelection();
}

// هون في حال اخترت كل الموظفين بال القسم بعمل تيشك على القسم 
function updateSelection() {
    let selected = getSelectedEmployees();

    selectAllEmployees.checked = Employees.length > 0 && selected.length === Employees.length;

    document.querySelectorAll(".department-option").forEach(departmentBox => {
        let departmentEmployees = Employees.filter(
            employee => employee.department === departmentBox.value
        );

        departmentBox.checked = departmentEmployees.length > 0 &&
            departmentEmployees.every(employee => selected.includes(employee.id));
    });

    updateParticipantsText();
}
// بجيب كل الموظفين الي اخترتهم بالليست 
function getSelectedEmployees() {
    let selected = [];

    document.querySelectorAll(".employee-option:checked").forEach(box => {
        selected.push(Number(box.value));
    });

    return selected;
}
//هون عشان اعرض الموظفين بال Participants
function updateParticipantsText() {
    let selected = getSelectedEmployees();
    let text = document.getElementById("participantsText");

    if (selected.length === 0) {
        text.textContent = "Select participants";
    } else if (selected.length === Employees.length) {
        text.textContent = "All Employees";
    } else if (selected.length === 1) {
        let employee = Employees.find(user => user.id === selected[0]);
        text.textContent = employee ? employee.name : "1 participant";
    } else {
        text.textContent = selected.length + " participants selected";
    }
}
// عشان لما يعمل uncheck
function clearParticipants() {
    document.querySelectorAll(".employee-option, .department-option").forEach(box => {
        box.checked = false;
    });

    selectAllEmployees.checked = false;
    updateParticipantsText();
}

//لما اضغط على schedule meeting بتفتح 
function showMeetingForm() {
    editingMeetingId = null;
    meetingForm.reset();
    clearParticipants();
    document.getElementById("formTitle").textContent = "Schedule Meeting";
    document.getElementById("saveMeetingButton").textContent = "Schedule Meeting";
    meetingModal.hidden = false;
}
//عشان اسكر ال schedule meeting
function hideMeetingForm() {
    meetingModal.hidden = true;
    participantsMenu.hidden = true;
    editingMeetingId = null;
}

// هون بعمل كذا شغله اول اشي في حال ما اختار موظف ببعثله اليرت 
//ثاني اشي في حال بدي اعمل ابديت على ميتنج معين 
//اذا لا فا انا هون بكون بعمل ميتنج 
//واخر اشي بعمل save طبعا 
function saveMeeting(event) {
    event.preventDefault();

    let participants = getSelectedEmployees();

    if (participants.length === 0) {
        alert("Please select at least one employee.");
        return;
    }

    let meeting = Meetings.find(item => item.id === editingMeetingId);
    if (editingMeetingId === null) {
        let id = Date.now();
        meeting = { id: id, createdBy: "HR", status: "Scheduled", responses: [], roomName: "HRMeeting_" + id };
        Meetings.push(meeting);
    }
    if (meeting) {
        for (let field in meetingFields) {
            let value = document.getElementById(meetingFields[field]).value;
            meeting[field] = field === "title" || field === "notes" ? value.trim() : value;
        }
        meeting.participants = participants;
    }

    saveMeetings();
    hideMeetingForm();
    displayMeetings();
}

meetingForm.addEventListener("submit", saveMeeting);

//وقت ما اعدل على الميتنق ال HR
function editMeeting(id) {
    let meeting = Meetings.find(item => item.id === id);

    if (!meeting || meeting.createdBy !== "HR") return;

    editingMeetingId = id;
    for (let field in meetingFields) {
        document.getElementById(meetingFields[field]).value = field === "notes" ? meeting.notes || "" : meeting[field];
    }

    clearParticipants();
    document.querySelectorAll(".employee-option").forEach(box => {
        box.checked = meeting.participants.includes(Number(box.value));
    });
    updateSelection();

    document.getElementById("formTitle").textContent = "Edit Meeting";
    document.getElementById("saveMeetingButton").textContent = "Save Changes";
    meetingModal.hidden = false;
}
// لما بدي احذف ميتنج
function deleteMeeting(id) {
    if (!confirm("Are you sure you want to delete this meeting?")) return;

    Meetings = Meetings.filter(meeting => meeting.id !== id);
    saveMeetings();
    displayMeetings();
}

// هون بعرض كل الميتنجات الي انا عاملها او الي الموظف قبلها
function displayMeetings() {
    let container = document.getElementById("meetingsContainer");
    let scheduled = Meetings.filter(meeting =>
        meeting.createdBy === "HR" ||
        (meeting.createdBy === "Employee" && meeting.status === "Accepted")
    );

    if (scheduled.length === 0) {
        container.innerHTML = `<p class="empty-message">No scheduled meetings.</p>`;
        return;
    }

    container.innerHTML = "";

    scheduled.forEach(meeting => {
        let employeeRequest = meeting.createdBy === "Employee";
        let status = employeeRequest ? "Accepted" : "Upcoming";
        let statusClass = employeeRequest ? "status-accepted" : "status-upcoming";
        let count = meeting.participants ? meeting.participants.length : 0;

        container.innerHTML += `
            <div class="meeting-card">
                <div class="meeting-card-header">
                    <h3>${meeting.title}</h3>
                    <span class="status ${statusClass}">${status}</span>
                </div>

                <div class="meeting-details">
                    <p class="meeting-info"><strong>Date</strong><span>${formatDate(meeting.date)}</span></p>
                    <p class="meeting-info"><strong>Time</strong><span>${formatTime(meeting.time)}</span></p>
                    <p class="meeting-info"><strong>Participants</strong><span>${count}</span></p>
                    ${meeting.notes ? `<div class="notes-preview">${meeting.notes}</div>` : ""}
                </div>

                <div class="card-actions">
                    <button class="join-button" onclick="joinMeeting(${meeting.id})">Join Meeting</button>
                    <button class="view-button" onclick="viewMeeting(${meeting.id})">View</button>
                    ${employeeRequest ? "" : `
                        <button class="edit-button" onclick="editMeeting(${meeting.id})">Edit</button>
                        <button class="delete-button" onclick="deleteMeeting(${meeting.id})">Delete</button>
                    `}
                </div>
            </div>`;
    });
}
// لما اكبس على join meeting بفتح ال zoom meeting
function joinMeeting(id) {
    let meeting = Meetings.find(item => item.id === id);
    if (!meeting) return;

    if (!meeting.roomName) {
        meeting.roomName = "HRMeeting_" + meeting.id;
        saveMeetings();
    }
    window.location.href = "../meetingzoom/meetingzoom.html?room=" + encodeURIComponent(meeting.roomName);
}

//بجيب الميتنق وبعرض معلوماته
function viewMeeting(id) {
    let meeting = Meetings.find(item => item.id === id);
    if (!meeting) return;

    document.getElementById("viewMeetingTitle").textContent = meeting.title;
    document.getElementById("viewMeetingDate").textContent = formatDate(meeting.date);
    document.getElementById("viewMeetingTime").textContent = formatTime(meeting.time);
    document.getElementById("viewMeetingNotes").textContent = meeting.notes || "No notes";

    displayViewParticipants(meeting);
    displayViewResponses(meeting);
    document.getElementById("viewMeetingModal").hidden = false;
}
//لما اكبس على view ميتنق بعرض الموظفين واقسامهم
function displayViewParticipants(meeting) {
    let container = document.getElementById("viewMeetingParticipants");
    container.innerHTML = "";

    (meeting.participants || []).forEach(id => {
        let person = Employees.find(user => user.id === id);
        if (!person) return;

        container.innerHTML += `
            <div class="view-participant">
                <div>
                    <div class="participant-name">${person.name}</div>
                    <div class="participant-department">${person.department || person.position || ""}</div>
                </div>
            </div>`;
    });
}
//احفظ بيانات الفيو
function displayViewResponses(meeting) {
    let container = document.getElementById("viewMeetingResponses");
    container.innerHTML = "";

    if (meeting.createdBy === "Employee") {
        container.innerHTML = responseCard("HR Response", meeting.status, meeting.hrMessage);
        return;
    }

    (meeting.participants || []).forEach(id => {
        let employee = Employees.find(user => user.id === id && user.role === "employee");
        if (!employee) return;

        let response = (meeting.responses || []).find(item => item.employeeId === id);
        let status = response ? response.status : "Pending";

        container.innerHTML += responseCard(employee.name, status, response ? response.message : "");
    });
}

//هون لما اعمل للردود دسيبلاي على الشاشه 
function responseCard(name, status, message) {
    return `
        <div class="response-item">
            <div class="response-header">
                <strong>${name}</strong>
                <span class="status ${getStatusClass(status)}">${status}</span>
            </div>
            ${message ? `<p class="response-message">${message}</p>` : ""}
        </div>`;
}

function closeMeetingView() {
    document.getElementById("viewMeetingModal").hidden = true;
}

// مراجعة طلب الموظف وقبوله أو رفضه.
function displayMeetingRequests() {
    let container = document.getElementById("meetingRequests");
    let requests = Meetings.filter(meeting =>
        meeting.createdBy === "Employee" && meeting.status === "Pending"
    );

    if (requests.length === 0) {
        container.innerHTML = `<p class="empty-message">No pending meeting requests.</p>`;
        return;
    }

    container.innerHTML = "";

    requests.forEach(request => {
        let employee = Employees.find(user => user.id === request.requestedBy);

        container.innerHTML += `
            <div class="meeting-card">
                <div class="meeting-card-header">
                    <h3>${request.title}</h3>
                    <span class="status status-pending">Pending</span>
                </div>

                <div class="meeting-details">
                    <p class="meeting-info"><strong>Employee</strong><span>${employee ? employee.name : "Employee"}</span></p>
                    <p class="meeting-info"><strong>Date</strong><span>${formatDate(request.date)}</span></p>
                    <p class="meeting-info"><strong>Time</strong><span>${formatTime(request.time)}</span></p>
                </div>

                <div class="card-actions">
                    <button class="view-button" onclick="viewRequest(${request.id})">Review Request</button>
                </div>
            </div>`;
    });
}
// هون بعرض كل الريكوست وبحفظ ال id 
function viewRequest(id) {
    let request = Meetings.find(item => item.id === id);
    if (!request) return;

    currentRequestId = id;
    let employee = Employees.find(user => user.id === request.requestedBy);

    document.getElementById("viewRequestTitle").textContent = request.title;
    document.getElementById("viewRequestEmployee").textContent = employee ? employee.name : "Employee";
    document.getElementById("viewRequestDate").textContent = formatDate(request.date);
    document.getElementById("viewRequestTime").textContent = formatTime(request.time);
    document.getElementById("viewRequestStatus").textContent = request.status;
    document.getElementById("viewRequestNotes").textContent = request.notes || "No notes";
    document.getElementById("requestResponseMessage").value = request.hrMessage || "";
    document.getElementById("viewRequestModal").hidden = false;
}
// هون بغيرلي الحاله حسب اذا انقبل او نرفض
function respondToCurrentRequest(status) {
    let request = Meetings.find(item => item.id === currentRequestId);
    if (!request) return;

    request.status = status;
    request.hrMessage = document.getElementById("requestResponseMessage").value.trim();

    if (!request.roomName) {
        request.roomName = "EmployeeMeeting_" + request.id;
    }

    saveMeetings();
    closeRequestView();
    displayMeetingRequests();
    displayMeetings();
}
//لما افتح ريكوست
function closeRequestView() {
    document.getElementById("viewRequestModal").hidden = true;
    currentRequestId = null;
}
//css
function getStatusClass(status) {
    if (status === "Accepted") return "status-accepted";
    if (status === "Rejected") return "status-rejected";
    return "status-pending";
}
//date
function formatDate(date) {
    if (!date) return "-";

    let parts = date.split("-");
    let value = new Date(parts[0], parts[1] - 1, parts[2]);

    return value.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}
//time
function formatTime(time) {
    if (!time) return "-";

    let parts = time.split(":");
    let hour = Number(parts[0]);
    let period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;
    return hour + ":" + parts[1] + " " + period;
}
//لما اكبس اي مكان برا بسكر الدروب ليست
document.addEventListener("click", function (event) {
    let dropdown = document.querySelector(".participants-dropdown");

    if (dropdown && !dropdown.contains(event.target)) {
        participantsMenu.hidden = true;
    }
});
//init
loadEmployees();
