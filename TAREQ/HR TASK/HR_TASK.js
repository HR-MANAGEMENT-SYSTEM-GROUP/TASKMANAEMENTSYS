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

/* INIT*/
document.addEventListener("DOMContentLoaded", function () {
    currentHR = getCurrentUser();
    if (!validateHRAccess()) {return; }
    currentHRId = Number(currentHR.id);
    setupDarkModeFromStorage();
    loadTasks();
    loadEmployees();
    setupFiltersEvents();
});
/* CURRENT HR FROM LOGIN*/

function getCurrentUser() {
    
    try { return JSON.parse(localStorage.getItem("currentUser"));
    } catch (error) {  return null; }}


function validateHRAccess() {

    if (!currentHR || !currentHR.id) {alert("Please login first.");

        window.location.href = LOGIN_PAGE;
        return false;}

    const role =String(currentHR.role || "") .trim() .toLowerCase();

    if (role !== "hr" && role !== "admin") {alert("Access denied. HR access only.");

        window.location.href = LOGIN_PAGE;
        return false;}
    return true;
}


function getHRName() {return (currentHR.name ||currentHR.fullName ||currentHR.username || currentHR.email ||"HR User");}

/* LOCAL STORAGE*/
function loadTasks() {
    tasks = getTasksFromStorage();  applyTimeoutStatus();
    lastTasksSnapshot = localStorage.getItem("tasks") || "[]";}


function getTasksFromStorage() {try {return JSON.parse(localStorage.getItem("tasks")) || [];} catch (error) {return [];}}


function saveTasks() {

    localStorage.setItem("tasks", JSON.stringify(tasks));
    lastTasksSnapshot = localStorage.getItem("tasks") || "[]";
    window.dispatchEvent(new Event("tasksUpdated"));
}


function refreshPageData() {

    loadFilters();
    displayTasks();
    updateDashboard();

}
/* EMPLOYEES FROM JSON*/

function loadEmployees() {

    fetch(USERS_JSON_PATH)
       .then(function (response) {

            if (!response.ok) { throw new Error("Users.json not found: " + USERS_JSON_PATH); }
            return response.json();})
        
            .then(function (users) {

/*   يدعم لو الملف Array مباشرة  أو لو كان object وفيه users */
       
const usersList = Array.isArray(users)  ? users  : users.users || [];

   employees = usersList.filter(function (user) {

                    const role =  String(user.role || "") .trim()   .toLowerCase();
                    const status =   String(user.status || "active")  .trim()   .toLowerCase();
                    return (   role === "employee" &&    status === "active"   ); });
  console.log("Loaded Employees:", employees);

            renderEmployeeMultiSelect(  "employeeList",[],"createEmp");
            loadFilters();
            displayTasks();
            updateDashboard();
            setupStorageSync();})

        .catch(function (error) {   console.error("Users.json Error:", error); employees = [];

            renderEmployeeMultiSelect("employeeList", [],"createEmp");
            loadFilters();
            displayTasks();
            updateDashboard();});}

function getEmployeeById(employeeId) {

    return employees.find(function (employee) {  return Number(employee.id) === Number(employeeId);});}


function getEmployeeNameById(employeeId) {
    const employee =getEmployeeById(employeeId);
    return employee ? employee.name : "Unknown";
}


/*MULTI SELECT EMPLOYEES WITH CHECKBOXES*/
/* SELECT-LIKE MULTI EMPLOYEE DROPDOWN*/

