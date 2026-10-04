let Meetings = [];
let Employees = [];
let hr = null;
let hrEmail = "maya.nasser@company.com";
let form = document.getElementById("requestMeetingForm");
let modal = document.getElementById("requestFormContainer");

// معرفة الموظف اللي عامل تسجيل دخول.
function getUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUser"));
    } catch (error) {
        return null;
    }
}
// معرفة الايدي للموظف اللي عامل تسجيل دخول.
function getId() {
    let user = getUser();
    if (!user || user.role !== "employee") return null;
    let id = Number(user.id);
    if (Number.isInteger(id) && id > 0) return id;
    return null;
}
let empId = getId();
function checkLogin() {
    let id = getId();
    if (id === null) {
        window.location.href = "../../GAITH/login.html";
        return false;
    }
    if (id !== empId) {
        window.location.reload();
        return false;
    }
    return true;
}

// قراءة JSON وتحديد HR اللي رح يستقبل الطلب.
async function loadData() {
    let button = document.getElementById("sendRequestButton");
    button.disabled = true;
    try {
        let saved = JSON.parse(localStorage.getItem("Employees"));
        if (Array.isArray(saved)) Employees = saved;
    } catch (error) {
        Employees = [];
    }
    try {
        let response = await fetch("../../jsonFiles/Users.json");
        if (!response.ok) throw new Error("Users.json could not be loaded");
        let users = await response.json();
        if (!Array.isArray(users)) throw new Error("Invalid user directory");
        let managers = users.filter(function (user) {
            return user.role === "hr" && (user.email || "").toLowerCase() === hrEmail;
        });
        hr = managers[0] || null;
        if (Employees.length === 0) {
            Employees = users;
            localStorage.setItem("Employees", JSON.stringify(users));
        }
    } catch (error) {
        console.error("Error loading meeting directory:", error);
    }
    button.disabled = false;
    if (!checkLogin()) return;
    try {
        let saved = JSON.parse(localStorage.getItem("Meetings"));
        if (Array.isArray(saved)) Meetings = saved;
    } catch (error) {
        console.error("Unable to read meetings:", error);
    }
    displayMeet();
    displayReq();
}
function saveData() {
    localStorage.setItem("Meetings", JSON.stringify(Meetings));
}
function getMeet(id) {
    for (let meet of Meetings) {
        if (meet.id === id) return meet;
    }
    return null;
}
function getReply(meet) {
    if (!meet.responses) meet.responses = [];
    for (let reply of meet.responses) {
        if (reply.employeeId === empId) return reply;
    }
    return null;
}

// فتح نموذج الطلب وإرساله بنفس بيانات التخزين السابقة.
function openForm() {
    if (!checkLogin()) return;
    form.reset();
    modal.hidden = false;
}
function closeForm() {
    modal.hidden = true;
}
function sendReq(event) {
    event.preventDefault();
    if (!checkLogin()) return;
    if (!hr) {
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
        requestedBy: empId,
        hrManagerId: hr.id,
        participants: [empId, hr.id],
        status: "Pending",
        hrMessage: "",
        roomName: "EmployeeMeeting_" + id,
        responses: []
    });
    saveData();
    displayReq();
    closeForm();
}

// عرض دعوات الموظف واجتماعاته المقبولة.
function displayMeet() {
    let inviteBox = document.getElementById("invitationsContainer");
    let meetBox = document.getElementById("upcomingMeetingsContainer");
    inviteBox.innerHTML = "";
    meetBox.innerHTML = "";
    for (let meet of Meetings) {
        let accepted = false;
        if (meet.createdBy === "HR" && meet.participants && meet.participants.includes(empId)) {
            let reply = getReply(meet);
            if (!reply || reply.status === "Pending") {
                let message = "";
                if (reply) message = reply.message;
                let content = `
                    ${msg("Your message:", message)}
                    <div class="response-area">
                        <label>Message to HR (optional)</label>
                        <textarea id="employeeMessage-${meet.id}" placeholder="Add a message or explain if the time does not work..."></textarea>
                    </div>
                    <div class="card-actions">
                        <button class="accept-button" onclick="replyMeet(${meet.id}, 'Accepted')">Accept</button>
                        <button class="reject-button" onclick="replyMeet(${meet.id}, 'Rejected')">Reject</button>
                    </div>`;
                inviteBox.appendChild(card(meet, "Pending", content));
            }
            if (reply && reply.status === "Accepted") accepted = true;
        }
        if (meet.createdBy === "Employee" && meet.requestedBy === empId) {
            if (meet.status === "Accepted") accepted = true;
        }
        if (accepted) {
            let button = `<div class="card-actions">
                <button class="join-button" onclick="joinMeet(${meet.id})">Join Meeting</button></div>`;
            meetBox.appendChild(card(meet, "Confirmed", button));
        }
    }
    if (inviteBox.innerHTML === "") inviteBox.innerHTML = '<p class="empty-message">You have no pending meeting invitations.</p>';
    if (meetBox.innerHTML === "") meetBox.innerHTML = '<p class="empty-message">You have no confirmed upcoming meetings.</p>';
}

