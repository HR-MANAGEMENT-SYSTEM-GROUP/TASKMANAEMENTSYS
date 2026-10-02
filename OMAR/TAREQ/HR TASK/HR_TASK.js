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

    if (localStorage.getItem("theme") === "dark") {  document.body.classList.add("dark-mode"); }}


function setupFiltersEvents() { const employeeFilter = document.getElementById("employeeFilter");

    const taskFilter =  document.getElementById("taskFilter");

    if (employeeFilter) {

        employeeFilter.addEventListener("change", function () {  loadFilters();  displayTasks(); });  }

    if (taskFilter) {  taskFilter.addEventListener("change", function () {   displayTasks(); }); }}


function applyTimeoutStatus() { let changed = false;

    tasks.forEach(function (task) {  const status =  normalizeStatus(task.status);

        if (  status === "Completed" || status === "Blocked" ||  status === "Submitted" || status === "Time Out" ) {   return; }

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
   CREATE TASK
========================================================= */

function createTask() {

    const selectedEmployees = getSelectedEmployees("employeeList");
    const title = document.getElementById("taskTitleInput")?.value.trim() || "";
    const description =document.getElementById("taskDescriptionInput")?.value.trim() || "";
    const priority =document.getElementById("taskPriorityInput")?.value || "Medium";
    const deadlineDate = document.getElementById("deadlineDate")?.value || "";
    const deadlineTime =document.getElementById("deadlineTime")?.value || "";
    const taskFileInput =document.getElementById("taskFile");
    const taskImageInput =document.getElementById("taskImage");

    if ( title === "" ||description === "" || selectedEmployees.length === 0 || deadlineDate === "" ||deadlineTime === "") 
    { alert("Please complete task data.");return; }

    const deadline = new Date(`${deadlineDate}T${deadlineTime}`);
    if (Number.isNaN(deadline.getTime())) {alert("Please select valid deadline.");  return; }
    if (deadline < new Date()) {alert("Deadline cannot be in the past."); return; }

    const taskFile = taskFileInput && taskFileInput.files.length > 0  ? taskFileInput.files[0].name : "";
    const taskImage = taskImageInput && taskImageInput.files.length > 0   ? taskImageInput.files[0].name    : "";
    const groupId =  generateTaskGroupId();
    selectedEmployees.forEach(function (employeeId, index) {

        const employee = getEmployeeById(employeeId);
        const task = { id: generateTaskId(employeeId, index),
 taskGroupId: groupId, groupId: groupId,  title: title,  description: description,   priority: priority,    deadline: deadline.toISOString(),

  employeeId: Number(employeeId), employeeName: employee ? employee.name : "Unknown",   assignedEmployees: [Number(employeeId)],   assignedEmployeeNames: [   employee ? employee.name : "Unknown"   ],

 createdBy: Number(currentHRId), createdByHRId: Number(currentHRId),  createdByHRName: getHRName(),   createdByHREmail: currentHR.email || "",

     createdAt: new Date().toISOString(),   updatedAt: new Date().toISOString(),

  status: "New",  taskFile: taskFile,   taskImage: taskImage,
     submission: null,  hrFeedback: "",  notification: "New task assigned by HR",

 history: [  {  message: "Task created by HR.",    hrId: currentHRId,     hrName: getHRName(),     date: new Date().toISOString()  } ]};
 tasks.push(task); });

    saveTasks();
    clearCreateForm();
    refreshPageData();
    alert("Tasks created successfully.");}


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

 const weights = {    "Submitted": 1,    "In Progress": 2,    "New": 3,  "Pending": 3,   "Not Complete": 4,    "Completed": 5,   "Time Out": 6,  "Blocked": 7 };

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

    const status = normalizeStatus(task.status);
    let buttons = ` <button class="btn btn-primary btn-sm"    onclick="viewTask(${task.id})">    View </button> `;

    if (status === "Blocked") {

        buttons += `   <button   class="btn btn-success btn-sm"   onclick="unblockTask(${task.id})">🔓 Unblock  </button> `;return buttons; }

    buttons += `
     <button class="btn btn-warning btn-sm" onclick="openEdit(${task.id})"> Edit  </button>
     <button   class="btn btn-danger btn-sm"   onclick="blockTask(${task.id})">   🚫 Block</button>`;

 return buttons;}
/* VIEW / REVIEW*/
function viewTask(id) {

    selectedTaskId = Number(id);
    const task =  getTaskById(selectedTaskId);if (!task) {   return; }

    setHTML("viewTaskTitle", escapeHTML(task.title));
    setHTML("viewTaskDescription", escapeHTML(task.description));
    setHTML( "viewTaskEmployees", `<b>Employee:</b> ${escapeHTML(task.employeeName || "Unknown")}`);
    setHTML(   "submittedEmployee",   task.submission     ? escapeHTML(task.submission.employeeName)     : "Not Submitted" );
    setHTML(  "submittedDate", task.submission    ? formatDateTime(task.submission.date)   : "-");
    setHTML(   "submittedSolution", task.submission   ? escapeHTML(task.submission.solution || "No Solution")   : "No Solution" );
    setHTML("taskCreatedDate", formatDateTime(task.createdAt));
    setHTML("taskUpdatedDate", formatDateTime(task.updatedAt));
    setHTML(  "submittedFile",  task.submission?.file || "No File" );
    setHTML(   "submittedImage",  task.submission?.image || "No Image" );

    const feedbackInput = document.getElementById("hrFeedback");
    if (feedbackInput) {  feedbackInput.value = task.hrFeedback || "";}

    const modal =    bootstrap.Modal.getOrCreateInstance(   document.getElementById("viewTaskModal")  );
    modal.show();}


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

function openEdit(id) { selectedTaskId = Number(id);

    const task =  getTaskById(selectedTaskId);
    if (!task) { alert("Task not found");return; }
    setValue("editTitle", task.title);
    setValue("editDescription", task.description);
    setValue("editPriority", task.priority);
    setValue("editDeadline", toDateTimeLocal(task.deadline));

    const selectedIds = [  Number(task.employeeId)  ];
    renderEmployeeMultiSelect( "editEmployeeList",  selectedIds,  "editEmp" );
    const modal =  bootstrap.Modal.getOrCreateInstance(    document.getElementById("editModal") ); modal.show();}


function saveEditTask() {

    const task =   getTaskById(selectedTaskId);

    if (!task) { return; }

    const title = getValue("editTitle").trim();
    const description = getValue("editDescription").trim();
    const priority =getValue("editPriority");
    const deadlineValue =getValue("editDeadline");
    const selectedEmployees =getSelectedEmployees("editEmployeeList");

    if ( title === "" ||  description === "" ||selectedEmployees.length === 0)
         { alert("Please complete task data and select employee."); return;}

    if (selectedEmployees.length > 1) {    alert("In edit mode, select one employee only.");  return; }

    const selectedEmployeeId =  Number(selectedEmployees[0]);
    const deadline =  new Date(deadlineValue);

    if (Number.isNaN(deadline.getTime())) {   alert("Please select valid deadline.");   return;}

    const oldEmployeeId =  Number(task.employeeId);
    const groupId =  task.taskGroupId || task.groupId || task.id;
    const duplicateTask = tasks.find(function (item) {

            const itemGroupId =
                item.taskGroupId || item.groupId || item.id;

            return (
                Number(item.id) !== Number(task.id) &&
                Number(itemGroupId) === Number(groupId) &&
                Number(item.employeeId) === selectedEmployeeId
            );

        });

    if (duplicateTask) {
        alert("This employee already has a card for this task.");
        return;
    }

    const employee =
        getEmployeeById(selectedEmployeeId);

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

}


/* =========================================================
   BLOCK / UNBLOCK
========================================================= */

function blockTask(id) {

    const task =
        getTaskById(id);

    if (!task) {  return;}
    if (!confirm("Are you sure you want to block this task?")) { return; }
    task.previousStatus = task.status;
    task.status = "Blocked";
    task.notification = "Blocked by HR";
    task.blockedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    saveTasks();
    refreshPageData();

}
function unblockTask(id) {

    const task =getTaskById(id);
    if (!task) { return;}
    task.status = task.previousStatus || "New";
    task.notification = "Task unblocked by HR";
    task.updatedAt = new Date().toISOString();
    saveTasks();
    refreshPageData();

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
window.blockTask = blockTask;
window.unblockTask = unblockTask;
window.toggleEmployeeDropdown = toggleEmployeeDropdown;
window.toggleAllEmployees = toggleAllEmployees;
window.updateEmployeeSelectSummary = updateEmployeeSelectSummary;