function renderEmployeeMultiSelect(containerId, selectedIds = [], prefix = "emp") {

    const container =document.getElementById(containerId);

    if (!container) {  return; }

    const selectedSet = new Set(  selectedIds.map(function (id) {  return Number(id);  }) );

    container.innerHTML = ` <div class="employee-select-wrapper">

            <button type="button"  class="employee-select-control"   onclick="toggleEmployeeDropdown('${containerId}', event)">
                <span id="${containerId}_summary">  ${getSelectedSummary(selectedSet)}  </span>
                <span class="employee-select-arrow"> </span> </button>

  <div class="employee-select-dropdown" id="${containerId}_menu">

 <label class="employee-option select-all-option">

 <input   type="checkbox"   ${employees.length > 0 && selectedSet.size === employees.length ? "checked" : ""}  
  onchange="toggleAllEmployees('${containerId}', this.checked)">
 <span>  Select All Employees   </span>     </label>

 <div class="employee-options-list"> ${ employees.map(function (employee) {
 const checked =  selectedSet.has(Number(employee.id)); return `

 <label class="employee-option">

 <input type="checkbox"  class="employee-check"   value="${employee.id}"
  ${checked ? "checked" : ""}   onchange="updateEmployeeSelectSummary('${containerId}')">

  <span> ${escapeHTML(employee.name)} </span> </label>  `;  }).join("")  }</div>  </div> </div>`;

}


function toggleEmployeeDropdown(containerId, event) {

    if (event) {event.stopPropagation(); }

    document  .querySelectorAll(".employee-select-dropdown")  .forEach(function (menu) {

            if (menu.id !== `${containerId}_menu`) {menu.classList.remove("show");  } });

    const menu =  document.getElementById(`${containerId}_menu`);

    if (!menu) { return;} menu.classList.toggle("show");
}


function toggleAllEmployees(containerId, checked) {

    const container = document.getElementById(containerId);

    if (!container) { return; }

    container  .querySelectorAll(".employee-check")  .forEach(function (checkbox) {     checkbox.checked = checked; });
    updateEmployeeSelectSummary(containerId);}


function updateEmployeeSelectSummary(containerId) {

    const summary = document.getElementById(`${containerId}_summary`);

    if (!summary) { return;  }

    const selectedIds = getSelectedEmployees(containerId);

    if (selectedIds.length === 0) { summary.textContent = "Select Employees";}
     else if (selectedIds.length === employees.length) {   summary.textContent = "All Employees";} 
    else if (selectedIds.length === 1) {

     const employee = getEmployeeById(selectedIds[0]);

     summary.textContent =  employee ? employee.name : "1 Employee"; } 
    else {summary.textContent =  `${selectedIds.length} Employees Selected`;}}


function getSelectedSummary(selectedSet) {

    if (!selectedSet || selectedSet.size === 0) { return "Select Employees";}
    if (selectedSet.size === employees.length) {  return "All Employees"; }

    if (selectedSet.size === 1) {

  const employeeId =  Array.from(selectedSet)[0];
const employee = getEmployeeById(employeeId);

 return employee ? employee.name : "1 Employee"; }

    return `${selectedSet.size} Employees Selected`;}


function getSelectedEmployees(containerId) { const container = document.getElementById(containerId);

    if (!container) { return [];}

    return Array .from(container.querySelectorAll(".employee-check:checked"))  .map(function (checkbox) {      return Number(checkbox.value);  });}


/* Close dropdown when clicking outside */
document.addEventListener("click", function () {

    document  .querySelectorAll(".employee-select-dropdown") .forEach(function (menu) {    menu.classList.remove("show");  });});


function setupDarkModeFromStorage() {
    function syncTheme() {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        if (isDark) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }
    }
    const savedTheme = localStorage.getItem("theme") || localStorage.getItem("journey-theme");
    if (savedTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        document.body.classList.add("dark-mode");
    } else {
        document.documentElement.removeAttribute("data-theme");
        document.body.classList.remove("dark-mode");
    }
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}


function setupFiltersEvents() { const employeeFilter = document.getElementById("employeeFilter");

    const taskFilter =  document.getElementById("taskFilter");

    if (employeeFilter) {

        employeeFilter.addEventListener("change", function () {  loadFilters();  displayTasks(); });  }

    if (taskFilter) {  taskFilter.addEventListener("change", function () {   displayTasks(); }); }}


function applyTimeoutStatus() { let changed = false;

    tasks.forEach(function (task) {  const status =  normalizeStatus(task.status);

        if (  status === "Completed"  ||  status === "Submitted" || status === "Time Out" ) {   return; }

        if (!task.deadline) {  return;  }

        const deadlineDate =  new Date(task.deadline);

        if ( !Number.isNaN(deadlineDate.getTime()) &&  new Date() > deadlineDate )
             { task.status = "Time Out"; task.updatedAt = new Date().toISOString(); task.notification = "Task became Time Out";  changed = true; }  });

    if (changed) { saveTasks(); }}

