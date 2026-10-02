// HR_TASK.js
// MASAR HR Task Management

let tasks = [];
let employees = [];
let selectedTaskId = null;
let currentHR = null;
let currentHRId = null;
let lastTasksSnapshot = "";

const USERS_JSON_PATH = "../../jsonFiles/Users.json";
const LOGIN_PAGE = "/GAITH/login.html";


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    currentHR = getCurrentUser();

    if (!validateHRAccess()) {
        return;
    }

    currentHRId = Number(currentHR.id);

    setupDarkModeFromStorage();
    loadTasks();
    loadEmployees();
    setupFiltersEvents();

});


/* =========================================================
   CURRENT HR FROM LOGIN
========================================================= */

function getCurrentUser() {

    try {
        return JSON.parse(localStorage.getItem("currentUser"));
    } catch (error) {
        return null;
    }

}


function validateHRAccess() {

    if (!currentHR || !currentHR.id) {

        alert("Please login first.");

        window.location.href = LOGIN_PAGE;

        return false;

    }

    const role =
        String(currentHR.role || "")
            .trim()
            .toLowerCase();

    if (role !== "hr" && role !== "admin") {

        alert("Access denied. HR access only.");

        window.location.href = LOGIN_PAGE;

        return false;

    }

    return true;

}


function getHRName() {

    return (
        currentHR.name ||
        currentHR.fullName ||
        currentHR.username ||
        currentHR.email ||
        "HR User"
    );

}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadTasks() {

    tasks = getTasksFromStorage();

    applyTimeoutStatus();

    lastTasksSnapshot =
        localStorage.getItem("tasks") || "[]";

}


function getTasksFromStorage() {

    try {
        return JSON.parse(localStorage.getItem("tasks")) || [];
    } catch (error) {
        return [];
    }

}


function saveTasks() {

    localStorage.setItem("tasks", JSON.stringify(tasks));

    lastTasksSnapshot =
        localStorage.getItem("tasks") || "[]";

    window.dispatchEvent(new Event("tasksUpdated"));

}


function refreshPageData() {

    loadFilters();
    displayTasks();
    updateDashboard();

}


/* =========================================================
   EMPLOYEES FROM JSON
========================================================= */

function loadEmployees() {

    fetch(USERS_JSON_PATH)
        .then(function (response) {
            return response.json();
        })
        .then(function (users) {

            employees =
                users.filter(function (user) {

                    const role =
                        String(user.role || "")
                            .trim()
                            .toLowerCase();

                    const status =
                        String(user.status || "")
                            .trim()
                            .toLowerCase();

                    return (
                        role === "employee" &&
                        status === "active"
                    );

                });

            renderEmployeeMultiSelect(
                "employeeList",
                [],
                "createEmp"
            );

            loadFilters();
            displayTasks();
            updateDashboard();
            setupStorageSync();

        })
        .catch(function (error) {
            console.log("Users.json Error", error);
        });

}


function getEmployeeById(employeeId) {

    return employees.find(function (employee) {
        return Number(employee.id) === Number(employeeId);
    });

}


function getEmployeeNameById(employeeId) {

    const employee =
        getEmployeeById(employeeId);

    return employee ? employee.name : "Unknown";

}


/* =========================================================
   MULTI SELECT EMPLOYEES WITH CHECKBOXES
========================================================= */

function renderEmployeeMultiSelect(containerId, selectedIds = [], prefix = "emp") {

    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }

    const selectedSet =
        new Set(
            selectedIds.map(function (id) {
                return Number(id);
            })
        );

    const allChecked =
        employees.length > 0 &&
        employees.every(function (employee) {
            return selectedSet.has(Number(employee.id));
        });

    container.innerHTML = `
        <div class="employee-multi-select">

            <button
                type="button"
                class="employee-select-btn"
                onclick="toggleEmployeeDropdown('${containerId}')">

                <span id="${containerId}_summary">
                    ${getSelectedSummary(selectedSet)}
                </span>

                <span>▾</span>

            </button>

            <div class="employee-select-menu" id="${containerId}_menu">

                <label class="employee-check-row select-all-row">

                    <input
                        type="checkbox"
                        ${allChecked ? "checked" : ""}
                        onchange="toggleAllEmployees('${containerId}', this.checked)">

                    <span>
                        Select All Employees
                    </span>

                </label>

                <div class="employee-check-list">

                    ${
                        employees.map(function (employee) {

                            const checked =
                                selectedSet.has(Number(employee.id));

                            return `
                                <label class="employee-check-row">

                                    <input
                                        type="checkbox"
                                        class="employee-check"
                                        value="${employee.id}"
                                        ${checked ? "checked" : ""}
                                        onchange="updateEmployeeSelectSummary('${containerId}')">

                                    <span>
                                        ${escapeHTML(employee.name)}
                                    </span>

                                </label>
                            `;

                        }).join("")
                    }

                </div>

            </div>

        </div>
    `;

}


