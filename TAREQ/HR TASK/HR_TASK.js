// HR_TASK.js
// MASAR HR Task Management (simple version)

/* 1) VARIABLES */
let tasks = [];
let employees = [];
let selectedTaskId = null;
let currentHR = null;
let currentHRId = null;
let lastTasksSnapshot = "";

const USERS_JSON_PATH = "../../jsonFiles/Users.json";
const LOGIN_PAGE = "/GAITH/login.html";


/*   2) FUNCTIONS */

/*  Current HR user  */

// Get the logged in user from localStorage
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUser"));
    } catch (error) {
        return null;
    }
}

// Only HR or admin can open this page
function validateHRAccess() {
    if (!currentHR || !currentHR.id) {
        alert("Please login first.");
        window.location.href = LOGIN_PAGE;
        return false;
    }

    const role = String(currentHR.role || "").trim().toLowerCase();

    if (role !== "hr" && role !== "admin") {
        alert("Access denied. HR access only.");
        window.location.href = LOGIN_PAGE;
        return false;
    }

    return true;
}

// HR name (first value that exists)
function getHRName() {
    return currentHR.name || currentHR.fullName || currentHR.username || currentHR.email || "HR User";
}

// Dark mode: read saved theme and keep body class in sync
function setupDarkMode() {
    const savedTheme = localStorage.getItem("theme") || localStorage.getItem("journey-theme");

    if (savedTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        document.body.classList.add("dark-mode");
    } else {
        document.documentElement.removeAttribute("data-theme");
        document.body.classList.remove("dark-mode");
    }

    // When data-theme changes, update the body class
    const observer = new MutationObserver(function () {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        document.body.classList.toggle("dark-mode", isDark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}


/*  Local Storage  */

// Read tasks from localStorage
function getTasksFromStorage() {
    try {
        return JSON.parse(localStorage.getItem("tasks")) || [];
    } catch (error) {
        return [];
    }
}

// Load tasks and update late tasks
function loadTasks() {
    tasks = getTasksFromStorage();
    applyTimeoutStatus();
    lastTasksSnapshot = localStorage.getItem("tasks") || "[]";
}

// Save tasks and tell other pages
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    lastTasksSnapshot = localStorage.getItem("tasks") || "[]";
    window.dispatchEvent(new Event("tasksUpdated"));
}

// Redraw filters, table and dashboard
function refreshPageData() {
    loadFilters();
    displayTasks();
    updateDashboard();
}

// If the deadline passed, change status to "Time Out"
function applyTimeoutStatus() {
    let changed = false;

    for (const task of tasks) {
        const status = normalizeStatus(task.status);

        if (status === "Completed" || status === "Submitted" || status === "Time Out") {
            continue;
        }

        if (!task.deadline) {
            continue;
        }

        // (an invalid date gives false here, so it is skipped)
        if (new Date() > new Date(task.deadline)) {
            task.status = "Time Out";
            task.updatedAt = getNow();
            task.notification = "Task became Time Out";
            changed = true;
        }
    }

    if (changed) {
        saveTasks();
    }
}

// Check every 1.5 seconds if tasks changed in another page
function setupStorageSync() {
    setInterval(function () {
        const currentSnapshot = localStorage.getItem("tasks") || "[]";

        if (currentSnapshot !== lastTasksSnapshot) {
            loadTasks();
            refreshPageData();
        }
    }, 1500);
}


/*  Small helpers  */

function getNow() {
    return new Date().toISOString();
}

function normalizeStatus(status) {
    return String(status || "New").trim();
}

function normalizePriority(priority) {
    return String(priority || "Medium").trim();
}

// "Time Out" -> "time-out" (used as css class)
function getStatusClass(status) {
    return normalizeStatus(status).toLowerCase().replaceAll(" ", "-");
}

// Protect the page from HTML code inside text
function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getTaskById(taskId) {
    return tasks.find(function (task) {
        return Number(task.id) === Number(taskId);
    });
}

function generateTaskId(employeeId, index) {
    return Date.now() * 1000 + Number(employeeId) + index;
}

function generateTaskGroupId() {
    return Date.now();
}

// Only the tasks created by the current HR
function getHRTasks() {
    return tasks.filter(function (task) {
        return Number(task.createdByHRId) === Number(currentHRId) ||
               Number(task.createdBy) === Number(currentHRId);
    });
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
}

// Convert a date to the format of <input type="datetime-local">
function toDateTimeLocal(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return "";
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
}

// Set the value of an input (if it exists)
function setValue(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.value = value || "";
    }
}

// Get the value of an input (empty text if not found)
function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : "";
}