function normalizeStatus(status) { return String(status || "New").trim();}


function normalizePriority(priority) { return String(priority || "Medium").trim();}


function escapeHTML(value) {

    if (value === null || value === undefined) { return ""; }  return String(value)
        
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
function getStatusClass(status) {return normalizeStatus(status)  .toLowerCase()  .replaceAll(" ", "-");}


function getTaskById(taskId) { return tasks.find(function (task) {     return Number(task.id) === Number(taskId); });}

function generateTaskId(employeeId, index = 0) {  return Date.now() * 1000 + Number(employeeId) + index;}

function generateTaskGroupId() { return Date.now();}


function getHRTasks() {return tasks.filter(function (task) {

        return ( Number(task.createdByHRId) === Number(currentHRId) ||   Number(task.createdBy) === Number(currentHRId)  )   })}


function getHRName() { return (  currentHR.name ||  currentHR.fullName || currentHR.username ||  currentHR.email ||  "HR User");}


function formatDateTime(value) { if (!value) {  return "-"; }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) { return value; }
    return date.toLocaleString();
}


function setValue(id, value) {

    const element = document.getElementById(id);
    if (element) {  element.value = value || ""; }}


function getValue(id) {

    const element = document.getElementById(id);
    return element ? element.value : "";}


function setHTML(id, value) {

    const element = document.getElementById(id);
 if (element) {element.innerHTML = value; }}


function toDateTimeLocal(value) {

    if (!value) { return ""; }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) { return "";}

    const offset = date.getTimezoneOffset();
    const localDate =  new Date(date.getTime() - offset * 60000);
    return localDate 
     .toISOString()
        .slice(0, 16)}


function hideModal(modalId) {

    const modalElement = document.getElementById(modalId);
    if (!modalElement || !window.bootstrap) {return; }

    const modal =  bootstrap.Modal.getInstance(modalElement);
    if (modal) { modal.hide(); }}
    /* =========================================================
   VALIDATION + POPUP HELPERS
========================================================= */

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

            okBtn.removeEventListener("click", confirmHandler);
            cancelBtn.removeEventListener("click", cancelHandler);
            overlay.removeEventListener("click", overlayHandler);

            resolve(result);
        }

        function confirmHandler() {
            closePopup(true);
        }

        function cancelHandler() {
            closePopup(false);
        }

        function overlayHandler(event) {
            if (event.target === overlay) {
                closePopup(false);
            }
        }

        okBtn.addEventListener("click", confirmHandler);
        cancelBtn.addEventListener("click", cancelHandler);
        overlay.addEventListener("click", overlayHandler);
    });
}