function toggleEmployeeDropdown(containerId) {

    const menu =
        document.getElementById(`${containerId}_menu`);

    if (!menu) {
        return;
    }

    menu.classList.toggle("show");

}


function toggleAllEmployees(containerId, checked) {

    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }

    container
        .querySelectorAll(".employee-check")
        .forEach(function (checkbox) {
            checkbox.checked = checked;
        });

    updateEmployeeSelectSummary(containerId);

}


function updateEmployeeSelectSummary(containerId) {

    const summary =
        document.getElementById(`${containerId}_summary`);

    if (!summary) {
        return;
    }

   function openEdit(id) {

    selectedTaskId = Number(id);

    const task =
        getTaskById(selectedTaskId);

    if (!task) {
        return;
    }

    setValue("editTitle", task.title);
    setValue("editDescription", task.description);
    setValue("editPriority", task.priority);
    setValue("editDeadline", toDateTimeLocal(task.deadline));

    /*
        مهم:
        هون ما بنجيب كل موظفين نفس الـ group.
        بنجيب فقط الموظف الموجود على هذا الكارد.
    */
    const selectedIds = [
        Number(task.employeeId)
    ];

    renderEmployeeMultiSelect(
        "editEmployeeList",
        selectedIds,
        "editEmp"
    );

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("editModal")
        );

    modal.show();

}


function getSelectedSummary(selectedSet) {

    if (!selectedSet || selectedSet.size === 0) {
        return "Select Employees";
    }

    if (selectedSet.size === employees.length) {
        return "All Employees Selected";
    }

    return `${selectedSet.size} Employee(s) Selected`;

}


function getSelectedEmployees(containerId) {

    const container =
        document.getElementById(containerId);

    if (!container) {
        return [];
    }

    return Array
        .from(container.querySelectorAll(".employee-check:checked"))
        .map(function (checkbox) {
            return Number(checkbox.value);
        });

}


/* =========================================================
   TASK MODEL HELPERS
========================================================= */

function generateTaskId(employeeId, index = 0) {

    return Date.now() * 1000 + Number(employeeId) + index;

}


function generateTaskGroupId() {

    return Date.now();

}


function normalizeStatus(status) {

    if (!status) {
        return "New";
    }

    return String(status).trim();

}


function normalizePriority(priority) {

    if (!priority) {
        return "Medium";
    }

    return String(priority).trim();

}


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


function getStatusClass(status) {

    return normalizeStatus(status)
        .toLowerCase()
        .replaceAll(" ", "-");

}


function getTaskDeadlineValue(task) {

    if (task.deadline) {
        return task.deadline;
    }

    if (task.deadlineDate && task.deadlineTime) {
        return `${task.deadlineDate}T${task.deadlineTime}`;
    }

    if (task.deadlineDate) {
        return task.deadlineDate;
    }

    return "";

}


function formatDateTime(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();

}


function formatDeadline(task) {

    return formatDateTime(getTaskDeadlineValue(task));

}


function isTaskForCurrentHR(task) {

    if (!task) {
        return false;
    }

    if (
        task.createdByHRId &&
        Number(task.createdByHRId) === Number(currentHRId)
    ) {
        return true;
    }

    if (
        task.createdBy &&
        Number(task.createdBy) === Number(currentHRId)
    ) {
        return true;
    }

    return false;

}


function getMyHRTasks() {

    return tasks.filter(function (task) {
        return isTaskForCurrentHR(task);
    });

}