function setHTML(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.innerHTML = value;
    }
}

function setCounter(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

// Name of the first selected file in a file input
function getFileName(id) {
    const input = document.getElementById(id);
    return input && input.files.length > 0 ? input.files[0].name : "";
}

function showModal(modalId, label) {
    const modalElement = document.getElementById(modalId);

    if (!modalElement) {
        showPopup(`${label} modal not found. Check id='${modalId}'.`, "error");
        return;
    }

    if (!window.bootstrap) {
        showPopup("Bootstrap is not loaded.", "error");
        return;
    }

    bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

function hideModal(modalId) {
    const modalElement = document.getElementById(modalId);

    if (!modalElement || !window.bootstrap) {
        return;
    }

    const modal = bootstrap.Modal.getInstance(modalElement);

    if (modal) {
        modal.hide();
    }
}


/*  Employees from JSON  */

function loadEmployees() {
    fetch(USERS_JSON_PATH)
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Users.json not found: " + USERS_JSON_PATH);
            }
            return response.json();
        })
        .then(function (users) {
            // The file can be an array, or an object that has "users"
            const usersList = Array.isArray(users) ? users : (users.users || []);

            // Keep only active employees
            employees = usersList.filter(function (user) {
                const role = String(user.role || "").trim().toLowerCase();
                const status = String(user.status || "active").trim().toLowerCase();
                return role === "employee" && status === "active";
            });

            renderEmployeeMultiSelect("employeeList", []);
            refreshPageData();
            setupStorageSync();
        })
        .catch(function (error) {
            console.error("Users.json Error:", error);
            employees = [];

            renderEmployeeMultiSelect("employeeList", []);
            refreshPageData();
        });
}

function getEmployeeById(employeeId) {
    return employees.find(function (employee) {
        return Number(employee.id) === Number(employeeId);
    });
}

function getEmployeeNameById(employeeId) {
    const employee = getEmployeeById(employeeId);
    return employee ? employee.name : "Unknown";
}


/*  Employees multi select (checkboxes)  */

// Text shown on the dropdown button
function getSelectedSummary(selectedIds) {
    if (selectedIds.length === 0) {
        return "Select Employees";
    }

    if (selectedIds.length === employees.length) {
        return "All Employees";
    }

    if (selectedIds.length === 1) {
        const employee = getEmployeeById(selectedIds[0]);
        return employee ? employee.name : "1 Employee";
    }

    return `${selectedIds.length} Employees Selected`;
}

// Draw the dropdown inside the container
function renderEmployeeMultiSelect(containerId, selectedIds) {
    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }

    // Make sure all ids are numbers
    const ids = selectedIds.map(function (id) {
        return Number(id);
    });

    // One checkbox for each employee
    let optionsHTML = "";
    for (const employee of employees) {
        const checked = ids.includes(Number(employee.id));

        optionsHTML += `
            <label class="employee-option">
                <input type="checkbox" class="employee-check" value="${employee.id}"
                    ${checked ? "checked" : ""}
                    onchange="updateEmployeeSelectSummary('${containerId}')">
                <span>${escapeHTML(employee.name)}</span>
            </label>`;
    }

    const allChecked = employees.length > 0 && ids.length === employees.length;

    container.innerHTML = `
        <div class="employee-select-wrapper">
            <button type="button" class="employee-select-control"
                onclick="toggleEmployeeDropdown('${containerId}', event)">
                <span id="${containerId}_summary">${getSelectedSummary(ids)}</span>
                <span class="employee-select-arrow"></span>
            </button>

            <div class="employee-select-dropdown" id="${containerId}_menu">
                <label class="employee-option select-all-option">
                    <input type="checkbox" ${allChecked ? "checked" : ""}
                        onchange="toggleAllEmployees('${containerId}', this.checked)">
                    <span>Select All Employees</span>
                </label>

                <div class="employee-options-list">${optionsHTML}</div>
            </div>
        </div>`;
}