function clearFieldErrors() {

    document.querySelectorAll(".field-error").forEach(function (error) {
        error.remove();
    });

    document.querySelectorAll(".input-error").forEach(function (input) {
        input.classList.remove("input-error");
    });
}


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

    const title = document.getElementById("taskTitleInput")?.value.trim() || "";
    const description = document.getElementById("taskDescriptionInput")?.value.trim() || "";
    const priority = document.getElementById("taskPriorityInput")?.value || "";
    const deadlineDate = document.getElementById("deadlineDate")?.value || "";
    const deadlineTime = document.getElementById("deadlineTime")?.value || "";
    const selectedEmployees = getSelectedEmployees("employeeList");

    if (title === "") {
        setFieldError("taskTitleInput", "Task title is required.");
        isValid = false;
    }

    if (description === "") {
        setFieldError("taskDescriptionInput", "Task description is required.");
        isValid = false;
    }

    if (priority === "") {
        setFieldError("taskPriorityInput", "Please select task priority.");
        isValid = false;
    }

    if (deadlineDate === "") {
        setFieldError("deadlineDate", "Deadline date is required.");
        isValid = false;
    }

    if (deadlineTime === "") {
        setFieldError("deadlineTime", "Deadline time is required.");
        isValid = false;
    }

    if (selectedEmployees.length === 0) {
        setFieldError("employeeList", "Please assign at least one employee.");
        isValid = false;
    }

    if (deadlineDate !== "" && deadlineTime !== "") {
        const deadline = new Date(`${deadlineDate}T${deadlineTime}`);

        if (Number.isNaN(deadline.getTime())) {
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

    if (title === "") {
        setFieldError("editTitle", "Task title is required.");
        isValid = false;
    }

    if (description === "") {
        setFieldError("editDescription", "Task description is required.");
        isValid = false;
    }

    if (priority === "") {
        setFieldError("editPriority", "Please select task priority.");
        isValid = false;
    }

    if (deadlineValue === "") {
        setFieldError("editDeadline", "Deadline is required.");
        isValid = false;
    }

    if (selectedEmployees.length === 0) {
        setFieldError("editEmployeeList", "Please assign one employee.");
        isValid = false;
    }

    if (selectedEmployees.length > 1) {
        setFieldError("editEmployeeList", "Select one employee only in edit mode.");
        isValid = false;
    }

    if (deadlineValue !== "") {
        const deadline = new Date(deadlineValue);

        if (Number.isNaN(deadline.getTime())) {
            setFieldError("editDeadline", "Please select a valid deadline.");
            isValid = false;
        }
    }

    return isValid;
}
/* =========================================================
   CREATE TASK
========================================================= */
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
    const title = document.getElementById("taskTitleInput")?.value.trim() || "";
    const description = document.getElementById("taskDescriptionInput")?.value.trim() || "";
    const priority = document.getElementById("taskPriorityInput")?.value || "Medium";
    const deadlineDate = document.getElementById("deadlineDate")?.value || "";
    const deadlineTime = document.getElementById("deadlineTime")?.value || "";
    const taskFileInput = document.getElementById("taskFile");
    const taskImageInput = document.getElementById("taskImage");

    const deadline = new Date(`${deadlineDate}T${deadlineTime}`);

    const taskFile = taskFileInput && taskFileInput.files.length > 0
        ? taskFileInput.files[0].name
        : "";

    const taskImage = taskImageInput && taskImageInput.files.length > 0
        ? taskImageInput.files[0].name
        : "";

    const groupId = generateTaskGroupId();

    selectedEmployees.forEach(function (employeeId, index) {

        const employee = getEmployeeById(employeeId);

        const task = {
            id: generateTaskId(employeeId, index),
            taskGroupId: groupId,
            groupId: groupId,

            title: title,
            description: description,
            priority: priority,
            deadline: deadline.toISOString(),

            employeeId: Number(employeeId),
            employeeName: employee ? employee.name : "Unknown",
            assignedEmployees: [Number(employeeId)],
            assignedEmployeeNames: [
                employee ? employee.name : "Unknown"
            ],

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
    hideModal("createModal");

    showPopup("Task created successfully.", "success");
}

function clearCreateForm() {

    [ "taskTitleInput", "taskDescriptionInput",  "deadlineDate",  "deadlineTime",  "taskFile",   "taskImage" ].forEach(function (id) {

        const input = document.getElementById(id);
        if (input) {  input.value = "";  } });
    renderEmployeeMultiSelect("employeeList", []);}

/* =========================================================
   FILTERS
========================================================= */

function loadFilters() {

 const employeeFilter =  document.getElementById("employeeFilter");
const taskFilter = document.getElementById("taskFilter");
const hrTasks = getHRTasks();
const selectedEmployee =   employeeFilter ? employeeFilter.value : "";
const selectedTask =taskFilter ? taskFilter.value : "";

    if (employeeFilter) {      const employeeIds =    [ ...new Set(hrTasks  .map(function (task) { return Number(task.employeeId);}).filter(Boolean))];

        employeeFilter.innerHTML =  `<option value="">All Employees</option>`;

        employeeIds.forEach(function (employeeId) {
            employeeFilter.innerHTML += `  <option value="${employeeId}">      ${escapeHTML(getEmployeeNameById(employeeId))}  </option>  `;  });

        if ( Array.from(employeeFilter.options)
               .some(function (option) {return option.value === selectedEmployee;})) {employeeFilter.value = selectedEmployee;}}

    if (taskFilter) {

        const filteredForEmployee = selectedEmployee     ? hrTasks.filter(function (task) { return Number(task.employeeId) === Number(selectedEmployee);  })  : hrTasks;

        const titles =[  ...new Set( filteredForEmployee.map(function (task) {   return task.title; }) .filter(Boolean))];

        taskFilter.innerHTML =  `<option value="">All Tasks</option>`;
        titles.forEach(function (title) {
            taskFilter.innerHTML += ` <option value="${escapeHTML(title)}">   ${escapeHTML(title)}  </option> `; });

        if ( Array.from(taskFilter.options) .some(function (option) { return option.value === selectedTask;  }) ) {  taskFilter.value = selectedTask; } }}


function getFilteredTasks() {

    let result =     getHRTasks();
    const employeeFilter =    document.getElementById("employeeFilter")?.value || "";
    const taskFilter = document.getElementById("taskFilter")?.value || "";

    if (employeeFilter) {result = result.filter(function (task) { return Number(task.employeeId) === Number(employeeFilter);  }); }

    if (taskFilter) {result = result.filter(function (task) {   return task.title === taskFilter;  });}  return result.sort(sortHRTasks);}


/*  SORT*/

function getStatusWeight(status) {

 const weights = {    "Submitted": 1,    "In Progress": 2,    "New": 3,  "Pending": 3,   "Not Complete": 4,    "Completed": 5,   "Time Out": 6 };

 return weights[normalizeStatus(status)] || 99;

}
function getPriorityWeight(priority) {

    const value = normalizePriority(priority)   .toLowerCase();
    if (value === "high") {  return 1;}
    if (value === "medium") {   return 2; }
    if (value === "low") {    return 3; }

    return 4;

}


function getDeadlineTime(task) {

    const deadline = new Date(task.deadline);
    if (Number.isNaN(deadline.getTime())) {  return Number.MAX_SAFE_INTEGER;  } return deadline.getTime();}


function sortHRTasks(a, b) {

    const statusDiff = getStatusWeight(a.status) - getStatusWeight(b.status);
    if (statusDiff !== 0) {   return statusDiff; }

    const priorityDiff = getPriorityWeight(a.priority) - getPriorityWeight(b.priority);
    if (priorityDiff !== 0) {  return priorityDiff; }    return getDeadlineTime(a) - getDeadlineTime(b);}

/*  DISPLAY TASKS */
function displayTasks() {

    const table =  document.getElementById("tasksTable");

    if (!table) {   return; }

    const filteredTasks =  getFilteredTasks();

    if (filteredTasks.length === 0) { table.innerHTML = `   <tr>  <td colspan="6" class="text-center py-4"> No tasks found. </td> </tr> `;
 return; }

    table.innerHTML =filteredTasks.map(function (task) {

            const status = normalizeStatus(task.status);

            const employeeName =   task.employeeName ||  getEmployeeNameById(task.employeeId); 
            return `

                <tr class="${status === "Blocked" ? "blocked-row" : ""}">
                    <td>   <b>${escapeHTML(task.title)}</b>  <br> <small>${escapeHTML(task.description)}</small>  </td>
                    <td>   ${escapeHTML(employeeName)}  </td>
                    <td>   ${escapeHTML(normalizePriority(task.priority))}  </td>
                    <td>  ${formatDateTime(task.deadline)}  </td>
                    <td>  <span class="status-badge ${getStatusClass(status)}"> ${escapeHTML(status)}  </span> </td>
                    <td> ${buildTaskActions(task)}  </td>
                </tr>  `; }).join("");

}


function buildTaskActions(task) {

    return `
        <button 
            class="btn btn-primary btn-sm"  onclick="viewTask(${task.id})">  View  </button>

        <button     class="btn btn-warning btn-sm"  onclick="openEdit(${task.id})">    Edit  </button>

        <button      class="btn btn-danger btn-sm"     onclick="deleteTask(${task.id})">     Delete  </button> `;
}
/* VIEW / REVIEW*/
function viewTask(id) {

    selectedTaskId = Number(id);

    const task = getTaskById(selectedTaskId);

    if (!task) {
        showPopup("Task not found.", "error");
        return;
    }

    setHTML("viewTaskTitle", escapeHTML(task.title));
    setHTML("viewTaskDescription", escapeHTML(task.description));
    setHTML("viewTaskEmployees", `<b>Employee:</b> ${escapeHTML(task.employeeName || "Unknown")}`);

    setHTML(
        "submittedEmployee",
        task.submission ? escapeHTML(task.submission.employeeName) : "Not Submitted"
    );

    setHTML(
        "submittedDate",
        task.submission ? formatDateTime(task.submission.date) : "-"
    );

    setHTML(
        "submittedSolution",
        task.submission ? escapeHTML(task.submission.solution || "No Solution") : "No Solution"
    );

    setHTML("taskCreatedDate", formatDateTime(task.createdAt));
    setHTML("taskUpdatedDate", formatDateTime(task.updatedAt));
    setHTML("submittedFile", task.submission?.file || "No File");
    setHTML("submittedImage", task.submission?.image || "No Image");

    const feedbackInput = document.getElementById("hrFeedback");

    if (feedbackInput) {
        feedbackInput.value = task.hrFeedback || "";
    }

    const modalElement = document.getElementById("viewTaskModal");

    if (!modalElement) {
        showPopup("View modal not found. Check id='viewTaskModal'.", "error");
        console.error("Missing modal: viewTaskModal");
        return;
    }

    if (!window.bootstrap) {
        showPopup("Bootstrap is not loaded.", "error");
        console.error("Bootstrap JS is not loaded.");
        return;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}


function hasValidSubmission(task) {

    if (!task || !task.submission) { return false; }
    return ( String(task.submission.solution || "").trim() !== "" ||  String(task.submission.file || "").trim() !== "" ||  String(task.submission.image || "").trim() !== "");}


function approveTask() {

    const task =  getTaskById(selectedTaskId);
    if (!task) {  return; }
    if (!hasValidSubmission(task)) {   alert("This task has no valid submission yet.");   return; }

    task.status = "Completed";
    task.notification = "Approved by HR";
    task.approvedByHRId = currentHRId;
    task.approvedByHRName = getHRName();
    task.approvedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    saveTasks();
    refreshPageData();
    hideModal("viewTaskModal");}

function requestChanges() {

    const task = getTaskById(selectedTaskId);
    if (!task) { return; }
    const feedbackInput = document.getElementById("hrFeedback");
    const feedback = feedbackInput ? feedbackInput.value.trim() : "";

    if (feedback === "") {  alert("Enter feedback.");  return; }

    task.status = "Not Complete";
    task.hrFeedback = feedback;
    task.notification = "HR requested changes";
    task.updatedAt = new Date().toISOString();
    saveTasks();
    refreshPageData();
    hideModal("viewTaskModal");

}
/* =========================================================
   EDIT TASK - SINGLE CARD ONLY
========================================================= */

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

    const selectedIds = [Number(task.employeeId)];

    renderEmployeeMultiSelect("editEmployeeList", selectedIds, "editEmp");

    const modalElement = document.getElementById("editModal");

    if (!modalElement) {
        showPopup("Edit modal not found. Check id='editModal'.", "error");
        console.error("Missing modal: editModal");
        return;
    }

    if (!window.bootstrap) {
        showPopup("Bootstrap is not loaded.", "error");
        console.error("Bootstrap JS is not loaded.");
        return;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}
function validateEditTaskForm() {

    clearFieldErrors();

    let isValid = true;

    const title = getValue("editTitle").trim();
    const description = getValue("editDescription").trim();
    const priority = getValue("editPriority");
    const deadlineValue = getValue("editDeadline");
    const selectedEmployees = getSelectedEmployees("editEmployeeList");

    if (title === "") {
        setFieldError("editTitle", "Task title is required.");
        isValid = false;
    }

    if (description === "") {
        setFieldError("editDescription", "Task description is required.");
        isValid = false;
    }

    if (priority === "") {
        setFieldError("editPriority", "Please select task priority.");
        isValid = false;
    }

    if (deadlineValue === "") {
        setFieldError("editDeadline", "Deadline is required.");
        isValid = false;
    }

    if (selectedEmployees.length === 0) {
        setFieldError("editEmployeeList", "Please assign one employee.");
        isValid = false;
    }

    if (selectedEmployees.length > 1) {
        setFieldError("editEmployeeList", "Select one employee only in edit mode.");
        isValid = false;
    }

    if (deadlineValue !== "") {
        const deadline = new Date(deadlineValue);

        if (Number.isNaN(deadline.getTime())) {
            setFieldError("editDeadline", "Please select a valid deadline.");
            isValid = false;
        }
    }

    return isValid;
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
    const deadlineValue = getValue("editDeadline");
    const selectedEmployees = getSelectedEmployees("editEmployeeList");

    const selectedEmployeeId = Number(selectedEmployees[0]);
    const deadline = new Date(deadlineValue);

    const oldEmployeeId = Number(task.employeeId);
    const groupId = task.taskGroupId || task.groupId || task.id;

    const duplicateTask = tasks.find(function (item) {

        const itemGroupId = item.taskGroupId || item.groupId || item.id;

        return (
            Number(item.id) !== Number(task.id) &&
            Number(itemGroupId) === Number(groupId) &&
            Number(item.employeeId) === selectedEmployeeId
        );
    });

    if (duplicateTask) {
        setFieldError("editEmployeeList", "This employee already has this task.");
        showPopup("This employee already has a card for this task.", "error");
        return;
    }

    const employee = getEmployeeById(selectedEmployeeId);

    task.title = title;
    task.description = description;
    task.priority = priority;
    task.deadline = deadline.toISOString();

    task.employeeId = selectedEmployeeId;
    task.employeeName = employee ? employee.name : "Unknown";
    task.assignedEmployees = [selectedEmployeeId];
    task.assignedEmployeeNames = [
        employee ? employee.name : "Unknown"
    ];

    task.updatedAt = new Date().toISOString();
    task.updatedByHRId = currentHRId;
    task.updatedByHRName = getHRName();
    task.notification = "Task updated by HR";

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

/* =========================================================
   Delete Task
========================================================= */
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
function resetCreateTaskForm() {

    document.getElementById("taskTitleInput").value = "";
    document.getElementById("taskDescriptionInput").value = "";
    document.getElementById("taskPriorityInput").value = "";
    document.getElementById("deadlineDate").value = "";
    document.getElementById("deadlineTime").value = "";
    document.getElementById("taskFile").value = "";
    document.getElementById("taskImage").value = "";

    const employeeCheckboxes = document.querySelectorAll("#employeeList input[type='checkbox']");

    employeeCheckboxes.forEach(function (checkbox) {
        checkbox.checked = false;
    });
}

/* DASHBOARD*/

function updateDashboard() {
    const hrTasks =  getHRTasks();
    const total =   hrTasks.length;
    const newCount = hrTasks.filter(function (task) {
            const status = normalizeStatus(task.status);
            return (  status === "New" ||  status === "Pending" ||   status === "Not Complete"  ); }).length;

    const submittedCount = hrTasks.filter(function (task) {  return normalizeStatus(task.status) === "Submitted"; }).length;

    const completedCount =
        hrTasks.filter(function (task) {   return normalizeStatus(task.status) === "Completed";  }).length;
    const overdueCount =
        hrTasks.filter(function (task) {  return normalizeStatus(task.status) === "Time Out"; }).length;
    setCounter("totalTasks", total);
    setCounter("newTasks", newCount);
    setCounter("submittedTasks", submittedCount);
    setCounter("completedTasks", completedCount);
    setCounter("overdueTasks", overdueCount);
}
function setCounter(id, value) { const element =  document.getElementById(id); if (element) { element.textContent = value; }
}
/* SYNC*/
function setupStorageSync() { setInterval(function () {   const currentSnapshot =  localStorage.getItem("tasks") || "[]";

        if (currentSnapshot !== lastTasksSnapshot) { loadTasks();   refreshPageData();  } }, 1500);}

/*GLOBAL FUNCTIONS */
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