function getTaskById(taskId) {

    return tasks.find(function (task) {
        return Number(task.id) === Number(taskId);
    });

}


function getTaskGroupId(task) {

    return task.taskGroupId || task.groupId || task.id;

}


function getTaskGroupTasks(task) {

    const groupId =
        getTaskGroupId(task);

    return tasks.filter(function (item) {

        return (
            isTaskForCurrentHR(item) &&
            getTaskGroupId(item) === groupId
        );

    });

}


function ensureTaskGroup(task) {

    const groupId =
        getTaskGroupId(task);

    const groupTasks =
        getTaskGroupTasks(task);

    groupTasks.forEach(function (item) {
        item.taskGroupId = groupId;
        item.groupId = groupId;
    });

    return groupId;

}


function hasValidSubmission(task) {

    if (!task || !task.submission) {
        return false;
    }

    const solution =
        String(task.submission.solution || "").trim();

    const file =
        String(task.submission.file || "").trim();

    const image =
        String(task.submission.image || "").trim();

    return solution !== "" || file !== "" || image !== "";

}


function pushTaskHistory(task, message) {

    if (!Array.isArray(task.history)) {
        task.history = [];
    }

    task.history.push({
        message: message,
        hrId: currentHRId,
        hrName: getHRName(),
        date: new Date().toISOString()
    });

}


/* =========================================================
   TIME OUT LOGIC
========================================================= */

function isDeadlinePassed(task) {

    const status =
        normalizeStatus(task.status);

    const ignoredStatuses = [
        "Submitted",
        "Completed",
        "Blocked",
        "Time Out"
    ];

    if (ignoredStatuses.includes(status)) {
        return false;
    }

    const deadlineValue =
        getTaskDeadlineValue(task);

    if (!deadlineValue) {
        return false;
    }

    const deadlineDate =
        new Date(deadlineValue);

    if (Number.isNaN(deadlineDate.getTime())) {
        return false;
    }

    return new Date() > deadlineDate;

}


function applyTimeoutStatus() {

    let changed = false;

    tasks.forEach(function (task) {

        if (!isTaskForCurrentHR(task)) {
            return;
        }

        if (isDeadlinePassed(task)) {

            task.status = "Time Out";
            task.updatedAt = new Date().toISOString();
            task.notification = "Task reached deadline and became Time Out";

            pushTaskHistory(
                task,
                "System changed task status to Time Out because the deadline passed."
            );

            changed = true;

        }

    });

    if (changed) {
        saveTasks();
    }

}


/* =========================================================
   CREATE TASK
========================================================= */

function createTask() {

    const titleInput =
        document.getElementById("taskTitleInput");

    const descriptionInput =
        document.getElementById("taskDescriptionInput");

    const priorityInput =
        document.getElementById("taskPriorityInput");

    const deadlineDateInput =
        document.getElementById("deadlineDate");

    const deadlineTimeInput =
        document.getElementById("deadlineTime");

    const taskFileInput =
        document.getElementById("taskFile");

    const taskImageInput =
        document.getElementById("taskImage");

    const selectedEmployees =
        getSelectedEmployees("employeeList");

    if (
        !titleInput ||
        !descriptionInput ||
        !priorityInput ||
        !deadlineDateInput ||
        !deadlineTimeInput
    ) {
        alert("Create task inputs not found.");
        return;
    }

    const title =
        titleInput.value.trim();

    const description =
        descriptionInput.value.trim();

    const priority =
        priorityInput.value;

    if (
        title === "" ||
        description === "" ||
        selectedEmployees.length === 0
    ) {
        alert("Please complete task data and select employees.");
        return;
    }

    const deadline =
        new Date(`${deadlineDateInput.value}T${deadlineTimeInput.value}`);

    if (Number.isNaN(deadline.getTime())) {
        alert("Please select deadline date and time.");
        return;
    }

    if (deadline < new Date()) {
        alert("Deadline cannot be in the past.");
        return;
    }

    const taskFile =
        taskFileInput && taskFileInput.files.length > 0
            ? taskFileInput.files[0].name
            : "";

    const taskImage =
        taskImageInput && taskImageInput.files.length > 0
            ? taskImageInput.files[0].name
            : "";

    const groupId =
        generateTaskGroupId();

    selectedEmployees.forEach(function (employeeId, index) {

        const employee =
            getEmployeeById(employeeId);

        const task = {
            id: generateTaskId(employeeId, index),
            taskGroupId: groupId,
            groupId: groupId,

            title: title,
            description: description,
            priority: priority,
            deadline: deadline.toISOString(),

            assignedEmployees: [Number(employeeId)],
            assignedEmployeeNames: [
                employee ? employee.name : "Unknown"
            ],

            employeeId: Number(employeeId),
            employeeName: employee ? employee.name : "Unknown",

            createdBy: Number(currentHRId),
            createdByHRId: Number(currentHRId),
            createdByHRName: getHRName(),
            createdByHREmail: currentHR.email || "",

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),

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
                    date: new Date().toISOString()
                }
            ]
        };

        tasks.push(task);

    });

    saveTasks();
    clearCreateForm();
    refreshPageData();

    alert("Tasks created successfully.");

}