// Open / close one dropdown (and close the others)
function toggleEmployeeDropdown(containerId, event) {
    if (event) {
        event.stopPropagation();
    }

    const menus = document.querySelectorAll(".employee-select-dropdown");
    for (const menu of menus) {
        if (menu.id !== `${containerId}_menu`) {
            menu.classList.remove("show");
        }
    }

    const menu = document.getElementById(`${containerId}_menu`);

    if (!menu) {
        return;
    }

    menu.classList.toggle("show");
}

// Check or uncheck all employees
function toggleAllEmployees(containerId, checked) {
    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }

    const checkboxes = container.querySelectorAll(".employee-check");
    for (const checkbox of checkboxes) {
        checkbox.checked = checked;
    }

    updateEmployeeSelectSummary(containerId);
}

// Update the text of the dropdown button
function updateEmployeeSelectSummary(containerId) {
    const summary = document.getElementById(`${containerId}_summary`);

    if (!summary) {
        return;
    }

    summary.textContent = getSelectedSummary(getSelectedEmployees(containerId));
}

// Get the ids of the checked employees
function getSelectedEmployees(containerId) {
    const container = document.getElementById(containerId);

    if (!container) {
        return [];
    }

    const result = [];
    const checkedBoxes = container.querySelectorAll(".employee-check:checked");

    for (const checkbox of checkedBoxes) {
        result.push(Number(checkbox.value));
    }

    return result;
}


/*  Popups  */

// Small message at the screen (success / error / info)
function showPopup(message, type = "success") {
    let popup = document.getElementById("actionPopup");

    if (!popup) {
        popup = document.createElement("div");
        popup.id = "actionPopup";
        document.body.appendChild(popup);
    }

    popup.className = `action-popup ${type}`;
    popup.textContent = message;
    popup.classList.add("show");

    setTimeout(function () {
        popup.classList.remove("show");
    }, 2500);
}

// Confirm box. Gives true if the user clicks OK, false otherwise
function showConfirmPopup(options) {
    const overlay = document.getElementById("customConfirmOverlay");
    const icon = document.getElementById("customConfirmIcon");
    const title = document.getElementById("customConfirmTitle");
    const message = document.getElementById("customConfirmMessage");
    const cancelBtn = document.getElementById("customConfirmCancel");
    const okBtn = document.getElementById("customConfirmOk");

    if (!overlay || !icon || !title || !message || !cancelBtn || !okBtn) {
        return Promise.resolve(false);
    }

    title.textContent = options.title || "Are you sure?";
    message.textContent = options.message || "Please confirm this action.";
    okBtn.textContent = options.confirmText || "Confirm";
    cancelBtn.textContent = options.cancelText || "Cancel";

    icon.className = "custom-confirm-icon";
    okBtn.className = "custom-confirm-ok";

    if (options.type === "danger") {
        icon.classList.add("danger");
        okBtn.classList.add("danger");
        icon.innerHTML = `<i class="bi bi-trash3"></i>`;
    } else if (options.type === "warning") {
        icon.classList.add("warning");
        icon.innerHTML = `<i class="bi bi-exclamation-triangle"></i>`;
    } else {
        icon.classList.add("success");
        icon.innerHTML = `<i class="bi bi-check2-circle"></i>`;
    }

    overlay.classList.add("show");

    return new Promise(function (resolve) {
        function closePopup(result) {
            overlay.classList.remove("show");
            resolve(result);
        }

        okBtn.onclick = function () {
            closePopup(true);
        };

        cancelBtn.onclick = function () {
            closePopup(false);
        };

        // Click outside the box = cancel
        overlay.onclick = function (event) {
            if (event.target === overlay) {
                closePopup(false);
            }
        };
    });
}