// عرض الطلبات اللي بعثها الموظف إلى HR.
function displayReq() {
    let box = document.getElementById("myRequestsContainer");
    box.innerHTML = "";
    let requests = Meetings.filter(function (meet) {
        return meet.createdBy === "Employee" && meet.requestedBy === empId;
    });
    for (let meet of requests) {
        box.appendChild(card(meet, meet.status, msg("HR Message:", meet.hrMessage)));
    }
    if (requests.length === 0) box.innerHTML = '<p class="empty-message">You have not requested any meetings.</p>';
}

// بطاقة الاجتماع  
function card(meet, status, content) {
    let box = document.createElement("div");
    box.className = "meeting-card";
    let color = "status-pending";
    if (status === "Accepted" || status === "Confirmed") color = "status-accepted";
    if (status === "Rejected") color = "status-rejected";
    let notes = "";
    if (meet.notes) notes = `<div class="notes-preview">${meet.notes}</div>`;
    box.innerHTML = `
        <div class="meeting-card-header">
            <h3>${meet.title}</h3><span class="status ${color}">${status}</span>
        </div>
        <div class="meeting-details">
            <p class="meeting-info"><strong>Date</strong><span>${showDate(meet.date)}</span></p>
            <p class="meeting-info"><strong>Time</strong><span>${showTime(meet.time)}</span></p>
            ${notes}
        </div>
        ${content}`;
    return box;
}
function msg(label, text) {
    if (!text) return "";
    return `<div class="hr-message"><strong>${label}</strong><p>${text}</p></div>`;
}

// قبول أو رفض الدعوة، مع تأكيد قبل الرفض.
function replyMeet(id, status) {
    if (!checkLogin()) return;
    let meet = getMeet(id);
    if (!meet) return;
    if (status === "Rejected" && !confirm("Are you sure you want to reject this meeting?")) return;
    let message = document.getElementById("employeeMessage-" + id).value.trim();
    let reply = getReply(meet);
    if (!reply) {
        reply = { employeeId: empId };
        meet.responses.push(reply);
    }
    reply.status = status;
    reply.message = message;
    saveData();
    displayMeet();
}
function joinMeet(id) {
    if (!checkLogin()) return;
    let meet = getMeet(id);
    if (!meet) return;
    if (!meet.roomName) {
        meet.roomName = "Meeting_" + meet.id;
        saveData();
    }
    window.location.href = "../meetingzoom/meetingzoom.html?room=" + encodeURIComponent(meet.roomName);
}

// تنسيق التاريخ والوقت للعرض فقط.
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

// تحديث الثيم حسب الاختيار المحفوظ.
function setTheme() {
    let dark = false;
    try {
        dark = localStorage.getItem("journey-theme") === "dark";
    } catch (error) {
        console.error("Unable to read theme:", error);
    }
    let root = document.documentElement;
    if (dark) root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    let button = document.getElementById("themeToggle");
    let label = document.getElementById("themeLabel");
    let buttonText = "Switch to dark theme";
    let text = "Dark";
    if (dark) {
        buttonText = "Switch to light theme";
        text = "Light";
    }
    if (button) button.setAttribute("aria-label", buttonText);
    if (label) label.textContent = text;
}

form.addEventListener("submit", sendReq);
window.addEventListener("storage", function (event) {
    if (event.key === "currentUser" || event.key === null) {
        if (!checkLogin()) return;
        let name = document.getElementById("userName");
        let user = getUser();
        if (name && user) name.textContent = user.name || "Employee";
    }
    if (event.key === "journey-theme" || event.key === null) setTheme();
});
window.MASAR_BASE_PATH = "../../NADA/home/";
setTheme();
if (checkLogin()) loadData();