function clearCreateForm() {

    const ids = [
        "taskTitleInput",
        "taskDescriptionInput",
        "deadlineDate",
        "deadlineTime",
        "taskFile",
        "taskImage"
    ];

    ids.forEach(function (id) {

        const input =
            document.getElementById(id);

        if (input) {
            input.value = "";
        }

    });

    renderEmployeeMultiSelect(
        "employeeList",
        [],
        "createEmp"
    );

}


/* =========================================================
   FILTERS
========================================================= */

function setupFiltersEvents() {

    const employeeFilter =
        document.getElementById("employeeFilter");

    const taskFilter =
        document.getElementById("taskFilter");

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


function loadFilters() {

    const employeeFilter =
        document.getElementById("employeeFilter");

    const taskFilter =
        document.getElementById("taskFilter");

    const myTasks =
        getMyHRTasks();

    const selectedEmployee =
        employeeFilter ? employeeFilter.value : "";

    const selectedTask =
        taskFilter ? taskFilter.value : "";

    if (employeeFilter) {

        const employeeIdsWithTasks =
            [
                ...new Set(
                    myTasks
                        .map(function (task) {
                            return Number(task.employeeId);
                        })
                        .filter(Boolean)
                )
            ];

        employeeFilter.innerHTML = `
            <option value="">All Employees</option>
        `;

        employeeIdsWithTasks.forEach(function (employeeId) {

            employeeFilter.innerHTML += `
                <option value="${employeeId}">
                    ${escapeHTML(getEmployeeNameById(employeeId))}
                </option>
            `;

        });

        if (
            Array.from(employeeFilter.options)
                .some(function (option) {
                    return option.value === selectedEmployee;
                })
        ) {
            employeeFilter.value = selectedEmployee;
        }

    }

    if (taskFilter) {

        const tasksForOptions =
            selectedEmployee
                ? myTasks.filter(function (task) {
                    return Number(task.employeeId) === Number(selectedEmployee);
                })
                : myTasks;

        const uniqueTaskTitles =
            [
                ...new Set(
                    tasksForOptions
                        .map(function (task) {
                            return task.title;
                        })
                        .filter(Boolean)
                )
            ];

        taskFilter.innerHTML = `
            <option value="">All Tasks</option>
        `;

        uniqueTaskTitles.forEach(function (title) {

            taskFilter.innerHTML += `
                <option value="${escapeHTML(title)}">
                    ${escapeHTML(title)}
                </option>
            `;

        });

        if (
            Array.from(taskFilter.options)
                .some(function (option) {
                    return option.value === selectedTask;
                })
        ) {
            taskFilter.value = selectedTask;
        }

    }

}


function getFilteredTasks() {

    let filteredTasks =
        getMyHRTasks();

    const employeeFilter =
        document.getElementById("employeeFilter")?.value || "";

    const taskFilter =
        document.getElementById("taskFilter")?.value || "";

    if (employeeFilter) {

        filteredTasks =
            filteredTasks.filter(function (task) {
                return Number(task.employeeId) === Number(employeeFilter);
            });

    }

    if (taskFilter) {

        filteredTasks =
            filteredTasks.filter(function (task) {
                return task.title === taskFilter;
            });

    }

    return filteredTasks.sort(sortHRTasks);

}


/* =========================================================
   SORTING
========================================================= */

function getStatusWeight(status) {

    const value =
        normalizeStatus(status);

    const weights = {
        "Submitted": 1,
        "In Progress": 2,
        "New": 3,
        "Pending": 3,
        "Not Complete": 4,
        "Completed": 5,
        "Time Out": 6,
        "Blocked": 7
    };

    return weights[value] || 99;

}


function getPriorityWeight(priority) {

    const value =
        normalizePriority(priority)
            .toLowerCase();

    if (value === "high") {
        return 1;
    }

    if (value === "medium") {
        return 2;
    }

    if (value === "low") {
        return 3;
    }

    return 4;

}


function getDeadlineTime(task) {

    const deadlineValue =
        getTaskDeadlineValue(task);

    if (!deadlineValue) {
        return Number.MAX_SAFE_INTEGER;
    }

    const deadlineDate =
        new Date(deadlineValue);

    if (Number.isNaN(deadlineDate.getTime())) {
        return Number.MAX_SAFE_INTEGER;
    }

    return deadlineDate.getTime();

}


function sortHRTasks(firstTask, secondTask) {

    const firstStatus =
        getStatusWeight(firstTask.status);

    const secondStatus =
        getStatusWeight(secondTask.status);

    if (firstStatus !== secondStatus) {
        return firstStatus - secondStatus;
    }

    const firstPriority =
        getPriorityWeight(firstTask.priority);

    const secondPriority =
        getPriorityWeight(secondTask.priority);

    if (firstPriority !== secondPriority) {
        return firstPriority - secondPriority;
    }

    const firstDeadline =
        getDeadlineTime(firstTask);

    const secondDeadline =
        getDeadlineTime(secondTask);

    if (firstDeadline !== secondDeadline) {
        return firstDeadline - secondDeadline;
    }

    return (
        new Date(secondTask.createdAt || 0) -
        new Date(firstTask.createdAt || 0)
    );

}


/* =========================================================
   DISPLAY TASKS
========================================================= */

function displayTasks() {

    const table =
        document.getElementById("tasksTable");

    if (!table) {
        return;
    }

    const filteredTasks =
        getFilteredTasks();

    if (filteredTasks.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    No tasks found.
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML =
        filteredTasks.map(function (task) {

            const status =
                normalizeStatus(task.status);

            const statusClass =
                getStatusClass(status);

            const employeeName =
                task.employeeName ||
                getEmployeeNameById(task.employeeId);

            return `
                <tr class="${status === "Blocked" ? "blocked-row" : ""}">

                    <td>
                        <b>${escapeHTML(task.title)}</b>
                        <br>
                        <small>${escapeHTML(task.description)}</small>
                    </td>

                    <td>
                        ${escapeHTML(employeeName)}
                    </td>

                    <td>
                        ${escapeHTML(normalizePriority(task.priority))}
                    </td>

                    <td>
                        ${formatDeadline(task)}
                    </td>

                    <td>
                        <span class="status-badge ${statusClass}">
                            ${escapeHTML(status)}
                        </span>
                    </td>

                    <td>
                        ${buildTaskActions(task)}
                    </td>

                </tr>
            `;

        }).join("");

}


function buildTaskActions(task) {

    const status =
        normalizeStatus(task.status);

    let buttons = `
        <button
            class="btn btn-primary btn-sm"
            onclick="viewTask(${task.id})">
            View
        </button>
    `;

    if (status === "Blocked") {

        buttons += `
            <button
                class="btn btn-success btn-sm"
                onclick="unblockTask(${task.id})">
                🔓 Unblock
            </button>
        `;

        return buttons;

    }

    buttons += `
        <button
            class="btn btn-warning btn-sm"
            onclick="openEdit(${task.id})">
            Edit
        </button>

        <button
            class="btn btn-danger btn-sm"
            onclick="blockTask(${task.id})">
            🚫 Block
        </button>
    `;

    return buttons;

}


/* =========================================================
   VIEW / REVIEW TASK
========================================================= */

function viewTask(id) {

    selectedTaskId = Number(id);

    const task =
        getTaskById(selectedTaskId);

    if (!task) {
        return;
    }

    const employeeName =
        task.employeeName ||
        getEmployeeNameById(task.employeeId);

    setHTML("viewTaskTitle", escapeHTML(task.title));
    setHTML("viewTaskDescription", escapeHTML(task.description));

    setHTML(
        "viewTaskEmployees",
        `<b>Employee:</b> ${escapeHTML(employeeName)}`
    );

    setHTML(
        "submittedEmployee",
        task.submission
            ? escapeHTML(task.submission.employeeName)
            : "Not Submitted"
    );

    setHTML(
        "submittedDate",
        task.submission
            ? formatDateTime(task.submission.date)
            : "-"
    );

    setHTML(
        "submittedSolution",
        task.submission
            ? escapeHTML(task.submission.solution || "No Solution")
            : "No Solution"
    );

    setHTML(
        "taskCreatedDate",
        formatDateTime(task.createdAt)
    );

    setHTML(
        "taskUpdatedDate",
        formatDateTime(task.updatedAt)
    );

    setHTML(
        "submittedFile",
        task.submission?.file
            ? escapeHTML(task.submission.file)
            : "No File"
    );

    setHTML(
        "submittedImage",
        task.submission?.image
            ? escapeHTML(task.submission.image)
            : "No Image"
    );

    const feedbackInput =
        document.getElementById("hrFeedback");

    if (feedbackInput) {
        feedbackInput.value = task.hrFeedback || "";
    }

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("viewTaskModal")
        );

    modal.show();

}


function approveTask() {

    const task =
        getTaskById(selectedTaskId);

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
    task.approvedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    pushTaskHistory(
        task,
        "HR approved the task and marked it as Completed."
    );

    saveTasks();
    refreshPageData();

    hideModal("viewTaskModal");

}


function requestChanges() {

    const task =
        getTaskById(selectedTaskId);

    if (!task) {
        return;
    }

    if (!hasValidSubmission(task)) {
        alert("This task has no submission to review.");
        return;
    }

    const feedbackInput =
        document.getElementById("hrFeedback");

    const feedback =
        feedbackInput ? feedbackInput.value.trim() : "";

    if (feedback === "") {
        alert("Enter feedback.");
        return;
    }

    task.status = "Not Complete";
    task.hrFeedback = feedback;
    task.notification = "HR requested changes";
    task.reviewedByHRId = currentHRId;
    task.reviewedByHRName = getHRName();
    task.reviewedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    pushTaskHistory(
        task,
        "HR requested changes from the employee."
    );

    saveTasks();
    refreshPageData();

    hideModal("viewTaskModal");

}


/* =========================================================
   EDIT TASK
========================================================= */

function openEdit(id) {

    selectedTaskId = Number(id);

    const task =
        getTaskById(selectedTaskId);

    if (!task) {
        return;
    }

    ensureTaskGroup(task);

    const groupTasks =
        getTaskGroupTasks(task);

    const selectedIds =
        groupTasks.map(function (item) {
            return Number(item.employeeId);
        });

    setValue("editTitle", task.title);
    setValue("editDescription", task.description);
    setValue("editPriority", task.priority);
    setValue("editDeadline", toDateTimeLocal(task.deadline));

    renderEmployeeMultiSelect(
        "editEmployeeList",
        selectedIds,
        "editEmp"
    );

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById("editModal")
        );

    modal.show();

}


