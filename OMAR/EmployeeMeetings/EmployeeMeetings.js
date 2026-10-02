let Meetings = [];
let Employees = [];
let meetingHR = null;
const meetingHREmail = "maya.nasser@company.com";

// Use the signed-in employee for requests, invitations and responses.
function getSignedInEmployeeId() {
    try {
        const user = JSON.parse(localStorage.getItem("currentUser"));
        const id = Number(user?.id);
        return user?.role === "employee" && Number.isInteger(id) && id > 0 ? id : null;
    } catch (_) {
        return null;
    }
}

const currentEmployeeId = getSignedInEmployeeId();

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

function loadEmployees() {
    const submitButton = document.querySelector("#requestMeetingForm button[type='submit']");
    submitButton.disabled = true;
    try {
        const saved = JSON.parse(localStorage.getItem("Employees"));
        Employees = Array.isArray(saved) ? saved : [];
    } catch (_) {
        Employees = [];
    }

    // Resolve the fixed HR recipient from the full directory, even when the
    // employee cache contains employee accounts only.
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

function startPage() {
    Meetings = JSON.parse(localStorage.getItem("Meetings")) || [];
    displayInvitations();
    displayUpcomingMeetings();
    displayMyRequests();
}

function saveMeetings() {
    localStorage.setItem("Meetings", JSON.stringify(Meetings));
}

function getHRManager() {
    return meetingHR;
}

// Request meeting modal.
function showRequestForm() {
    if (!ensureEmployeeSession()) return;
    document.getElementById("requestMeetingForm").reset();
    document.getElementById("requestFormContainer").hidden = false;
}

function hideRequestForm() {
    document.getElementById("requestFormContainer").hidden = true;
}

// Send a meeting request to HR.
document.getElementById("requestMeetingForm").addEventListener("submit", function (event) {
    event.preventDefault();
    if (!ensureEmployeeSession()) return;

    let manager = getHRManager();
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
});

function getEmployeeResponse(meeting) {
    if (!meeting.responses) meeting.responses = [];

    return meeting.responses.find(
        response => response.employeeId === currentEmployeeId
    );
}

function getStatusClass(status) {
    if (status === "Accepted") return "status-accepted";
    if (status === "Rejected") return "status-rejected";
    return "status-pending";
}

// Same information is used in all meeting cards.
function meetingDetails(meeting) {
    return `
        <div class="meeting-details">
            <p class="meeting-info"><strong>Date</strong><span>${formatDate(meeting.date)}</span></p>
            <p class="meeting-info"><strong>Time</strong><span>${formatTime(meeting.time)}</span></p>
            ${meeting.notes ? `<div class="notes-preview">${meeting.notes}</div>` : ""}
        </div>`;
}

function displayInvitations() {
    let container = document.getElementById("invitationsContainer");

    let invitations = Meetings.filter(meeting => {
        if (meeting.createdBy !== "HR") return false;
        if (!meeting.participants || !meeting.participants.includes(currentEmployeeId)) return false;

        let response = getEmployeeResponse(meeting);
        return !response || response.status !== "Accepted";
    });

    if (invitations.length === 0) {
        container.innerHTML = `<p class="empty-message">You have no pending meeting invitations.</p>`;
        return;
    }

    container.innerHTML = "";

    invitations.forEach(meeting => {
        let response = getEmployeeResponse(meeting);
        let status = response ? response.status : "Pending";

        container.innerHTML += `
            <div class="meeting-card">
                <div class="meeting-card-header">
                    <h3>${meeting.title}</h3>
                    <span class="status ${getStatusClass(status)}">${status}</span>
                </div>

                ${meetingDetails(meeting)}

                ${response && response.message ? `
                    <div class="hr-message">
                        <strong>Your message:</strong>
                        <p>${response.message}</p>
                    </div>` : ""}

                <div class="response-area">
                    <label>Message to HR (optional)</label>
                    <textarea id="employeeMessage-${meeting.id}"
                        placeholder="Add a message or explain if the time does not work..."></textarea>
                </div>

                <div class="card-actions">
                    <button class="accept-button" onclick="respondToMeeting(${meeting.id}, 'Accepted')">Accept</button>
                    <button class="reject-button" onclick="respondToMeeting(${meeting.id}, 'Rejected')">Reject</button>
                </div>
            </div>`;
    });
}

function respondToMeeting(id, status) {
    if (!ensureEmployeeSession()) return;
    let meeting = Meetings.find(item => item.id === id);
    if (!meeting) return;

    let message = document.getElementById("employeeMessage-" + id).value.trim();
    let response = getEmployeeResponse(meeting);

    if (response) {
        response.status = status;
        response.message = message;
    } else {
        meeting.responses.push({
            employeeId: currentEmployeeId,
            status: status,
            message: message
        });
    }

    saveMeetings();
    displayInvitations();
    displayUpcomingMeetings();
}

function displayUpcomingMeetings() {
    let container = document.getElementById("upcomingMeetingsContainer");

    let upcoming = Meetings.filter(meeting => {
        if (meeting.createdBy === "HR" &&
            meeting.participants &&
            meeting.participants.includes(currentEmployeeId)) {
            let response = getEmployeeResponse(meeting);
            return response && response.status === "Accepted";
        }

        return meeting.createdBy === "Employee" &&
            meeting.requestedBy === currentEmployeeId &&
            meeting.status === "Accepted";
    });

    if (upcoming.length === 0) {
        container.innerHTML = `<p class="empty-message">You have no confirmed upcoming meetings.</p>`;
        return;
    }

    container.innerHTML = "";

    upcoming.forEach(meeting => {
        container.innerHTML += `
            <div class="meeting-card">
                <div class="meeting-card-header">
                    <h3>${meeting.title}</h3>
                    <span class="status status-accepted">Confirmed</span>
                </div>

                ${meetingDetails(meeting)}

                <div class="card-actions">
                    <button class="join-button" onclick="joinMeeting(${meeting.id})">Join Meeting</button>
                </div>
            </div>`;
    });
}

function displayMyRequests() {
    let container = document.getElementById("myRequestsContainer");

    let requests = Meetings.filter(meeting =>
        meeting.createdBy === "Employee" &&
        meeting.requestedBy === currentEmployeeId
    );

    if (requests.length === 0) {
        container.innerHTML = `<p class="empty-message">You have not requested any meetings.</p>`;
        return;
    }

    container.innerHTML = "";

    requests.forEach(meeting => {
        container.innerHTML += `
            <div class="meeting-card">
                <div class="meeting-card-header">
                    <h3>${meeting.title}</h3>
                    <span class="status ${getStatusClass(meeting.status)}">${meeting.status}</span>
                </div>

                ${meetingDetails(meeting)}

                ${meeting.hrMessage ? `
                    <div class="hr-message">
                        <strong>HR Message:</strong>
                        <p>${meeting.hrMessage}</p>
                    </div>` : ""}
            </div>`;
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

       window.location.href =
        "../meetingzoom/meetingzoom.html?room=" +
        encodeURIComponent(meeting.roomName);
}

function formatDate(date) {
    if (!date) return "-";
    let parts = date.split("-");
    let value = new Date(parts[0], parts[1] - 1, parts[2]);
    return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(time) {
    if (!time) return "-";
    let parts = time.split(":");
    let hour = Number(parts[0]);
    let period = hour >= 12 ? "PM" : "AM";
    return (hour % 12 || 12) + ":" + parts[1] + " " + period;
}

if (ensureEmployeeSession()) loadEmployees();

/* Home navbar, theme and footer behavior for this employee meetings page. */
(function () {
    'use strict';

    const root = document.documentElement;
    const themeButton = document.getElementById('themeToggle');
    const themeLabel = document.getElementById('themeLabel');

    try {
        if (localStorage.getItem('journey-theme') === 'dark') {
            root.setAttribute('data-theme', 'dark');
        }
    } catch (_) {
        // Keep the default theme if browser storage is unavailable.
    }

    function renderTheme() {
        const dark = root.getAttribute('data-theme') === 'dark';
        const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
        themeButton.setAttribute('aria-label', label);
        themeButton.title = label;
        themeLabel.textContent = dark ? 'Light' : 'Dark';
    }

    themeButton.addEventListener('click', function () {
        const dark = root.getAttribute('data-theme') !== 'dark';
        if (dark) root.setAttribute('data-theme', 'dark');
        else root.removeAttribute('data-theme');
        try {
            localStorage.setItem('journey-theme', dark ? 'dark' : 'light');
        } catch (_) {
            // The theme still works for this visit when storage is unavailable.
        }
        renderTheme();
    });

    function renderUser() {
        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('currentUser'));
        } catch (_) {
            // Keep the login link visible when there is no readable session.
        }
        document.getElementById('navAuth').classList.toggle('hidden', !!user);
        document.getElementById('navUser').classList.toggle('hidden', !user);
        document.getElementById('userName').textContent = user?.name || 'Employee';
    }

    // Use the same session cleanup as the existing Home navbar.
    window.logout = function () {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('bridgeway_current_role');
        localStorage.setItem('loggedIn', 'false');
        window.location.reload();
    };

    window.addEventListener('storage', function (event) {
        if (event.key === 'currentUser' || event.key === null) {
            if (!ensureEmployeeSession()) return;
            renderUser();
        }
        if (event.key === 'journey-theme' || event.key === null) {
            if (event.newValue === 'dark') root.setAttribute('data-theme', 'dark');
            else root.removeAttribute('data-theme');
            renderTheme();
        }
    });

    document.getElementById('yr').textContent = new Date().getFullYear();
    renderTheme();
    renderUser();
})();
