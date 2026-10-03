let Meetings = [];
let Employees = [];
let meetingHR = null;
const meetingHREmail = "maya.nasser@company.com";
let requestForm = document.getElementById("requestMeetingForm");
let requestModal = document.getElementById("requestFormContainer");

//هاي عشان اجيب الموظف الي عامل login
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUser"));
    } catch (_) {
        return null;
    }
}
//عشان اجيب ال id 
function getSignedInEmployeeId() {
    let user = getCurrentUser();
    let id = Number(user?.id);
    return user?.role === "employee" && Number.isInteger(id) && id > 0 ? id : null;
}

const currentEmployeeId = getSignedInEmployeeId();
// بتاكد انه الموظف لسا عامل لوج ان وبحدث الصفحه
function ensureEmployeeSession() {
    const signedInId = getSignedInEmployeeId();
    if (signedInId === null) {
        window.location.href = "../../GAITH/login.html";
        return false;
    }
    if (signedInId !== currentEmployeeId) {
        window.location.reload();
        return false;
    }
    return true;
}

// تحميل الموظفين من التخزين وبيانات HR من ملف المستخدمين.
function loadEmployees() {
    const submitButton = document.querySelector("#requestMeetingForm button[type='submit']");
    submitButton.disabled = true;
    try {
        const saved = JSON.parse(localStorage.getItem("Employees"));
        Employees = Array.isArray(saved) ? saved : [];
    } catch (_) {
        Employees = [];
    }

    return fetch("../../jsonFiles/Users.json")
        .then(response => {
            if (!response.ok) throw new Error("Users.json could not be loaded");
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) throw new Error("Invalid user directory");
            meetingHR = data.find(user =>
                user.role === "hr" &&
                (user.email || "").toLowerCase() === meetingHREmail
            ) || null;
            if (Employees.length === 0) {
                Employees = data;
                localStorage.setItem("Employees", JSON.stringify(data));
            }
        })
        .catch(error => console.log("Error loading meeting directory:", error))
        .finally(() => {
            submitButton.disabled = false;
            if (ensureEmployeeSession()) startPage();
        });
}
//هون بس ابدا بجيب الميتنج من اللوكل وبعرضهم
function startPage() {
    Meetings = JSON.parse(localStorage.getItem("Meetings")) || [];
    displayInvitations();
    displayUpcomingMeetings();
    displayMyRequests();
}

function saveMeetings() {
    localStorage.setItem("Meetings", JSON.stringify(Meetings));
}

// فتح الطلب وإرساله إلى HR.
function showRequestForm() {
    if (!ensureEmployeeSession()) return;
    requestForm.reset();
    requestModal.hidden = false;
}

function hideRequestForm() {
    requestModal.hidden = true;
}
//هون لما بدي ابعث ميتنج
function sendMeetingRequest(event) {
    event.preventDefault();
    if (!ensureEmployeeSession()) return;

    let manager = meetingHR;
    if (!manager) {
        alert("Unable to load the HR recipient. Please reload the page and try again.");
        return;
    }

    let id = Date.now();

    Meetings.push({
        id: id,
        title: document.getElementById("requestTitle").value.trim(),
        date: document.getElementById("requestDate").value,
        time: document.getElementById("requestTime").value,
        notes: document.getElementById("requestNotes").value.trim(),
        createdBy: "Employee",
        requestedBy: currentEmployeeId,
        hrManagerId: manager.id,
        participants: [currentEmployeeId, manager.id],
        status: "Pending",
        hrMessage: "",
        roomName: "EmployeeMeeting_" + id,
        responses: []
    });

    saveMeetings();
    displayMyRequests();
    hideRequestForm();
}

requestForm.addEventListener("submit", sendMeetingRequest);

function getEmployeeResponse(meeting) {
    if (!meeting.responses) meeting.responses = [];

    return meeting.responses.find(response => response.employeeId === currentEmployeeId);
}

function isInvited(meeting) {
    return meeting.createdBy === "HR" && meeting.participants && meeting.participants.includes(currentEmployeeId);
}

function getStatusClass(status) {
    if (status === "Accepted") return "status-accepted";
    if (status === "Rejected") return "status-rejected";
    return "status-pending";
}

// شكل موحد للبطاقات، مع محتوى مختلف .
function meetingCard(meeting, status, content, statusClass = getStatusClass(status)) {
    return `
        <div class="meeting-card">
            <div class="meeting-card-header">
                <h3>${meeting.title}</h3>
                <span class="status ${statusClass}">${status}</span>
            </div>
            <div class="meeting-details">
                <p class="meeting-info"><strong>Date</strong><span>${formatDate(meeting.date)}</span></p>
                <p class="meeting-info"><strong>Time</strong><span>${formatTime(meeting.time)}</span></p>
                ${meeting.notes ? `<div class="notes-preview">${meeting.notes}</div>` : ""}
            </div>
            ${content}
        </div>`;
}
// عشان اعرض المسج
function messageCard(label, message) {
    if (!message) return "";
    return `<div class="hr-message"><strong>${label}</strong><p>${message}</p></div>`;
}