function saveEditTask() {

    const task =
        getTaskById(selectedTaskId);

    if (!task) {
        return;
    }

    const title =
        getValue("editTitle").trim();

    const description =
        getValue("editDescription").trim();

    const priority =
        getValue("editPriority");

    const deadlineValue =
        getValue("editDeadline");

    const selectedEmployees =
        getSelectedEmployees("editEmployeeList");

    if (
        title === "" ||
        description === "" ||
        selectedEmployees.length === 0
    ) {
        alert("Please complete task data and select employee.");
        return;
    }

    /*
        مهم:
        Edit للكارد الواحد لازم يكون لموظف واحد فقط.
        Create هو اللي بسمح لأكثر من موظف.
    */
    if (selectedEmployees.length > 1) {
        alert("In edit mode, please select one employee only for this card.");
        return;
    }

    const selectedEmployeeId =
        Number(selectedEmployees[0]);

    const deadline =
        new Date(deadlineValue);

    if (Number.isNaN(deadline.getTime())) {
        alert("Please select a valid deadline.");
        return;
    }

    const editFileInput =
        document.getElementById("editTaskFile");

    const editImageInput =
        document.getElementById("editTaskImage");

    const newTaskFile =
        editFileInput && editFileInput.files.length > 0
            ? editFileInput.files[0].name
            : "";

    const newTaskImage =
        editImageInput && editImageInput.files.length > 0
            ? editImageInput.files[0].name
            : "";

    const oldEmployeeId =
        Number(task.employeeId);

    const groupId =
        getTaskGroupId(task);

    /*
        منع التكرار:
        لو نفس الـ task group عنده كارد ثاني لنفس الموظف الجديد
        لا نسمح يصير duplicate.
    */
    const duplicateTask =
        tasks.find(function (item) {

            return (
                Number(item.id) !== Number(task.id) &&
                getTaskGroupId(item) === groupId &&
                Number(item.employeeId) === selectedEmployeeId
            );

        });

    if (duplicateTask) {
        alert("This employee already has a card for this task.");
        return;
    }

    updateTaskCommonFields(
        task,
        title,
        description,
        priority,
        deadline.toISOString(),
        newTaskFile,
        newTaskImage
    );

    assignTaskToEmployee(
        task,
        selectedEmployeeId
    );

    /*
        إذا غيّرت الموظف:
        لازم نمسح submission القديم لأنه كان تابع للموظف القديم.
    */
    if (oldEmployeeId !== selectedEmployeeId) {

        task.status = "New";
        task.submission = null;
        task.hrFeedback = "";
        task.previousStatus = "";
        task.notification = "Task reassigned by HR";

        pushTaskHistory(
            task,
            "HR reassigned this card to another employee."
        );

    } else {

        pushTaskHistory(
            task,
            "HR edited this task card."
        );

    }

    saveTasks();
    refreshPageData();

    hideModal("editModal");

}