/*  Validation  */

// Remove all red error messages
function clearFieldErrors() {
    for (const error of document.querySelectorAll(".field-error")) {
        error.remove();
    }

    for (const input of document.querySelectorAll(".input-error")) {
        input.classList.remove("input-error");
    }
}

// Show a red error message under a field
function setFieldError(elementId, message) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.classList.add("input-error");

    const error = document.createElement("div");
    error.className = "field-error";
    error.textContent = message;

    element.insertAdjacentElement("afterend", error);
}

function validateCreateTaskForm() {
    clearFieldErrors();

    let isValid = true;

    const title = getValue("taskTitleInput").trim();
    const description = getValue("taskDescriptionInput").trim();
    const priority = getValue("taskPriorityInput");
    const deadlineDate = getValue("deadlineDate");
    const deadlineTime = getValue("deadlineTime");
    const selectedEmployees = getSelectedEmployees("employeeList");

    if (title === "") { setFieldError("taskTitleInput", "Task title is required."); isValid = false; }
    if (description === "") { setFieldError("taskDescriptionInput", "Task description is required."); isValid = false; }
    if (priority === "") { setFieldError("taskPriorityInput", "Please select task priority."); isValid = false; }
    if (deadlineDate === "") { setFieldError("deadlineDate", "Deadline date is required."); isValid = false; }
    if (deadlineTime === "") { setFieldError("deadlineTime", "Deadline time is required."); isValid = false; }
    if (selectedEmployees.length === 0) { setFieldError("employeeList", "Please assign at least one employee."); isValid = false; }

    // Check the full deadline (date + time)
    if (deadlineDate !== "" && deadlineTime !== "") {
        const deadline = new Date(`${deadlineDate}T${deadlineTime}`);

        if (isNaN(deadline.getTime())) {
            setFieldError("deadlineDate", "Please select a valid deadline.");
            setFieldError("deadlineTime", "Please select a valid deadline.");
            isValid = false;
        } else if (deadline < new Date()) {
            setFieldError("deadlineDate", "Deadline cannot be in the past.");
            setFieldError("deadlineTime", "Deadline cannot be in the past.");
            isValid = false;
        }
    }

    return isValid;
}

function validateEditTaskForm() {
    clearFieldErrors();

    let isValid = true;

    const title = getValue("editTitle").trim();
    const description = getValue("editDescription").trim();
    const priority = getValue("editPriority");
    const deadlineValue = getValue("editDeadline");
    const selectedEmployees = getSelectedEmployees("editEmployeeList");

    if (title === "") { setFieldError("editTitle", "Task title is required."); isValid = false; }
    if (description === "") { setFieldError("editDescription", "Task description is required."); isValid = false; }
    if (priority === "") { setFieldError("editPriority", "Please select task priority."); isValid = false; }
    if (deadlineValue === "") { setFieldError("editDeadline", "Deadline is required."); isValid = false; }
    if (selectedEmployees.length === 0) { setFieldError("editEmployeeList", "Please assign one employee."); isValid = false; }
    if (selectedEmployees.length > 1) { setFieldError("editEmployeeList", "Select one employee only in edit mode."); isValid = false; }

    if (deadlineValue !== "" && isNaN(new Date(deadlineValue).getTime())) {
        setFieldError("editDeadline", "Please select a valid deadline.");
        isValid = false;
    }

    return isValid;
}


/*  Create task  */