// meeting invitations
function displayInvitations() {
    let container = document.getElementById("invitationsContainer");

    let invitations = Meetings.filter(meeting => {
        if (!isInvited(meeting)) return false;

        let response = getEmployeeResponse(meeting);
        return !response || response.status !== "Accepted";
    });

    container.innerHTML = invitations.length ? "" : `<p class="empty-message">You have no pending meeting invitations.</p>`;

    invitations.forEach(meeting => {
        let response = getEmployeeResponse(meeting);
        let status = response ? response.status : "Pending";

        container.innerHTML += meetingCard(meeting, status, `
            ${messageCard("Your message:", response ? response.message : "")}
            <div class="response-area">
                <label>Message to HR (optional)</label>
                <textarea id="employeeMessage-${meeting.id}"
                    placeholder="Add a message or explain if the time does not work..."></textarea>
            </div>
            <div class="card-actions">
                <button class="accept-button" onclick="respondToMeeting(${meeting.id}, 'Accepted')">Accept</button>
                <button class="reject-button" onclick="respondToMeeting(${meeting.id}, 'Rejected')">Reject</button>
            </div>`);
    });
}
//لما اقبل او ارفض اجتماع
function respondToMeeting(id, status) {
    if (!ensureEmployeeSession()) return;
    let meeting = Meetings.find(item => item.id === id);
    if (!meeting) return;

    let message = document.getElementById("employeeMessage-" + id).value.trim();
    let response = getEmployeeResponse(meeting);

    if (!response) {
        response = { employeeId: currentEmployeeId };
        meeting.responses.push(response);
    }
    response.status = status;
    response.message = message;

    saveMeetings();
    displayInvitations();
    displayUpcomingMeetings();
}


function displayUpcomingMeetings() {
    let container = document.getElementById("upcomingMeetingsContainer");

    let upcoming = Meetings.filter(meeting => {
        if (isInvited(meeting)) {
            let response = getEmployeeResponse(meeting);
            return response && response.status === "Accepted";
        }

        return meeting.createdBy === "Employee" &&
            meeting.requestedBy === currentEmployeeId &&
            meeting.status === "Accepted";
    });

    container.innerHTML = upcoming.length ? "" : `<p class="empty-message">You have no confirmed upcoming meetings.</p>`;

    upcoming.forEach(meeting => {
        container.innerHTML += meetingCard(meeting, "Confirmed", `
            <div class="card-actions">
                <button class="join-button" onclick="joinMeeting(${meeting.id})">Join Meeting</button>
            </div>`, "status-accepted");
    });
}


function displayMyRequests() {
    let container = document.getElementById("myRequestsContainer");

    let requests = Meetings.filter(meeting =>
        meeting.createdBy === "Employee" &&
        meeting.requestedBy === currentEmployeeId
    );

    container.innerHTML = requests.length ? "" : `<p class="empty-message">You have not requested any meetings.</p>`;

    requests.forEach(meeting => {
        container.innerHTML += meetingCard(meeting, meeting.status, messageCard("HR Message:", meeting.hrMessage));
    });
}

function joinMeeting(id) {
    if (!ensureEmployeeSession()) return;
    let meeting = Meetings.find(item => item.id === id);
    if (!meeting) return;

    if (!meeting.roomName) {
        meeting.roomName = "Meeting_" + meeting.id;
        saveMeetings();
    }

    window.location.href = "../meetingzoom/meetingzoom.html?room=" + encodeURIComponent(meeting.roomName);
}
//date
function formatDate(date) {
    if (!date) return "-";
    let parts = date.split("-");
    let value = new Date(parts[0], parts[1] - 1, parts[2]);
    return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
//time
function formatTime(time) {
    if (!time) return "-";
    let parts = time.split(":");
    let hour = Number(parts[0]);
    let period = hour >= 12 ? "PM" : "AM";
    return (hour % 12 || 12) + ":" + parts[1] + " " + period;
}

if (ensureEmployeeSession()) loadEmployees();

window.MASAR_BASE_PATH = "../../NADA/home/";

// css
function syncSharedTheme() {
    let dark = false;
    try {
        dark = (localStorage.getItem("journey-theme") || localStorage.getItem("theme")) === "dark";
    } catch (_) {}
    let root = document.documentElement;
    if (dark) root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    let button = document.getElementById("themeToggle");
    let label = document.getElementById("themeLabel");
    if (button) button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    if (label) label.textContent = dark ? "Light" : "Dark";
}

window.addEventListener("storage", function (event) {
    if (event.key === "currentUser" || event.key === null) {
        if (!ensureEmployeeSession()) return;
        let name = document.getElementById("userName");
        if (name) name.textContent = getCurrentUser()?.name || "Employee";
    }
    if (event.key === "journey-theme" || event.key === null) syncSharedTheme();
});

syncSharedTheme();