function updateTaskCommonFields(
    task,
    title,
    description,
    priority,
    deadline,
    taskFile,
    taskImage
) {

    task.title = title;
    task.description = description;
    task.priority = priority;
    task.deadline = deadline;

    if (taskFile) {
        task.taskFile = taskFile;
    }

    if (taskImage) {
        task.taskImage = taskImage;
    }

    task.updatedAt = new Date().toISOString();
    task.updatedByHRId = currentHRId;
    task.updatedByHRName = getHRName();
    task.notification = "Task updated by HR";

}


function assignTaskToEmployee(task, employeeId) {

    const employee =
        getEmployeeById(employeeId);

    task.employeeId = Number(employeeId);
    task.employeeName = employee ? employee.name : "Unknown";
    task.assignedEmployees = [Number(employeeId)];
    task.assignedEmployeeNames = [
        employee ? employee.name : "Unknown"
    ];

}


function createClonedTaskForEmployee(
    baseTask,
    employeeId,
    groupId,
    index,
    title,
    description,
    priority,
    deadline,
    taskFile,
    taskImage
) {

    const employee =
        getEmployeeById(employeeId);

    return {
        id: generateTaskId(employeeId, index + 50),
        taskGroupId: groupId,
        groupId: groupId,

        title: title,
        description: description,
        priority: priority,
        deadline: deadline,

        assignedEmployees: [Number(employeeId)],
        assignedEmployeeNames: [
            employee ? employee.name : "Unknown"
        ],

        employeeId: Number(employeeId),
        employeeName: employee ? employee.name : "Unknown",

        createdBy: Number(currentHRId),
        createdByHRId: Number(currentHRId),
        createdByHRName: getHRName(),
        createdByHREmail: currentHR.email || "",

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        status: "New",

        taskFile: taskFile || baseTask.taskFile || "",
        taskImage: taskImage || baseTask.taskImage || "",

        submission: null,
        hrFeedback: "",
        notification: "New task assigned by HR",
        history: [
            {
                message: "Task created by HR from edit assignment.",
                hrId: currentHRId,
                hrName: getHRName(),
                date: new Date().toISOString()
            }
        ]
    };

}