async function createTask() {
    if (!validateCreateTaskForm()) {
        showPopup("Please complete the required fields.", "error");
        return;
    }

    const confirmCreate = await showConfirmPopup({
        title: "Create Task?",
        message: "Are you sure you want to create this task?",
        confirmText: "Create",
        cancelText: "Cancel",
        type: "success"
    });

    if (!confirmCreate) {
        showPopup("Create task cancelled.", "info");
        return;
    }

    const selectedEmployees = getSelectedEmployees("employeeList");
    const title = getValue("taskTitleInput").trim();
    const description = getValue("taskDescriptionInput").trim();
    const priority = getValue("taskPriorityInput") || "Medium";
    const deadline = new Date(`${getValue("deadlineDate")}T${getValue("deadlineTime")}`);
    const taskFile = getFileName("taskFile");
    const taskImage = getFileName("taskImage");
    const groupId = generateTaskGroupId();

    // One task card for each selected employee
    for (let i = 0; i < selectedEmployees.length; i++) {
        const employeeId = selectedEmployees[i];
        const employee = getEmployeeById(employeeId);
        const employeeName = employee ? employee.name : "Unknown";

        const task = {
            id: generateTaskId(employeeId, i),
            taskGroupId: groupId,
            groupId: groupId,

            title: title,
            description: description,
            priority: priority,
            deadline: deadline.toISOString(),

            employeeId: Number(employeeId),
            employeeName: employeeName,
            assignedEmployees: [Number(employeeId)],
            assignedEmployeeNames: [employeeName],

            createdBy: Number(currentHRId),
            createdByHRId: Number(currentHRId),
            createdByHRName: getHRName(),
            createdByHREmail: currentHR.email || "",

            createdAt: getNow(),
            updatedAt: getNow(),

            status: "New",
            taskFile: taskFile,
            taskImage: taskImage,

            submission: null,
            hrFeedback: "",
            notification: "New task assigned by HR",

            history: [
                {
                    message: "Task created by HR.",
                    hrId: currentHRId,
                    hrName: getHRName(),
                    date: getNow()
                }
            ]
        };

        tasks.push(task);
    }

    saveTasks();
    clearCreateForm();
    refreshPageData();
    hideModal("createModal");

    showPopup("Task created successfully.", "success");
}

// Clear the create form
function clearCreateForm() {
    const ids = ["taskTitleInput", "taskDescriptionInput", "deadlineDate", "deadlineTime", "taskFile", "taskImage"];

    for (const id of ids) {
        setValue(id, "");
    }

    renderEmployeeMultiSelect("employeeList", []);
}

// Reset the create form (NOT used in this file - delete it if your HTML does not call it)
function resetCreateTaskForm() {
    const ids = ["taskTitleInput", "taskDescriptionInput", "taskPriorityInput", "deadlineDate", "deadlineTime", "taskFile", "taskImage"];

    for (const id of ids) {
        setValue(id, "");
    }

    const checkboxes = document.querySelectorAll("#employeeList input[type='checkbox']");
    for (const checkbox of checkboxes) {
        checkbox.checked = false;
    }
}


/*  Filters  */

// Fill the two filters (employees and task titles)
function loadFilters() {
    const employeeFilter = document.getElementById("employeeFilter");
    const taskFilter = document.getElementById("taskFilter");
    const hrTasks = getHRTasks();

    // Remember what the user selected before
    const selectedEmployee = employeeFilter ? employeeFilter.value : "";
    const selectedTask = taskFilter ? taskFilter.value : "";

    if (employeeFilter) {
        // Employee ids without repeating
        const employeeIds = [];
        for (const task of hrTasks) {
            const id = Number(task.employeeId);
            if (id && !employeeIds.includes(id)) {
                employeeIds.push(id);
            }
        }

        employeeFilter.innerHTML = `<option value="">All Employees</option>`;
        for (const id of employeeIds) {
            employeeFilter.innerHTML += `<option value="${id}">${escapeHTML(getEmployeeNameById(id))}</option>`;
        }

        selectIfExists(employeeFilter, selectedEmployee);
    }

    if (taskFilter) {
        // If an employee is selected, show only his tasks
        let filteredForEmployee = hrTasks;
        if (selectedEmployee) {
            filteredForEmployee = hrTasks.filter(function (task) {
                return Number(task.employeeId) === Number(selectedEmployee);
            });
        }

        // Task titles without repeating
        const titles = [];
        for (const task of filteredForEmployee) {
            if (task.title && !titles.includes(task.title)) {
                titles.push(task.title);
            }
        }

        taskFilter.innerHTML = `<option value="">All Tasks</option>`;
        for (const title of titles) {
            taskFilter.innerHTML += `<option value="${escapeHTML(title)}">${escapeHTML(title)}</option>`;
        }

        selectIfExists(taskFilter, selectedTask);
    }
}

// Select the option only if it exists in the list
function selectIfExists(select, value) {
    for (const option of select.options) {
        if (option.value === value) {
            select.value = value;
        }
    }
}

// Tasks after applying the filters, then sorted
function getFilteredTasks() {
    let result = getHRTasks();
    const employeeFilter = getValue("employeeFilter");
    const taskFilter = getValue("taskFilter");

    if (employeeFilter) {
        result = result.filter(function (task) {
            return Number(task.employeeId) === Number(employeeFilter);
        });
    }

    if (taskFilter) {
        result = result.filter(function (task) {
            return task.title === taskFilter;
        });
    }

    return result.sort(sortHRTasks);
}


/*  Sort  */

// Smaller number = shown first
function getStatusWeight(status) {
    const weights = {
        "Submitted": 1,
        "In Progress": 2,
        "New": 3,
        "Pending": 3,
        "Not Complete": 4,
        "Completed": 5,
        "Time Out": 6
    };

    return weights[normalizeStatus(status)] || 99;
}

function getPriorityWeight(priority) {
    const value = normalizePriority(priority).toLowerCase();

    if (value === "high") { return 1; }
    if (value === "medium") { return 2; }
    if (value === "low") { return 3; }

    return 4;
}

function getDeadlineTime(task) {
    const deadline = new Date(task.deadline);

    if (isNaN(deadline.getTime())) {
        return Number.MAX_SAFE_INTEGER;
    }

    return deadline.getTime();
}

// Sort by status, then priority, then deadline
function sortHRTasks(a, b) {
    const statusDiff = getStatusWeight(a.status) - getStatusWeight(b.status);
    if (statusDiff !== 0) {
        return statusDiff;
    }

    const priorityDiff = getPriorityWeight(a.priority) - getPriorityWeight(b.priority);
    if (priorityDiff !== 0) {
        return priorityDiff;
    }

    return getDeadlineTime(a) - getDeadlineTime(b);
}


/*  Display tasks  */

function displayTasks() {
    const table = document.getElementById("tasksTable");

    if (!table) {
        return;
    }

    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        table.innerHTML = `<tr><td colspan="6" class="text-center py-4">No tasks found.</td></tr>`;
        return;
    }

    let rows = "";

    for (const task of filteredTasks) {
        const status = normalizeStatus(task.status);
        const employeeName = task.employeeName || getEmployeeNameById(task.employeeId);

        rows += `
            <tr class="${status === "Blocked" ? "blocked-row" : ""}">
                <td><b>${escapeHTML(task.title)}</b><br><small>${escapeHTML(task.description)}</small></td>
                <td>${escapeHTML(employeeName)}</td>
                <td>${escapeHTML(normalizePriority(task.priority))}</td>
                <td>${formatDateTime(task.deadline)}</td>
                <td><span class="status-badge ${getStatusClass(status)}">${escapeHTML(status)}</span></td>
                <td>${buildTaskActions(task)}</td>
            </tr>`;
    }

    table.innerHTML = rows;
}

// View / Edit / Delete buttons
function buildTaskActions(task) {
    return `
        <button class="btn btn-primary btn-sm" onclick="viewTask(${task.id})">View</button>
        <button class="btn btn-warning btn-sm" onclick="openEdit(${task.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})">Delete</button>`;
}


/*  View / Review  */