/* =========================================================
   BLOCK / UNBLOCK
========================================================= */

function blockTask(id) {

    const task =
        getTaskById(id);

    if (!task) {
        return;
    }

    if (!confirm("Are you sure you want to block this task?")) {
        return;
    }

    task.previousStatus = task.status;
    task.status = "Blocked";
    task.notification = "Blocked by HR";
    task.blockedByHRId = currentHRId;
    task.blockedByHRName = getHRName();
    task.blockedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    pushTaskHistory(
        task,
        "HR blocked the task."
    );

    saveTasks();
    refreshPageData();

}


function unblockTask(id) {

    const task =
        getTaskById(id);

    if (!task) {
        return;
    }

    if (!confirm("Are you sure you want to unblock this task?")) {
        return;
    }

    task.status = task.previousStatus || "New";
    task.notification = "Task unblocked by HR";
    task.unblockedByHRId = currentHRId;
    task.unblockedByHRName = getHRName();
    task.unblockedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    pushTaskHistory(
        task,
        "HR unblocked the task."
    );

    saveTasks();
    refreshPageData();

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const myTasks =
        getMyHRTasks();

    const total =
        myTasks.length;

    const newCount =
        myTasks.filter(function (task) {

            const status =
                normalizeStatus(task.status);

            return (
                status === "New" ||
                status === "Pending" ||
                status === "Not Complete"
            );

        }).length;

    const submittedCount =
        myTasks.filter(function (task) {
            return normalizeStatus(task.status) === "Submitted";
        }).length;

    const completedCount =
        myTasks.filter(function (task) {
            return normalizeStatus(task.status) === "Completed";
        }).length;

    const overdueCount =
        myTasks.filter(function (task) {
            return normalizeStatus(task.status) === "Time Out";
        }).length;

    setCounter("totalTasks", total);
    setCounter("newTasks", newCount);
    setCounter("submittedTasks", submittedCount);
    setCounter("completedTasks", completedCount);
    setCounter("overdueTasks", overdueCount);

}