function viewTask(id) {
    selectedTaskId = Number(id);

    const task = getTaskById(selectedTaskId);

    if (!task) {
        showPopup("Task not found.", "error");
        return;
    }

    const submission = task.submission;

    setHTML("viewTaskTitle", escapeHTML(task.title));
    setHTML("viewTaskDescription", escapeHTML(task.description));
    setHTML("viewTaskEmployees", `<b>Employee:</b> ${escapeHTML(task.employeeName || "Unknown")}`);

    setHTML("submittedEmployee", submission ? escapeHTML(submission.employeeName) : "Not Submitted");
    setHTML("submittedDate", submission ? formatDateTime(submission.date) : "-");
    setHTML("submittedSolution", submission ? escapeHTML(submission.solution || "No Solution") : "No Solution");

    setHTML("taskCreatedDate", formatDateTime(task.createdAt));
    setHTML("taskUpdatedDate", formatDateTime(task.updatedAt));
    setHTML("submittedFile", (submission && submission.file) || "No File");
    setHTML("submittedImage", (submission && submission.image) || "No Image");

    setValue("hrFeedback", task.hrFeedback);

    showModal("viewTaskModal", "View");
}

// Does the task have a solution, a file or an image?
function hasValidSubmission(task) {
    if (!task || !task.submission) {
        return false;
    }

    const submission = task.submission;

    return String(submission.solution || "").trim() !== "" ||
           String(submission.file || "").trim() !== "" ||
           String(submission.image || "").trim() !== "";
}

// HR approves the task
function approveTask() {
    const task = getTaskById(selectedTaskId);

    if (!task) {
        return;
    }

    if (!hasValidSubmission(task)) {
        alert("This task has no valid submission yet.");
        return;
    }

    task.status = "Completed";
    task.notification = "Approved by HR";
    task.approvedByHRId = currentHRId;
    task.approvedByHRName = getHRName();
    task.approvedAt = getNow();
    task.updatedAt = getNow();

    saveTasks();
    refreshPageData();
    hideModal("viewTaskModal");
}

// HR asks the employee to change the work
function requestChanges() {
    const task = getTaskById(selectedTaskId);

    if (!task) {
        return;
    }

    const feedback = getValue("hrFeedback").trim();

    if (feedback === "") {
        alert("Enter feedback.");
        return;
    }

    task.status = "Not Complete";
    task.hrFeedback = feedback;
    task.notification = "HR requested changes";
    task.updatedAt = getNow();

    saveTasks();
    refreshPageData();
    hideModal("viewTaskModal");
}


/*  Edit task (one employee only)  */

function openEdit(id) {
    selectedTaskId = Number(id);

    const task = getTaskById(selectedTaskId);

    if (!task) {
        showPopup("Task not found.", "error");
        return;
    }

    setValue("editTitle", task.title);
    setValue("editDescription", task.description);
    setValue("editPriority", task.priority);
    setValue("editDeadline", toDateTimeLocal(task.deadline));

    renderEmployeeMultiSelect("editEmployeeList", [Number(task.employeeId)]);

    showModal("editModal", "Edit");
}

async function saveEditTask() {
    const task = getTaskById(selectedTaskId);

    if (!task) {
        showPopup("Task not found.", "error");
        return;
    }

    if (!validateEditTaskForm()) {
        showPopup("Please complete the required fields.", "error");
        return;
    }

    const confirmEdit = await showConfirmPopup({
        title: "Save Changes?",
        message: "Are you sure you want to update this task?",
        confirmText: "Save",
        cancelText: "Cancel",
        type: "warning"
    });

    if (!confirmEdit) {
        showPopup("Edit task cancelled.", "info");
        return;
    }

    const title = getValue("editTitle").trim();
    const description = getValue("editDescription").trim();
    const priority = getValue("editPriority");
    const deadline = new Date(getValue("editDeadline"));
    const selectedEmployeeId = Number(getSelectedEmployees("editEmployeeList")[0]);

    const oldEmployeeId = Number(task.employeeId);
    const groupId = task.taskGroupId || task.groupId || task.id;

    // The same employee cannot have the same task twice
    const duplicateTask = tasks.find(function (item) {
        const itemGroupId = item.taskGroupId || item.groupId || item.id;

        return Number(item.id) !== Number(task.id) &&
               Number(itemGroupId) === Number(groupId) &&
               Number(item.employeeId) === selectedEmployeeId;
    });

    if (duplicateTask) {
        setFieldError("editEmployeeList", "This employee already has this task.");
        showPopup("This employee already has a card for this task.", "error");
        return;
    }

    const employee = getEmployeeById(selectedEmployeeId);
    const employeeName = employee ? employee.name : "Unknown";

    task.title = title;
    task.description = description;
    task.priority = priority;
    task.deadline = deadline.toISOString();

    task.employeeId = selectedEmployeeId;
    task.employeeName = employeeName;
    task.assignedEmployees = [selectedEmployeeId];
    task.assignedEmployeeNames = [employeeName];

    task.updatedAt = getNow();
    task.updatedByHRId = currentHRId;
    task.updatedByHRName = getHRName();
    task.notification = "Task updated by HR";

    // If the employee changed, the task starts again
    if (oldEmployeeId !== selectedEmployeeId) {
        task.status = "New";
        task.submission = null;
        task.hrFeedback = "";
        task.previousStatus = "";
        task.notification = "Task reassigned by HR";
    }

    saveTasks();
    refreshPageData();
    hideModal("editModal");

    showPopup("Task updated successfully.", "success");
}


/*  Delete task  */

async function deleteTask(id) {
    const task = getTaskById(id);

    if (!task) {
        showPopup("Task not found.", "error");
        return;
    }

    const confirmDelete = await showConfirmPopup({
        title: "Delete Task?",
        message: "This task will be removed from HR and employee pages.",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger"
    });

    if (!confirmDelete) {
        showPopup("Delete cancelled.", "info");
        return;
    }

    tasks = tasks.filter(function (item) {
        return Number(item.id) !== Number(id);
    });

    saveTasks();
    refreshPageData();

    showPopup("Task deleted successfully.", "success");
}


/*  Dashboard  */

function updateDashboard() {
    const hrTasks = getHRTasks();

    let newCount = 0;
    let submittedCount = 0;
    let completedCount = 0;
    let overdueCount = 0;

    for (const task of hrTasks) {
        const status = normalizeStatus(task.status);

        if (status === "New" || status === "Pending" || status === "Not Complete") { newCount++; }
        if (status === "Submitted") { submittedCount++; }
        if (status === "Completed") { completedCount++; }
        if (status === "Time Out") { overdueCount++; }
    }

    setCounter("totalTasks", hrTasks.length);
    setCounter("newTasks", newCount);
    setCounter("submittedTasks", submittedCount);
    setCounter("completedTasks", completedCount);
    setCounter("overdueTasks", overdueCount);
}


/*  3) EVENTS */

// Filters: refresh the table when the user changes them
function setupFiltersEvents() {
    const employeeFilter = document.getElementById("employeeFilter");
    const taskFilter = document.getElementById("taskFilter");

    if (employeeFilter) {
        employeeFilter.addEventListener("change", function () {
            loadFilters();
            displayTasks();
        });
    }

    if (taskFilter) {
        taskFilter.addEventListener("change", function () {
            displayTasks();
        });
    }
}

// Close all employee dropdowns when clicking outside
document.addEventListener("click", function () {
    for (const menu of document.querySelectorAll(".employee-select-dropdown")) {
        menu.classList.remove("show");
    }
});

// Functions used inside HTML (onclick="...")
window.createTask = createTask;
window.viewTask = viewTask;
window.approveTask = approveTask;
window.requestChanges = requestChanges;
window.openEdit = openEdit;
window.saveEditTask = saveEditTask;
window.deleteTask = deleteTask;
window.toggleEmployeeDropdown = toggleEmployeeDropdown;
window.toggleAllEmployees = toggleAllEmployees;
window.updateEmployeeSelectSummary = updateEmployeeSelectSummary;


/*   4) FIRST RUN */
document.addEventListener("DOMContentLoaded", function () {
    currentHR = getCurrentUser();

    if (!validateHRAccess()) {
        return;
    }

    currentHRId = Number(currentHR.id);
    setupDarkMode();
    loadTasks();
    loadEmployees();
    setupFiltersEvents();
});