function setCounter(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent = value;

}


/* =========================================================
   SYNC
========================================================= */

function setupStorageSync() {

    window.addEventListener("storage", function (event) {

        if (event.key === "tasks") {
            loadTasks();
            refreshPageData();
        }

    });

    setInterval(function () {

        const currentSnapshot =
            localStorage.getItem("tasks") || "[]";

        if (currentSnapshot !== lastTasksSnapshot) {

            loadTasks();
            refreshPageData();

        }

    }, 1500);

}


/* =========================================================
   DARK MODE
========================================================= */

function setupDarkModeFromStorage() {

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }

}


/* =========================================================
   UTILITIES
========================================================= */

function setHTML(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.innerHTML = value;
    }

}


function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value = value || "";
    }

}


function getValue(id) {

    const element =
        document.getElementById(id);

    return element ? element.value : "";

}


function toDateTimeLocal(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const offset =
        date.getTimezoneOffset();

    const localDate =
        new Date(date.getTime() - offset * 60000);

    return localDate
        .toISOString()
        .slice(0, 16);

}


function hideModal(modalId) {

    const modalElement =
        document.getElementById(modalId);

    if (!modalElement || !window.bootstrap) {
        return;
    }

    const modal =
        bootstrap.Modal.getInstance(modalElement);

    if (modal) {
        modal.hide();
    }

}


/* =========================================================
   GLOBAL FUNCTIONS FOR HTML ONCLICK
========================================================= */

window.createTask = createTask;
window.viewTask = viewTask;
window.approveTask = approveTask;
window.requestChanges = requestChanges;
window.openEdit = openEdit;
window.saveEditTask = saveEditTask;
window.blockTask = blockTask;
window.unblockTask = unblockTask;
window.toggleEmployeeDropdown = toggleEmployeeDropdown;
window.toggleAllEmployees = toggleAllEmployees;
window.updateEmployeeSelectSummary = updateEmployeeSelectSummary;
}